import {FRAME_BYTES} from '../src/spatial-origin.js';
import {CREST_SHEET_COUNT,CREST_SHEET_NODES,CREST_SHEET_NODE_BYTES} from '../src/wgsl/crest-sheet.js';
import {CREST_SURFACE_SIZE,CREST_SURFACE_CLEAR,CREST_SURFACE_BUILD} from '../src/wgsl/crest-surface.js';

// Exercise the production rasterizer with controlled overlapping footprints.
// These checks establish storage/union behavior, not breaking appearance.
export async function crestSurfaceChecks(device){
  const bytes=CREST_SURFACE_SIZE**2*4,stride=CREST_SHEET_NODE_BYTES/4;
  const data=new Float32Array(CREST_SHEET_COUNT*CREST_SHEET_NODES*stride);
  const frame=device.createBuffer({size:FRAME_BYTES,usage:GPUBufferUsage.UNIFORM});
  const nodes=device.createBuffer({size:data.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST});
  const field=device.createBuffer({size:bytes,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC});
  const read=device.createBuffer({size:bytes,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});
  try{
    const pipelines=await Promise.all([CREST_SURFACE_CLEAR,CREST_SURFACE_BUILD].map(code=>
      device.createComputePipelineAsync({layout:'auto',compute:{module:device.createShaderModule({code}),entryPoint:'main'}})));
    const groups=[[field],[frame,nodes,field]].map((buffers,i)=>device.createBindGroup({
      layout:pipelines[i].getBindGroupLayout(0),entries:buffers.map((buffer,binding)=>({binding,resource:{buffer}}))}));
    async function run(events){
      data.fill(0);
      events.forEach(([activity,offset=0],chain)=>{
        for(let n=0;n<2;n++){
          const k=(chain*CREST_SHEET_NODES+n)*stride;data[k+7]=activity;
          for(let j=0;j<5;j++){data[k+16+j*4]=-2+n*4+offset;data[k+18+j*4]=-1+j*.5;}
        }
      });
      device.queue.writeBuffer(nodes,0,data);
      const encoder=device.createCommandEncoder(),pass=encoder.beginComputePass();
      for(let i=0;i<2;i++){
        pass.setPipeline(pipelines[i]);pass.setBindGroup(0,groups[i]);
        pass.dispatchWorkgroups(i===0?CREST_SURFACE_SIZE**2/64:Math.ceil(CREST_SHEET_COUNT/64));
      }
      pass.end();encoder.copyBufferToBuffer(field,0,read,0,bytes);device.queue.submit([encoder.finish()]);
      await read.mapAsync(GPUMapMode.READ);const values=new Uint32Array(read.getMappedRange()).slice();read.unmap();return values;
    }
    const single=await run([[.8]]),duplicate=await run([[.8],[.8],[.4]]),reverse=await run([[.4],[.8]]);
    const outside=await run([[.8,1000]]),empty=await run([]);
    const checks=[
      {name:'nonempty bounded footprint',pass:single.some(x=>x>0)&&single.every(x=>x<=Math.ceil(.8*65535))},
      {name:'duplicate occupancy is idempotent',pass:single.every((x,i)=>x===duplicate[i])},
      {name:'union is independent of event order',pass:single.every((x,i)=>x===reverse[i])},
      {name:'outside footprint never wraps',pass:outside.every(x=>x===0)},
      {name:'empty frame clears previous occupancy',pass:empty.every(x=>x===0)}
    ].map(({name,pass})=>({name,status:pass?'PASS':'FAIL'}));
    return {status:checks.every(x=>x.status==='PASS')?'PASS':'FAIL',checks,
      occupiedCells:single.reduce((n,x)=>n+(x>0),0),scope:'Manufactured production-atlas storage and overlap; no visual or fluid-physics claim.'};
  }finally{frame.destroy();nodes.destroy();field.destroy();read.destroy();}
}
