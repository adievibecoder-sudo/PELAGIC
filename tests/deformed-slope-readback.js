import {FRAME_WGSL} from '../src/wgsl/common.js';
import {SHORT_WAVE_COUPLING} from '../src/wgsl/coupling.js';

export async function deformedSlopeChecks(device,frame,disp,deriv,mom,sampler){
  const code=FRAME_WGSL+SHORT_WAVE_COUPLING+/* wgsl */`
@group(0) @binding(0) var<uniform> F:Frame;
@group(0) @binding(1) var displacement:texture_2d_array<f32>;
@group(0) @binding(2) var derivatives:texture_2d_array<f32>;
@group(0) @binding(3) var moments:texture_2d_array<f32>;
@group(0) @binding(4) var repeatSampler:sampler;
@group(0) @binding(5) var<storage,read_write> result:array<vec4f>;
fn random(seed:u32)->f32 {
  var s=seed*747796405u+2891336453u;
  let w=((s>>((s>>28u)+4u))^s)*277803737u;
  return f32((w>>22u)^w)/4294967296.0;
}
@compute @workgroup_size(8,8) fn main(@builtin(global_invocation_id) id:vec3u){
  if(any(id.xy>=vec2u(128))){return;}
  let index=id.y*128u+id.x;
  let q=(vec2f(id.xy)+vec2f(random(index*2u+17u),random(index*2u+18u)))/128.0*4000.0-2000.0;
  let coupling=surfaceCoupling(derivatives,repeatSampler,q,F.windP[1].y,F.waveOrigins,F.roughnessWind,F.roughnessOffset);
  let amplitude=coupling.x;
  let gradient=coupling.yz;
  var s=vec2f(0);var j=vec3f(0);var shortDisp=vec3f(0);var cov=vec3f(0);
  for(var c=0u;c<6u;c++){
    let uv=cascadeUV(q,c,F.cascInvL[c>>2u][c&3u],F.waveOrigins);
    let g=select(1.0,amplitude,c>=3u);
    let d=textureSampleLevel(derivatives,repeatSampler,uv,c,0.0)*g;
    let m=textureSampleLevel(moments,repeatSampler,uv,c,0.0)*(g*g);
    let a=textureSampleLevel(displacement,repeatSampler,uv,c,0.0)*g;
    s+=d.xy;j+=vec3f(d.z,d.w,a.w);
    cov+=vec3f(max(m.x-d.x*d.x,0.0),max(m.y-d.y*d.y,0.0),m.z-d.x*d.y);
    if(c>=3u){shortDisp+=a.xyz/g;}
  }
  s+=shortDisp.y*gradient;
  let jx=1.0+j.x+shortDisp.x*gradient.x;let jz=1.0+j.y+shortDisp.z*gradient.y;
  let jxz=j.z+shortDisp.x*gradient.y;let jzx=j.z+shortDisp.z*gradient.x;
  let jac=jx*jz-jxz*jzx;
  let A=mat2x2f(jz,-jxz,-jzx,jx)*(1.0/max(jac,0.18));
  let sl=A*s;let C=A*mat2x2f(cov.x,cov.z,cov.z,cov.y)*transpose(A);
  result[index*3u]=vec4f(dot(s,s)+cov.x+cov.y,dot(sl,sl)+C[0][0]+C[1][1],jac,amplitude);
  result[index*3u+1u]=vec4f(s,sl);
  result[index*3u+2u]=vec4f(C[0][0],C[1][1],C[0][1],length(sl));
}`;
  const module=device.createShaderModule({code});
  const info=await module.getCompilationInfo();
  if(info.messages.some(m=>m.type==='error'))throw Error(info.messages.map(m=>m.message).join('\n'));
  const pipeline=await device.createComputePipelineAsync({layout:'auto',compute:{module,entryPoint:'main'}});
  const size=128*128*48;
  const buffer=device.createBuffer({size,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC});
  const read=device.createBuffer({size,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});
  try{
    const bind=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:frame}},
      {binding:1,resource:disp},{binding:2,resource:deriv},{binding:3,resource:mom},{binding:4,resource:sampler},{binding:5,resource:{buffer}}]});
    const enc=device.createCommandEncoder(),pass=enc.beginComputePass();
    pass.setPipeline(pipeline);pass.setBindGroup(0,bind);pass.dispatchWorkgroups(16,16);pass.end();
    enc.copyBufferToBuffer(buffer,0,read,0,size);device.queue.submit([enc.finish()]);
    await read.mapAsync(GPUMapMode.READ);const data=Array.from(new Float32Array(read.getMappedRange()));read.unmap();
    const col=c=>data.filter((_,i)=>i%12===c),mean=v=>v.reduce((a,b)=>a+b,0)/v.length;
    const j=col(2),weight=j.map(x=>Math.max(x,0)),mass=weight.reduce((a,b)=>a+b,0);
    const weighted=v=>v.reduce((a,b,i)=>a+b*weight[i],0)/mass;
    const variance=(a,b)=>weighted(a.map(x=>x*x))-weighted(a)**2+weighted(b.map(x=>x*x))-weighted(b)**2;
    const raw=col(0),deformed=col(1),resolved=variance(col(6),col(7));
    const sorted=col(11).sort((a,b)=>a-b);
    return {finite:data.every(Number.isFinite),sampleCount:j.length,meanJacobian:mean(j),
      foldedFraction:j.filter(x=>x<=0).length/j.length,regularizedFraction:j.filter(x=>x<.18).length/j.length,
      parameterSlopeSecondMoment:mean(raw),deformedParameterSecondMoment:mean(deformed),
      deformedAreaSecondMoment:weighted(deformed),deformedAreaResolvedVariance:resolved,
      deformedAreaUnresolvedVariance:weighted(col(8))+weighted(col(9)),
      resolvedSlope:{p50:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.floor(sorted.length*.95)],p99:sorted[Math.floor(sorted.length*.99)],max:sorted.at(-1)},
      scope:'16384 stratified deterministic points over 4x4 km; level-0 bilinear first/second moments, current choppy inverse-Jacobian and short-wave coupling. Positive horizontal Jacobian area weights; folds invalidate the single-valued area interpretation. Moment transformation uses filtered mean Jacobian, not exact deformed microgeometry. One realization, not ensemble/observational calibration.',
      columns:['parameter slope energy','deformed slope energy','horizontal Jacobian','short amplitude','sx','sz','deformed sx','deformed sz','cov xx','cov zz','cov xz','resolved slope magnitude'],values:data};
  }finally{read.destroy();buffer.destroy();}
}
