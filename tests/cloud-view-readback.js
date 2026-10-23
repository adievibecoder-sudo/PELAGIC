import {FRAME_WGSL,ATMO_CORE_WGSL} from '../src/wgsl/common.js';
import {CLOUD_VOLUME} from '../src/wgsl/clouds.js';

const WIDTH=64,HEIGHT=32;
const methods=[
  {name:'production-quarter',count:96,phase:0.25,spacing:0,filter:0},
  {name:'production-midpoint',count:96,phase:0.5,spacing:0,filter:0},
  {name:'production-three-quarter',count:96,phase:0.75,spacing:0,filter:0},
  {name:'pixel-midpoint',count:96,phase:0.5,spacing:0,filter:1},
  {name:'unfiltered-midpoint',count:96,phase:0.5,spacing:0,filter:2},
  {name:'pixel-1024',count:1024,phase:0.5,spacing:1,filter:1},
  {name:'pixel-2048',count:2048,phase:0.5,spacing:1,filter:1},
  {name:'pixel-4096',count:4096,phase:0.5,spacing:1,filter:1},
  {name:'unfiltered-4096',count:4096,phase:0.5,spacing:1,filter:2},
];

export async function cloudViewChecks(device,frame,noise,sampler,cloudHeight){
  const prefix=CLOUD_VOLUME.slice(0,CLOUD_VOLUME.indexOf('fn iceDensity('));
  const code=FRAME_WGSL+ATMO_CORE_WGSL+`
@group(0) @binding(0) var<uniform> F:Frame;
`+prefix+/* wgsl */`
@group(0) @binding(7) var<storage,read_write> result:array<vec4f>;
@group(0) @binding(8) var<uniform> probe:array<vec4f,2>;
@compute @workgroup_size(8,4) fn main(@builtin(global_invocation_id) id:vec3u){
  let xy=id.xy+vec2u(0,u32(probe[1].x));
  if(xy.x>=64u||xy.y>=32u){return;}
  // Fixed upper half of the real camera frustum, not a second synthetic camera.
  let ndc=vec2f((f32(xy.x)+0.5)/32.0-1.0,1.0-(f32(xy.y)+0.5)/32.0);
  let dir=normalize(F.camFwd.xyz+ndc.x*F.camRight.xyz+ndc.y*F.camUp.xyz);
  let altitude=max(F.camPos.y*0.001,0.001);
  let ro=vec3f(0,altitude,0);let sphereOrigin=vec3f(0,RG+altitude,0);
  let outer=raySphere(sphereOrigin,dir,RG+F.cloudP.x+F.weather.w);
  let inner=raySphere(sphereOrigin,dir,RG+F.cloudP.x);
  var start=max(0.0,outer.x);var finish=min(max(0.0,outer.y),200.0);
  if(altitude<F.cloudP.x){start=max(0.0,inner.y);}
  else if(inner.x>0.0){finish=min(finish,inner.x);}
  let ground=raySphere(sphereOrigin,dir,RG);
  if(ground.x>0.0){finish=min(finish,ground.x);}
  if(finish<=start||dir.y < -sqrt(2.0*altitude/RG)-0.002){
    result[xy.y*64u+xy.x]=vec4f(0);return;
  }
  let count=u32(probe[0].x);let phase=probe[0].y;
  let exponential=probe[0].z<0.5;let filter=u32(probe[0].w);
  let logRange=log((finish+1.0)/(start+1.0));
  let pixAng=2.0*length(F.camUp.xyz)/probe[1].y;
  var integral=0.0;var occupied=0.0;var first=finish;var moment=0.0;
  for(var i=0u;i<count;i++){
    var a=mix(start,finish,f32(i)/f32(count));
    var b=mix(start,finish,f32(i+1u)/f32(count));
    if(exponential){
      a=(start+1.0)*exp(logRange*f32(i)/f32(count))-1.0;
      b=(start+1.0)*exp(logRange*f32(i+1u)/f32(count))-1.0;
    }
    let ds=b-a;let subdivisions=select(1u,4u,exponential);
    for(var sub=0u;sub<subdivisions;sub++){
      let t=a+ds*(f32(sub)+phase)/f32(subdivisions);
      let pixel=t*pixAng;
      var footprint=select(max(ds*0.14,(a+b)*0.5*pixAng),pixel,filter==1u);
      if(filter==2u){footprint=0.0;}
      let d=cloudDensityFiltered(ro+dir*t,true,footprint);
      let weight=ds/f32(subdivisions);
      integral+=d*weight;moment+=d*weight*t;
      if(d>0.001){occupied+=weight;first=min(first,t);}
    }
  }
  result[xy.y*64u+xy.x]=vec4f(integral*F.cloudP.z*6.0,occupied,
    select(first,0.0,occupied==0.0),moment/max(integral,1e-12));
}`;
  const module=device.createShaderModule({code});
  const compilation=await module.getCompilationInfo();
  if(compilation.messages.some(m=>m.type==='error'))throw Error(compilation.messages.map(m=>m.message).join('\n'));
  const pipeline=await device.createComputePipelineAsync({layout:'auto',compute:{module,entryPoint:'main'}});
  const size=WIDTH*HEIGHT*16;
  const buffer=device.createBuffer({size,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC});
  const read=device.createBuffer({size,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});
  const params=device.createBuffer({size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
  const results=[];
  try{
    const bind=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[
      {binding:0,resource:{buffer:frame}},{binding:5,resource:noise},{binding:6,resource:sampler},
      {binding:7,resource:{buffer}},{binding:8,resource:{buffer:params}}]});
    for(const method of methods){
      // Bound each submission to four rows so the reference does not monopolize the GPU.
      for(let row=0;row<HEIGHT;row+=4){
        device.queue.writeBuffer(params,0,new Float32Array([method.count,method.phase,method.spacing,method.filter,row,cloudHeight,0,0]));
        const enc=device.createCommandEncoder(),pass=enc.beginComputePass();
        pass.setPipeline(pipeline);pass.setBindGroup(0,bind);pass.dispatchWorkgroups(WIDTH/8,1);pass.end();
        device.queue.submit([enc.finish()]);await device.queue.onSubmittedWorkDone();
      }
      const enc=device.createCommandEncoder();enc.copyBufferToBuffer(buffer,0,read,0,size);device.queue.submit([enc.finish()]);
      await read.mapAsync(GPUMapMode.READ);const values=Array.from(new Float32Array(read.getMappedRange()));read.unmap();
      results.push({...method,tau:values.filter((_,i)=>i%4===0),occupiedKm:values.filter((_,i)=>i%4===1),
        firstKm:values.filter((_,i)=>i%4===2),centroidKm:values.filter((_,i)=>i%4===3)});
    }
  }finally{params.destroy();read.destroy();buffer.destroy();}
  const mean=a=>a.reduce((a,b)=>a+b,0)/a.length;
  const reference=results.find(r=>r.name==='pixel-4096');
  for(const result of results){
    const errors=result.tau.map((t,i)=>Math.abs(Math.exp(-t)-Math.exp(-reference.tau[i]))).sort((a,b)=>a-b);
    result.summary={opacityMAE:mean(errors),opacityP95:errors[Math.floor(errors.length*.95)],opacityMax:errors.at(-1),
      meanOpacity:mean(result.tau.map(t=>1-Math.exp(-t))),occupiedRays:result.occupiedKm.filter(v=>v>0).length};
  }
  const checks={finite:results.every(r=>r.tau.concat(r.occupiedKm,r.firstKm,r.centroidKm).every(Number.isFinite)),
    nonnegative:results.every(r=>r.tau.every(t=>t>=0)),
    referenceConvergence:results.find(r=>r.name==='pixel-2048').summary.opacityMAE<0.002};
  return {status:Object.values(checks).every(Boolean)?'PASS':'FAIL',checks,width:WIDTH,height:HEIGHT,cloudHeight,results,
    scope:'64x32 rays through upper half of actual camera, same spherical entry/exit and parabolic density as production. Production uses 96 exponential segments with four taps; shifted phases test aliasing. Dense uniform pixel-filtered references 1024/2048/4096 do not change the application. No early exit, no illumination, no tone map. Pixel-filtered density is not pixel-integrated opacity. PASS covers finite/nonnegative values and mean 2048/4096 opacity convergence below 0.002 only. Per-ray errors and occupied intervals remain reported; no morphology or radiometry acceptance.'};
}
