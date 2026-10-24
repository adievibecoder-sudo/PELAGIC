// Conservative two-stream diffuse-light approximation. Column transport cannot
// represent lateral escape; retain as an explicit comparison until validated.
export const CLOUD_AMBIENT=/* wgsl */`
fn columnAmbient(p:vec3f,sigma:f32)->f32 {
  let altitude=p.y+dot(p.xz,p.xz)/(2.0*RG);
  let lengths=max(vec2f(F.cloudP.x+F.weather.w-altitude,altitude-F.cloudP.x),vec2f(0));
  var tau=vec2f(0);
  for(var i=0u;i<4u;i++){
    let u=(f32(i)+0.5)*0.25;
    tau.x+=cloudDensityFiltered(p+vec3f(0,lengths.x*u,0),false,lengths.x*0.035)*lengths.x*0.25;
    tau.y+=cloudDensityFiltered(p-vec3f(0,lengths.y*u,0),false,lengths.y*0.035)*lengths.y*0.25;
  }
  // Mean cosine of the existing dual-HG droplet phase, no new roughness/colour fit.
  tau*=sigma*(1.0-(0.85*0.68+0.15*(-0.25)));
  return (1.0+1.7320508*tau.y)/(1.0+0.8660254*(tau.x+tau.y));
}
`;
export function cloudAmbientShader(code,query) {
  if(query.get('maAmbient')!=='column'||!code.includes('fn cloudLayers('))return code;
  const marker='ambient*mix(0.18,1.0,sqrt(height))';
  if(!code.includes(marker))throw Error('Cloud ambient splice contract changed');
  return code.replace('fn cloudLayers(',CLOUD_AMBIENT+'fn cloudLayers(')
    .replace(marker,'ambient*columnAmbient(p,sigma)');
}
