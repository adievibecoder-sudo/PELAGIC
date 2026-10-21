const half=h=>{const s=(h&32768)?-1:1,e=(h>>10)&31,m=h&1023;return e===31?(m?NaN:s*Infinity):s*(e?2**(e-15)*(1+m/1024):2**-14*m/1024);};
export async function phase1LightReadback(device,shadow,irradiance,environment){
  async function read(texture,mip=0){
    const w=Math.max(1,texture.width>>mip),h=Math.max(1,texture.height>>mip),layers=texture.depthOrArrayLayers,bpr=Math.ceil(w*8/256)*256;
    const buf=device.createBuffer({size:bpr*h*layers,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});
    const enc=device.createCommandEncoder();enc.copyTextureToBuffer({texture,mipLevel:mip},{buffer:buf,bytesPerRow:bpr,rowsPerImage:h},[w,h,layers]);device.queue.submit([enc.finish()]);
    await buf.mapAsync(GPUMapMode.READ);const src=new Uint16Array(buf.getMappedRange()),means=[],centres=[];let invalid=0;
    for(let l=0;l<layers;l++){const sum=[0,0,0,0];for(let y=0;y<h;y++)for(let x=0;x<w;x++)for(let c=0;c<4;c++){
      const v=half(src[(l*h+y)*bpr/2+x*4+c]);if(!Number.isFinite(v))invalid++;sum[c]+=v;
    }means.push(sum.map(v=>v/(w*h)));centres.push(Array.from({length:4},(_,c)=>half(src[(l*h+Math.floor(h/2))*bpr/2+Math.floor(w/2)*4+c])));}
    buf.unmap();buf.destroy();return {width:w,height:h,means,centres,invalid};
  }
  return {shadow:await read(shadow),irradiance:await read(irradiance),angular:await read(environment,2),
    convention:'shadow RG direct Sun/Moon transmittance; B supported precipitation; A regional event. Cubes +X -X +Y -Y +Z -Z. Relative linear RGB.'};
}
