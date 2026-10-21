// Per-ray near-plane medium field shared by sky and surface passes.
// No CPU readback participates in optical classification.
export const IMMERSION = /* wgsl */ `
fn waterFraction(pixel:vec2f)->f32 {
  let signedHeight=textureSampleLevel(lensMedium,sampC,pixel*F.screen.zw,0.0).r;
  let pixelWidth=max(fwidth(signedHeight),0.00015);
  return (1.0-smoothstep(-pixelWidth,pixelWidth,signedHeight))*step(0.5,F.control.z);
}
fn volumeWater(ray:vec3f,distance:f32,surface:vec4f)->vec3f {
  let depth=max(surface.x-F.camPos.y,0.0);
  let ext=F.absorption.rgb+F.backscatter.rgb*12.0;
  let lightDir=refract(-F.sunDir.xyz,vec3f(0,1,0),1.0/1.333);
  let mu=dot(ray,-lightDir);
  let phase=phaseHG(mu,0.75);
  let ambient=textureSampleLevel(skyIrradiance,sampC,vec3f(0,1,0),0.0).rgb;
  let directT=textureSampleLevel(cloudShadow,sampC,vec2f(0.5),0.0).rg;
  let sun=sunIlluminance()*directT.x*max(F.sunDir.y,0.0)*exp(-ext*depth/max(-lightDir.y,0.2));
  let moonDirection=refract(-F.moonDir.xyz,vec3f(0,1,0),1.0/1.333);
  let moon=moonIlluminance()*directT.y*max(F.moonDir.y,0.0)*exp(-ext*depth/max(-moonDirection.y,0.2));
  let u=F.backscatter.rgb/(F.absorption.rgb+F.backscatter.rgb);
  let diffuse=ambient*u*0.18*exp(-ext*depth*0.35);
  let scattering=(sun*phase+moon*phaseHG(dot(ray,-moonDirection),0.75))*F.backscatter.rgb*12.0/max(ext,vec3f(1e-5));
  return (diffuse+scattering)*(1.0-exp(-ext*distance));
}
`;
