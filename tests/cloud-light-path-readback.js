import {FRAME_WGSL} from '../src/wgsl/common.js';
import {CLOUD_VOLUME} from '../src/wgsl/clouds.js';
import {CLOUD_LIGHT_PATH} from '../src/wgsl/cloud-light-path.js';

export async function cloudLightPathChecks(device,frame,noise,sampler){
  const prefix=CLOUD_VOLUME.slice(0,CLOUD_VOLUME.indexOf('fn iceDensity('));
  const code=FRAME_WGSL+`
const RG:f32=6360.0;
@group(0) @binding(0) var<uniform> F:Frame;
`+prefix+CLOUD_LIGHT_PATH+/* wgsl */`
@group(0) @binding(7) var<storage,read_write> result:array<vec4f>;
@compute @workgroup_size(8,4) fn main(@builtin(global_invocation_id) id:vec3u){
  if(id.x>=16u||id.y>=8u){return;}
  let angle=array<f32,3>(48.0,5.0,0.5)[id.z/8u]*0.01745329252;
  let light=vec3f(0.0,sin(angle),-cos(angle));
  let xz=(vec2f(id.xy)+0.5)/vec2f(16,8)*40.0-20.0;
  let alt=F.cloudP.x+(0.15+0.6*f32((id.x*17u+id.y*13u)%127u)/127.0)*F.regional.y;
  let p=vec3f(xz.x,alt-dot(xz,xz)/(2.0*RG),xz.y);
  let extent=cloudLightExtent(p,light);
  let mode=id.z%8u;
  var integral=0.0;
  if(mode==0u){
    var ds=0.06;var t=0.03;
    for(var j=0u;j<5u;j++){
      integral+=cloudDensityFiltered(p+light*t,false,ds*0.35)*ds;
      t+=ds;ds*=2.1;
    }
  }else if(mode<4u){
    integral=cloudLightIntegral(p,light,5u<<(mode-1u));
  }else if(mode<7u){
    let count=256u<<(mode-4u);let ds=extent/f32(count);
    for(var j=0u;j<count;j++){
      integral+=cloudDensityFiltered(p+light*(f32(j)+0.5)*ds,false,0.0)*ds;
    }
  }else{
    var constant=0.0;var linear=0.0;
    for(var j=0u;j<5u;j++){
      let segment=cloudLightSegment(extent,j,5u);
      constant+=segment.y;linear+=segment.x*segment.y;
    }
    let endpoint=p+light*extent;
    let endpointAlt=endpoint.y+dot(endpoint.xz,endpoint.xz)/(2.0*RG);
    result[id.z*128u+id.y*16u+id.x]=vec4f(constant/extent-1.0,linear/(0.5*extent*extent)-1.0,
      endpointAlt-(F.cloudP.x+F.weather.w),extent);
    return;
  }
  result[id.z*128u+id.y*16u+id.x]=vec4f(integral*F.cloudP.z*6.0,extent,cloudDensity(p,true),0);
}`;
  const module=device.createShaderModule({code});
  const info=await module.getCompilationInfo();
  if(info.messages.some(m=>m.type==='error'))throw Error(info.messages.map(m=>m.message).join('\n'));
  const pipeline=await device.createComputePipelineAsync({layout:'auto',compute:{module,entryPoint:'main'}});
  const size=24*128*16;
  const buffer=device.createBuffer({size,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC});
  const read=device.createBuffer({size,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});
  try{
    const bind=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:frame}},
      {binding:5,resource:noise},{binding:6,resource:sampler},{binding:7,resource:{buffer}}]});
    const enc=device.createCommandEncoder(),pass=enc.beginComputePass();
    pass.setPipeline(pipeline);pass.setBindGroup(0,bind);pass.dispatchWorkgroups(2,2,24);pass.end();
    enc.copyBufferToBuffer(buffer,0,read,0,size);device.queue.submit([enc.finish()]);
    await read.mapAsync(GPUMapMode.READ);const data=Array.from(new Float32Array(read.getMappedRange()));read.unmap();
    const values=(g,c)=>Array.from({length:128},(_,i)=>data[(g*128+i)*4+c]);
    const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
    const angles=[48,5,0.5].map((elevation,a)=>{
      const reference=values(a*8+6,0),density=values(a*8,2),extent=values(a*8,1);
      const occupied=density.map((d,i)=>d>.001?i:-1).filter(i=>i>=0);
      const indices=Array.from({length:128},(_,i)=>i);
      const error=(v,ids)=>({tauMAE:mean(ids.map(i=>Math.abs(v[i]-reference[i]))),
        transmittanceMAE:mean(ids.map(i=>Math.abs(Math.exp(-v[i])-Math.exp(-reference[i]))))});
      return {elevation,occupied:occupied.length,extent:{mean:mean(extent),min:Math.min(...extent),max:Math.max(...extent)},
        methods:['legacy5','finite5','finite10','finite20','midpoint256','midpoint512','midpoint1024'].map((name,g)=>{
          const tau=values(a*8+g,0);return {name,meanTau:mean(tau),all:error(tau,indices),occupied:error(tau,occupied),tau};
        }),manufactured:{constantRelative:Math.max(...values(a*8+7,0).map(Math.abs)),
          linearRelative:Math.max(...values(a*8+7,1).map(Math.abs)),endpointKm:Math.max(...values(a*8+7,2).map(Math.abs))}};
    });
    const checks={finite:data.every(Number.isFinite),nonnegative:angles.every(a=>a.methods.every(m=>m.tau.every(t=>t>=0))),
      constant:angles.every(a=>a.manufactured.constantRelative<1e-4),linear:angles.every(a=>a.manufactured.linearRelative<1e-4),
      endpoint:angles.every(a=>a.manufactured.endpointKm<1e-4)};
    return {status:Object.values(checks).every(Boolean)?'PASS':'FAIL',checks,angles,
      scope:'128 fixed probes per angle over 40 km, stratified heights. Analytic constant/linear fields and parabolic layer exit; dense actual density integration at 256/512/1024 unfiltered midpoints. Filtered coarse estimates are compared against unfiltered density, not a claim of converged or physical cloud radiometry. PASS covers only finite/bounded analytic checks; actual-field errors are reported independently.'};
  }finally{read.destroy();buffer.destroy();}
}
