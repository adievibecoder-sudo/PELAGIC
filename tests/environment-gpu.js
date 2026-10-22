import {FRAME_WGSL} from '../src/wgsl/common.js';
import {REGIONAL_WEATHER} from '../src/wgsl/environment.js';
import {FRAME_BYTES,FRAME_FLOATS} from '../src/spatial-origin.js';
import {DEFAULTS} from '../src/settings.js';
import {createEnvironment,sampleEnvironment,environmentUniforms} from '../src/environment.js';
const result=document.querySelector('#result');
const params=new URLSearchParams(location.search);
async function run(){
 let device;
 try{
  const adapter=await navigator.gpu?.requestAdapter({powerPreference:'high-performance'});if(!adapter)throw Error('Native WebGPU required');
  device=await adapter.requestDevice();const errors=[];device.onuncapturederror=e=>errors.push(e.error.message);
  const identity={vendor:adapter.info.vendor,architecture:adapter.info.architecture,device:adapter.info.device,description:adapter.info.description};
  if(adapter.isFallbackAdapter===true||/software|swiftshader|llvmpipe|lavapipe|warp|microsoft basic render|softpipe/i.test(JSON.stringify(identity)))throw Error('Software adapter rejected');
  const source=FRAME_WGSL+`@group(0) @binding(0) var<uniform> F:Frame;
   @group(0) @binding(1) var<storage,read> points:array<vec2f>;
   @group(0) @binding(2) var<storage,read_write> results:array<vec4f>;`+REGIONAL_WEATHER+`
   @compute @workgroup_size(64) fn main(@builtin(global_invocation_id) id:vec3u){
    if(id.x>=arrayLength(&points)){return;}let p=points[id.x];
    results[id.x]=vec4f(regionalWeight(p),regionalCoverage(p),precipitationSupport(p),regionalTypes(p).z);
   }`;
  const mod=device.createShaderModule({code:source});const info=await mod.getCompilationInfo();if(info.messages.some(m=>m.type==='error'))throw Error(JSON.stringify(info.messages));
  const pipe=await device.createComputePipelineAsync({layout:'auto',compute:{module:mod,entryPoint:'main'}}),B=GPUBufferUsage;
  const count=1024,frame=device.createBuffer({size:FRAME_BYTES,usage:B.UNIFORM|B.COPY_DST}),points=device.createBuffer({size:count*8,usage:B.STORAGE|B.COPY_DST}),out=device.createBuffer({size:count*16,usage:B.STORAGE|B.COPY_SRC}),read=device.createBuffer({size:count*16,usage:B.MAP_READ|B.COPY_DST});
  const bg=device.createBindGroup({layout:pipe.getBindGroupLayout(0),entries:[frame,points,out].map((buffer,binding)=>({binding,resource:{buffer}}))});
  const checks=[];
  for(const cameraX of [511.9,512.1,1024.1,1000000]){
   const state=createEnvironment({...DEFAULTS,frontEnabled:true,frontX:18000,frontZ:-3000,frontHeading:137,clouds:.2,rain:.3});state.clocks.weather=137.5;
   const f=new Float32Array(FRAME_FLOATS);environmentUniforms(state,{x:cameraX,z:5000},f);device.queue.writeBuffer(frame,0,f);
   const p=new Float32Array(count*2),reference=[];
   for(let i=0;i<count;i++){const x=-20000+(i%32)*2000,z=-30000+Math.floor(i/32)*2000;p[i*2]=(x-cameraX)*.001;p[i*2+1]=(z-5000)*.001;const e=sampleEnvironment(state,x,z);reference.push([e.frontWeight,e.clouds,e.rain,e.weights[2]]);}
   device.queue.writeBuffer(points,0,p);const enc=device.createCommandEncoder(),cp=enc.beginComputePass();cp.setPipeline(pipe);cp.setBindGroup(0,bg);cp.dispatchWorkgroups(count/64);cp.end();enc.copyBufferToBuffer(out,0,read,0,count*16);device.queue.submit([enc.finish()]);
   await read.mapAsync(GPUMapMode.READ);const values=new Float32Array(read.getMappedRange());let maxError=0,invalid=0;for(let i=0;i<count;i++)for(let c=0;c<4;c++){const value=values[i*4+c];if(!Number.isFinite(value))invalid++;maxError=Math.max(maxError,Math.abs(value-reference[i][c]));}read.unmap();
   // Worst-case f32 kilometre cancellation at 1000 km / 20 km envelope < 2e-5.
   checks.push({cameraX,count,maxAbsoluteError:maxError,tolerance:2e-5,invalid,status:maxError<2e-5&&!invalid?'PASS':'FAIL'});
  }
  const report={time:new Date().toISOString(),sourceCheckpoint:params.get('revision')||'UNSPECIFIED',userAgent:navigator.userAgent,adapter:identity,backend:'native-webgpu',checks,errors,status:checks.every(c=>c.status==='PASS')&&!errors.length?'PASS':'FAIL'};
  result.textContent=JSON.stringify(report,null,2);document.title='ENVIRONMENT TESTS '+report.status;
  const stage=encodeURIComponent(params.get('stage')||'v04-p1-tests');
  const response=await fetch('/__evidence?stage='+stage+'&name=environment-gpu.json',{method:'POST',body:JSON.stringify(report,null,2)});
  if(!response.ok)throw Error('Evidence save failed: HTTP '+response.status);
 }catch(e){result.textContent=e.stack;document.title='ENVIRONMENT TESTS FAIL';}finally{device?.destroy();}
}
document.querySelector('#run').onclick=run;
if(params.get('auto')==='1')run();
