import {FRAME_WGSL} from './common.js';
import {SHORT_WAVE_COUPLING} from './coupling.js';
import {expectShaderMarkers} from './shader-patch.js';

// Jitter raster positions; subtract it when reconstructing camera rays.
export function temporalShader(code,enabled){
  if(!enabled)return code;
  if(code.includes('fn reflectedEnvironment(')){
    code=code.replace('o.pos = F.viewProj * vec4f(o.rel, 1.0);',
      'o.pos = F.viewProj * vec4f(o.rel, 1.0);\n  o.pos = vec4f(o.pos.xy+F.jitter.xy*o.pos.w,o.pos.zw);');
    code=code.replace('return vec4f(mix(col,submerged,wet)/F.windP[1].x, 1.0);',/* wgsl */`
  let radiance=mix(col,submerged,wet);
  let glint=dot(spec,vec3f(.2126,.7152,.0722))/max(dot(radiance,vec3f(.2126,.7152,.0722)),1e-6);
  let reactive=clamp(max(max(foamMask*.9,glint*.95),wet),0.0,1.0);
  return vec4f(radiance/F.windP[1].x,reactive);`);
  }
  code=code.replace('F.camFwd.xyz + in.ndc.x * F.camRight.xyz + in.ndc.y * F.camUp.xyz',
    'F.camFwd.xyz + (in.ndc.x-F.jitter.x) * F.camRight.xyz + (in.ndc.y-F.jitter.y) * F.camUp.xyz');
  code=code.replace('return vec4f(L/F.windP[1].x, 1.0);','return vec4f(L/F.windP[1].x,max(cl.a,waterFraction(in.pos.xy)));');
  code=code.replace('let ndc=vec2f(uv.x*2.0-1.0,1.0-uv.y*2.0);',
    'let ndc=vec2f(uv.x*2.0-1.0,1.0-uv.y*2.0)-F.jitter.xy;');
  code=code.replace('F.camFwd.xyz+(uv.x*2.0-1.0)*F.camRight.xyz+(1.0-uv.y*2.0)*F.camUp.xyz',
    'F.camFwd.xyz+(uv.x*2.0-1.0-F.jitter.x)*F.camRight.xyz+(1.0-uv.y*2.0-F.jitter.y)*F.camUp.xyz');
  code=code.replace('o.p=F.viewProj*vec4f(world-F.camPos.xyz,1);',
    'o.p=F.viewProj*vec4f(world-F.camPos.xyz,1);o.p=vec4f(o.p.xy+F.jitter.xy*o.p.w,o.p.zw);');
  return code;
}

export function oceanMotionShader(ocean){
  const start=ocean.indexOf('struct VSOut {'),end=ocean.indexOf('fn fresnelWater(');
  if(start<0||end<start)throw Error('Ocean motion vertex contract changed');
  let vertex=ocean.slice(start,end);
  expectShaderMarkers(vertex,'Ocean motion',['  @location(2) height: f32,','  var o: VSOut;','  o.xz = xz;']);
  vertex=vertex.replace('  @location(2) height: f32,',`  @location(2) height: f32,
  @location(3) @interpolate(perspective,sample) previousClip:vec4f,
  @location(4) @interpolate(perspective,sample) currentClip:vec4f,`);
  vertex=vertex.replace('  var o: VSOut;',/* wgsl */`
  let oldXZ=xz+F.worldOrigin.zw;
  let oldAmplitude=surfaceAmplitude(oldDerivatives,sampR,oldXZ,F.previousCamera.w,F.previousWaveOrigins,F.previousRoughnessWind,F.previousRoughnessOffset);
  var oldDisp=vec3f(0);
  for(var c=0u;c<6u;c++){
    let texel=F.cascL[c>>2u][c&3u]/TEX_N;
    let lod=log2(max(eff/texel,1.0))+0.5;
    if(lod<8.0){oldDisp+=textureSampleLevel(oldDisplacement,sampR,cascadeUV(oldXZ,c,F.cascInvL[c>>2u][c&3u],F.previousWaveOrigins),c,lod).xyz*select(1.0,oldAmplitude,c>=3u);}
  }
  let oldDelta=oldXZ-F.previousCamera.xz;
  let oldWorld=vec3f(oldXZ.x+oldDisp.x,oldDisp.y-dot(oldDelta,oldDelta)/(2.0*6360000.0),oldXZ.y+oldDisp.z);
  var o: VSOut;
  o.previousClip=F.previousViewProj*vec4f(oldWorld-F.previousCamera.xyz,1);`);
  vertex=vertex.replace('  o.xz = xz;',`  o.currentClip=o.pos;
  o.pos=vec4f(o.pos.xy+F.jitter.xy*o.pos.w,o.pos.zw);
  o.xz = xz;`);
  return FRAME_WGSL+SHORT_WAVE_COUPLING+/* wgsl */`
@group(0) @binding(0) var<uniform> F:Frame;
@group(0) @binding(1) var dispTex:texture_2d_array<f32>;
@group(0) @binding(2) var derivTex:texture_2d_array<f32>;
@group(0) @binding(3) var sampR:sampler;
@group(0) @binding(4) var oldDisplacement:texture_2d_array<f32>;
@group(0) @binding(5) var oldDerivatives:texture_2d_array<f32>;
const TEX_N:f32=256.0;
`+vertex+/* wgsl */`
@fragment fn fs(in:VSOut)->@location(0)vec4f{
  let oldW=max(in.previousClip.w,1e-6);
  let velocity=(in.currentClip.xy/in.currentClip.w-in.previousClip.xy/oldW)*vec2f(.5,-.5);
  return vec4f(velocity,in.previousClip.z/oldW,select(0.0,1.0,in.previousClip.w>0.05));
}`;
}

export const TAA_RESOLVE=FRAME_WGSL+/* wgsl */`
@group(0) @binding(0) var<uniform> F:Frame;
@group(0) @binding(1) var current:texture_2d<f32>;
@group(0) @binding(2) var motion:texture_multisampled_2d<f32>;
@group(0) @binding(3) var depth:texture_depth_multisampled_2d;
@group(0) @binding(4) var history:texture_2d<f32>;
@group(0) @binding(5) var historyDepth:texture_2d<f32>;
@group(0) @binding(6) var linearSampler:sampler;
@group(0) @binding(7) var output:texture_storage_2d<rgba16float,write>;
@group(0) @binding(8) var outputDepth:texture_storage_2d<r32float,write>;
fn ycocg(c:vec3f)->vec3f{return vec3f(dot(c,vec3f(.25,.5,.25)),(c.r-c.b)*.5,dot(c,vec3f(-.25,.5,-.25)));}
fn rgb(c:vec3f)->vec3f{return vec3f(c.x+c.y-c.z,c.x+c.z,c.x-c.y-c.z);}
@compute @workgroup_size(8,8) fn main(@builtin(global_invocation_id) id:vec3u){
  let dims=textureDimensions(output);if(any(id.xy>=dims)){return;}
  let p=vec2i(id.xy);let uv=(vec2f(id.xy)+.5)/vec2f(dims);
  let now=textureLoad(current,p,0);
  var z=0.0;var farZ=1.0;var sample=0;
  for(var s=0;s<4;s++){
    let d=textureLoad(depth,p,s);farZ=min(farZ,d);
    if(d>z){z=d;sample=s;}
  }
  let mv=textureLoad(motion,p,sample);
  var oldUV=uv-mv.xy+(F.jitter.zw-F.jitter.xy)*vec2f(.5,-.5);
  var expectedZ=mv.z;var valid=F.temporal.x*mv.w;
  if(z==0.0){
    let ndc=vec2f(uv.x*2.0-1.0,1.0-uv.y*2.0)-F.jitter.xy;
    let ray=F.camFwd.xyz+ndc.x*F.camRight.xyz+ndc.y*F.camUp.xyz;
    let old=F.previousViewProj*vec4f(ray,0);
    oldUV=(old.xy/max(old.w,1e-6)+F.jitter.zw)*vec2f(.5,-.5)+.5;
    expectedZ=0.0;valid=F.temporal.x*select(0.0,1.0,old.w>0.0);
  }
  if(any(oldUV<vec2f(.5)/vec2f(dims))||any(oldUV>1.0-vec2f(.5)/vec2f(dims))){valid=0.0;}
  // Reject mixed sky/water coverage instead of assigning its averaged colour to
  // one surface. Select depth and velocity from exactly the same MSAA sample.
  if(z>0.0 && farZ==0.0){valid=0.0;}
  let oldPixel=clamp(vec2i(oldUV*vec2f(dims)),vec2i(0),vec2i(dims)-1);
  let previousZ=textureLoad(historyDepth,oldPixel,0).r;
  // Binary16 motion-depth rounding contributes at most 2^-25 absolute error.
  if((z==0.0)!=(previousZ==0.0)||abs(previousZ-expectedZ)>max(expectedZ*.025,3.1e-8)){valid=0.0;}
  let old=textureSampleLevel(history,linearSampler,oldUV,0);
  var lo=vec3f(1e30);var hi=vec3f(-1e30);var mean=vec3f(0);var square=vec3f(0);
  for(var y=-1;y<=1;y++){for(var x=-1;x<=1;x++){
    let c=ycocg(textureLoad(current,clamp(p+vec2i(x,y),vec2i(0),vec2i(dims)-1),0).rgb);
    lo=min(lo,c);hi=max(hi,c);mean+=c/9.0;square+=c*c/9.0;
  }}
  let sigma=sqrt(max(square-mean*mean,vec3f(0)));
  lo=max(lo,mean-sigma*1.25);hi=min(hi,mean+sigma*1.25);
  let previous=ycocg(old.rgb*F.temporal.y);
  let centre=(lo+hi)*.5;let extent=max((hi-lo)*.5,vec3f(1e-7));
  let delta=previous-centre;let ratio=abs(delta)/extent;
  let clipped=centre+delta/max(1.0,max(ratio.x,max(ratio.y,ratio.z)));
  let lum=ycocg(now.rgb).x;
  let disagreement=abs(previous.x-lum)/max(max(abs(previous.x),abs(lum)),1e-5);
  let speed=length((oldUV-uv)*vec2f(dims));
  let reactive=max(now.a,old.a);
  var weight=mix(.72,.35,clamp(speed/12.0,0.0,1.0))*(1.0-.9*reactive);
  weight*=1.0-smoothstep(.15,.7,disagreement);
  // Cloud opacity marks finite-distance volumes: rotation-only sky motion is
  // insufficient for cloud parallax/advection. S5 owns their separate history.
  if(z==0.0){weight=min(weight,mix(.72,.08,now.a));}
  weight*=valid;
  let result=max(mix(now.rgb,rgb(clipped),weight),vec3f(0));
  textureStore(output,p,vec4f(result,now.a));textureStore(outputDepth,p,vec4f(z));
}`;
