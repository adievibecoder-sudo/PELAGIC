export const WAVE_COORDINATES=/* wgsl */`
fn cascadeUV(q:vec2f,c:u32,inverseLength:f32,origins:array<vec4f,3>)->vec2f {
  let phase=select(origins[c>>1u].xy,origins[c>>1u].zw,(c&1u)==1u);
  return q*inverseLength+phase;
}
`;
