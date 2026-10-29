import {PATCHES} from '../numerics.js';
import {WAVE_COORDINATES} from './coordinates.js';
import {WIND_ROUGHNESS} from './wind-roughness.js';
import {REGIONAL_SEA} from './regional-sea.js';

// Existing Lagrangian displacement already compresses short-wave wavelengths.
// Add only the first-order amplitude response, bounded outside weak-wave validity.
// The 4 m filter separates the carrier strain from cascades 3..5 (lambda < 0.4 m).
export const SHORT_WAVE_COUPLING=WAVE_COORDINATES+WIND_ROUGHNESS+REGIONAL_SEA+/* wgsl */`
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
fn surfaceAmplitude(derivatives:texture_2d_array<f32>,linearSampler:sampler,q:vec2f,chop:f32,origins:array<vec4f,3>,wind:vec4f,offset:vec4f,front:vec4f,frontControl:vec4f,seaEnergy:vec4f)->f32 {
  return shortAmplitude(derivatives,linearSampler,q,chop,origins)*windRoughness(q,wind,offset).x*regionalSea(q,front,frontControl,seaEnergy).x;
}
fn surfaceCoupling(derivatives:texture_2d_array<f32>,linearSampler:sampler,q:vec2f,chop:f32,origins:array<vec4f,3>,wind:vec4f,offset:vec4f,front:vec4f,frontControl:vec4f,seaEnergy:vec4f)->vec3f {
  let a=shortAmplitude(derivatives,linearSampler,q,chop,origins);
  let gradient=shortAmplitudeGradient(derivatives,linearSampler,q,chop,origins);
  let windField=windRoughness(q,wind,offset);
  let sea=regionalSea(q,front,frontControl,seaEnergy);
  let gain=windField.x*sea.x;
  let gainGradient=windField.yz*sea.x+sea.yz*windField.x;
  return vec3f(a*gain,gradient*gain+a*gainGradient);
}
`;
