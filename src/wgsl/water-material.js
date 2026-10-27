import {replaceShader} from './shader-patch.js';

// Semi-infinite two-flux closure with transport (reduced) scattering. This is
// a bounded three-band approximation, not a spectral ocean-colour inversion.
export const WATER_BODY = /* wgsl */`
fn waterTransportAlbedo(absorption:vec3f,reduced:vec3f)->vec3f {
  let root=sqrt(absorption/max(absorption+reduced,vec3f(1e-8)));
  return (1.0-root)/(1.0+root);
}
fn waterDiffuseAlbedo(absorption:vec3f,backscatter:vec3f)->vec3f {
  return waterTransportAlbedo(absorption,waterMolecularScatter(backscatter)+
    waterParticleScatter(backscatter)*(1.0-WATER_PARTICLE_G));
}
`;

export function waterMaterialShader(code,query){
  if(!['body','layered'].includes(query.get('abWater'))||!code.includes('fn reflectedEnvironment('))return code;
  code=replaceShader(code,'fn reflectedEnvironment(',WATER_BODY+'fn reflectedEnvironment(');
  code=replaceShader(code,'  let downwelling=diffuseUp*0.94+sunE*max(Ld.y,0.0)*(1.0-fresnelWater(Ld.y))+moonE*max(F.moonDir.y,0.0)*(1.0-fresnelWater(F.moonDir.y));',/* wgsl */`
  // Volume photons integrate over metres. Use the same filtered displacement
  // Jacobian as their incident normal; capillary strain must not sharpen it.
  var volumeSlope=vec2f(0);var volumeStrain=vec3f(0);
  let transportScale=clamp(.25/dot(aWater+waterMolecularScatter(bb)+
    waterParticleScatter(bb)*(1.0-WATER_PARTICLE_G),vec3f(.2126,.7152,.0722)),.5,6.0);
  for(var c=0u;c<3u;c++){
    let invL=F.cascInvL[c>>2u][c&3u];
    let uv=cascadeUV(xz,c,invL,F.waveOrigins);
    let lod=clamp(log2(transportScale*TEX_N*invL),0.0,8.0);
    let d=textureSampleLevel(derivTex,sampR,uv,c,lod);
    let crossStrain=textureSampleLevel(dispTex,sampR,uv,c,lod).w;
    volumeSlope+=d.xy;volumeStrain+=vec3f(d.zw,crossStrain);
  }
  let volumeJ=mat2x2f(1.0+volumeStrain.y,-volumeStrain.z,
    -volumeStrain.z,1.0+volumeStrain.x);
  let volumeDet=max((1.0+volumeStrain.x)*(1.0+volumeStrain.y)-volumeStrain.z*volumeStrain.z,.25);
  let volumeGradient=volumeJ*volumeSlope/volumeDet;
  let volumeNormal=normalize(vec3f(-volumeGradient.x,1,-volumeGradient.y));
  let volumeSky=textureSampleLevel(skyIrradiance,sampC,volumeNormal,0.0).rgb;
  let muSun=max(dot(volumeNormal,Ld),0.0);
  let muMoon=max(dot(volumeNormal,F.moonDir.xyz),0.0);
  let downwelling=volumeSky*.94+sunE*muSun*(1.0-fresnelWater(muSun))+
    moonE*muMoon*(1.0-fresnelWater(muMoon));`);
  code=replaceShader(code,'  var body=subsurfaceReflectance*downwelling/(1.333*1.333);',
    '  var body=waterDiffuseAlbedo(aWater,bb)*downwelling/(PI*1.333*1.333);');
  if(query.get('abWater')==='layered'){
    code=replaceShader(code,'  body += exp(-(aWater + bb*12.0)*crestPath) * sunE * k1 * 0.035;',/* wgsl */`
  // A finite aerated shoulder transmits light from the opposite flank. Its
  // optical path follows resolved gravity strain, never capillary compression.
  // This bounded slab is an artistic closure, not an overturning-volume solve.
  let gravityCompression=-.5*(volumeStrain.x+volumeStrain.y-
    length(vec2f(volumeStrain.x-volumeStrain.y,2.0*volumeStrain.z)))/max(F.windP[1].y,.1);
  let shoulder=smoothstep(.06,.30,gravityCompression);
  let forwardCosine=max(dot(Ld,-V),0.0);
  let backLight=pow(forwardCosine,3.0);
  let shoulderPath=mix(7.0,1.8,shoulder);
  let shoulderScatter=waterMolecularScatter(bb)+waterParticleScatter(bb)+vec3f(.16*shoulder);
  let beam=exp(-aWater*shoulderPath)*(1.0-exp(-shoulderScatter*shoulderPath));
  let entryLight=sunIlluminance()*cloudT;
  let forwardPhase=(1.0-.65*.65)/(4.0*PI*pow(1.0+.65*.65-1.3*forwardCosine,1.5));
  let transmitted=(entryLight*backLight*forwardPhase+volumeSky/PI)*beam*(shoulder/(1.333*1.333));
  body+=transmitted;`);
    code=replaceShader(code,'  body += exp(-aWater*0.65)*downwelling/PI*aeration*0.075;',/* wgsl */`
  // Bubble scattering is nearly achromatic; it is not particulate backscatter
  // and must not inherit the particulate b/bb=12 conversion.
  let bubbleAlbedo=waterTransportAlbedo(aWater,waterMolecularScatter(bb)+
    waterParticleScatter(bb)*(1.0-WATER_PARTICLE_G)+vec3f(.35*aeration));
  let bubbleBody=bubbleAlbedo*downwelling/(PI*1.333*1.333);
  body=mix(body,max(body,bubbleBody),aeration);`);
  }
  return code;
}
