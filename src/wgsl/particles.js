import {FRAME_WGSL,ATMO_CORE_WGSL,NOISE_WGSL,CASCADES,CONFIG} from './common.js';
import {SKY_RENDER_FUNCS} from './sky.js';
import {SHORT_WAVE_COUPLING} from './coupling.js';
import {EMISSION_HAZARD} from './breaking-events.js';
import {replaceShader} from './shader-patch.js';
export const PARTICLE_COUNT=CONFIG.quality==='Balanced'?24576:49152;
export function particleMotionShader(code,query){
 if(query.get('abRain')!=='velocity'||!code.includes('let stretch=select(1.0,12.0,rain);'))return code;
 code=replaceShader(code,' let world=p.p.xyz+right*uv.x*drawRadius+up*uv.y*drawRadius*stretch;',/* wgsl */`
 // Project the simulated velocity, including perspective motion, into the
 // billboard plane. Camera-up streaks otherwise rotate independently of wind.
 let relative=p.p.xyz-F.camPos.xyz;
 let depth=max(dot(relative,F.camFwd.xyz),0.1);
 let velocity=p.v.xyz-relative*(dot(p.v.xyz,F.camFwd.xyz)/depth);
 let projected=vec2f(dot(velocity,right),dot(velocity,up));
 let axis=select(vec2f(0,1),projected/max(length(projected),0.0001),rain&&dot(projected,projected)>0.00000001);
 let along=right*axis.x+up*axis.y;let across=right*axis.y-up*axis.x;
 // Filter width and length independently. A subpixel drop must not become a
 // twelve-pixel needle solely because its width reached one pixel.
 let halfLength=radius*stretch;
 let drawLength=max(halfLength,pixelRadius);
 let world=p.p.xyz+across*uv.x*drawRadius+along*uv.y*drawLength;`);
 return replaceShader(code,'radius*radius/max(drawRadius*drawRadius,0.000001)',
   'radius*halfLength/max(drawRadius*drawLength,0.000001)');
}
export const PARTICLE_UPDATE=FRAME_WGSL+NOISE_WGSL+SHORT_WAVE_COUPLING+EMISSION_HAZARD+/* wgsl */`
struct Particle {p:vec4f,v:vec4f};
@group(0) @binding(0) var<uniform> F:Frame;
@group(0) @binding(1) var<storage,read_write> particles:array<Particle>;
@group(0) @binding(2) var foam:texture_2d_array<f32>;
@group(0) @binding(3) var disp:texture_2d_array<f32>;
@group(0) @binding(4) var samp:sampler;
@group(0) @binding(5) var derivatives:texture_2d_array<f32>;
@group(0) @binding(6) var previousDisplacement:texture_2d_array<f32>;
@group(0) @binding(7) var weatherSupport:texture_2d<f32>;
@group(0) @binding(8) var weatherSampler:sampler;
fn rnd(v:u32)->f32{return f32(pcgHash(v)>>8u)/16777216.0;}
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) id:vec3u){
 let k=id.x;if(k>=${PARTICLE_COUNT}u){return;}
 let rain=k%4u==0u;let spindrift=k%4u==1u;
 var p=particles[k];let dt=min(F.backscatter.w,0.05);
 p.p.x-=F.worldOrigin.z;p.p.z-=F.worldOrigin.w;
 if(dt<=0.0){particles[k]=p;return;}
 p.p.w-=dt;
 if(p.p.w<=0.0 || distance(p.p.xyz,F.camPos.xyz)>220.0){
   let seed=k*137u+u32(F.post.z)*197u;
   let r=vec3f(rnd(seed+1u),rnd(seed+2u),rnd(seed+3u));
   // Source domain stays within the fine foam clipmap; no toroidal ghosts.
   let xz=F.camPos.xz+(r.xz-0.5)*select(116.0,70.0,rain);
   let amplitude=surfaceAmplitude(derivatives,samp,xz,F.windP[1].y,F.waveOrigins,F.roughnessWind,F.roughnessOffset);
   var d=vec3f(0);var last=vec3f(0);for(var c=0u;c<${CASCADES}u;c++){
     d+=textureSampleLevel(disp,samp,cascadeUV(xz,c,F.cascInvL[c>>2u][c&3u],F.waveOrigins),c,0.0).xyz*select(1.0,amplitude,c>=3u);
     last+=textureSampleLevel(previousDisplacement,samp,cascadeUV(xz,c,F.cascInvL[c>>2u][c&3u],F.waveOrigins),c,0.0).xyz*select(1.0,amplitude,c>=3u);
   }
   let fresh=textureSampleLevel(foam,samp,xz/F.lodP.z,0u,0.0).g;
   let windGate=smoothstep(select(4.0,9.0,spindrift),select(12.0,19.0,spindrift),F.windP[0].z);
   let rainSupport=textureSampleLevel(weatherSupport,weatherSampler,(xz-F.camPos.xz)/40000.0+0.5,0.0).b;
   let spawn=select(fresh*fresh*F.weather.y*windGate,rainSupport,rain);
   if(rnd(seed+4u)>emissionProbability(spawn,dt)){p.p=vec4f(xz.x,-1000,xz.y,0);particles[k]=p;return;}
   let life=select(0.7+r.y*1.2,2.5+r.y*2.0,spindrift);
   p.p=vec4f(xz.x+d.x,select(d.y+0.12,F.camPos.y+8.0+r.y*25.0,rain),xz.y+d.z,select(life,4.0,rain));
   let orbital=clamp((d-last)/max(dt,0.001),vec3f(-8),vec3f(8));
   let launch=orbital+vec3f(F.windP[0].x,0,F.windP[0].y)*F.windP[0].z*0.16+vec3f(0,1.0+r.y*3.0,0);
   let radius=select(0.015+r.y*0.045,0.26+r.y*0.4,spindrift);
   p.v=vec4f(select(launch,vec3f(F.windP[0].x*F.windP[0].z*0.3,-7.0,F.windP[0].y*F.windP[0].z*0.3),rain),select(radius,0.012,rain));
 } else {
   let air=vec3f(F.windP[0].x*F.windP[0].z*0.7,0,F.windP[0].y*F.windP[0].z*0.7);
   // Spindrift sprites are dilute droplet populations. Drag produces a small
   // terminal fall speed; ballistic froth retains much more inertia.
   let drag=select(1.2,8.0,spindrift);
   p.v=vec4f(mix(p.v.xyz,air+vec3f(0,-9.81/drag,0),1.0-exp(-dt*drag)),p.v.w);
   p.p=vec4f(p.p.xyz+p.v.xyz*dt,p.p.w);
   var q=p.p.xz;var surface=vec3f(0);
   for(var iteration=0u;iteration<2u;iteration++){
     surface=vec3f(0);for(var c=0u;c<3u;c++){surface+=textureSampleLevel(disp,samp,cascadeUV(q,c,F.cascInvL[c>>2u][c&3u],F.waveOrigins),c,0.0).xyz;}
     q=p.p.xz-surface.xz;
   }
   if(p.p.y<surface.y-0.08){p.p.w=0.0;}
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
@group(0) @binding(7) var skyLUT:texture_2d_array<f32>;
`+SKY_RENDER_FUNCS+/* wgsl */`
struct VOut{@builtin(position) p:vec4f,@location(0) uv:vec2f,@location(1) opacity:f32,@location(2) light:vec3f};
@vertex fn vs(@builtin(vertex_index) v:u32,@builtin(instance_index) id:u32)->VOut{
 let corners=array<vec2f,6>(vec2f(-1,-1),vec2f(1,-1),vec2f(1,1),vec2f(-1,-1),vec2f(1,1),vec2f(-1,1));
 let p=particles[id];let uv=corners[v];let rain=id%4u==0u;let spindrift=id%4u==1u;
 let stretch=select(1.0,12.0,rain);
 let right=normalize(F.camRight.xyz);let up=normalize(F.camUp.xyz);
 let radius=p.v.w*select(1.0,1.0+max(0.0,3.0-p.p.w)*0.6,spindrift);
 let pixelRadius=max(0.0,dot(p.p.xyz-F.camPos.xyz,F.camFwd.xyz))*length(F.camUp.xyz)*F.screen.w;
 let drawRadius=max(radius,pixelRadius);
 let world=p.p.xyz+right*uv.x*drawRadius+up*uv.y*drawRadius*stretch;
 var o:VOut;o.p=F.viewProj*vec4f(world-F.camPos.xyz,1);o.uv=uv;
 o.opacity=smoothstep(0.0,0.3,p.p.w)*select(select(0.28,0.035,spindrift),0.16,rain)*min(1.0,radius*radius/max(drawRadius*drawRadius,0.000001));
 let cosTheta=dot(normalize(p.p.xyz-F.camPos.xyz),F.sunDir.xyz);
 let phase=0.07957747*(1.0-0.75*0.75)/pow(max(1.0+0.75*0.75-1.5*cosTheta,0.001),1.5);
 let ambient=textureSampleLevel(environment,lightSampler,vec3f(0,1,0),0.0).rgb/PI;
 let shadowUV=clamp((p.p.xz-F.camPos.xz)/40000.0+0.5,vec2f(0.001),vec2f(0.999));
 let sunlight=textureSampleLevel(shadow,lightSampler,shadowUV,0.0).r;
 let moonCos=dot(normalize(p.p.xyz-F.camPos.xyz),F.moonDir.xyz);
 let moonPhase=0.07957747*(1.0-0.75*0.75)/pow(max(1.0+0.75*0.75-1.5*moonCos,0.001),1.5);
 let moonShadow=textureSampleLevel(shadow,lightSampler,shadowUV,0.0).g;
 o.light=ambient*select(0.85,0.65,spindrift)+sunIlluminance()*sunlight*mix(0.16,phase,select(0.4,0.9,spindrift))+moonIlluminance()*moonShadow*mix(0.16,moonPhase,select(0.4,0.9,spindrift));
 return o;
}
@fragment fn fs(i:VOut)->@location(0)vec4f{
 let alpha=exp(-dot(i.uv,i.uv)*3.0)*i.opacity;
 return vec4f(i.light/F.windP[1].x,alpha);
}`;
