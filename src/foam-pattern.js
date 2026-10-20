// Rank-transform the authored foam topology so thresholds specify occupied area.
// Binary8 ties limit exact coverage; their measured error is retained in evidence.
export function equalizeFoamPattern(rgba){
 const count=rgba.length/4,hist=new Uint32Array(256),cdf=new Uint8Array(256);
 for(let i=0;i<rgba.length;i+=4)hist[rgba[i]]++;
 let prefix=0;
 for(let i=0;i<256;i++){cdf[i]=Math.round((prefix+.5*hist[i])/count*255);prefix+=hist[i];}
 for(let i=0;i<rgba.length;i+=4)rgba[i]=cdf[rgba[i]];
 const checks=[.01,.05,.1,.25,.5,.75,.9].map(area=>{
  let occupied=0;for(let i=0;i<rgba.length;i+=4)if(rgba[i]/255>1-area)occupied++;
  return {requestedArea:area,actualArea:occupied/count};
 });
 return {texels:count,checks,maxAbsoluteAreaError:Math.max(...checks.map(c=>Math.abs(c.actualArea-c.requestedArea))),
  scope:'Texture-texel threshold coverage only. Bilinear sampling, shading footprint and evolving foam density require separate validation.'};
}
