import {PATCHES} from '../numerics.js';

// Existing Lagrangian displacement already compresses short-wave wavelengths.
// Add only the first-order amplitude response, bounded outside weak-wave validity.
// The 4 m filter separates the carrier strain from cascades 3..5 (lambda < 0.4 m).
export const SHORT_WAVE_COUPLING=/* wgsl */`
fn shortAmplitude(derivatives:texture_2d_array<f32>,linearSampler:sampler,q:vec2f,chop:f32)->f32 {
  var convergence=0.0;
  let lengths=array<f32,2>(${PATCHES[0]},${PATCHES[1]});
  for(var c=0u;c<2u;c++){
    let lod=max(log2(4.0*256.0/lengths[c]),0.0);
    let d=textureSampleLevel(derivatives,linearSampler,q/lengths[c],c,lod);
    convergence-=d.z+d.w;
  }
  let strain=convergence/max(chop,0.1);
  return 1.0+0.2*tanh(strain/0.2);
}
fn shortAmplitudeGradient(derivatives:texture_2d_array<f32>,linearSampler:sampler,q:vec2f,chop:f32)->vec2f {
  // Symmetric metre-scale differences on the deliberately low-pass strain field.
  return vec2f(shortAmplitude(derivatives,linearSampler,q+vec2f(1,0),chop)-shortAmplitude(derivatives,linearSampler,q-vec2f(1,0),chop),
    shortAmplitude(derivatives,linearSampler,q+vec2f(0,1),chop)-shortAmplitude(derivatives,linearSampler,q-vec2f(0,1),chop))*0.5;
}
`;
