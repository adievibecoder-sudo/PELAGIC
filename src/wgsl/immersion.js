// The current GPU surface plane at the lens, shared by sky and surface passes.
// No CPU readback participates in optical classification.
export const IMMERSION = /* wgsl */ `
fn waterFraction(ray:vec3f,surface:vec4f)->f32 {
  let entrance=ray*(0.05/max(dot(ray,F.camFwd.xyz),0.15));
  let signedHeight=F.camPos.y+entrance.y-surface.x-dot(surface.yz,entrance.xz);
  let pixelWidth=max(fwidth(signedHeight),0.001);
  return (1.0-smoothstep(-pixelWidth,pixelWidth,signedHeight))*step(0.5,F.control.z);
}
fn volumeWater(ray:vec3f,distance:f32,surface:vec4f)->vec3f {
  let depth=max(surface.x-F.camPos.y,0.0);
  let ext=F.absorption.rgb+F.backscatter.rgb*12.0;
  let lightDir=refract(-F.sunDir.xyz,vec3f(0,1,0),1.0/1.333);
  let mu=dot(ray,-lightDir);
  let phase=phaseHG(mu,0.75);
  let ambient=skyAtmo(vec3f(0,1,0))*PI;
  let sun=sunIlluminance()*max(F.sunDir.y,0.0)*exp(-ext*depth/max(-lightDir.y,0.2));
  let u=F.backscatter.rgb/(F.absorption.rgb+F.backscatter.rgb);
  let diffuse=ambient*u*0.18*exp(-ext*depth*0.35);
  let scattering=sun*F.backscatter.rgb*12.0/max(ext,vec3f(1e-5))*phase;
  return (diffuse+scattering)*(1.0-exp(-ext*distance));
}
`;
