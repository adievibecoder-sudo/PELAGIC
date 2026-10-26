import {CREST_SUPPORT,GRAVITY_CREST_SAMPLING} from '../src/wgsl/crest-support.js';
import {FRAME_WGSL} from '../src/wgsl/common.js';
import {WAVE_COORDINATES} from '../src/wgsl/coordinates.js';

export async function crestTextureChecks(device,frame,displacement,derivative,sampler){
  const code=FRAME_WGSL+WAVE_COORDINATES+CREST_SUPPORT+GRAVITY_CREST_SAMPLING+/* wgsl */`
  @group(0) @binding(0) var<uniform> F:Frame;
  @group(0) @binding(1) var disp:texture_2d_array<f32>;
  @group(0) @binding(2) var derivatives:texture_2d_array<f32>;
  @group(0) @binding(3) var samp:sampler;
  @group(0) @binding(4) var<storage,read_write> result:array<vec4f>;
  @compute @workgroup_size(64) fn main(@builtin(global_invocation_id) id:vec3u){
    let q=F.camPos.xz+(vec2f(f32(id.x%64u),f32(id.x/64u))+.5-32.0)*(116.0/64.0);
    let c=projectGravityCrest(q,2.5);
    result[id.x]=vec4f(c.valid,c.steepness,c.residual,c.curvature);
  }`;
  const module=device.createShaderModule({code,label:'actual FFT crest support'});
  const pipeline=await device.createComputePipelineAsync({layout:'auto',compute:{module,entryPoint:'main'}});
  const size=4096*16;
  const output=device.createBuffer({size,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC});
  const read=device.createBuffer({size,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST});
  try{
    const bind=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:frame}},
      {binding:1,resource:displacement},{binding:2,resource:derivative},{binding:3,resource:sampler},{binding:4,resource:{buffer:output}}]});
    const enc=device.createCommandEncoder(),pass=enc.beginComputePass();pass.setPipeline(pipeline);pass.setBindGroup(0,bind);pass.dispatchWorkgroups(64);pass.end();
    enc.copyBufferToBuffer(output,0,read,0,size);device.queue.submit([enc.finish()]);await read.mapAsync(GPUMapMode.READ);
    const values=new Float32Array(read.getMappedRange()),steepness=[];let invalid=0,supported=0,maxResidual=0;
    for(let i=0;i<values.length;i+=4){
      for(let j=0;j<4;j++)invalid+=!Number.isFinite(values[i+j]);
      if(values[i]===1){steepness.push(values[i+1]);supported+=values[i+1]>.22;maxResidual=Math.max(maxResidual,values[i+2]);}
    }
    read.unmap();steepness.sort((a,b)=>a-b);
    return {samples:4096,invalid,projected:steepness.length,aboveOnset:supported,maxResidual,
      steepnessP50:steepness[Math.floor(steepness.length*.5)]??0,steepnessP95:steepness[Math.floor(steepness.length*.95)]??0,
      scope:'Current production FFT textures, 116 m camera-local square. Ridge support is not evidence of nonlinear breaking.'};
  }finally{output.destroy();read.destroy();}
}

export async function crestSupportChecks(device){
  const code=CREST_SUPPORT+/* wgsl */`
  struct Case {start:vec2f,angle:f32,time:f32,crossing:f32,amplitude:f32,travel:f32,pad:f32};
  @group(0) @binding(0) var<uniform> C:Case;
  @group(0) @binding(1) var<storage,read_write> result:array<vec4f>;
  fn gravityCrestSample(q:vec2f)->CrestSample {
    let a=vec2f(cos(C.angle),sin(C.angle));let b=vec2f(-a.y,a.x);
    let k=.5;let phase=dot(q,a)*k-sqrt(9.81*k)*C.time;
    let crossPhase=dot(q,b)*k-sqrt(9.81*k)*C.time;
    let slope=-C.amplitude*k*(a*sin(phase)+C.crossing*b*sin(crossPhase));
    let x=-C.amplitude*k*cos(phase);let y=-C.amplitude*k*C.crossing*cos(crossPhase);
    return CrestSample(slope,vec3f(x*a.x*a.x+y*b.x*b.x,x*a.y*a.y+y*b.y*b.y,x*a.x*a.y+y*b.x*b.y));
  }
  @compute @workgroup_size(1) fn main(){
    let r=projectGravityCrest(C.start,C.travel);
    result[0]=vec4f(r.q,r.axis);result[1]=vec4f(r.steepness,r.curvature,r.residual,r.valid);
  }`;
  const module=device.createShaderModule({code,label:'gravity crest analytic phase checks'});
  const info=await module.getCompilationInfo();
  if(info.messages.some(x=>x.type==='error'))throw Error(info.messages.map(x=>x.message).join('\n'));
  const pipeline=await device.createComputePipelineAsync({layout:'auto',compute:{module,entryPoint:'main'}});
  const input=device.createBuffer({size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
  const output=device.createBuffer({size:32,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC});
  const read=device.createBuffer({size:32,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST});
  const bg=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:input}},{binding:1,resource:{buffer:output}}]});
  const checks=[];
  async function run(name,data,predicate){
    device.queue.writeBuffer(input,0,new Float32Array(data));
    const enc=device.createCommandEncoder(),pass=enc.beginComputePass();pass.setPipeline(pipeline);pass.setBindGroup(0,bg);pass.dispatchWorkgroups(1);pass.end();
    enc.copyBufferToBuffer(output,0,read,0,32);device.queue.submit([enc.finish()]);
    await read.mapAsync(GPUMapMode.READ);const r=Array.from(new Float32Array(read.getMappedRange()));read.unmap();
    checks.push({name,status:r.every(Number.isFinite)&&predicate(r)?'PASS':'FAIL',result:r});return r;
  }
  try{
    await run('Traveling gravity ridge follows sqrt(g/k) phase speed',[0,0,0,.1,0,1,2,0],r=>r[7]===1&&Math.abs(r[0]-Math.sqrt(9.81/.5)*.1)<.001);
    const angle=.73,t=.1,d=Math.sqrt(9.81/.5)*t;
    await run('Oblique ridge position and compression axis',[0,0,angle,t,0,1,2,0],r=>r[7]===1&&Math.hypot(r[0]-d*Math.cos(angle),r[1]-d*Math.sin(angle))<.001&&Math.abs(r[2]*Math.cos(angle)+r[3]*Math.sin(angle))>.999);
    await run('Unequal crossing retains dominant crest',[0,0,0,.1,.25,1,2,0],r=>r[7]===1&&Math.abs(r[0]-d)<.001&&Math.abs(r[1])<.001);
    await run('Equal crossing rejects ambiguous axis',[0,0,0,0,1,1,2,0],r=>r[7]===0);
    await run('Flat calm field rejects crest support',[0,0,0,0,0,0,2,0],r=>r[7]===0);
    await run('Trough rejects ridge projection',[Math.PI/.5,0,0,0,0,1,2,0],r=>r[7]===0);
    await run('Phase discontinuity exceeds continuation bound',[0,0,0,.4,0,1,.25,0],r=>r[7]===0);
    let q=[0,0],error=0,invalid=0;
    for(let n=1;n<=24;n++){
      const r=await run('Continuation step '+n,[...q,0,n/24,0,1,.8,0],r=>r[7]===1);
      q=r.slice(0,2);error=Math.max(error,Math.abs(q[0]-Math.sqrt(9.81/.5)*n/24));invalid+=r[7]!==1;
    }
    checks.splice(7,24,{name:'24 consecutive phase continuation steps',status:invalid===0&&error<.001?'PASS':'FAIL',maxErrorMetres:error,invalid});
    return {status:checks.every(x=>x.status==='PASS')?'PASS':'FAIL',checks,scope:'Production ridge projection on analytic traveling/crossing gravity fields. Texture interpolation and nonlinear breaking are not certified.'};
  }finally{input.destroy();output.destroy();read.destroy();}
}
