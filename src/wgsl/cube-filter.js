export const CUBE_COORDINATES = /* wgsl */`
fn cubeDirection(face:u32,uv:vec2f)->vec3f {
  let p=uv*2.0-1.0;
  switch(face){
    case 0u:{return vec3f(1,-p.y,-p.x);}
    case 1u:{return vec3f(-1,-p.y,p.x);}
    case 2u:{return vec3f(p.x,1,p.y);}
    case 3u:{return vec3f(p.x,-1,-p.y);}
    case 4u:{return vec3f(p.x,-p.y,1);}
    default:{return vec3f(-p.x,-p.y,-1);}
  }
}
fn cubeAddress(d:vec3f)->vec3f {
  let a=abs(d);var uv=vec2f(0);var face=0.0;
  if(a.x>=a.y&&a.x>=a.z){
    face=select(1.0,0.0,d.x>=0.0);uv=vec2f(select(d.z,-d.z,d.x>=0.0),-d.y)/a.x;
  }else if(a.y>=a.z){
    face=select(3.0,2.0,d.y>=0.0);uv=vec2f(d.x,select(-d.z,d.z,d.y>=0.0))/a.y;
  }else{
    face=select(5.0,4.0,d.z>=0.0);uv=vec2f(select(-d.x,d.x,d.z>=0.0),-d.y)/a.z;
  }
  return vec3f(uv*.5+.5,face);
}
`;

export const CUBE_CROSS_FACE = CUBE_COORDINATES + /* wgsl */`
fn cubeLoad(t:texture_2d_array<f32>,p:vec2i,face:u32)->vec4f {
  let size=vec2i(textureDimensions(t));
  if(all(p>=vec2i(0))&&all(p<size)){return textureLoad(t,p,face,0);}
  let address=cubeAddress(cubeDirection(face,(vec2f(p)+.5)/vec2f(size)));
  let texel=clamp(vec2i(floor(address.xy*vec2f(size))),vec2i(0),size-1);
  return textureLoad(t,texel,i32(address.z),0);
}
`;
