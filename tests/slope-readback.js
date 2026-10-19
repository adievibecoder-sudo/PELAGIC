import {decodeHalf} from '../src/numerics.js';

// Read production mips, not a second implementation of the GPU box filter.
export async function slopeMipReadback(device,deriv,mom,n=256,cascades=6) {
  const buffers=[],encoder=device.createCommandEncoder();
  for(let level=0;level<=Math.log2(n);level++){
    const size=n>>level,stride=Math.ceil(size*8/256)*256;
    for(const texture of [deriv,mom]){
      const buffer=device.createBuffer({size:stride*size*cascades,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});
      encoder.copyTextureToBuffer({texture,mipLevel:level},{buffer,bytesPerRow:stride,rowsPerImage:size},[size,size,cascades]);
      buffers.push({buffer,size,stride,level});
    }
  }
  device.queue.submit([encoder.finish()]);
  await Promise.all(buffers.map(({buffer})=>buffer.mapAsync(GPUMapMode.READ)));
  const rows=[];
  for(let level=0;level<=Math.log2(n);level++){
    const d=buffers[level*2],m=buffers[level*2+1];
    const dv=new Uint16Array(d.buffer.getMappedRange()),mv=new Uint16Array(m.buffer.getMappedRange());
    for(let c=0;c<cascades;c++){
      let resolved=0,unresolved=0,moment=0,invalid=0,negativeRaw=0;
      for(let y=0;y<d.size;y++)for(let x=0;x<d.size;x++){
        const i=(c*d.size+y)*d.stride/2+x*4;
        const sx=decodeHalf(dv[i]),sz=decodeHalf(dv[i+1]);
        const energy=decodeHalf(mv[i])+decodeHalf(mv[i+1]);
        if(!Number.isFinite(sx+sz+energy)){invalid++;continue;}
        const r=sx*sx+sz*sz;resolved+=r;moment+=energy;unresolved+=Math.max(energy-r,0);
        if(energy-r< -Math.max(2e-7,energy*.002))negativeRaw++;
      }
      const count=d.size*d.size;
      const total=moment/count,base=level===0?total:rows[c].secondMoment;
      const loss=Math.abs(total-base)/Math.max(base,1e-12);
      rows.push({cascade:c,level,texelCount:count,resolvedMeanSquare:resolved/count,
        unresolvedVariance:unresolved/count,secondMoment:total,mipRelativeEnergyLoss:loss,invalid,negativeRaw,
        status:invalid===0&&loss<.006&&negativeRaw===0?'PASS':'FAIL'});
    }
  }
  buffers.forEach(({buffer})=>{buffer.unmap();buffer.destroy();});
  return {status:rows.every(r=>r.status==='PASS')?'PASS':'FAIL',rows,
    tolerance:'0.6% cumulative energy drift across eight binary16 mip stores; negative raw variance tolerance 0.2% or 2e-7 for independently rounded binary16 moments. No nonfinite samples.',
    scope:'Unmodulated parameter-space slope moments. This does not validate the final deformed, gust-modulated BRDF or observational Cox-Munk statistics.'};
}
