import {FFT_ROWS,FFT_COLS} from '../src/wgsl/sim.js';
import {N} from '../src/wgsl/common.js';
import {inverse2D,decodeHalf} from '../src/numerics.js';

export async function verifyFFT(device) {
  const B=GPUBufferUsage,T=GPUTextureUsage,n=N;
  const buffers=[],textures=[];
  const buffer=(usage)=>{const b=device.createBuffer({size:n*n*16,usage});buffers.push(b);return b;};
  const a=buffer(B.STORAGE|B.COPY_DST),b=buffer(B.STORAGE|B.COPY_DST),ta=buffer(B.STORAGE),tb=buffer(B.STORAGE);
  const outputs=Array.from({length:3},()=>{const t=device.createTexture({size:[n,n,1],format:'rgba16float',usage:T.STORAGE_BINDING|T.COPY_SRC});textures.push(t);return t;});
  const make=async(code)=>device.createComputePipelineAsync({layout:'auto',compute:{module:device.createShaderModule({code}),entryPoint:'main'}});
  const rows=await make(FFT_ROWS),cols=await make(FFT_COLS);
  const group=(p,rs)=>device.createBindGroup({layout:p.getBindGroupLayout(0),entries:rs.map((resource,binding)=>({binding,resource}))});
  const gr=group(rows,[a,b,ta,tb].map(buffer=>({buffer}))),gc=group(cols,[{buffer:ta},{buffer:tb},...outputs.map(t=>t.createView({dimension:'2d-array'}))]);
  const result=[];
  for(const mode of ['DC impulse','crossing harmonics','seeded broadband']) {
    const inputA=new Float32Array(n*n*4),inputB=new Float32Array(n*n*4);
    let seed=1307;
    const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296-0.5;};
    if(mode==='DC impulse'){inputA.set([.25,-.125,1,.5]);inputB.set([.1,.2,.3,.4]);}
    else if(mode==='crossing harmonics') {
      for(const [x,y,amp] of [[2,7,.6],[11,3,.25],[17,9,.1]]) {
        const k=(y*n+x)*4,m=((n-y)*n+n-x)*4;
        inputA[k+2]=amp;inputA[m+2]=amp;inputB[k]=amp*x;inputB[m]=amp*x;
        inputA[k+1]=amp*.3;inputA[m+1]=-amp*.3;
      }
    } else for(let i=0;i<inputA.length;i++){inputA[i]=rand()/n;inputB[i]=rand()/n;}
    device.queue.writeBuffer(a,0,inputA);device.queue.writeBuffer(b,0,inputB);
    const read=outputs.map(()=>device.createBuffer({size:n*n*8,usage:B.COPY_DST|B.MAP_READ}));
    const enc=device.createCommandEncoder(),cp=enc.beginComputePass();
    cp.setPipeline(rows);cp.setBindGroup(0,gr);cp.dispatchWorkgroups(n,1,1);
    cp.setPipeline(cols);cp.setBindGroup(0,gc);cp.dispatchWorkgroups(n,1,1);cp.end();
    outputs.forEach((t,i)=>enc.copyTextureToBuffer({texture:t},{buffer:read[i],bytesPerRow:n*8},[n,n,1]));
    device.queue.submit([enc.finish()]);
    const expectedA=inverse2D(inputA,n),expectedB=inverse2D(inputB,n);
    const expected=[new Float64Array(n*n*4),expectedB,new Float64Array(n*n*4)];
    for(let i=0;i<n*n;i++){
      expected[0].set([expectedA[i*4],expectedA[i*4+2],expectedA[i*4+1],expectedA[i*4+3]],i*4);
      expected[2].set([expectedB[i*4]**2,expectedB[i*4+1]**2,expectedB[i*4]*expectedB[i*4+1],0],i*4);
    }
    const channels=[];
    for(let c=0;c<3;c++) {
      await read[c].mapAsync(GPUMapMode.READ);const data=new Uint16Array(read[c].getMappedRange());
      let sq=0,signal=0,maxError=0,invalid=0,maxReference=0;
      for(let i=0;i<data.length;i++) {
        const v=decodeHalf(data[i]),e=Math.abs(v-expected[c][i]);if(!Number.isFinite(v))invalid++;
        sq+=e*e;signal+=expected[c][i]**2;maxError=Math.max(maxError,e);maxReference=Math.max(maxReference,Math.abs(expected[c][i]));
      }
      const relativeL2=Math.sqrt(sq/Math.max(signal,1e-30));
      // Binary16 roundoff plus f32 FFT arithmetic; absolute guard covers cancellation near zero.
      const tolerance=0.0012*maxReference+2e-5;
      channels.push({field:['displacement','derivatives','moments'][c],status:invalid===0&&relativeL2<0.001&&maxError<tolerance?'PASS':'FAIL',relativeL2,maxError,tolerance,invalid});
      read[c].unmap();read[c].destroy();
    }
    result.push({case:mode,channels});
  }
  buffers.forEach(b=>b.destroy());textures.forEach(t=>t.destroy());
  return result;
}
