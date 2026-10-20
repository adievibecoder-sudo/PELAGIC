// Reversible Phase 0 hypotheses. No candidate changes the default shader.
export function phase0Shader(code, query) {
  const model=query.get('p0Cloud');
  if (['continuous','cells'].includes(model) && code.includes('fn cloudDensityFiltered(')) {
    const start=code.indexOf('fn cloudDensityFiltered('),end=code.indexOf('fn cloudDensity(',start);
    if(end<0)throw Error('Phase 0 cloud splice contract changed');
    code=code.slice(0,start)+cloudCandidate(model)+code.slice(end);
  }
  if(query.get('p0Desat')==='off')code=code.replace('c = mix(c, vec3f(lum), smoothstep(0.7, 6.0, lum) * 0.55);','// Phase 0: isolate the extra pre-AgX desaturation.');
  if(query.get('p0CloudView')==='opacity')code=code.replace('var L=skyAtmo(dir)*(1.0-cl.a)+cl.rgb+(sunDisk(dir)+nightStars(dir))*(1.0-cl.a);','var L=vec3f(cl.a);');
  return code;
}

function cloudCandidate(model) { return /* wgsl */`
fn cloudDensityFiltered(p:vec3f,detail:bool,footprint:f32)->f32 {
  let altitude=p.y+dot(p.xz,p.xz)/(2.0*RG);
  let h=(altitude-F.cloudP.x)/F.weather.w;
  if(h<=0.0 || h>=1.0){return 0.0;}
  let wind=F.windP[0].xy;
  let drift=wind*F.cloudP.w*F.windP[0].z*0.00065;
  let w=p.xz+F.camPos.xz*0.001+F.worldOrigin.xy-drift;
  let strat=select(0.0,1.0,F.weather.z>0.5 && F.weather.z<1.5);
  let storm=step(1.5,F.weather.z);
  let weather=textureSampleLevel(cloudNoise,cloudNoiseSampler,vec3f(w.x*.009,.31,w.y*.009),0.0);
  let cover=clamp(F.cloudP.y+(weather.a-.5)*2.6,0.0,1.0);
  let shear=wind*h*h*F.weather.w*.18;
  let scale=mix(.14,.08,storm);
  let q=vec3f((w+shear).x*scale,h*.34,(w+shear).y*scale);
  let lod=max(0.0,log2(max(footprint,.001)*scale*128.0));
  let n=textureSampleLevel(cloudNoise,cloudNoiseSampler,q,lod);
  let top=mix(.78,.37,strat)+(weather.r-.5)*.28;
  let profile=smoothstep(0.0,.06,h)*(1.0-smoothstep(top*.58,top,h));
  ${model==='continuous' ? `
  let shape=n.r*.78+n.g*.22;
  let threshold=1.0-cover*.67;
  var density=clamp((shape-threshold)/max(.12,1.0-threshold),0.0,1.0)*profile;
  ` : `
  // Connected cell walls candidate; no per-cell ellipsoid scan.
  let bank=textureSampleLevel(cloudNoise,cloudNoiseSampler,vec3f(w.x*.024,.57,w.y*.024),max(0.0,lod-2.0));
  let walls=smoothstep(.32,.62,1.0-bank.g);
  let threshold=1.0-cover*.65-walls*.18;
  var density=clamp((n.r-threshold)/.24,0.0,1.0)*profile;
  `}
  let erosion=textureSampleLevel(cloudNoise,cloudNoiseSampler,q*3.1+vec3f(.17,.31,.59),lod+1.0).b;
  let edge=(1.0-erosion)*mix(.18,.035,strat);
  density=max(0.0,density-edge*(1.0-density));
  return density;
}
`; }
