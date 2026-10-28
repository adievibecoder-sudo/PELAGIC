import {waterMaterialShader} from './water-material.js';
import {replaceShader} from './shader-patch.js';

const G=.70223624, ETA=1/1.333;
export const MIN_WATER_COSINE=Math.sqrt(1-ETA*ETA);

// Integrate unit molecular and particle phase functions once. Coefficients,
// absorption and incident light remain dynamic in the shader.
export function firstCollisionFlux(muLight,rings=48,azimuths=96){
  const result=[0,0];
  for(let i=0;i<rings;i++){
    const mu=(i+.5)/rings;
    for(let j=0;j<azimuths;j++){
      const cosine=-muLight*mu+Math.sqrt((1-muLight*muLight)*(1-mu*mu))*Math.cos((j+.5)*2*Math.PI/azimuths);
      const weight=mu/(muLight+mu)*2*Math.PI/(rings*azimuths);
      result[0]+=3/(16*Math.PI)*(1+cosine*cosine)*weight;
      result[1]+=(1-G*G)/(4*Math.PI*(1+G*G-2*G*cosine)**1.5)*weight;
    }
  }
  return result;
}
export const FIRST_FLUX_TABLE=Array.from({length:33},(_,i)=>firstCollisionFlux(MIN_WATER_COSINE+(1-MIN_WATER_COSINE)*i/32));
const TABLE=/* wgsl */`
fn waterSingleFlux(muLight:f32,molecular:vec3f,particle:vec3f,extinction:vec3f)->vec3f {
  let values=array<vec2f,33>(${FIRST_FLUX_TABLE.map(v=>`vec2f(${v[0]},${v[1]})`).join(',')});
  let coordinate=clamp((muLight-${MIN_WATER_COSINE})/${1-MIN_WATER_COSINE}*32.0,0.0,32.0);
  let lower=min(u32(coordinate),31u);
  let flux=mix(values[lower],values[lower+1u],coordinate-f32(lower));
  return (molecular*flux.x+particle*flux.y)/max(extinction,vec3f(1e-8));
}
`;

const SKY=/* wgsl */`
fn waterAngularSky(normal:vec3f,outgoing:vec3f,molecular:vec3f,particle:vec3f,
  extinction:vec3f,reflectance:vec3f,budget:vec3f)->vec3f {
  let tangent=normalize(vec3f(1,-normal.x/max(normal.y,.001),0));
  let bitangent=cross(tangent,normal);
  var radiance=vec3f(0);var entering=vec3f(0);
  for(var ring=0u;ring<2u;ring++){
    let mu=select(.2113248654,.7886751346,ring==1u);
    for(var az=0u;az<6u;az++){
      let angle=(f32(az)+.5*f32(ring))*PI/3.0;
      let light=normal*mu+sqrt(1.0-mu*mu)*(tangent*cos(angle)+bitangent*sin(angle));
      let incident=textureSampleLevel(envCube,sampC,light,2.0).rgb*(PI/6.0);
      entering+=incident*mu*(1.0-fresnelWater(mu));
      radiance+=waterDirectionalBody(light,incident,normal,outgoing,molecular,particle,extinction,reflectance);
    }
  }
  // The low-order angular rule supplies direction, while the existing 128-ray
  // irradiance cache supplies flux. Do not brighten water by adding both.
  return radiance*budget/max(entering,vec3f(1e-8));
}
`;

export function waterSkyTransportShader(code,query){
  if(query.get('abWater')!=='angular'||!code.includes('fn reflectedEnvironment('))return code;
  const transport=new URLSearchParams(query);transport.set('abWater','transport');
  code=waterMaterialShader(code,transport);
  const start=code.indexOf('fn waterSingleFlux('),end=code.indexOf('fn waterDirectionalBody(',start);
  if(start<0||end<0)throw Error('Water first-collision splice contract changed');
  code=code.slice(0,start)+TABLE+code.slice(end);
  code=replaceShader(code,'  let remainder=max(reflectance-firstFlux,vec3f(0));',`  let firstShare=min(vec3f(1),reflectance/max(firstFlux,vec3f(1e-8)));
  let remainder=max(reflectance-firstFlux*firstShare,vec3f(0));`);
  code=replaceShader(code,'return first*entering/(1.333*1.333)+waterEscapedRadiance(remainder,entering);',
    'return first*firstShare*entering/(1.333*1.333)+waterEscapedRadiance(remainder,entering);');
  code=replaceShader(code,'fn reflectedEnvironment(',SKY+'fn reflectedEnvironment(');
  return replaceShader(code,'var body=waterEscapedRadiance(deepReflectance,volumeSky*.94)+',
    'var body=waterAngularSky(volumeNormal,outgoing,molecularScatter,particleScatter,extinction,deepReflectance,volumeSky*.94)+');
}
