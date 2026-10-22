// Experimental density only. Kilometres throughout; lighting/extinction unchanged.
// Regional support, vertically narrowing bodies and independent erosion replace
// the repeated ellipsoidal support. This is a morphological model, not moist fluid dynamics.
export const CLOUD_BANK = /* wgsl */ `
const BANK_BIAS:f32=0.43;
fn cloudBankDensity(p:vec3f,detail:bool,footprint:f32)->f32 {
  let altitude=p.y+dot(p.xz,p.xz)/(2.0*RG);
  let depth=mix(F.regional.y,3.5,regionalWeight(p.xz));
  if(altitude<=F.cloudP.x || altitude>=F.cloudP.x+depth){return 0.0;}
  let coverage=regionalCoverage(p.xz);
  if(coverage<0.001){return 0.0;}
  let world=p+vec3f(F.camPos.x*0.001+F.worldOrigin.x,0,F.camPos.z*0.001+F.worldOrigin.y)-vec3f(F.cloudDrift.x,0,F.cloudDrift.y);
  let bankWeather=textureSampleLevel(cloudNoise,cloudNoiseSampler,vec3f(world.x*.008,.31,world.z*.008),max(log2(max(footprint,.001)*1.024),0.0));
  let regional=textureSampleLevel(cloudNoise,cloudNoiseSampler,vec3f((world.x+world.z*.37)*.027,.73,(world.z-world.x*.37)*.027),max(log2(max(footprint,.001)*3.7),0.0));
  // Bounded modulation preserves the empty/full endpoints. The old 3.2 gain
  // was calibrated for sparse ellipsoid seeds, not a continuous support field.
  let cover=clamp(coverage+coverage*(1.0-coverage)*((bankWeather.a-.5)*1.8+(regional.a-.5)*1.4),0.0,1.0);
  let bottom=F.cloudP.x+depth*(.025+.06*regional.r);
  let h=(altitude-bottom)/max(depth*(.48+.44*bankWeather.r),.1);
  if(h<=0.0 || h>=1.0 || cover<.001){return 0.0;}
  let wind=F.windP[0].xy;
  let shear=wind*h*h*depth*.24;
  let q=vec3f((world.x+shear.x)*.19,(altitude-F.cloudP.x)*.24,(world.z+shear.y)*.19);
  let lod=max(log2(max(footprint,.001)*.24*128.0),0.0);
  let n=textureSampleLevel(cloudNoise,cloudNoiseSampler,q,lod);
  let signal=clamp((n.r-.5)*3.4+.57-(1.0-n.g)*.12,0.0,1.0);
  let threshold=(1.0-cover)*.91+.20*smoothstep(.26,.95,h)+BANK_BIAS;
  var d=clamp((signal-threshold)*3.0,0.0,1.0);
  if(d<=0.0){return 0.0;}
  let erodeQ=q*vec3f(3.71,2.63,3.71)+vec3f(.31,.73,.17);
  let erosion=textureSampleLevel(cloudNoise,cloudNoiseSampler,erodeQ,lod+1.4).b;
  let edge=(1.0-erosion)*mix(.14,.065,smoothstep(.05,.5,h));
  d=max(0.0,d-edge*(1.0-d));
  return d*smoothstep(0.0,.08,h)*(1.0-smoothstep(.65,1.0,h));
}
`;

export function cloudBankShader(code,query){
  if(query.get('maCloud')!=='bank'||!code.includes('fn cloudDensityFiltered('))return code;
  return code.replace('fn cloudDensityFiltered(', 'fn cloudDensityLegacy(').replace('fn cloudDensity(p:',CLOUD_BANK+`
fn cloudDensityFiltered(p:vec3f,detail:bool,footprint:f32)->f32 {
  let legacyWeight=clamp(regionalTypes(p.xz).y+regionalTypes(p.xz).z,0.0,1.0);
  if(legacyWeight>.9999){return cloudDensityLegacy(p,detail,footprint);}
  let bank=cloudBankDensity(p,detail,footprint);
  if(legacyWeight<.0001){return bank;}
  return mix(bank,cloudDensityLegacy(p,detail,footprint),legacyWeight);
}
fn cloudDensity(p:`);
}
