export const IRRADIANCE_SIZE=16;
export const IRRADIANCE_SAMPLES=128;
// Cosine-weighted hemispherical quadrature. Output is irradiance, not radiance.
// The environment excludes the direct solar disc, which is integrated separately.
export const ENV_IRRADIANCE=/* wgsl */`
@group(0) @binding(0) var environment:texture_cube<f32>;
@group(0) @binding(1) var linearSampler:sampler;
@group(0) @binding(2) var output:texture_storage_2d_array<rgba16float,write>;
fn faceDirection(face:u32,p:vec2f)->vec3f {
  let u=p.x*2.0-1.0;let v=p.y*2.0-1.0;
  switch(face){
    case 0u:{return vec3f(1,-v,-u);}
    case 1u:{return vec3f(-1,-v,u);}
    case 2u:{return vec3f(u,1,v);}
    case 3u:{return vec3f(u,-1,-v);}
    case 4u:{return vec3f(u,-v,1);}
    default:{return vec3f(-u,-v,-1);}
  }
}
@compute @workgroup_size(8,8,1) fn main(@builtin(global_invocation_id) id:vec3u){
  let size=textureDimensions(output);
  if(any(id.xy>=size)){return;}
  let n=normalize(faceDirection(id.z,(vec2f(id.xy)+0.5)/vec2f(size)));
  let axis=select(vec3f(0,1,0),vec3f(1,0,0),abs(n.y)>0.95);
  let t=normalize(cross(axis,n));let b=cross(n,t);
  var sum=vec3f(0);
  for(var i=0u;i<${IRRADIANCE_SAMPLES}u;i++){
    let r=sqrt((f32(i)+0.5)/${IRRADIANCE_SAMPLES}.0);
    let angle=f32(i)*2.399963229728653;
    let direction=t*(r*cos(angle))+b*(r*sin(angle))+n*sqrt(1.0-r*r);
    sum+=textureSampleLevel(environment,linearSampler,direction,2.0).rgb;
  }
  textureStore(output,id.xy,id.z,vec4f(sum*(3.141592653589793/${IRRADIANCE_SAMPLES}.0),1));
}`;
