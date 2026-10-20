import {FRAME_WGSL,CASCADES,N} from './common.js';
import {SHORT_WAVE_COUPLING} from './coupling.js';

export const LENS_MEDIUM=FRAME_WGSL+SHORT_WAVE_COUPLING+/* wgsl */`
@group(0) @binding(0) var<uniform> F:Frame;
@group(0) @binding(1) var dispTex:texture_2d_array<f32>;
@group(0) @binding(2) var derivTex:texture_2d_array<f32>;
@group(0) @binding(3) var linearRepeat:sampler;
@group(0) @binding(4) var<storage,read> surfaceAtLens:vec4f;
@group(0) @binding(5) var output:texture_storage_2d<rgba16float,write>;
fn lensVertex(q:vec2f)->vec3f {
  var d=vec3f(0);
  let amplitude=shortAmplitude(derivTex,linearRepeat,q,F.windP[1].y,F.waveOrigins);
  for(var c=0u;c<${CASCADES}u;c++){
    let texel=F.cascL[c>>2u][c&3u]/${N}.0;
    let lod=log2(max((2.0/F.lodP.y)/texel,1.0))+0.5;
    if(lod<8.0){d+=textureSampleLevel(dispTex,linearRepeat,cascadeUV(q,c,F.cascInvL[c>>2u][c&3u],F.waveOrigins),c,lod).xyz*select(1.0,amplitude,c>=3u);}
  }
  return d;
}
fn lensDisplacement(q:vec2f)->vec3f {
  let spacing=2.0/F.lodP.y;
  let base=floor(q/spacing)*spacing;let f=fract(q/spacing);
  let a=lensVertex(base);let d=lensVertex(base+vec2f(spacing));
  // Same a-c-d / a-d-b diagonal as the raster grid. A smooth texture inverse
  // otherwise disagrees with the centimetre-scale facets at the near plane.
  if(f.y>f.x){return a*(1.0-f.y)+lensVertex(base+vec2f(0,spacing))*(f.y-f.x)+d*f.x;}
  return a*(1.0-f.x)+lensVertex(base+vec2f(spacing,0))*(f.x-f.y)+d*f.y;
}
@compute @workgroup_size(8,8) fn main(@builtin(global_invocation_id) id:vec3u){
  let dims=textureDimensions(output);if(any(id.xy>=dims)){return;}
  let uv=(vec2f(id.xy)+0.5)/vec2f(dims);
  let ray=F.camFwd.xyz+(uv.x*2.0-1.0)*F.camRight.xyz+(1.0-uv.y*2.0)*F.camUp.xyz;
  // Unnormalised camera ray has dot(ray,forward)=1: this is the actual near plane.
  let entrance=F.camPos.xyz+ray*0.05;
  var signedDistance=F.camPos.y-surfaceAtLens.x;
  var residual=0.0;
  if(abs(signedDistance)<0.75){
    var q=surfaceAtLens.yz+entrance.xz-F.camPos.xz;
    for(var i=0u;i<8u;i++){
      let d=lensDisplacement(q);
      q+=clamp(entrance.xz-q-d.xz,vec2f(-1.0),vec2f(1.0))*0.8;
    }
    let d=lensDisplacement(q);
    signedDistance=entrance.y-d.y;
    residual=length(q+d.xz-entrance.xz);
  }
  textureStore(output,id.xy,vec4f(signedDistance,residual,0,1));
}
`;
