import {FRAME_WGSL} from '../src/wgsl/common.js';
import {CLOUD_VOLUME} from '../src/wgsl/clouds.js';
import {cloudWorkShader} from '../src/wgsl/cloud-work.js';

export async function cloudWorkChecks(device,frame,noise,sampler,mode='bounded'){
  const prefix=CLOUD_VOLUME.slice(0,CLOUD_VOLUME.indexOf('fn iceDensity('));
  const reference=prefix.slice(prefix.indexOf('fn thermalShape('),prefix.indexOf('fn cloudDensity(p:'))
    .replaceAll('thermalShape','thermalReference').replaceAll('cloudDensityFiltered','densityReference');
  const code=FRAME_WGSL+`
const RG:f32=6360.0;
@group(0) @binding(0) var<uniform> initial:Frame;
var<private> F:Frame;
`+cloudWorkShader(prefix,new URLSearchParams({abCloudWork:mode}))+reference+/* wgsl */`
@group(0) @binding(7) var<storage,read_write> result:array<vec4f>;
@compute @workgroup_size(8,8) fn main(@builtin(global_invocation_id) id:vec3u){
  F=initial;
  let k=id.z*4096u+id.y*64u+id.x;
  let r=vec3f(hash3(vec3f(f32(k),7,13)),hash3(vec3f(31,f32(k),11)),hash3(vec3f(17,41,f32(k))));
  F.regional.x=f32(id.z%4u)/3.0;
  F.regional.y=select(0.3,5.0,id.z%2u==0u);
  F.cloudWeights=select(select(vec4f(1,0,0,0),vec4f(0,1,0,0),id.z/4u==1u),vec4f(0,0,1,0),id.z/4u==2u);
  if(id.z>=12u){F.cloudWeights=vec4f(0.3,0.2,0.5,0);}
  F.frontControl.z=f32(id.x%2u);
  let xz=(r.xz-0.5)*120.0;
  let altitude=F.cloudP.x+(r.y*1.2-0.1)*5.0;
  let p=vec3f(xz.x,altitude-dot(xz,xz)/(2.0*RG),xz.y);
  let footprint=select(0.0,exp2(f32(id.y%12u)-8.0),id.y%2u==0u);
  let a=cloudDensityFiltered(p,true,footprint);
  let b=densityReference(p,true,footprint);
  result[k]=vec4f(a,b,abs(a-b),0);
}`;
  const module=device.createShaderModule({code,label:'cloud exact support comparison'});
  const info=await module.getCompilationInfo();
  if(info.messages.some(m=>m.type==='error'))throw Error(info.messages.map(m=>m.message).join('\n'));
  const pipeline=await device.createComputePipelineAsync({layout:'auto',compute:{module,entryPoint:'main'}});
  const size=65536*16,buffer=device.createBuffer({size,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC});
  const read=device.createBuffer({size,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});
  try{
    const bind=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:frame}},
      {binding:5,resource:noise},{binding:6,resource:sampler},{binding:7,resource:{buffer}}]});
    const enc=device.createCommandEncoder(),pass=enc.beginComputePass();
    pass.setPipeline(pipeline);pass.setBindGroup(0,bind);pass.dispatchWorkgroups(8,8,16);pass.end();
    enc.copyBufferToBuffer(buffer,0,read,0,size);device.queue.submit([enc.finish()]);
    await read.mapAsync(GPUMapMode.READ);const values=new Float32Array(read.getMappedRange());
    let maxError=0,invalid=0,occupied=0,changed=0;
    for(let i=0;i<65536;i++){const [a,b,e]=values.subarray(i*4,i*4+3);if(!Number.isFinite(e))invalid++;maxError=Math.max(maxError,e);occupied+=b>0;changed+=a!==b;}
    read.unmap();return {status:!invalid&&!changed?'PASS':'FAIL',samples:65536,maxError,invalid,occupied,changed,
      scope:'Legacy density; pure and mixed cloud types, coverage endpoints, 0.3/5 km depth, regional front on/off, varying footprint, 120 km area. Exact support rejection; not visual morphology acceptance.'};
  }finally{buffer.destroy();read.destroy();}
}
