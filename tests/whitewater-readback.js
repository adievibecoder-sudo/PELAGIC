import {PARTICLE_UPDATE,PARTICLE_COUNT} from '../src/wgsl/particles.js';
import {whitewaterShader,WHITEWATER_COUNT} from '../src/wgsl/whitewater.js';
import {FRAME_BYTES,FRAME_FLOATS} from '../src/spatial-origin.js';

export async function whitewaterChecks(device){
  const code=whitewaterShader(PARTICLE_UPDATE,new URLSearchParams('abWhitewater=parcels&maBreaking=gravity'));
  const module=device.createShaderModule({code,label:'whitewater manufactured transport'});
  const info=await module.getCompilationInfo();
  if(info.messages.some(x=>x.type==='error'))throw Error(info.messages.map(x=>x.message).join('\n'));
  const pipeline=await device.createComputePipelineAsync({layout:'auto',compute:{module,entryPoint:'main'}});
  const resources=[];
  const buffer=(size,usage)=>{const r=device.createBuffer({size,usage});resources.push(r);return r;};
  const frame=buffer(FRAME_BYTES,GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST);
  const size=(PARTICLE_COUNT+WHITEWATER_COUNT)*32;
  const particles=buffer(size,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST);
  const read=buffer(size,GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST);
  const sampler=device.createSampler({minFilter:'nearest',magFilter:'nearest',addressModeU:'repeat',addressModeV:'repeat'});
  // Filterable half-float textures retain the production binding contract.
  const half=(value)=>{const f=new Float32Array([value]),u=new Uint32Array(f.buffer)[0],s=(u>>>16)&0x8000,e=((u>>>23)&255)-112,m=u&0x7fffff;return e<=0?s:e>=31?s|0x7c00:s|(e<<10)|((m+0x1000)>>>13);};
  const makeHalf=(layers,values)=>{
    const t=device.createTexture({size:[1,1,layers],format:'rgba16float',usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST});resources.push(t);
    const write=values=>{const a=new Uint16Array(layers*4);for(let i=0;i<layers;i++)a.set(values.map(half),i*4);device.queue.writeTexture({texture:t},a,{bytesPerRow:8,rowsPerImage:1},[1,1,layers]);};
    write(values);return {t,write};
  };
  const f=makeHalf(2,[0,0,0,0]),d=makeHalf(6,[0,2/6,0,0]),s=makeHalf(6,[0,0,-.15,-.15]),w=makeHalf(1,[0,0,0,0]);
  const bind=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[
    {binding:0,resource:{buffer:frame}},{binding:1,resource:{buffer:particles}},
    {binding:2,resource:f.t.createView({dimension:'2d-array'})},{binding:3,resource:d.t.createView({dimension:'2d-array'})},
    {binding:4,resource:sampler},{binding:5,resource:s.t.createView({dimension:'2d-array'})},
    {binding:6,resource:d.t.createView({dimension:'2d-array'})},{binding:7,resource:w.t.createView()},{binding:8,resource:sampler}]});
  const uniform=new Float32Array(FRAME_FLOATS);uniform[61]=1;uniform[66]=128;uniform[67]=1024;uniform[86]=1;uniform[103]=1/60;
  for(let c=0;c<6;c++){uniform[40+c]=128;uniform[48+c]=1/128;}
  async function run(initial){
    device.queue.writeBuffer(frame,0,uniform);device.queue.writeBuffer(particles,0,initial);
    const enc=device.createCommandEncoder(),pass=enc.beginComputePass();pass.setPipeline(pipeline);pass.setBindGroup(0,bind);
    pass.dispatchWorkgroups((PARTICLE_COUNT+WHITEWATER_COUNT)/64);pass.end();enc.copyBufferToBuffer(particles,0,read,0,size);device.queue.submit([enc.finish()]);
    await read.mapAsync(GPUMapMode.READ);const result=new Float32Array(read.getMappedRange()).slice();read.unmap();return result;
  }
  const checks=[];const check=(name,pass,details)=>checks.push({name,status:pass?'PASS':'FAIL',...details});
  try{
    const empty=new Float32Array(size/4),offset=PARTICLE_COUNT*8;
    const calm=await run(empty);let calmAlive=0;for(let k=offset;k<calm.length;k+=8)calmAlive+=calm[k+3]>0;
    check('No event history produces no whitewater',calmAlive===0,{alive:calmAlive});
    f.write([1,1,1,0]);const active=await run(empty);let alive=0,invalid=0;
    for(let k=offset;k<active.length;k+=8){alive+=active[k+3]>0;for(let j=0;j<8;j++)invalid+=!Number.isFinite(active[k+j]);}
    check('Fresh gravity crests emit finite attached parcels',alive>100&&invalid===0,{alive,invalid});
    const anchor=new Float32Array(size/4);anchor.set([4,2,6,.8,4,.7,6,.5],offset);
    uniform[103]=0;uniform[126]=1024;uniform[127]=-1024;
    const shifted=await run(anchor);
    check('Paused origin rebase moves position and material anchor together',shifted[offset]===-1020&&shifted[offset+2]===1030&&shifted[offset+4]===-1020&&shifted[offset+6]===1030&&shifted[offset+3]===anchor[offset+3],{parcel:Array.from(shifted.slice(offset,offset+8))});
    uniform[126]=0;uniform[127]=0;uniform[103]=1/60;uniform[86]=0;
    const disabled=await run(anchor);check('Disabling foam retires existing parcels',disabled[offset+3]===0,{});
    uniform[86]=1;uniform[80]=.3;uniform[81]=-.2;
    const advected=await run(anchor);const J=.55,dt=uniform[103];
    const error=Math.max(Math.abs(advected[offset+4]-(4+.3/J*dt)),Math.abs(advected[offset+6]-(6-.2/J*dt)));
    check('Mean current is mapped into material coordinates once',error<1e-5,{maxPositionError:error});
    return {status:checks.every(x=>x.status==='PASS')?'PASS':'FAIL',checks,scope:'Production compute shader on manufactured constant displacement/strain/foam. Not visual acceptance or nonlinear breaker validation.'};
  }finally{resources.forEach(r=>r.destroy());}
}
