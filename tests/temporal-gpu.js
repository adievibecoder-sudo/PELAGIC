import {TAA_RESOLVE} from '../src/wgsl/taa.js';
import {FRAME_BYTES,FRAME_FLOATS} from '../src/spatial-origin.js';
import {readFloatTexture} from './texture-readback.js';

export async function temporalGPUChecks(device){
  const U=GPUTextureUsage,B=GPUBufferUsage,resources=[];
  const tex=(format,usage,sampleCount=1)=>{const t=device.createTexture({size:[16,16],format,usage,sampleCount});resources.push(t);return t;};
  const current=tex('rgba16float',U.COPY_DST|U.TEXTURE_BINDING),history=tex('rgba16float',U.COPY_DST|U.TEXTURE_BINDING);
  const oldDepth=tex('r32float',U.COPY_DST|U.TEXTURE_BINDING),output=tex('rgba16float',U.STORAGE_BINDING|U.COPY_SRC);
  const outputDepth=tex('r32float',U.STORAGE_BINDING),depth=tex('depth32float',U.RENDER_ATTACHMENT|U.TEXTURE_BINDING,4);
  const motion=tex('rgba16float',U.RENDER_ATTACHMENT|U.TEXTURE_BINDING,4);
  const frame=device.createBuffer({size:FRAME_BYTES,usage:B.UNIFORM|B.COPY_DST});resources.push(frame);
  const setup=device.createBuffer({size:16,usage:B.UNIFORM|B.COPY_DST});resources.push(setup);
  const source=/* wgsl */`
@group(0) @binding(0) var<uniform> control:vec4f;
@vertex fn vs(@builtin(vertex_index) i:u32)->@builtin(position)vec4f{
  return vec4f(vec2f(f32((i<<1u)&2u),f32(i&2u))*2.0-1.0,0,1);
}
struct Out{@builtin(frag_depth) depth:f32,@location(0) motion:vec4f};
@fragment fn fs(@builtin(sample_index) s:u32)->Out{
  var o:Out;o.depth=select(.25,.5,s==2u);o.motion=vec4f(control.xy,select(.25,.5,s==2u),1);
  if(control.z>.5&&s!=2u){o.depth=0.0;}
  return o;
}`;
  const module=device.createShaderModule({code:source});
  const raster=await device.createRenderPipelineAsync({layout:'auto',vertex:{module,entryPoint:'vs'},fragment:{module,entryPoint:'fs',targets:[{format:'rgba16float'}]},
    depthStencil:{format:'depth32float',depthWriteEnabled:true,depthCompare:'always'},multisample:{count:4}});
  const setupBG=device.createBindGroup({layout:raster.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:setup}}]});
  const resolveModule=device.createShaderModule({code:TAA_RESOLVE});const info=await resolveModule.getCompilationInfo();
  if(info.messages.some(x=>x.type==='error'))throw Error(info.messages.map(x=>x.message).join('\n'));
  const pipe=await device.createComputePipelineAsync({layout:'auto',compute:{module:resolveModule,entryPoint:'main'}});
  const bind=device.createBindGroup({layout:pipe.getBindGroupLayout(0),entries:[{buffer:frame},current.createView(),motion.createView(),depth.createView(),history.createView(),oldDepth.createView(),
    device.createSampler({magFilter:'linear',minFilter:'linear'}),output.createView(),outputDepth.createView()].map((resource,binding)=>({binding,resource}))});
  const half=(value)=>{if(value===0)return 0;const e=Math.floor(Math.log2(value));return Math.round((value/2**e-1)*1024)|((e+15)<<10);};
  const upload=(texture,fn)=>{const data=new Uint16Array(16*16*4);for(let y=0;y<16;y++)for(let x=0;x<16;x++)data.set(fn(x,y).map(half),(y*16+x)*4);device.queue.writeTexture({texture},data,{bytesPerRow:128},[16,16]);};
  const checks=[];
  try{
    for(const name of ['reset','stable','exposure','sample-depth','disocclusion','mixed-coverage','offscreen','reactive','history-outlier']){
      const f=new Float32Array(FRAME_FLOATS);f[36]=f[37]=16;f[38]=f[39]=1/16;f[224]=name==='reset'?0:1;f[225]=name==='exposure'?2:1;
      device.queue.writeBuffer(frame,0,f);device.queue.writeBuffer(setup,0,new Float32Array([name==='offscreen'?1:0,0,name==='mixed-coverage'?1:0,0]));
      // Nearby radiance spans the history value, so depth/rejection tests cannot
      // pass merely because neighbourhood clipping erased the wrong history.
      upload(current,(x,y)=>[x===8&&y===8?1:(x+y)%2?.75:1.25,1,1,name==='reactive'?1:0]);
      upload(history,()=>[name==='history-outlier'?100:name==='exposure'?.55:1.1,name==='exposure'?.5:1,name==='exposure'?.5:1,0]);
      device.queue.writeTexture({texture:oldDepth},new Float32Array(256).fill(name==='disocclusion'?.25:.5),{bytesPerRow:64},[16,16]);
      const enc=device.createCommandEncoder();const pass=enc.beginRenderPass({colorAttachments:[{view:motion.createView(),loadOp:'clear',clearValue:{r:0,g:0,b:0,a:0},storeOp:'store'}],
        depthStencilAttachment:{view:depth.createView(),depthLoadOp:'clear',depthClearValue:0,depthStoreOp:'store'}});
      pass.setPipeline(raster);pass.setBindGroup(0,setupBG);pass.draw(3);pass.end();
      const cp=enc.beginComputePass();cp.setPipeline(pipe);cp.setBindGroup(0,bind);cp.dispatchWorkgroups(2,2);cp.end();device.queue.submit([enc.finish()]);
      const read=await readFloatTexture(device,output),red=read.values[(8*16+8)*4];
      const reject=['reset','disocclusion','mixed-coverage','offscreen','history-outlier'].includes(name);
      const passCheck=read.values.every(Number.isFinite)&&(reject?Math.abs(red-1)<.002:name==='reactive'?red>1&&red<1.015:red>1.04&&red<1.08);
      checks.push({name,pass:passCheck,centreRed:red});
    }
    return {status:checks.every(x=>x.pass)?'PASS':'FAIL',checks,scope:'Production resolve on manufactured 4x depth/motion; sample 2 is nearest reverse-Z, other samples deliberately differ. Does not certify ocean motion or visual quality.'};
  }finally{resources.forEach(r=>r.destroy());}
}
