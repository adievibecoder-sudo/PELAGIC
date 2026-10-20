import {FRAME_WGSL} from '../src/wgsl/common.js';
import {CLOUD_VOLUME} from '../src/wgsl/clouds.js';
import {phase0Shader} from './phase0-shaders.js';

export async function phase0CloudColumns(device,frame,noise,sampler,query) {
  const prefix=CLOUD_VOLUME.slice(0,CLOUD_VOLUME.indexOf('fn cloudShadowFor('));
  const code=FRAME_WGSL+'\nconst RG:f32=6360.0;\n@group(0) @binding(0) var<uniform> F:Frame;\n'+prefix+/* wgsl */`
@group(0) @binding(7) var<storage,read_write> result:array<vec4f>;
@compute @workgroup_size(8,8) fn main(@builtin(global_invocation_id) id:vec3u){
 if(any(id.xy>=vec2u(32))){return;}
 let xz=((vec2f(id.xy)+.5)/32.0-.5)*40.0;
 var tau=0.0;var maxD=0.0;
 for(var i=0u;i<128u;i++){
   let altitude=F.cloudP.x+(f32(i)+.5)*F.weather.w/128.0;
   let d=cloudDensity(vec3f(xz.x,altitude-dot(xz,xz)/(2.0*RG),xz.y),true);
   tau+=d*F.weather.w/128.0*F.cloudP.z*6.0;maxD=max(maxD,d);
 }
 result[id.y*32u+id.x]=vec4f(tau,exp(-tau),maxD,1);
}`;
  const module=device.createShaderModule({code:phase0Shader(code,query)});
  const compilation=await module.getCompilationInfo();
  if(compilation.messages.some(m=>m.type==='error'))throw Error(compilation.messages.map(m=>m.message).join('\n'));
  const pipeline=await device.createComputePipelineAsync({layout:'auto',compute:{module,entryPoint:'main'}});
  const buffer=device.createBuffer({size:16384,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC});
  const read=device.createBuffer({size:16384,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});
  const bg=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:frame}},{binding:5,resource:noise},{binding:6,resource:sampler},{binding:7,resource:{buffer}}]});
  const encoder=device.createCommandEncoder(),pass=encoder.beginComputePass();pass.setPipeline(pipeline);pass.setBindGroup(0,bg);pass.dispatchWorkgroups(4,4);pass.end();encoder.copyBufferToBuffer(buffer,0,read,0,16384);device.queue.submit([encoder.finish()]);
  await read.mapAsync(GPUMapMode.READ);const data=Array.from(new Float32Array(read.getMappedRange()));read.unmap();read.destroy();buffer.destroy();
  const tau=data.filter((_,i)=>i%4===0),sorted=[...tau].sort((a,b)=>a-b);
  return {scope:'1024 fixed vertical columns in a 40 km square, 128 midpoint samples per column. Integrated extinction; not solar-disc occupancy, measured cloud water or converged quadrature.',model:query.get('p0Cloud')||'baseline',tau,mean:tau.reduce((a,b)=>a+b,0)/tau.length,p50:sorted[512],p90:sorted[921],max:sorted.at(-1),fractionTauOver1:tau.filter(t=>t>1).length/tau.length,invalid:data.filter(x=>!Number.isFinite(x)).length};
}
