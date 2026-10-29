import {FOAM_UPDATE,FOAM_RES} from '../src/wgsl/sim.js';
import {FOAM_BYTES} from '../src/spatial-origin.js';
import {breakingEventsShader} from '../src/wgsl/breaking-events.js';
import {breakingPhaseShader} from '../src/wgsl/breaking-phase.js';
import {decodeHalf} from '../src/numerics.js';

// Production kernel, manufactured constant fields: isolate rejected phase
// estimates from texture advection and compare to an independent decay ODE.
export async function verifyPhaseResidency(device){
  const resources=[],checks=[];
  const q=new URLSearchParams('abBreaking=phase-resident');
  const module=device.createShaderModule({code:breakingPhaseShader(breakingEventsShader(FOAM_UPDATE,q),q)});
  const pipeline=await device.createComputePipelineAsync({layout:'auto',compute:{module,entryPoint:'main'}});
  const sampler=device.createSampler({addressModeU:'repeat',addressModeV:'repeat',minFilter:'linear',magFilter:'linear'});
  const tex=(layers,half)=>{
    const t=device.createTexture({size:[1,1,layers],format:'rgba16float',usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST});
    resources.push(t);const a=new Uint16Array(layers*4);
    for(let i=0;i<layers;i++)a.set(half,i*4);
    device.queue.writeTexture({texture:t},a,{bytesPerRow:8,rowsPerImage:1},[1,1,layers]);
    return t.createView({dimension:'2d-array'});
  };
  const previous=tex(2,[0,0x3800,0,0]),empty=tex(6,[0,0,0,0]);
  const output=device.createTexture({size:[FOAM_RES,FOAM_RES,2],format:'rgba16float',usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.COPY_SRC});
  const frame=device.createBuffer({size:FOAM_BYTES,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
  const read=device.createBuffer({size:256,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});
  resources.push(output,frame,read);
  const group=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[
    {binding:0,resource:{buffer:frame}},{binding:1,resource:previous},
    {binding:2,resource:output.createView({dimension:'2d-array'})},
    {binding:3,resource:empty},{binding:4,resource:empty},{binding:5,resource:sampler},
    {binding:6,resource:empty}]});
  const uniform=new Float32Array(FOAM_BYTES/4);uniform[8]=.25;uniform[9]=2;
  uniform[11]=.22;uniform[12]=.65;uniform[13]=3;uniform[14]=5;uniform[15]=1;uniform[34]=1;
  for(let c=0;c<6;c++){uniform[16+c]=128;uniform[24+c]=1/128;}
  try{
    for(const dt of [0,1/120,1/60,1/24]){
      uniform[10]=dt;device.queue.writeBuffer(frame,0,uniform);
      const encoder=device.createCommandEncoder(),pass=encoder.beginComputePass();
      pass.setPipeline(pipeline);pass.setBindGroup(0,group);pass.dispatchWorkgroups(1);pass.end();
      encoder.copyTextureToBuffer({texture:output},{buffer:read,bytesPerRow:256,rowsPerImage:1},[1,1,1]);
      device.queue.submit([encoder.finish()]);await read.mapAsync(GPUMapMode.READ);
      const values=Array.from(new Uint16Array(read.getMappedRange()).slice(0,4),decodeHalf);read.unmap();
      const active=.5*Math.exp(-dt*(1/.4+12)),residual=.5-active;
      const error=Math.max(Math.abs(values[1]-active),Math.abs(values[0]+values[3]-residual));
      checks.push({dt,values,expected:{active,residual},error,status:error<.0003?'PASS':'FAIL'});
    }
    return {status:checks.every(c=>c.status==='PASS')?'PASS':'FAIL',checks,
      scope:'Rejected phase estimate and paused identity; half-float error bound. No crossing, event identity or visual acceptance.'};
  }finally{resources.forEach(r=>r.destroy());}
}
