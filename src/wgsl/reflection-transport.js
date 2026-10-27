import {replaceShader} from './shader-patch.js';

// Integrate the slope distribution once. Cubemap mips cover a quadrature cell,
// while the quadrature covers the remaining covariance; neither changes the FFT.
export function reflectionTransportShader(code,query){
  if(query.get('abReflection')!=='partition'||!code.includes('fn reflectedEnvironment('))return code;
  code=replaceShader(code,'  let sky=textureSampleLevel(envCube,sampC,ray,lod).rgb;',/* wgsl */`
  var sky=textureSampleLevel(envCube,sampC,ray,lod).rgb;
  // The lower cache contains one flat dielectric reflection, but no body term.
  // Supply the missing transmitted radiance without a recursive cache feedback.
  if(ray.y<0.0){sky+=bodyRadiance*(1.0-fresnelWater(-ray.y));}`);
  const start=code.indexOf('  // Five-point covariance quadrature');
  const end=code.indexOf('  if(weights<1e-5){',start);
  if(start<0||end<0)throw Error('Reflection quadrature splice contract changed');
  code=code.slice(0,start)+/* wgsl */`
  let ch0=vec2f(sqrt(cov.x),cov.z/sqrt(cov.x));
  let ch1=vec2f(0.0,sqrt(max(cov.y-cov.z*cov.z/cov.x,1e-7)));
  // Tensor Gauss-Hermite integrates each resolved cell centre. Allocate 1/4
  // of variance to mip filtering, 3/4 to centres, rather than two full lobes.
  let cellLod=clamp(envLod-1.0,0.0,ENV_MAXMIP);
  let positions=array<f32,3>(-1.5,0.0,1.5);
  let masses=array<f32,3>(1.0/6.0,2.0/3.0,1.0/6.0);
  var reflected=vec3f(0);var fresnelSum=0.0;var weights=0.0;
  for(var tap=0u;tap<9u;tap++){
    let x=tap%3u;let y=tap/3u;
    let off=ch0*positions[x]+ch1*positions[y];
    let facet=normalize(nrm-tangent*off.x-bitangent*off.y);
    let nv=max(dot(facet,V),0.0);
    let w=masses[x]*masses[y]*nv/max(dot(facet,nrm),.001);
    let rf=reflect(-V,facet);let f=fresnelWater(nv);
    let Rl=vec3f(dot(rf,tangent),dot(rf,nrm),dot(rf,bitangent));
    let visible=select(0.0,(1.0+lambdaSmith(Vl,cov))/(1.0+lambdaSmith(Vl,cov)+lambdaSmith(Rl,cov)),Rl.y>0.0);
    reflected+=reflectedEnvironment(vec3f(displacedXZ.x,in.height,displacedXZ.y),rf,cellLod,body)*f*w*visible;
    fresnelSum+=f*w;weights+=w;
  }
`+code.slice(end);
  return code;
}
