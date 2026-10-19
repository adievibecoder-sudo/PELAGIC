// Periodic volume built once on the GPU. Original implementation, no image assets.
export const CLOUD_NOISE = /* wgsl */ `
@group(0) @binding(0) var dst:texture_storage_3d<rgba8unorm,write>;
fn hash(p:vec3i,period:i32)->vec3f {
  let q=((p%period)+period)%period;
  var s=(u32(q.x)*73856093u) ^ (u32(q.y)*19349663u) ^ (u32(q.z)*83492791u);
  s=(s^(s>>16u))*2246822519u;s=(s^(s>>13u))*3266489917u;s^=s>>16u;
  return vec3f(f32(s&1023u),f32((s>>10u)&1023u),f32((s>>20u)&1023u))/1024.0;
}
fn perlin(p:vec3f,period:i32)->f32 {
  let cell=vec3i(floor(p));let f=fract(p);let u=f*f*f*(f*(f*6.0-15.0)+10.0);
  var v=0.0;
  for(var z=0;z<=1;z++){for(var y=0;y<=1;y++){for(var x=0;x<=1;x++){
    let o=vec3i(x,y,z);let gradient=normalize(hash(cell+o,period)*2.0-1.0+vec3f(0.001));
    let weight=mix(1.0-u,u,vec3f(o));
    v+=dot(gradient,f-vec3f(o))*weight.x*weight.y*weight.z;
  }}}
  return clamp(v*0.85+0.5,0.0,1.0);
}
fn worley(p:vec3f,period:i32)->f32 {
  let cell=vec3i(floor(p));let f=fract(p);var nearest=2.0;
  for(var z=-1;z<=1;z++){for(var y=-1;y<=1;y++){for(var x=-1;x<=1;x++){
    let o=vec3i(x,y,z);let d=vec3f(o)+hash(cell+o,period)-f;nearest=min(nearest,dot(d,d));
  }}}
  return clamp(1.0-sqrt(nearest),0.0,1.0);
}
@compute @workgroup_size(4,4,4) fn main(@builtin(global_invocation_id) id:vec3u){
  let p=(vec3f(id)+0.5)/64.0;
  let base=0.625*perlin(p*8.0,8)+0.25*perlin(p*16.0,16)+0.125*perlin(p*32.0,32);
  let w=worley(p*8.0,8);let fine=0.625*worley(p*16.0,16)+0.375*worley(p*32.0,32);
  textureStore(dst,id,vec4f(clamp(base*1.5-0.2*(1.0-w),0.0,1.0),w,fine,perlin(p*4.0,4)));
}`;

export const CLOUD_NOISE_MIP = /* wgsl */ `
@group(0) @binding(0) var src:texture_3d<f32>;
@group(0) @binding(1) var dst:texture_storage_3d<rgba8unorm,write>;
@compute @workgroup_size(4,4,4) fn main(@builtin(global_invocation_id) id:vec3u){
  if(any(id>=textureDimensions(dst))){return;}
  var sum=vec4f(0);
  for(var z=0;z<2;z++){for(var y=0;y<2;y++){for(var x=0;x<2;x++){
    sum+=textureLoad(src,vec3i(id)*2+vec3i(x,y,z),0);
  }}}
  textureStore(dst,id,sum*0.125);
}`;
