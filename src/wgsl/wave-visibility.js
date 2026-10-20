import {FRAME_WGSL,N} from './common.js';
import {WAVE_COORDINATES} from './coordinates.js';

export const WAVE_MAP_SIZE=256;
export const WAVE_MAP_COORDS=/* wgsl */`
fn waveMapSpan(layer:u32)->f32 {return select(128.0,1024.0,layer==1u);}
fn waveMapCentre(camera:vec2f,layer:u32)->vec2f {
  let texel=waveMapSpan(layer)/256.0;
  return floor(camera/texel)*texel;
}
`;

// Eulerian height atlas for resolved gravity waves. The four-step inverse is
// damped near steep crests; it cannot represent an overturned, multivalued sea.
export const WAVE_HEIGHT=FRAME_WGSL+WAVE_MAP_COORDS+WAVE_COORDINATES+/* wgsl */`
@group(0) @binding(0) var<uniform> F:Frame;
@group(0) @binding(1) var displacement:texture_2d_array<f32>;
@group(0) @binding(2) var linearRepeat:sampler;
@group(0) @binding(3) var output:texture_storage_2d_array<rgba16float,write>;
fn gravityDisplacement(q:vec2f,spacing:f32)->vec3f {
  var d=vec3f(0);
  for(var c=0u;c<3u;c++){
    let texel=F.cascL[c>>2u][c&3u]/${N}.0;
    let lod=max(log2(max(spacing/texel,1.0)),0.0);
    d+=textureSampleLevel(displacement,linearRepeat,cascadeUV(q,c,F.cascInvL[c>>2u][c&3u],F.waveOrigins),c,lod).xyz;
  }
  return d;
}
@compute @workgroup_size(8,8) fn main(@builtin(global_invocation_id) id:vec3u){
  let span=waveMapSpan(id.z);let spacing=span/256.0;
  let goal=waveMapCentre(F.camPos.xz,id.z)+((vec2f(id.xy)+0.5)/256.0-0.5)*span;
  var q=goal;
  for(var i=0u;i<5u;i++){let d=gravityDisplacement(q,spacing);q=mix(q,goal-d.xz,0.75);}
  let d=gravityDisplacement(q,spacing);
  textureStore(output,id.xy,id.z,vec4f(d.y,length(q+d.xz-goal),0,1));
}
`;

export const WAVE_SHADOW_CORE=WAVE_MAP_COORDS+/* wgsl */`
fn atlasHeight(heights:texture_2d_array<f32>,linearClamp:sampler,p:vec2f,camera:vec2f,preferred:u32)->vec2f {
  var layer=preferred;
  var uv=(p-waveMapCentre(camera,layer))/waveMapSpan(layer)+0.5;
  if(layer==0u && (any(uv<vec2f(0.01)) || any(uv>vec2f(0.99)))){
    layer=1u;uv=(p-waveMapCentre(camera,layer))/waveMapSpan(layer)+0.5;
  }
  if(any(uv<vec2f(0.005)) || any(uv>vec2f(0.995))){return vec2f(0,0);}
  return vec2f(textureSampleLevel(heights,linearClamp,uv,layer,0.0).r,1);
}
fn gravityVisibility(heights:texture_2d_array<f32>,linearClamp:sampler,point:vec3f,camera:vec2f,light:vec3f,layer:u32)->f32 {
  if(light.y<=0.0){return 0.0;}
  let horizontal=length(light.xz);
  if(horizontal<0.001){return 1.0;}
  let direction=light.xz/horizontal;let tangent=light.y/horizontal;
  var visible=1.0;
  let spacing=waveMapSpan(layer)/256.0;
  var distance=spacing*1.5;
  for(var i=0u;i<28u;i++){
    let h=atlasHeight(heights,linearClamp,point.xz+direction*distance,camera,layer);
    if(h.y==0.0){break;}
    let ray=point.y+distance*tangent;
    let penumbra=0.004675*distance/horizontal;
    // Half-float height error and the footprint of the source texel, metres.
    let bias=0.035+spacing*0.06;
    visible=min(visible,smoothstep(-penumbra-bias,penumbra+bias,ray-h.x+bias));
    if(visible<0.001){break;}
    distance+=spacing*max(1.0,distance/(spacing*7.0));
  }
  return visible;
}
// Finite-height-field reflection visibility, separate from microfacet masking.
// Returns the strongest obstruction and a footprint-filtered hit weight. This
// is a bounded single-bounce approximation, not a complete reflection tracer.
fn gravityReflectionHit(heights:texture_2d_array<f32>,linearClamp:sampler,point:vec3f,camera:vec2f,ray:vec3f,layer:u32)->vec4f {
  let horizontal=length(ray.xz);
  if(horizontal<0.001){return vec4f(0);}
  let start=atlasHeight(heights,linearClamp,point.xz,camera,layer);
  if(start.y==0.0){return vec4f(0);}
  let spacing=waveMapSpan(layer)/256.0;
  let originHeight=max(point.y,start.x)+0.035+spacing*0.06;
  let direction=ray.xz/horizontal;
  let tangent=ray.y/horizontal;
  var result=vec4f(0);
  var distance=spacing*1.5;
  for(var i=0u;i<20u;i++){
    let p=point.xz+direction*distance;
    let h=atlasHeight(heights,linearClamp,p,camera,layer);
    if(h.y==0.0){break;}
    let difference=h.x-originHeight-distance*tangent;
    let width=spacing*0.08+distance*0.0005;
    let hit=smoothstep(-width,width,difference);
    if(hit>result.w){result=vec4f(p,distance,hit);}
    if(hit>0.999){break;}
    distance*=1.35;
  }
  return result;
}
`;

export const WAVE_SHADOW=FRAME_WGSL+WAVE_SHADOW_CORE+/* wgsl */`
@group(0) @binding(0) var<uniform> F:Frame;
@group(0) @binding(1) var heights:texture_2d_array<f32>;
@group(0) @binding(2) var linearClamp:sampler;
@group(0) @binding(3) var output:texture_storage_2d_array<rgba16float,write>;
@compute @workgroup_size(8,8) fn main(@builtin(global_invocation_id) id:vec3u){
  let span=waveMapSpan(id.z);
  let xz=waveMapCentre(F.camPos.xz,id.z)+((vec2f(id.xy)+0.5)/256.0-0.5)*span;
  let height=textureLoad(heights,id.xy,id.z,0).r;
  let visibility=gravityVisibility(heights,linearClamp,vec3f(xz.x,height,xz.y),F.camPos.xz,F.sunDir.xyz,id.z);
  var lunar=1.0;
  if(F.celestial.x>0.0){lunar=gravityVisibility(heights,linearClamp,vec3f(xz.x,height,xz.y),F.camPos.xz,F.moonDir.xyz,id.z);}
  textureStore(output,id.xy,id.z,vec4f(visibility,lunar,0,1));
}
`;
