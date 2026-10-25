import {FRAME_WGSL,ATMO_CORE_WGSL,NOISE_WGSL} from '../src/wgsl/common.js';
import {CLOUD_VOLUME} from '../src/wgsl/clouds.js';
import {CLOUD_SHADOW_PATH} from '../src/wgsl/cloud-shadow.js';

export async function cloudShadowReadback(device,frame,noise,sampler){
  const density=CLOUD_VOLUME.slice(0,CLOUD_VOLUME.indexOf('fn cloudShadowAt('));
  const code=FRAME_WGSL+ATMO_CORE_WGSL+NOISE_WGSL+'\n@group(0) @binding(0) var<uniform> F:Frame;\n'+density+CLOUD_SHADOW_PATH+/* wgsl */`
@group(0) @binding(7) var<storage,read_write> output:array<vec4f>;
@compute @workgroup_size(8,8) fn main(@builtin(global_invocation_id) id:vec3u){
  if(any(id.xy>=vec2u(16))){return;}
  let span=select(40.0,0.512,id.z==1u);
  let xz=((vec2f(id.xy)+0.5)/16.0-0.5)*span;
  let p=vec3f(xz.x,0,xz.y);
  let k=(id.z*256u+id.y*16u+id.x)*2u;
  output[k]=vec4f(cloudShadowFor(p,F.sunDir.xyz),integratedCloudShadow(p,F.sunDir.xyz,12u),
    integratedCloudShadow(p,F.sunDir.xyz,48u),integratedCloudShadow(p,F.sunDir.xyz,96u));
  output[k+1u]=vec4f(integratedCloudShadow(p,F.sunDir.xyz,512u),integratedCloudShadow(p,F.sunDir.xyz,1024u),cloudShadowInterval(p,F.sunDir.xyz));
}`;
  const module=device.createShaderModule({code,label:'cloud shadow convergence'});
  const info=await module.getCompilationInfo();
  if(info.messages.some(x=>x.type==='error'))throw Error(info.messages.map(x=>x.message).join('\n'));
  const pipeline=await device.createComputePipelineAsync({layout:'auto',compute:{module,entryPoint:'main'}});
  const size=512*32,buffer=device.createBuffer({size,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC});
  const read=device.createBuffer({size,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});
  try{
    const bind=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:frame}},
      {binding:5,resource:noise},{binding:6,resource:sampler},{binding:7,resource:{buffer}}]});
    const enc=device.createCommandEncoder(),pass=enc.beginComputePass();pass.setPipeline(pipeline);pass.setBindGroup(0,bind);pass.dispatchWorkgroups(2,2,2);pass.end();
    enc.copyBufferToBuffer(buffer,0,read,0,size);device.queue.submit([enc.finish()]);await read.mapAsync(GPUMapMode.READ);
    const data=Array.from(new Float32Array(read.getMappedRange()));read.unmap();
    return {finite:data.every(Number.isFinite),scope:'Actual density, 256 probes each over 40 km and 512 m; no physical radiometry claim.',
      fields:['legacy12','curved12','curved48','curved96','curved512','curved1024','startKm','finishKm'],
      regions:[40,.512].map((spanKm,r)=>({spanKm,methods:['legacy12','curved12','curved48','curved96','curved512'].map((name,c)=>{
        const errors=Array.from({length:256},(_,i)=>Math.abs(data[(r*256+i)*8+c]-data[(r*256+i)*8+5])).sort((a,b)=>a-b);
        return {name,transmittanceMAE:errors.reduce((a,b)=>a+b)/256,p95:errors[243],max:errors[255]};
      })})),data};
  }finally{read.destroy();buffer.destroy();}
}
