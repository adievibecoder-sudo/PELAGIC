import {readFloatTexture} from './texture-readback.js';

export async function inversionReadback(device,gravity,lens){
  const result={};
  for(const [name,texture] of [['gravityAtlas',gravity],['lensMedium',lens]]){
    const {values,width,height,layers}=await readFloatTexture(device,texture);
    result[name]=Array.from({length:layers},(_,layer)=>{
      const residual=[];let invalid=0;
      for(let i=0;i<width*height;i++){
        const v=values[(layer*width*height+i)*4+1];
        if(Number.isFinite(v))residual.push(v);else invalid++;
      }
      residual.sort((a,b)=>a-b);
      return {layer,invalid,samples:residual.length,mean:residual.reduce((s,x)=>s+x,0)/residual.length,p95:residual[Math.floor(residual.length*.95)],max:residual.at(-1)};
    });
  }
  return {...result,units:'metres',scope:'Actual current production fields. Gravity atlas: first three cascades at 0.5/4 m spacing, five damped steps. Lens: raster-triangle surface, eight capped steps only within 0.75 m of the camera probe. Different bandlimits intentionally prevent treating height differences as solver error. Folded surfaces remain potentially multivalued.'};
}
