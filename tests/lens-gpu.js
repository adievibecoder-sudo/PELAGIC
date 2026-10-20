import {LENS_MEDIUM} from '../src/wgsl/lens-medium.js';
import {FRAME_BYTES,FRAME_FLOATS} from '../src/spatial-origin.js';
import {PATCHES,decodeHalf} from '../src/numerics.js';

export async function verifyLensMedium(device){
 const T=GPUTextureUsage,B=GPUBufferUsage,resources=[];
 const texture=desc=>{const t=device.createTexture(desc);resources.push(t);return t;};
 const buffer=(size,usage)=>{const b=device.createBuffer({size,usage});resources.push(b);return b;};
 const disp=texture({size:[256,256,6],format:'rgba16float',usage:T.TEXTURE_BINDING|T.COPY_DST});
 const deriv=texture({size:[256,256,6],format:'rgba16float',usage:T.TEXTURE_BINDING});
 const out=texture({size:[128,72],format:'rgba16float',usage:T.STORAGE_BINDING|T.COPY_SRC});
 const frame=buffer(FRAME_BYTES,B.UNIFORM|B.COPY_DST),probe=buffer(16,B.STORAGE|B.COPY_DST),read=buffer(128*72*8,B.MAP_READ|B.COPY_DST);
 const module=device.createShaderModule({code:LENS_MEDIUM}),info=await module.getCompilationInfo();
 if(info.messages.some(m=>m.type==='error'))throw Error(info.messages.map(m=>m.message).join('\n'));
 const pipe=await device.createComputePipelineAsync({layout:'auto',compute:{module,entryPoint:'main'}});
 const sampler=device.createSampler({magFilter:'linear',minFilter:'linear',addressModeU:'repeat',addressModeV:'repeat'});
 const bg=device.createBindGroup({layout:pipe.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:frame}},{binding:1,resource:disp.createView()},{binding:2,resource:deriv.createView()},{binding:3,resource:sampler},{binding:4,resource:{buffer:probe}},{binding:5,resource:out.createView()}]});
 const f32=new Float32Array(1),bits=new Uint32Array(f32.buffer);
 const half=v=>{f32[0]=v;const u=bits[0],e=((u>>>23)&255)-112;return e<=0?0:((u>>>16)&32768)|(e<<10)|((u>>>13)&1023);};
 const results=[];
 for(const [name,amp,cameraY,shift] of [['plane-above',0,.02,0],['plane-below',0,-.02,0],['curved-interface',.12,.119,0],['translated-interface',.12,.119,2]]){
  const data=new Uint16Array(256*256*6*4),L=PATCHES[3],wave=2*Math.PI/L;
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){
    const off=((3*256+y)*256+x)*4;data[off]=half(shift);data[off+1]=half(amp*Math.cos((x+.5)*L/256*wave));
  }
  device.queue.writeTexture({texture:disp},data,{bytesPerRow:2048,rowsPerImage:256},[256,256,6]);
  const f=new Float32Array(FRAME_FLOATS);f[16]=shift;f[17]=cameraY;f[20]=.98;f[25]=.55;f[30]=-1;f[61]=1.12;f[65]=24;f.set(PATCHES,40);f.set(PATCHES.map(x=>1/x),48);
  device.queue.writeBuffer(frame,0,f);device.queue.writeBuffer(probe,0,new Float32Array([amp,0,0,0]));
  const e=device.createCommandEncoder(),pass=e.beginComputePass();pass.setPipeline(pipe);pass.setBindGroup(0,bg);pass.dispatchWorkgroups(16,9);pass.end();e.copyTextureToBuffer({texture:out},{buffer:read,bytesPerRow:1024},[128,72]);device.queue.submit([e.finish()]);
  await read.mapAsync(GPUMapMode.READ);const values=new Uint16Array(read.getMappedRange());let maxError=0,maxResidual=0,invalid=0,wet=0,dry=0;
  for(let y=0;y<72;y++)for(let x=0;x<128;x++){
    const ex=((x+.5)/128*2-1)*.98*.05,ey=(1-(y+.5)/72*2)*.55*.05;
    const expected=cameraY+ey-amp*Math.cos(ex*wave),offset=(y*128+x)*4,actual=decodeHalf(values[offset]);
    maxError=Math.max(maxError,Math.abs(actual-expected));maxResidual=Math.max(maxResidual,decodeHalf(values[offset+1]));
    if(!Number.isFinite(actual))invalid++;if(actual<0)wet++;else dry++;
  }
  read.unmap();results.push({name,maxError,maxResidual,invalid,wet,dry,status:maxError<.00015&&maxResidual<.00001&&!invalid?'PASS':'FAIL'});
 }
 resources.forEach(r=>r.destroy());return {status:results.every(r=>r.status==='PASS')?'PASS':'FAIL',results,
  tolerance:'0.15 mm signed-height error: binary16 input/output, texture interpolation and 0.0833 m raster triangles on a 7.43 m sinusoid. Linear mesh interpolation bound A*k^2*spacing^2/8 is 0.075 mm; remaining budget covers quantization and texture sampling. Constant translation inversion residual <0.01 mm.',
  scope:'Production near-plane shader, flat/curved/translated manufactured surfaces against an analytic sinusoid. Does not certify inversion at folded storm crests or coarser/morphed raster nodes.'};
}
