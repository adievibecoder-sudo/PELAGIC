import {PATCHES} from '../numerics.js';
import {WAVE_COORDINATES} from './coordinates.js';

// Existing Lagrangian displacement already compresses short-wave wavelengths.
// Add only the first-order amplitude response, bounded outside weak-wave validity.
// The 4 m filter separates the carrier strain from cascades 3..5 (lambda < 0.4 m).
export const SHORT_WAVE_COUPLING=WAVE_COORDINATES+/* wgsl */`
fn shortAmplitude(derivatives:texture_2d_array<f32>,linearSampler:sampler,q:vec2f,chop:f32,origins:array<vec4f,3>)->f32 {
  var convergence=0.0;
  let lengths=array<f32,2>(${PATCHES[0]},${PATCHES[1]});
  for(var c=0u;c<2u;c++){
    let lod=max(log2(4.0*256.0/lengths[c]),0.0);
    let d=textureSampleLevel(derivatives,linearSampler,cascadeUV(q,c,1.0/lengths[c],origins),c,lod);
    convergence-=d.z+d.w;
  }
  let strain=convergence/max(chop,0.1);
  return 1.0+0.2*tanh(strain/0.2);
}
fn shortAmplitudeGradient(derivatives:texture_2d_array<f32>,linearSampler:sampler,q:vec2f,chop:f32,origins:array<vec4f,3>)->vec2f {
  // Symmetric metre-scale differences on the deliberately low-pass strain field.
  return vec2f(shortAmplitude(derivatives,linearSampler,q+vec2f(1,0),chop,origins)-shortAmplitude(derivatives,linearSampler,q-vec2f(1,0),chop,origins),
    shortAmplitude(derivatives,linearSampler,q+vec2f(0,1),chop,origins)-shortAmplitude(derivatives,linearSampler,q-vec2f(0,1),chop,origins))*0.5;
}
`;
