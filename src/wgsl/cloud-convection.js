// Opt-in Milestone A experiment. Density changes only; optical coefficients,
// radiance integration, atmosphere and the ocean remain unchanged.
export function cloudConvectionShader(code, query) {
  if (query.get('maCloud') !== 'convective' || !code.includes('fn thermalShape(')) return code;
  const thermalStart = code.indexOf('fn thermalShape(');
  const densityStart = code.indexOf('fn cloudDensityFiltered(');
  const densityEnd = code.indexOf('fn cloudDensity(p:', densityStart);
  if (densityStart < thermalStart || densityEnd < densityStart) throw Error('Cloud density splice contract changed');
  const thermal = code.slice(thermalStart, densityStart);
  const density = code.slice(densityStart, densityEnd);
  const nextThermal = thermal.replace('thermalShape(', 'thermalConvection(')
    .replace('let size=mix(3.6,7.0,storm);', 'let size=mix(5.4,7.0,storm);')
    .replace('(id+0.2+random.xy*0.6)*size', '(id+0.04+random.xy*0.92)*size')
    .replace('layerDepth*(0.20+0.64*random.y*random.y)', 'layerDepth*(0.24+0.68*random.y)')
    .replace('size*(0.17+0.29*random.x)', 'size*(0.12+0.30*random.x)');
  const nextDensity = density.replace('cloudDensityFiltered(', 'cloudDensityConvection(')
    // Noise follows the layer altitude, not the camera's tangent-plane sag.
    .replace('let world=p+vec3f(', 'let world=vec3f(p.x,altitude,p.z)+vec3f(')
    .replace('let thermal=thermalShape(world,altitude,cover,storm,layerDepth);', /* wgsl */`
      // Smooth world-space envelope distortion, with smaller billows inside it.
      // This approximates convective morphology; it is not a moisture solver.
      let bendNoise=textureSampleLevel(cloudNoise,cloudNoiseSampler,world*vec3f(.12,.22,.12),max(lod-2.0,0.0));
      let bendNoise2=textureSampleLevel(cloudNoise,cloudNoiseSampler,world*vec3f(.31,.47,.31)+vec3f(.33,.71,.19),max(lod-1.0,0.0));
      let distorted=world+vec3f((bendNoise.rg-.5)*1.1+(bendNoise2.rg-.5)*.30,0).xzy;
      let thermal=thermalConvection(distorted,altitude,cover,storm,layerDepth);`)
    .replace('let billow=(shape.r-0.5)*3.4+(shape.g-0.4)*0.65;', 'let billow=(shape.r-0.5)*1.9+(shape.g-0.4)*0.95+(bendNoise2.b-.45)*.6;')
    .replace('return density;', 'return density*.86;');
  const wrapper = /* wgsl */`
fn cloudDensityFiltered(p:vec3f,detail:bool,footprint:f32)->f32 {
  let weight=clamp(regionalTypes(p.xz).x,0.0,1.0);
  if(weight<.0001){return cloudDensityPreserved(p,detail,footprint);}
  let convection=cloudDensityConvection(p,detail,footprint);
  if(weight>.9999){return convection;}
  return mix(cloudDensityPreserved(p,detail,footprint),convection,weight);
}
`;
  return code.slice(0, densityStart) + density.replace('cloudDensityFiltered(', 'cloudDensityPreserved(')
    + nextThermal + nextDensity + wrapper + code.slice(densityEnd);
}
