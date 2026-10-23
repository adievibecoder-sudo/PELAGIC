// Morphology hypothesis only: vertically correlated condensate surplus,
// not a prognostic humidity or buoyancy solver. Existing extinction is retained.
export const CLOUD_CONDENSATE=/* wgsl */`
fn condensateNoise(q:vec3f,footprint:f32,frequency:f32)->vec4f {
  return textureSampleLevel(cloudNoise,cloudNoiseSampler,q,
    max(log2(max(footprint,0.001)*frequency*128.0),0.0));
}
fn cloudCondensate(p:vec3f,footprint:f32)->f32 {
  let altitude=p.y+dot(p.xz,p.xz)/(2.0*RG);
  let depth=mix(F.regional.y,3.5,regionalWeight(p.xz));
  let coverage=regionalCoverage(p.xz);
  if(coverage<0.001||altitude<=F.cloudP.x||altitude>=F.cloudP.x+depth){return 0.0;}
  let world=p.xz+F.camPos.xz*0.001+F.worldOrigin.xy-F.cloudDrift.xy;
  let bank=condensateNoise(vec3f(world.x*0.008,0.31,world.y*0.008),footprint,0.008);
  let cover=clamp(coverage+coverage*(1.0-coverage)*(bank.a-0.5)*3.2,0.0,1.0);
  let base=F.cloudP.x+depth*(0.02+0.04*bank.r);
  let h=(altitude-base)/depth;
  if(h<=0.0||h>=1.0){return 0.0;}
  let shear=F.windP[0].xy*(h*h*depth*0.20);
  let xz=world-shear;
  // A shared horizontal field connects neighbouring updrafts at the base.
  // Height-dependent surplus removes weak columns first, forming irregular crowns.
  let column=condensateNoise(vec3f(xz.x*0.16,0.173,xz.y*0.16),footprint,0.16);
  let rotated=vec2f(xz.x*0.8-xz.y*0.6,xz.x*0.6+xz.y*0.8);
  let branching=condensateNoise(vec3f(rotated.x*0.37,h*0.31+0.19,rotated.y*0.37),footprint,0.37);
  let support=0.5+(column.r-0.5)*3.8+(branching.r-0.5)*1.25;
  let surplus=support-(1.0-cover)-0.52*h*h;
  let edge=smoothstep(0.0,0.16,surplus);
  if(edge<=0.0){return 0.0;}
  let detail=condensateNoise(vec3f(rotated.x*0.91,h*depth*0.91,rotated.y*0.91)+vec3f(0.31,0.47,0.73),footprint,0.91);
  let erosion=(1.0-detail.b)*0.10*(1.0-edge);
  let condensate=clamp((surplus-erosion)/0.25,0.0,1.0);
  let growth=smoothstep(0.0,0.055,h)*(0.25+0.75*smoothstep(0.02,0.28,h));
  return condensate*growth*(1.0-smoothstep(0.86,1.0,h));
}
`;

export function cloudCondensateShader(code,query){
  if(query.get('maCloud')!=='condensate'||!code.includes('fn cloudDensityFiltered('))return code;
  return code.replace('fn cloudDensityFiltered(','fn cloudDensityPreserved(')
    .replace('fn cloudDensity(p:',CLOUD_CONDENSATE+/* wgsl */`
fn cloudDensityFiltered(p:vec3f,detail:bool,footprint:f32)->f32 {
  let weight=clamp(regionalTypes(p.xz).x,0.0,1.0);
  if(weight<0.0001){return cloudDensityPreserved(p,detail,footprint);}
  let candidate=cloudCondensate(p,footprint);
  if(weight>0.9999){return candidate;}
  return mix(cloudDensityPreserved(p,detail,footprint),candidate,weight);
}
fn cloudDensity(p:`);
}
