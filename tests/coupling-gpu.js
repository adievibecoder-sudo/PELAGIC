import {SHORT_WAVE_COUPLING} from '../src/wgsl/coupling.js';
import {PATCHES} from '../src/numerics.js';

export async function verifyCoupling(device){
 const n=256,count=2048,chop=1.12,k=8*Math.PI/PATCHES[0];
 const f=new Float32Array(1),u=new Uint32Array(f.buffer);
 const half=v=>{f[0]=v;const b=u[0],e=((b>>>23)&255)-112;return e<=0?0:((b>>>16)&32768)|(e<<10)|((b>>>13)&1023);};
 const data=new Uint16Array(n*n*6*4);
 // Texel centres are q=(i+.5)*L/N, matching the production sampling convention.
 for(let y=0;y<n;y++)for(let x=0;x<n;x++)data[(y*n+x)*4+2]=half(-chop*.1*Math.cos(k*(x+.5)*PATCHES[0]/n));
 const input=device.createTexture({size:[n,n,6],format:'rgba16float',usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST});
 device.queue.writeTexture({texture:input},data,{bytesPerRow:n*8,rowsPerImage:n},[n,n,6]);
 const output=device.createBuffer({size:count*16,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC});
 const read=device.createBuffer({size:count*16,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST});
 const code=SHORT_WAVE_COUPLING+`
 @group(0) @binding(0) var d:texture_2d_array<f32>;
 @group(0) @binding(1) var s:sampler;
 @group(0) @binding(2) var<storage,read_write> result:array<vec4f>;
 @compute @workgroup_size(64) fn main(@builtin(global_invocation_id) id:vec3u){
  let q=vec2f((f32(id.x)+0.37)*${PATCHES[0]}/${count}.0,17.0);
  result[id.x]=vec4f(shortAmplitude(d,s,q,${chop},array<vec4f,3>()),shortAmplitudeGradient(d,s,q,${chop},array<vec4f,3>()),0);
 }`;
 const module=device.createShaderModule({code});const info=await module.getCompilationInfo();
 const errors=info.messages.filter(m=>m.type==='error').map(m=>m.message);
 if(errors.length){input.destroy();output.destroy();read.destroy();return {status:'FAIL',errors};}
 const pipe=await device.createComputePipelineAsync({layout:'auto',compute:{module,entryPoint:'main'}});
 const bg=device.createBindGroup({layout:pipe.getBindGroupLayout(0),entries:[{binding:0,resource:input.createView({dimension:'2d-array'})},{binding:1,resource:device.createSampler({magFilter:'linear',minFilter:'linear',addressModeU:'repeat',addressModeV:'repeat'})},{binding:2,resource:{buffer:output}}]});
 const e=device.createCommandEncoder(),p=e.beginComputePass();p.setPipeline(pipe);p.setBindGroup(0,bg);p.dispatchWorkgroups(count/64);p.end();e.copyBufferToBuffer(output,0,read,0,read.size);device.queue.submit([e.finish()]);
 await read.mapAsync(GPUMapMode.READ);const result=new Float32Array(read.getMappedRange());
 let amplitudeError=0,gradientError=0,invalid=0;
 for(let i=0;i<count;i++){
  const q=(i+.37)*PATCHES[0]/count,phase=k*q,t=Math.tanh(.5*Math.cos(phase));
  const expected=1+.2*t,gradient=-.1*k*Math.sin(phase)*(1-t*t);
  amplitudeError=Math.max(amplitudeError,Math.abs(result[i*4]-expected));
  gradientError=Math.max(gradientError,Math.abs(result[i*4+1]-gradient),Math.abs(result[i*4+2]));
  for(let j=0;j<3;j++)if(!Number.isFinite(result[i*4+j]))invalid++;
 }
 read.unmap();read.destroy();output.destroy();input.destroy();
 return {status:amplitudeError<.0003&&gradientError<.00015&&!invalid?'PASS':'FAIL',amplitudeError,gradientError,invalid,samples:count,
  tolerance:'Absolute amplitude 0.0003; derivative 0.00015 per metre. Includes binary16 samples and bilinear gradient changes across a 4.31 m cell; reference is analytic, not copied sampler code.',
  scope:'Manufactured long-wave convergence field. Not observational validation of the bounded modulation model.'};
}
