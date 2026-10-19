import {decodeHalf} from '../src/numerics.js';
export async function foamReadback(device,texture) {
 const n=texture.width,layers=texture.depthOrArrayLayers;
 const buffer=device.createBuffer({size:n*n*layers*8,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});
 const encoder=device.createCommandEncoder();encoder.copyTextureToBuffer({texture},{buffer,bytesPerRow:n*8,rowsPerImage:n},[n,n,layers]);device.queue.submit([encoder.finish()]);
 await buffer.mapAsync(GPUMapMode.READ);const data=new Uint16Array(buffer.getMappedRange());const result=[];
 for(let layer=0;layer<layers;layer++){
  let mean=0,max=0,invalid=0;const count=[0,0,0];
  for(let i=0;i<n*n;i++){const offset=(layer*n*n+i)*4,v=decodeHalf(data[offset])+decodeHalf(data[offset+3]);mean+=v;max=Math.max(max,v);if(!Number.isFinite(v)||v<0)invalid++;[.05,.2,.5].forEach((t,k)=>{if(v>t)count[k]++;});}
  result.push({layer,meanDensity:mean/(n*n),maxDensity:max,invalid,densityThresholds:[.05,.2,.5],areaFractions:count.map(v=>v/(n*n))});
 }
 buffer.unmap();buffer.destroy();return {layers:result,interpretation:'Simulation-memory density over uniform parameter-space texels, not observed projected optical whitecap coverage. A single instant cannot validate a wind-coverage fit.'};
}
