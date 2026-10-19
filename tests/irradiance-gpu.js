import {ENV_IRRADIANCE,IRRADIANCE_SIZE} from '../src/wgsl/irradiance.js';
import {decodeHalf} from '../src/numerics.js';

export async function verifyIrradiance(device) {
  const module=device.createShaderModule({code:ENV_IRRADIANCE});
  const info=await module.getCompilationInfo();
  const shaderErrors=info.messages.filter(m=>m.type==='error').map(m=>m.message);
  if(shaderErrors.length)return {status:'FAIL',shaderErrors};
  const pipeline=await device.createComputePipelineAsync({layout:'auto',compute:{module,entryPoint:'main'}});
  const n=32,size=IRRADIANCE_SIZE;
  // Exactly representable half values isolate convolution from input quantization.
  const input=device.createTexture({size:[n,n,6],format:'rgba16float',usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST});
  const output=device.createTexture({size:[size,size,6],format:'rgba16float',usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.COPY_SRC});
  const sampler=device.createSampler({minFilter:'linear',magFilter:'linear'});
  const bg=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:input.createView({dimension:'cube'})},{binding:1,resource:sampler},{binding:2,resource:output.createView({dimension:'2d-array'})}]});
  const bpr=Math.ceil(size*8/256)*256;
  const read=device.createBuffer({size:bpr*size*6,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});
  const data=new Uint16Array(n*n*6*4),cases=[];
  const direction=(f,x,y,s)=>{
    const u=(x+.5)/s*2-1,v=(y+.5)/s*2-1;
    const d=[[1,-v,-u],[-1,-v,u],[u,1,v],[u,-1,-v],[u,-v,1],[-u,-v,-1]][f];
    const l=Math.hypot(...d);return d.map(a=>a/l);
  };
  const half=v=>{const f=new Float32Array([v]),u=new Uint32Array(f.buffer)[0];return (((u>>>23)&255)-112)*1024+((u>>>13)&1023);};
  for(const mode of ['isotropic','linear angular gradient']){
  for(let f=0;f<6;f++)for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const d=direction(f,x,y,n),i=((f*n+y)*n+x)*4;
    data.set(mode==='isotropic'?[0x3400,0x3800,0x3c00,0x3c00]:[...d.map(v=>half(.5+.25*v)),0x3c00],i);
  }
  device.queue.writeTexture({texture:input},data,{bytesPerRow:n*8,rowsPerImage:n},[n,n,6]);
  const encoder=device.createCommandEncoder(),pass=encoder.beginComputePass();pass.setPipeline(pipeline);pass.setBindGroup(0,bg);pass.dispatchWorkgroups(size/8,size/8,6);pass.end();
  encoder.copyTextureToBuffer({texture:output},{buffer:read,bytesPerRow:bpr,rowsPerImage:size},[size,size,6]);device.queue.submit([encoder.finish()]);
  await read.mapAsync(GPUMapMode.READ);const result=new Uint16Array(read.getMappedRange());let maxRelative=0,invalid=0;
  for(let c=0;c<6;c++)for(let y=0;y<size;y++)for(let x=0;x<size;x++)for(let channel=0;channel<3;channel++){
    const v=decodeHalf(result[(c*size+y)*bpr/2+x*4+channel]);
    const expected=mode==='isotropic'?Math.PI*[.25,.5,1][channel]:Math.PI*(.5+direction(c,x,y,size)[channel]/6);
    if(!Number.isFinite(v))invalid++;else maxRelative=Math.max(maxRelative,Math.abs(v/expected-1));
  }
  read.unmap();
  const tolerance=mode==='isotropic'?.0015:.008;
  cases.push({mode,status:invalid===0&&maxRelative<tolerance?'PASS':'FAIL',maxRelative,invalid,tolerance});
  }
  read.destroy();input.destroy();output.destroy();
  return {status:cases.every(c=>c.status==='PASS')?'PASS':'FAIL',cases,
    inputRadiance:[.25,.5,1],expectedIrradiance:[.25,.5,1].map(v=>v*Math.PI),testedNormals:6*size*size,
    tolerance:'Isotropic: 0.15% includes binary16 rounding. Linear angular gradient: 0.8% includes finite 128-point quadrature and 32-pixel cubemap sampling. Analytic E(n)=pi*(0.5+n/6).'};
}
