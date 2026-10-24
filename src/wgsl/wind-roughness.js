export const WIND_ROUGHNESS=/* wgsl */`
fn roughHash(cell:vec2i,seed:u32)->f32 {
  let p=vec2u((cell%vec2i(256)+vec2i(256))%vec2i(256));
  var h=p.x*1597334677u+p.y*3812015801u+seed*2798796415u;
  h=(h^(h>>16u))*2246822519u;h=(h^(h>>13u))*3266489917u;
  return f32((h^(h>>16u))>>8u)/8388607.5-1.0;
}
fn roughNoise(p:vec2f,seed:u32)->vec3f {
  let cell=vec2i(floor(p));let f=fract(p);
  let u=f*f*f*(f*(f*6.0-15.0)+10.0);
  let du=30.0*f*f*(f-1.0)*(f-1.0);
  let a=roughHash(cell,seed);let b=roughHash(cell+vec2i(1,0),seed);
  let c=roughHash(cell+vec2i(0,1),seed);let d=roughHash(cell+vec2i(1,1),seed);
  return vec3f(mix(mix(a,b,u.x),mix(c,d,u.x),u.y),
    mix(b-a,d-c,u.y)*du.x,mix(c-a,d-b,u.x)*du.y);
}
fn windRoughness(q:vec2f,wind:vec4f,offset:vec4f)->vec3f {
  if(wind.z<=0.0){return vec3f(1,0,0);}
  let across=vec2f(-wind.y,wind.x);
  let p=vec2f(dot(q,wind.xy)/96.0,dot(q,across)/32.0)+offset.xy;
  let a=roughNoise(p,u32(wind.w));
  let b=roughNoise(p*2.0+vec2f(37.3,19.1),u32(wind.w)+137u);
  let value=a.x*(2.0/3.0)+b.x/3.0;
  let gradient=(a.yz+b.yz)*(2.0/3.0);
  // E[noise]=0: E[gain^2]=1. No global short-wave variance is removed.
  let gain=sqrt(1.0+wind.z*value);
  let worldGradient=wind.xy*(gradient.x/96.0)+across*(gradient.y/32.0);
  return vec3f(gain,worldGradient*(wind.z/(2.0*gain)));
}
`;
