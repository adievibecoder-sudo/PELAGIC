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

// Gaussian stress fluctuations with unit marginal variance at every location.
// Normalizing interpolation variance prevents quiet grid centres / gusty nodes.
export const GAUSSIAN_STRESS=/* wgsl */`
fn stressGaussian(cell:vec2i,seed:u32)->f32 {
  let u=clamp(0.5+0.5*roughHash(cell,seed),0.0000001,0.9999999);
  let v=0.5+0.5*roughHash(cell,seed+1931u);
  return sqrt(-2.0*log(u))*cos(6.28318530718*v);
}
fn stressNoise(p:vec2f,seed:u32)->vec3f {
  let cell=vec2i(floor(p));let f=fract(p);
  let u=f*f*f*(f*(f*6.0-15.0)+10.0);
  let du=30.0*f*f*(f-1.0)*(f-1.0);
  let w=vec4f((1.0-u.x)*(1.0-u.y),u.x*(1.0-u.y),(1.0-u.x)*u.y,u.x*u.y);
  let dx=vec4f(-(1.0-u.y),1.0-u.y,-u.y,u.y)*du.x;
  let dy=vec4f(-(1.0-u.x),-u.x,1.0-u.x,u.x)*du.y;
  let samples=vec4f(stressGaussian(cell,seed),stressGaussian(cell+vec2i(1,0),seed),
    stressGaussian(cell+vec2i(0,1),seed),stressGaussian(cell+vec2i(1,1),seed));
  let variance=dot(w,w);let inv=inverseSqrt(variance);let value=dot(w,samples)*inv;
  return vec3f(value,dot(dx,samples)*inv-value*dot(w,dx)/variance,
    dot(dy,samples)*inv-value*dot(w,dy)/variance);
}
fn stressRoughness(q:vec2f,wind:vec4f,offset:vec4f)->vec3f {
  if(wind.z<=0.0){return vec3f(1,0,0);}
  let across=vec2f(-wind.y,wind.x);
  let p=vec2f(dot(q,wind.xy)/96.0,dot(q,across)/32.0)+offset.xy;
  let a=stressNoise(p,u32(wind.w));
  let b=stressNoise(p*2.0+vec2f(37.3,19.1),u32(wind.w)+137u);
  let value=(2.0*a.x+b.x)*inverseSqrt(5.0);
  let gradient=(a.yz+b.yz)*(2.0*inverseSqrt(5.0));
  // The spectrum's local wind response supplies sigma. E[exp(sigma Z-
  // sigma^2/2)]=1, so mean squared wave amplitude is retained analytically.
  let sigma=wind.z;
  let gain=exp(0.5*sigma*value-0.25*sigma*sigma);
  let worldGradient=wind.xy*(gradient.x/96.0)+across*(gradient.y/32.0);
  return vec3f(gain,worldGradient*(0.5*sigma*gain));
}
`;

export function stressRoughnessShader(code,query){
  if(query.get('maRoughness')!=='stress'||!code.includes('fn windRoughness('))return code;
  return code.replace('fn windRoughness(',GAUSSIAN_STRESS+'fn legacyWindRoughness(')
    .replaceAll('windRoughness(q,wind,offset)','stressRoughness(q,wind,offset)');
}
