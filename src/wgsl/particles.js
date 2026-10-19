import {FRAME_WGSL,ATMO_CORE_WGSL,NOISE_WGSL,CASCADES} from './common.js';
import {SKY_RENDER_FUNCS} from './sky.js';
export const PARTICLE_COUNT=12288;
export const PARTICLE_UPDATE=FRAME_WGSL+NOISE_WGSL+/* wgsl */`
struct Particle {p:vec4f,v:vec4f};
@group(0) @binding(0) var<uniform> F:Frame;
@group(0) @binding(1) var<storage,read_write> particles:array<Particle>;
@group(0) @binding(2) var foam:texture_2d_array<f32>;
@group(0) @binding(3) var disp:texture_2d_array<f32>;
@group(0) @binding(4) var samp:sampler;
fn rnd(v:u32)->f32{return f32(pcgHash(v)>>8u)/16777216.0;}
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) id:vec3u){
 let k=id.x;if(k>=${PARTICLE_COUNT}u){return;}
 let rain=k%3u==0u;
 var p=particles[k];let dt=min(F.backscatter.w,0.05);
 if(dt<=0.0){return;}
 p.p.w-=dt;
 if(p.p.w<=0.0 || distance(p.p.xyz,F.camPos.xyz)>220.0){
   let seed=k*137u+u32(F.post.z)*197u;
   let r=vec3f(rnd(seed+1u),rnd(seed+2u),rnd(seed+3u));
   let xz=F.camPos.xz+(r.xz-0.5)*select(180.0,70.0,rain);
   var d=vec3f(0);for(var c=0u;c<${CASCADES}u;c++){
     d+=textureSampleLevel(disp,samp,xz*F.cascInvL[c>>2u][c&3u],c,0.0).xyz;
   }
   let fresh=textureSampleLevel(foam,samp,xz/F.lodP.z,0u,0.0).g;
   let spawn=select(fresh*F.weather.y*min(F.windP[0].z*0.07,2.0),F.weather.x,rain);
   if(rnd(seed+4u)>spawn){p.p=vec4f(xz.x,-1000,xz.y,0);particles[k]=p;return;}
   p.p=vec4f(xz.x+d.x,select(d.y+0.08,F.camPos.y+8.0+r.y*25.0,rain),xz.y+d.z,select(0.7+r.y*1.5,4.0,rain));
   p.v=vec4f(F.windP[0].x*F.windP[0].z*0.3,select(1.5+r.y*3.0,-7.0,rain),F.windP[0].y*F.windP[0].z*0.3,select(0.025+r.y*0.06,0.012,rain));
 } else {
   let air=vec3f(F.windP[0].x*F.windP[0].z*0.7,0,F.windP[0].y*F.windP[0].z*0.7);
   p.v=vec4f(mix(p.v.xyz,air,1.0-exp(-dt*1.8))+vec3f(0,-9.81,0)*dt,p.v.w);
   p.p=vec4f(p.p.xyz+p.v.xyz*dt,p.p.w);
   if(p.p.y< -3.0){p.p.w=0.0;}
 }
 particles[k]=p;
}`;
export const PARTICLE_RENDER=FRAME_WGSL+ATMO_CORE_WGSL+/* wgsl */`
struct Particle {p:vec4f,v:vec4f};
@group(0) @binding(0) var<uniform> F:Frame;
@group(0) @binding(1) var<storage,read> particles:array<Particle>;
@group(0) @binding(2) var environment:texture_cube<f32>;
@group(0) @binding(3) var lightSampler:sampler;
@group(0) @binding(4) var shadow:texture_2d<f32>;
@group(0) @binding(5) var transLUT:texture_2d<f32>;
@group(0) @binding(6) var sampC:sampler;
@group(0) @binding(7) var skyLUT:texture_2d<f32>;
`+SKY_RENDER_FUNCS+/* wgsl */`
struct VOut{@builtin(position) p:vec4f,@location(0) uv:vec2f,@location(1) opacity:f32,@location(2) light:vec3f};
@vertex fn vs(@builtin(vertex_index) v:u32,@builtin(instance_index) id:u32)->VOut{
 let corners=array<vec2f,6>(vec2f(-1,-1),vec2f(1,-1),vec2f(1,1),vec2f(-1,-1),vec2f(1,1),vec2f(-1,1));
 let p=particles[id];let uv=corners[v];let rain=id%3u==0u;
 let stretch=select(1.0,12.0,rain);
 let right=normalize(F.camRight.xyz);let up=normalize(F.camUp.xyz);
 let world=p.p.xyz+right*uv.x*p.v.w+up*uv.y*p.v.w*stretch;
 var o:VOut;o.p=F.viewProj*vec4f(world-F.camPos.xyz,1);o.uv=uv;
 o.opacity=smoothstep(0.0,0.3,p.p.w)*select(0.13,0.16,rain)*select(F.weather.y,F.weather.x,rain);
 let cosTheta=dot(normalize(p.p.xyz-F.camPos.xyz),F.sunDir.xyz);
 let phase=0.07957747*(1.0-0.75*0.75)/pow(max(1.0+0.75*0.75-1.5*cosTheta,0.001),1.5);
 let ambient=textureSampleLevel(environment,lightSampler,vec3f(0,1,0),6.0).rgb;
 let shadowUV=clamp((p.p.xz-F.camPos.xz)/40000.0+0.5,vec2f(0.001),vec2f(0.999));
 let sunlight=textureSampleLevel(shadow,lightSampler,shadowUV,0.0).r;
 o.light=ambient*0.65+sunIlluminance()*sunlight*phase;
 return o;
}
@fragment fn fs(i:VOut)->@location(0)vec4f{
 let alpha=exp(-dot(i.uv,i.uv)*3.0)*i.opacity;
 return vec4f(i.light,alpha);
}`;
