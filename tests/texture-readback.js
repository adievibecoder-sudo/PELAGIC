import {decodeHalf} from '../src/numerics.js';

export async function readFloatTexture(device, texture, level = 0) {
  const full = texture.format === 'rgba32float', bytes = full ? 16 : 8;
  const width = Math.max(1, texture.width >> level), height = Math.max(1, texture.height >> level);
  const layers = texture.depthOrArrayLayers, stride = Math.ceil(width * bytes / 256) * 256;
  const buffer = device.createBuffer({size:stride*height*layers,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});
  const encoder = device.createCommandEncoder();
  encoder.copyTextureToBuffer({texture,mipLevel:level},{buffer,bytesPerRow:stride,rowsPerImage:height},[width,height,layers]);
  device.queue.submit([encoder.finish()]);
  await buffer.mapAsync(GPUMapMode.READ);
  const raw = full ? new Float32Array(buffer.getMappedRange()) : new Uint16Array(buffer.getMappedRange());
  const values = new Float32Array(width*height*layers*4), unit = full ? 4 : 2;
  for(let z=0;z<layers;z++)for(let y=0;y<height;y++)for(let x=0;x<width*4;x++){
    const value=raw[(z*height+y)*stride/unit+x];
    values[(z*height+y)*width*4+x]=full?value:decodeHalf(value);
  }
  buffer.unmap();buffer.destroy();return {values,width,height,layers};
}
