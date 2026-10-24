export const SUN_DISC = /* wgsl */`
fn sunDiscDirection(direction:vec3f,index:u32)->vec3f {
  let sd=normalize(direction);
  let axis=select(vec3f(0,1,0),vec3f(1,0,0),abs(sd.y)>0.9);
  let tx=normalize(cross(sd,axis));let ty=cross(tx,sd);
  // Centre plus six equally spaced outer samples; no missing seventh sector.
  let angle=(f32(index)-1.0)*1.0471975512;
  let offset=select(vec2f(cos(angle),sin(angle))*0.65,vec2f(0),index==0u);
  return normalize(sd+(tx*offset.x+ty*offset.y)*0.004675);
}
`;
