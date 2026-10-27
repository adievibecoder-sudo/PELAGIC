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

export const WATER_LAYER = /* wgsl */`
struct WaterLayer { reflection:vec3f, transmission:vec3f };
fn waterFiniteLayer(absorption:vec3f,reduced:vec3f,depth:f32)->WaterLayer {
  let rate=sqrt(absorption*(absorption+2.0*reduced));
  let infinite=reduced/max(absorption+reduced+rate,vec3f(1e-8));
  let attenuation=exp(-rate*depth);
  let denominator=max(vec3f(1)-infinite*infinite*attenuation*attenuation,vec3f(1e-6));
  let conservativeT=1.0/(1.0+reduced*depth);
  return WaterLayer(select(infinite*(1.0-attenuation*attenuation)/denominator,1.0-conservativeT,absorption<vec3f(1e-8)),
    select((1.0-infinite*infinite)*attenuation/denominator,conservativeT,absorption<vec3f(1e-8)));
}
fn waterLayerReflectance(absorption:vec3f,reduced:vec3f,bubbles:f32,depth:f32)->vec3f {
  let deep=reduced/max(absorption+reduced+sqrt(absorption*(absorption+2.0*reduced)),vec3f(1e-8));
  let layer=waterFiniteLayer(absorption,reduced+vec3f(bubbles),depth);
  return layer.reflection+layer.transmission*layer.transmission*deep/
    max(vec3f(1)-layer.reflection*deep,vec3f(1e-6));
}
fn waterEscapedRadiance(reflectance:vec3f,irradiance:vec3f)->vec3f {
  // Diffuse internal Fresnel follows reciprocity with air-side mean F=.066.
  // Sum returned diffuse flux before the final view-dependent interface exit.
  let internalF=1.0-(1.0-.066)/(1.333*1.333);
  return reflectance*irradiance/(PI*1.333*1.333*(vec3f(1)-reflectance*internalF));
}
`;

export function waterMaterialShader(code,query){
  if(!['body','layered','volume','slab'].includes(query.get('abWater'))||!code.includes('fn reflectedEnvironment('))return code;
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
  if(['layered','volume'].includes(query.get('abWater'))){
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
  if(query.get('abWater')==='volume'){
    code=replaceShader(code,'  let shoulder=smoothstep(.06,.30,gravityCompression);',
      '  let shoulder=smoothstep(.015,.16,gravityCompression);');
    code=replaceShader(code,'  body+=transmitted;',`  // Bounded crest-volume art direction: a reduced-scattering shoulder under
  // a finite absorbing water path. This is not a simulated bubble population.
  let reduced=waterMolecularScatter(bb)+waterParticleScatter(bb)*(1.0-WATER_PARTICLE_G);
  let shoulderAlbedo=waterTransportAlbedo(aWater,reduced+vec3f(.18*shoulder));
  let shoulderLight=volumeSky*.94+entryLight*max(Ld.y,.12)*waveT.x;
  let shoulderBody=shoulderAlbedo*exp(-aWater*2.0)*shoulderLight/(PI*1.333*1.333);
  body=mix(body,max(body,shoulderBody),shoulder)+transmitted;`);
  }
  if(query.get('abWater')==='slab'){
    code=replaceShader(code,'fn reflectedEnvironment(',WATER_LAYER+'fn reflectedEnvironment(');
    code=replaceShader(code,'  var body=waterDiffuseAlbedo(aWater,bb)*downwelling/(PI*1.333*1.333);',`  let reducedScatter=waterMolecularScatter(bb)+waterParticleScatter(bb)*(1.0-WATER_PARTICLE_G);
  // The deep substrate retains the ocean backscatter closure. A diffuse
  // two-flux infinite medium overestimates weak, forward-scattering water.
  let deepReflectance=clamp(PI*subsurfaceReflectance,vec3f(0),vec3f(1));
  var body=waterEscapedRadiance(deepReflectance,downwelling);`);
    code=replaceShader(code,'  body += exp(-(aWater + bb*12.0)*crestPath) * sunE * k1 * 0.035;',
      '  // Finite aerated-layer transport below replaces additive crest glow.');
    code=replaceShader(code,'  body += exp(-aWater*0.65)*downwelling/PI*aeration*0.075;',`  let gravityCompression=-.5*(volumeStrain.x+volumeStrain.y-
    length(vec2f(volumeStrain.x-volumeStrain.y,2.0*volumeStrain.z)))/max(F.windP[1].y,.1);
  let shoulder=smoothstep(.12,.40,gravityCompression);
  let bubbleStrength=clamp(.35*shoulder+aeration,0.0,1.0);
  let bubbleLayer=waterFiniteLayer(aWater,reducedScatter+vec3f(.8*bubbleStrength),bubbleStrength*(.8+.4*bubbleStrength));
  let layeredReflectance=bubbleLayer.reflection+bubbleLayer.transmission*bubbleLayer.transmission*deepReflectance/
    max(vec3f(1)-bubbleLayer.reflection*deepReflectance,vec3f(1e-6));
  body=waterEscapedRadiance(layeredReflectance,downwelling);`);
  }
  return code;
}
