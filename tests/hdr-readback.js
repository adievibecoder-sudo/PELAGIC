import {decodeHalf} from '../src/numerics.js';
export async function hdrReadback(device,texture) {
  const w=texture.width,h=texture.height,bpr=Math.ceil(w*8/256)*256;
  const read=device.createBuffer({size:bpr*h,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});
  const e=device.createCommandEncoder();e.copyTextureToBuffer({texture},{buffer:read,bytesPerRow:bpr},[w,h]);device.queue.submit([e.finish()]);await read.mapAsync(GPUMapMode.READ);
  const data=new Uint16Array(read.getMappedRange());let invalid=0,negative=0,max=0,over60000=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)for(let c=0;c<3;c++){
    const v=decodeHalf(data[y*bpr/2+x*4+c]);if(!Number.isFinite(v))invalid++;else {max=Math.max(max,v);if(v<0)negative++;if(v>60000)over60000++;}
  }
  read.unmap();read.destroy();return {status:invalid===0&&negative===0&&max<65504?'PASS':'FAIL',invalid,negative,max,over60000,pixels:w*h,scope:'All RGB samples in pre-exposed resolved linear HDR, before bloom and tone mapping'};
}
