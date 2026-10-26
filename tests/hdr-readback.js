import {decodeHalf} from '../src/numerics.js';
export async function hdrReadback(device,texture,storageDivisor=1) {
  const w=texture.width,h=texture.height,bpr=Math.ceil(w*8/256)*256;
  const read=device.createBuffer({size:bpr*h,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});
  const e=device.createCommandEncoder();e.copyTextureToBuffer({texture},{buffer:read,bytesPerRow:bpr},[w,h]);device.queue.submit([e.finish()]);await read.mapAsync(GPUMapMode.READ);
  const data=new Uint16Array(read.getMappedRange());let invalid=0,negative=0,max=0,over60000=0;
  const invalidSamples=[];
  const regions=Array.from({length:3},()=>({count:0,rgb:[0,0,0],luminance:0,logLuminance:0}));
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const rgb=[];
    for(let c=0;c<3;c++){
      const v=decodeHalf(data[y*bpr/2+x*4+c]);rgb.push(v*storageDivisor);
      if(!Number.isFinite(v)){invalid++;if(invalidSamples.length<16)invalidSamples.push({x,y,channel:c,bits:data[y*bpr/2+x*4+c]});}else {max=Math.max(max,v);if(v<0)negative++;if(v>60000)over60000++;}
    }
    if(rgb.every(Number.isFinite)){
      const r=regions[Math.min(2,Math.floor(y/h*3))],l=.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];
      r.count++;r.luminance+=l;r.logLuminance+=Math.log(Math.max(l,1e-12));rgb.forEach((v,i)=>r.rgb[i]+=v);
    }
  }
  const radianceBands=regions.map((r,i)=>({verticalThird:i,meanRGB:r.rgb.map(v=>v/r.count),meanLuminance:r.luminance/r.count,geometricMeanLuminance:Math.exp(r.logLuminance/r.count)}));
  read.unmap();read.destroy();return {status:invalid===0&&negative===0&&max<65504?'PASS':'FAIL',invalid,invalidSamples,negative,max,over60000,pixels:w*h,storageDivisor,radianceBands,scope:'All RGB samples in pre-exposed resolved linear HDR, before bloom and tone mapping. Bands undo storage divisor, retain renderer-relative radiance units; no sky/ocean segmentation.'};
}
