// bb is the hemispherical backscatter coefficient [1/m]. Rayleigh molecules
// backscatter half their energy; particles use b/bb=12, fixing HG g uniquely.
export const WATER_OPTICS = /* wgsl */`
const WATER_PARTICLE_G:f32 = 0.70223624;
fn waterMolecularScatter(bb:vec3f)->vec3f {
  return 2.0*min(bb,vec3f(0.0007,0.001,0.0015));
}
fn waterParticleScatter(bb:vec3f)->vec3f {
  return 12.0*max(bb-0.5*waterMolecularScatter(bb),vec3f(0));
}
fn waterPhase(cosine:f32,molecular:vec3f,particles:vec3f)->vec3f {
  let g=WATER_PARTICLE_G;
  let phase=(1.0-g*g)/(12.5663706144*pow(max(1.0+g*g-2.0*g*cosine,1e-5),1.5));
  return molecular*(3.0/50.2654824574)*(1.0+cosine*cosine)+particles*phase;
}
`;
