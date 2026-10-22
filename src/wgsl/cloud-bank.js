// Experimental density only. Kilometres throughout; lighting/extinction unchanged.
// Regional support, vertically narrowing bodies and independent erosion replace
// the repeated ellipsoidal support. This is a morphological model, not moist fluid dynamics.
export const CLOUD_BANK = /* wgsl */ `
const BANK_BIAS:f32=0.0;
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
  let bottom=F.cloudP.x+depth*(.025+.025*regional.r);
  let h=(altitude-bottom)/max(depth*(.62+.34*bankWeather.r),.1);
  if(h<=0.0 || h>=1.0 || cover<.001){return 0.0;}
  let wind=F.windP[0].xy;
  let shear=wind*h*h*depth*.24;
  let warp=(regional.rg-.5)*.8;
  let q=vec3f((world.x+shear.x)*.13+warp.x,(altitude-F.cloudP.x)*.22,(world.z+shear.y)*.13+warp.y);
  let lod=max(log2(max(footprint,.001)*.22*128.0),0.0);
  let n=textureSampleLevel(cloudNoise,cloudNoiseSampler,q,lod);
  let lowErosion=(1.0-n.g)*.35;
  let signal=clamp((n.r*.7+.3-lowErosion)/(1.0-lowErosion),0.0,1.0);
  let profile=smoothstep(0.0,.055,h)*(1.0-smoothstep(.38,1.0,h));
  let threshold=1.0-cover*.82+BANK_BIAS;
  var d=clamp((signal*profile-threshold)/max(1.0-threshold,.05),0.0,1.0);
  if(d<=0.0){return 0.0;}
  let erosion=textureSampleLevel(cloudNoise,cloudNoiseSampler,q*2.13+vec3f(.61,.21,.47),lod+1.09).b;
  let edge=mix(erosion,1.0-erosion,smoothstep(.02,.22,h))*.22;
  d=clamp((d-edge)/(1.0-edge),0.0,1.0);
  return d;
}
`;

export function cloudBankShader(code,query){
  if(query.get('maCloud')==='convective-initial'&&code.includes('fn thermalShape(')){
    code=code.replace('let thermal=thermalShape(world,altitude,cover,storm,layerDepth);',`
      let bendNoise=textureSampleLevel(cloudNoise,cloudNoiseSampler,world*vec3f(.12,.22,.12),max(lod-2.0,0.0));
      let bendNoise2=textureSampleLevel(cloudNoise,cloudNoiseSampler,world*vec3f(.31,.47,.31)+vec3f(.33,.71,.19),max(lod-1.0,0.0));
      let distorted=world+vec3f((bendNoise.rg-.5)*1.1+(bendNoise2.rg-.5)*.30,0).xzy;
      let thermal=thermalShape(distorted,altitude,cover,storm,layerDepth);`)
      .replace('let size=mix(3.6,7.0,storm);','let size=mix(5.4,7.0,storm);')
      .replace('(id+0.2+random.xy*0.6)*size','(id+0.04+random.xy*0.92)*size')
      .replace('layerDepth*(0.20+0.64*random.y*random.y)','layerDepth*(0.24+0.68*random.y)')
      .replace('size*(0.17+0.29*random.x)','size*(0.12+0.30*random.x)')
      .replace('let billow=(shape.r-0.5)*3.4+(shape.g-0.4)*0.65;','let billow=(shape.r-0.5)*1.9+(shape.g-0.4)*0.95+(bendNoise2.b-.45)*.6;')
      .replace('return density;','return density*mix(.86,1.0,strat+storm);');
  }
  if(query.get('maDetail')==='pixel')code=code.replace('let footprint=max(ds*0.14,t*pixAng);','let footprint=t*pixAng;');
  if(query.get('maLight')==='centroid')code=code.replace('let p=ro+dir*t;','var p=ro+dir*t;')
    .replace('var density=0.0;','var density=0.0;var segmentT=1.0;var locationMoment=0.0;')
    .replace('density+=cloudDensityFiltered(ro+dir*(a+ds*(f32(sub)+0.5)*0.25),true,footprint)*0.25;',`
      let sampleT=a+ds*(f32(sub)+0.5)*0.25;
      let sampleDensity=cloudDensityFiltered(ro+dir*sampleT,true,footprint);
      let sampleAlpha=1.0-exp(-sampleDensity*F.cloudP.z*6.0*ds*.25);
      locationMoment+=sampleT*segmentT*sampleAlpha;
      segmentT*=1.0-sampleAlpha;density+=sampleDensity*.25;`)
    .replace('if(density>0.001) {','if(density>0.001) {\n      p=ro+dir*locationMoment/max(1.0-segmentT,1e-6);');
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
