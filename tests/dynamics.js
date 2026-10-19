import {SIM_EVOLVE,FOAM_UPDATE} from '../src/wgsl/sim.js';
import {PATCHES,omega,decodeHalf} from '../src/numerics.js';

const half=v=>{const a=new Float32Array([v]),u=new Uint32Array(a.buffer)[0];const e=((u>>>23)&255)-127+15;return e<=0?0:e>=31?31744:((u>>>16)&32768)|(e<<10)|((u>>>13)&1023);};
export async function verifyDynamics(device,progress=()=>{}) {
  const B=GPUBufferUsage,T=GPUTextureUsage;
  const resources=[];
  const buffer=(size,usage)=>{const b=device.createBuffer({size,usage});resources.push(b);return b;};
  const texture=(size,usage)=>{const t=device.createTexture({size,format:'rgba16float',usage});resources.push(t);return t;};
  const pipeline=async code=>device.createComputePipelineAsync({layout:'auto',compute:{module:device.createShaderModule({code}),entryPoint:'main'}});
  const group=(p,r)=>device.createBindGroup({layout:p.getBindGroupLayout(0),entries:r.map((resource,binding)=>({binding,resource}))});
  const n=256,c=6,ub=buffer(224,B.UNIFORM|B.COPY_DST),h0=buffer(n*n*c*16,B.STORAGE),a=buffer(n*n*c*16,B.STORAGE),b=buffer(n*n*c*16,B.STORAGE);
  const phases=buffer(n*n*c*8,B.STORAGE|B.COPY_DST|B.COPY_SRC),read=buffer(n*n*c*8,B.MAP_READ|B.COPY_DST);
  const pipe=await pipeline(SIM_EVOLVE),bg=group(pipe,[ub,h0,a,b,phases].map(buffer=>({buffer})));
  const u=new Float32Array(56);u.set(PATCHES);u[53]=1/60;device.queue.writeBuffer(ub,0,u);
  const phaseResults=[];
  for(const epoch of [0,21600,86400]) {
    progress('Phase evolution at epoch '+epoch+' seconds');
    const initial=new Float32Array(n*n*c*2);
    for(let z=0;z<c;z++)for(let y=0;y<16;y++)for(let x=0;x<16;x++){
      const i=((z*n+y)*n+x)*2,w=omega(Math.hypot(x,y)*2*Math.PI/PATCHES[z]);
      initial[i]=Math.cos(w*epoch);initial[i+1]=Math.sin(w*epoch);
    }
    device.queue.writeBuffer(phases,0,initial);
    for(let batch=0;batch<60;batch++){
      const e=device.createCommandEncoder(),p=e.beginComputePass();p.setPipeline(pipe);p.setBindGroup(0,bg);
      for(let j=0;j<120;j++)p.dispatchWorkgroups(1,1,6);p.end();device.queue.submit([e.finish()]);
      if(batch%10===0)await device.queue.onSubmittedWorkDone();
    }
    const e=device.createCommandEncoder();e.copyBufferToBuffer(phases,0,read,0,read.size);device.queue.submit([e.finish()]);await read.mapAsync(GPUMapMode.READ);
    const values=new Float32Array(read.getMappedRange());let maxPhaseError=0,maxNormError=0,invalid=0;
    for(let z=0;z<c;z++)for(let y=0;y<16;y++)for(let x=0;x<16;x++){
      if(x+y===0)continue;const i=((z*n+y)*n+x)*2,w=omega(Math.hypot(x,y)*2*Math.PI/PATCHES[z]);
      const actual=Math.atan2(values[i+1],values[i]),expected=w*(epoch+120);
      const error=Math.abs(Math.atan2(Math.sin(actual-expected),Math.cos(actual-expected)));
      maxPhaseError=Math.max(maxPhaseError,error);maxNormError=Math.max(maxNormError,Math.abs(Math.hypot(values[i],values[i+1])-1));if(!Number.isFinite(error))invalid++;
    }
    read.unmap();phaseResults.push({epoch,steps:7200,modes:1530,maxPhaseErrorRadians:maxPhaseError,maxNormError,invalid,status:maxPhaseError<0.02&&maxNormError<2e-6&&!invalid?'PASS':'FAIL'});
  }

  progress('Foam: manufactured advection and decay');
  const res=64,field=texture([256,256,6],T.TEXTURE_BINDING|T.COPY_DST);
  const displaced=texture([256,256,6],T.TEXTURE_BINDING|T.COPY_DST);
  const displacement=new Uint16Array(256*256*6*4);
  for(let i=0;i<256*256*6;i++)displacement[i*4]=half(.25);
  device.queue.writeTexture({texture:displaced},displacement,{bytesPerRow:2048,rowsPerImage:256},[256,256,6]);
  const foam=[0,1].map(()=>texture([res,res,2],T.TEXTURE_BINDING|T.STORAGE_BINDING|T.COPY_DST|T.COPY_SRC));
  const fu=buffer(144,B.UNIFORM|B.COPY_DST),fr=buffer(res*res*2*8,B.MAP_READ|B.COPY_DST);
  const fp=await pipeline(FOAM_UPDATE.replace(/const RES: i32 = \d+;/,'const RES: i32 = 64;'));
  const samp=device.createSampler({magFilter:'linear',minFilter:'linear',addressModeU:'repeat',addressModeV:'repeat'});
  const fbg=foam.map((t,i)=>group(fp,[{buffer:fu},foam[1-i].createView(),t.createView(),displaced.createView(),field.createView(),samp,samp,field.createView()]));
  const data=new Uint16Array(res*res*2*4),original=new Float64Array(res*res);
  for(let y=0;y<res;y++)for(let x=0;x<res;x++){
    const v=(x>12&&x<28&&y>20&&y<44)?0.75:0;original[y*res+x]=v;
    for(let z=0;z<2;z++)data[((z*res+y)*res+x)*4]=half(v);
  }
  const results=[];
  for(const [name,hz,steps,decay,drift] of [['translation',60,8,0,60],['decay-30',30,120,.22,0],['decay-60',60,240,.22,0],['decay-120',120,480,.22,0],['paused',60,20,0,0]]) {
    for(const t of foam)device.queue.writeTexture({texture:t},data,{bytesPerRow:res*8,rowsPerImage:res},[res,res,2]);
    const bytes=new ArrayBuffer(144),fi=new Int32Array(bytes),ff=new Float32Array(bytes);
    fi.set([32,32,32,32,32,32,32,32]);ff.set([1,1,name==='paused'?0:1/hz,decay],8);ff.set([.56,3,5,0],12);
    ff.set(PATCHES,16);ff.set(PATCHES.map(x=>1/x),24);ff[32]=drift;device.queue.writeBuffer(fu,0,bytes);
    let cur=0;const e=device.createCommandEncoder(),p=e.beginComputePass();p.setPipeline(fp);
    for(let j=0;j<steps;j++){cur=1-cur;p.setBindGroup(0,fbg[cur]);p.dispatchWorkgroups(res/8,res/8,2);}p.end();
    e.copyTextureToBuffer({texture:foam[cur]},{buffer:fr,bytesPerRow:res*8,rowsPerImage:res},[res,res,2]);device.queue.submit([e.finish()]);await fr.mapAsync(GPUMapMode.READ);
    const out=new Uint16Array(fr.getMappedRange());let l1=0,signal=0,mass=0,xmoment=0,invalid=0;
    for(let y=0;y<res;y++)for(let x=0;x<res;x++){
      const v=decodeHalf(out[(y*res+x)*4])+decodeHalf(out[(y*res+x)*4+3]);const sx=x-(name==='translation'?8:0);
      const expected=(sx>=0?original[y*res+sx]:0)*Math.exp(-decay*steps/hz);
      l1+=Math.abs(v-expected);signal+=expected;mass+=v;xmoment+=x*v;if(!Number.isFinite(v)||v<0)invalid++;
    }
    fr.unmap();const relativeL1=l1/Math.max(signal,1e-20);
    results.push({case:name,hz,steps,relativeL1,mass,centroidX:xmoment/mass,invalid,status:relativeL1<(name.startsWith('decay')?.002:.001)&&!invalid?'PASS':'FAIL'});
  }
  // A crest top has zero elevation slope. Compression alone must still emit foam.
  const derivative=new Uint16Array(256*256*6*4);
  for(let i=0;i<256*256;i++)derivative[i*4+2]=half(-.5);
  device.queue.writeTexture({texture:field},derivative,{bytesPerRow:2048,rowsPerImage:256},[256,256,6]);
  for(const t of foam)device.queue.writeTexture({texture:t},new Uint16Array(data.length),{bytesPerRow:res*8,rowsPerImage:res},[res,res,2]);
  const bytes=new ArrayBuffer(144),fi=new Int32Array(bytes),ff=new Float32Array(bytes);fi.set([32,32,32,32,32,32,32,32]);
  ff.set([1,1,1/60,0],8);ff.set([.83,3,5,1],12);ff.set(PATCHES,16);ff.set(PATCHES.map(x=>1/x),24);device.queue.writeBuffer(fu,0,bytes);
  let cur=0;const e=device.createCommandEncoder(),pass=e.beginComputePass();pass.setPipeline(fp);
  for(let i=0;i<30;i++){cur=1-cur;pass.setBindGroup(0,fbg[cur]);pass.dispatchWorkgroups(8,8,2);}pass.end();
  e.copyTextureToBuffer({texture:foam[cur]},{buffer:fr,bytesPerRow:res*8,rowsPerImage:res},[res,res,2]);device.queue.submit([e.finish()]);await fr.mapAsync(GPUMapMode.READ);
  const values=new Uint16Array(fr.getMappedRange()),off=(32*res+32)*4;
  const actual=decodeHalf(values[off])+decodeHalf(values[off+3]);
  const smooth=t=>t*t*(3-2*t),activity=.65+.35*smooth(.3/.8),expected=1-Math.exp(-5*activity*.5);
  results.push({case:'compressed-crest-zero-slope',actual,expected,relativeError:Math.abs(actual/expected-1),status:Math.abs(actual/expected-1)<.002?'PASS':'FAIL'});fr.unmap();
  resources.forEach(r=>r.destroy());
  return {phase:phaseResults,foam:results,tolerances:{phase:'0.02 rad maximum over a 120 s epoch; unit norm 2e-6. Sparse modes cover six bands.',foam:'Translation/pause relative L1 <0.001; compensated decay and source response <0.2%.'},limitations:'Epoch tests evolve only 120 s at each epoch. Foam uses production RES=64. Constant horizontal displacement deliberately differs from previous displacement: unchanged translation verifies orbital motion is not double-counted. Manufactured compression tests source response, not oceanographic breaking accuracy. Whitecap coverage remains unvalidated.'};
}
