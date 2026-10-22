import {FRAME_WGSL} from '../src/wgsl/common.js';
import {CLOUD_VOLUME} from '../src/wgsl/clouds.js';
import {cloudConvectionShader} from '../src/wgsl/cloud-convection.js';

export async function cloudConvectionChecks(device,frame,noise,sampler) {
  const prefix=CLOUD_VOLUME.slice(0,CLOUD_VOLUME.indexOf('fn iceDensity('));
  const source=FRAME_WGSL+`
const RG:f32=6360.0;
@group(0) @binding(0) var<uniform> initial:Frame;
var<private> F:Frame;
`+prefix+/* wgsl */`
@group(0) @binding(7) var<storage,read_write> result:array<vec4f>;
@compute @workgroup_size(8,8) fn main(@builtin(global_invocation_id) id:vec3u){
 if(any(id.xy>=vec2u(32))){return;}
 F=initial; F.frontControl.z=0.0; F.cloudWeights=vec4f(1,0,0,0);
 let xz=((vec2f(id.xy)+.5)/32.0-.5)*40.0;
 let h=F.cloudP.x+(f32((id.x*17u+id.y*13u)%127u)+.5)*F.regional.y/127.0;
 let p=vec3f(xz.x,h-dot(xz,xz)/(2.0*RG),xz.y);
 var values=vec4f(0);
 if(id.z==0u){
   let d=cloudDensity(p,true);
   F.regional.x=0.0;let empty=cloudDensity(p,true);
   F.regional.x=1.0;let full=cloudDensity(p,true);
   values=vec4f(d,empty,full,cloudDensity(vec3f(xz.x,F.cloudP.x+F.regional.y+1.0,xz.y),true));
 } else if(id.z==1u || id.z==2u){
   F.cloudWeights=select(vec4f(0,1,0,0),vec4f(0,0,1,0),id.z==2u);
   values=vec4f(cloudDensity(p,true),cloudDensityPreserved(p,true,0.0),0,0);
 } else if(id.z==3u){
   let d=cloudDensity(p,true);
   F.camPos.x+=12000.0;F.camPos.z-=8000.0;
   F.worldOrigin.x-=12.0;F.worldOrigin.y+=8.0;
   values=vec4f(d,cloudDensity(p,true),0,0);
 } else if(id.z==4u){
   let d=cloudDensity(p,true);let shifted=xz+vec2f(.125,-.25);
   F.cloudDrift.x+=.125;F.cloudDrift.y-=.25;
   let moved=vec3f(shifted.x,h-dot(shifted,shifted)/(2.0*RG),shifted.y);
   values=vec4f(d,cloudDensity(moved,true),0,0);
 } else if(id.z==5u){
   let d=cloudDensity(p,true);
   for(var j=0u;j<3u;j++){
     let eps=.001*pow(.1,f32(j));let shifted=xz+vec2f(eps,0);
     values[j]=abs(d-cloudDensity(vec3f(shifted.x,h-dot(shifted,shifted)/(2.0*RG),shifted.y),true));
   }
 } else {
   let steps=128u<<min(id.z-6u,2u);var tau=0.0;
   for(var i=0u;i<steps;i++){
     let alt=F.cloudP.x+(f32(i)+.5)*F.regional.y/f32(steps);
     tau+=cloudDensity(vec3f(xz.x,alt-dot(xz,xz)/(2.0*RG),xz.y),true)*F.regional.y/f32(steps)*F.cloudP.z*6.0;
   }
   values=vec4f(tau,0,0,0);
 }
 result[id.z*1024u+id.y*32u+id.x]=values;
}`;
  const code=cloudConvectionShader(source,new URLSearchParams({maCloud:'convective'}));
  const module=device.createShaderModule({code});
  const info=await module.getCompilationInfo();
  if(info.messages.some(m=>m.type==='error'))throw Error(info.messages.map(m=>m.message).join('\n'));
  const pipeline=await device.createComputePipelineAsync({layout:'auto',compute:{module,entryPoint:'main'}});
  const size=9*16384,buffer=device.createBuffer({size,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC});
  const read=device.createBuffer({size,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});
  try {
    const bind=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:frame}},{binding:5,resource:noise},{binding:6,resource:sampler},{binding:7,resource:{buffer}}]});
    const enc=device.createCommandEncoder(),pass=enc.beginComputePass();pass.setPipeline(pipeline);pass.setBindGroup(0,bind);pass.dispatchWorkgroups(4,4,9);pass.end();enc.copyBufferToBuffer(buffer,0,read,0,size);device.queue.submit([enc.finish()]);
    await read.mapAsync(GPUMapMode.READ);const data=Array.from(new Float32Array(read.getMappedRange()));read.unmap();
    const channel=(g,c)=>data.slice(g*4096,(g+1)*4096).filter((_,i)=>i%4===c),mean=v=>v.reduce((a,b)=>a+b,0)/v.length;
    const delta=g=>Math.max(...channel(g,0).map((v,i)=>Math.abs(v-channel(g,1)[i])));
    const valid=data.every(Number.isFinite),bounded=[...channel(0,0),...channel(0,2)].every(v=>v>=0&&v<=1);
    const continuity=[0,1,2].map(c=>mean(channel(5,c))),fine=channel(8,0);
    const quadrature=[6,7].map(g=>mean(channel(g,0).map((v,i)=>Math.abs(v-fine[i])))/Math.max(mean(fine),1e-8));
    const checks={finite:valid,bounded,empty:Math.max(...channel(0,1))===0,outsideLayer:Math.max(...channel(0,3))===0,
      monotoneCoverage:channel(0,0).every((v,i)=>v<=channel(0,2)[i]+1e-6),stratusUnchanged:delta(1)===0,stormUnchanged:delta(2)===0,
      rebase:delta(3)<2e-4,advection:delta(4)<2e-4,spatialContinuity:continuity[2]<continuity[1]&&continuity[1]<continuity[0],quadrature:quadrature[1]<.02};
    return {status:Object.values(checks).every(Boolean)?'PASS':'FAIL',checks,maxRebaseError:delta(3),maxAdvectionError:delta(4),meanSpatialChangeAtMetres:{'1':continuity[0],'.1':continuity[1],'.01':continuity[2]},meanTau512:mean(fine),relativeMeanAbsoluteTauErrorVs512:{'128':quadrature[0],'256':quadrature[1]},
      tolerance:'2e-4 density permits f32 texture interpolation/coordinate rounding under 12 km rebasing. Quadrature gate: 256 vs 512 midpoint mean absolute optical-depth difference below 2% of mean. These are numerical gates, not observational calibration.',scope:'1024 fixed probes per invariant, 1024 vertical columns per quadrature. Fixed 40 km region; no precipitation, moist thermodynamics, global long-run or cloud-evolution validation.'};
  } finally {read.destroy();buffer.destroy();}
}
