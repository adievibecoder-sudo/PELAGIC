import {decodeHalf} from '../src/numerics.js';
import {lightStorageShader,LIGHT_STORAGE_SCALE} from '../src/wgsl/light-storage.js';

export async function verifyLightStorage(device){
  const source=/* wgsl */`
const ENV: f32=512.0;
@group(0) @binding(0) var dst:texture_storage_2d_array<rgba16float,write>;
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) id:vec3u){
  if(id.x>=512u){return;}
  let value=exp2(-27.0+f32(id.x)/511.0*33.0);
  let L=vec3f(value,value*.37,value*.81);let face=0u;
  textureStore(dst,id.xy,face,vec4f(L, 1.0));
}`;
  const cases=[];
  for(const scaled of [false,true]){
    const code=lightStorageShader(source,new URLSearchParams(scaled?'abRadiance=scaled':''));
    const module=device.createShaderModule({code});
    const info=await module.getCompilationInfo();
    if(info.messages.some(m=>m.type==='error'))return {status:'FAIL',messages:info.messages};
    const pipeline=await device.createComputePipelineAsync({layout:'auto',compute:{module,entryPoint:'main'}});
    const texture=device.createTexture({size:[512,1,1],format:'rgba16float',usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.COPY_SRC});
    const read=device.createBuffer({size:4096,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});
    try{
      const bg=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:texture.createView({dimension:'2d-array'})}]});
      const enc=device.createCommandEncoder(),pass=enc.beginComputePass();pass.setPipeline(pipeline);pass.setBindGroup(0,bg);pass.dispatchWorkgroups(8);pass.end();
      enc.copyTextureToBuffer({texture},{buffer:read,bytesPerRow:4096},[512,1]);device.queue.submit([enc.finish()]);
      await read.mapAsync(GPUMapMode.READ);
      const bits=new Uint16Array(read.getMappedRange()),scale=scaled?LIGHT_STORAGE_SCALE:1;
      let invalid=0,zeroChannels=0,maxRelative=0,nightSquaredError=0,nightCount=0,opacityErrors=0,boundErrors=0;
      for(let i=0;i<512;i++){
        const value=2**(-27+i/511*33);
        if(decodeHalf(bits[i*4+3])!==1)opacityErrors++;
        for(let c=0;c<3;c++){
          const expected=value*[1,.37,.81][c],actual=decodeHalf(bits[i*4+c])/scale;
          if(!Number.isFinite(actual))invalid++;
          if(actual===0)zeroChannels++;
          const relative=Math.abs(actual/expected-1);maxRelative=Math.max(maxRelative,relative);
          // Storage conversion may truncate. Allow one binary16 ULP plus the
          // f32 exp2 evaluation error, including the subnormal range.
          const quantum=Math.max(2**-24,2**(Math.floor(Math.log2(expected*scale))-10))/scale;
          if(Math.abs(actual-expected)>quantum+expected*3e-6)boundErrors++;
          if(expected<1e-5){nightSquaredError+=relative*relative;nightCount++;}
        }
      }
      read.unmap();cases.push({scaled,invalid,zeroChannels,maxRelative,opacityErrors,boundErrors,nightRelativeRMS:Math.sqrt(nightSquaredError/nightCount)});
    }finally{read.destroy();texture.destroy();}
  }
  return {status:cases.every(c=>c.invalid===0&&c.opacityErrors===0&&c.boundErrors===0)&&cases[1].nightRelativeRMS<cases[0].nightRelativeRMS&&cases[1].zeroChannels===0?'PASS':'FAIL',cases,
    scope:'Native binary16 storage across 2^-27..64 relative radiance; RGB scaling only, alpha unchanged. Not a visual or scene radiometry acceptance.'};
}
