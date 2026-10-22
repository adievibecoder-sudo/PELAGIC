import {FRAME_WGSL} from '../src/wgsl/common.js';
import {CLOUD_VOLUME} from '../src/wgsl/clouds.js';
import {phase0Shader} from './phase0-shaders.js';
import {cloudBankShader} from '../src/wgsl/cloud-bank.js';

export async function phase0CloudColumns(device,frame,noise,sampler,query) {
  const noiseProbe=query.get('maNoise')==='1';
  const sweep=query.get('maSweep')==='1'&&query.get('maCloud')==='bank',count=noiseProbe?4:sweep?10:1;
  const prefix=CLOUD_VOLUME.slice(0,CLOUD_VOLUME.indexOf('fn iceDensity('));
  const code=FRAME_WGSL+'\nconst RG:f32=6360.0;\n@group(0) @binding(0) var<uniform> F:Frame;\n'+prefix+/* wgsl */`
@group(0) @binding(7) var<storage,read_write> result:array<vec4f>;
@compute @workgroup_size(8,8) fn main(@builtin(global_invocation_id) id:vec3u){
 if(any(id.xy>=vec2u(32))){return;}
 ${sweep?'BANK_BIAS=0.35+f32(id.z)*0.015;':''}
 let xz=((vec2f(id.xy)+.5)/32.0-.5)*40.0;
 var tau=0.0;var maxD=0.0;
 for(var i=0u;i<128u;i++){
   let altitude=F.cloudP.x+(f32(i)+.5)*F.weather.w/128.0;
   let d=cloudDensity(vec3f(xz.x,altitude-dot(xz,xz)/(2.0*RG),xz.y),true);
   tau+=d*F.weather.w/128.0*F.cloudP.z*6.0;maxD=max(maxD,d);
 }
 result[id.z*1024u+id.y*32u+id.x]=vec4f(tau,exp(-tau),maxD,1);
}`;
  const probe=/* wgsl */`
@group(0) @binding(7) var<storage,read_write> result:array<vec4f>;
@compute @workgroup_size(8,8) fn main(@builtin(global_invocation_id) id:vec3u){
 if(any(id.xy>=vec2u(32))){return;}
 let xz=((vec2f(id.xy)+.5)/32.0-.5)*40.0;
 let world=xz+F.camPos.xz*.001+F.worldOrigin.xy-F.cloudDrift.xy;
 let weather=textureSampleLevel(cloudNoise,cloudNoiseSampler,vec3f(world.x*.008,.31,world.y*.008),0.0);
 let regional=textureSampleLevel(cloudNoise,cloudNoiseSampler,vec3f((world.x+world.y*.37)*.027,.73,(world.y-world.x*.37)*.027),0.0);
 let cover=clamp(regionalCoverage(xz)+(weather.a-.5)*3.2+(regional.a-.5)*1.2,0.0,1.0);
 let n=textureSampleLevel(cloudNoise,cloudNoiseSampler,vec3f(world.x*.19,.5*.38,world.y*.19),0.0);
 let signal=clamp((n.r-.5)*3.4+.57-(1.0-n.g)*.12,0.0,1.0);
 var v=n;
 if(id.z==1u){v=weather;}
 if(id.z==2u){v=regional;}
 if(id.z==3u){v=vec4f(cover,signal,regionalCoverage(xz),F.regional.y);}
 result[id.z*1024u+id.y*32u+id.x]=v;
}`;
  let shader=cloudBankShader(phase0Shader(code,query),query);
  if(noiseProbe)shader=FRAME_WGSL+'\nconst RG:f32=6360.0;\n@group(0) @binding(0) var<uniform> F:Frame;\n'+prefix+probe;
  if(sweep)shader=shader.replace(/const BANK_BIAS:f32=[\d.]+;/,'var<private> BANK_BIAS:f32=0.0;');
  const module=device.createShaderModule({code:shader});
  const compilation=await module.getCompilationInfo();
  if(compilation.messages.some(m=>m.type==='error'))throw Error(compilation.messages.map(m=>m.message).join('\n'));
  const pipeline=await device.createComputePipelineAsync({layout:'auto',compute:{module,entryPoint:'main'}});
  const buffer=device.createBuffer({size:16384*count,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC});
  const read=device.createBuffer({size:16384*count,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});
  const bg=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:frame}},{binding:5,resource:noise},{binding:6,resource:sampler},{binding:7,resource:{buffer}}]});
  const encoder=device.createCommandEncoder(),pass=encoder.beginComputePass();pass.setPipeline(pipeline);pass.setBindGroup(0,bg);pass.dispatchWorkgroups(4,4,count);pass.end();encoder.copyBufferToBuffer(buffer,0,read,0,16384*count);device.queue.submit([encoder.finish()]);
  await read.mapAsync(GPUMapMode.READ);const data=Array.from(new Float32Array(read.getMappedRange()));read.unmap();read.destroy();buffer.destroy();
  if(sweep)return {scope:'Density-threshold calibration, 10 x 1024 vertical columns. No visual or performance acceptance.',variants:Array.from({length:count},(_,i)=>{const t=data.slice(i*4096,(i+1)*4096).filter((_,j)=>j%4===0);return {bias:.35+i*.015,mean:t.reduce((a,b)=>a+b,0)/1024,fractionTauOver1:t.filter(x=>x>1).length/1024};}),invalid:data.filter(x=>!Number.isFinite(x)).length};
  if(noiseProbe)return {scope:'GPU noise and coverage diagnostics',groups:Array.from({length:4},(_,group)=>({name:['shape','weather','regional','cover-signal-coverage-depth'][group],channels:Array.from({length:4},(_,c)=>{const v=data.slice(group*4096,(group+1)*4096).filter((_,i)=>i%4===c).sort((a,b)=>a-b);return {min:v[0],mean:v.reduce((a,b)=>a+b,0)/v.length,p10:v[102],p50:v[512],p90:v[921],max:v.at(-1)};})}))};
  const tau=data.filter((_,i)=>i%4===0),sorted=[...tau].sort((a,b)=>a-b);
  return {scope:'1024 fixed vertical columns in a 40 km square, 128 midpoint samples per column. Integrated extinction; not solar-disc occupancy, measured cloud water or converged quadrature.',model:query.get('maCloud')||query.get('p0Cloud')||'baseline',tau,mean:tau.reduce((a,b)=>a+b,0)/tau.length,p50:sorted[512],p90:sorted[921],max:sorted.at(-1),fractionTauOver1:tau.filter(t=>t>1).length/tau.length,invalid:data.filter(x=>!Number.isFinite(x)).length};
}
