import {CUBE_MIPS} from '../src/wgsl/sky.js';
import {readFloatTexture} from './texture-readback.js';

const direction=(face,u,v)=>[[1,-v,-u],[-1,-v,u],[u,1,v],[u,-1,-v],[u,-v,1],[-u,-v,-1]][face];
const field=(face,x,y,n)=>{
  const d=direction(face,2*(x+.5)/n-1,2*(y+.5)/n-1),length=Math.hypot(...d);
  return [...d.map(v=>.5+.5*v/length),1];
};

export async function verifyCubeMips(device){
  const T=GPUTextureUsage,n=32;
  const input=device.createTexture({size:[n,n,6],format:'rgba32float',usage:T.TEXTURE_BINDING|T.COPY_DST});
  const data=new Float32Array(n*n*6*4);
  for(let f=0;f<6;f++)for(let y=0;y<n;y++)for(let x=0;x<n;x++)data.set(field(f,x,y,n),((f*n+y)*n+x)*4);
  device.queue.writeTexture({texture:input},data,{bytesPerRow:n*16,rowsPerImage:n},[n,n,6]);
  const variants=[CUBE_MIPS,CUBE_MIPS.replace('cubeLoad(src, q, id.z)','textureLoad(src, clamp(q, vec2i(0), srcSize - 1), id.z, 0)')];
  const errors=[];
  for(const source of variants){
    // The unfilterable float32 input uses integer loads, never a sampler.
    const module=device.createShaderModule({code:source});
    const layout=device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:'unfilterable-float',viewDimension:'2d-array'}},{binding:1,visibility:GPUShaderStage.COMPUTE,storageTexture:{access:'write-only',format:'rgba16float',viewDimension:'2d-array'}}]});
    const pipe=await device.createComputePipelineAsync({layout:device.createPipelineLayout({bindGroupLayouts:[layout]}),compute:{module,entryPoint:'main'}});
    const output=device.createTexture({size:[n/2,n/2,6],format:'rgba16float',usage:T.STORAGE_BINDING|T.COPY_SRC});
    const group=device.createBindGroup({layout,entries:[{binding:0,resource:input.createView()},{binding:1,resource:output.createView()}]});
    const e=device.createCommandEncoder(),p=e.beginComputePass();p.setPipeline(pipe);p.setBindGroup(0,group);p.dispatchWorkgroups(2,2,6);p.end();device.queue.submit([e.finish()]);
    const result=await readFloatTexture(device,output);let sum=0,count=0,alphaError=0;
    for(let f=0;f<6;f++)for(let y=0;y<n/2;y++)for(let x=0;x<n/2;x++){
      if(x>0&&x<n/2-1&&y>0&&y<n/2-1)continue;
      const expected=[0,0,0];
      for(let j=-1;j<=2;j++)for(let i=-1;i<=2;i++){
        const weight=(i===0||i===1?3:1)*(j===0||j===1?3:1)/64;
        const value=field(f,x*2+i,y*2+j,n);for(let c=0;c<3;c++)expected[c]+=value[c]*weight;
      }
      const index=((f*n/2+y)*n/2+x)*4;
      for(let c=0;c<3;c++){sum+=Math.abs(result.values[index+c]-expected[c]);count++;}
      alphaError=Math.max(alphaError,Math.abs(result.values[index+3]-1));
    }
    errors.push({meanBoundaryError:sum/count,constantError:alphaError});output.destroy();
  }
  input.destroy();return {name:'Production cubemap mip boundary filtering',crossFace:errors[0],legacyClamp:errors[1],
    status:errors[0].meanBoundaryError<errors[1].meanBoundaryError*.65&&errors.every(e=>e.constantError===0)?'PASS':'FAIL',
    scope:'Actual mip kernel on a continuous directional RGB field, compared with an independent continuation of the 4x4 tent footprint across each face boundary. Not an observed ocean seam rating.'};
}
