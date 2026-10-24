import {readFloatTexture} from './texture-readback.js';
import {half,slopeLevel,downsample,compareLevel} from './slope-precision-reference.js';

export async function slopePrecisionReadback(device,deriv,mom) {
  if(deriv.format!=='rgba32float'||mom.format!=='rgba32float')throw Error('Precision reference requires float32 means and moments');
  let reference,legacy;
  const rows=[];
  for(let level=0;level<5;level++){
    const [d,m]=await Promise.all([readFloatTexture(device,deriv,level),readFloatTexture(device,mom,level)]);
    if(level===0){reference=slopeLevel(d.values,d.width,d.layers);legacy=slopeLevel(d.values,d.width,d.layers,half);}
    else {reference=downsample(reference,d.width*2,d.layers);legacy=downsample(legacy,d.width*2,d.layers,half);}
    const measured=new Float64Array(d.width*d.height*d.layers*5);
    for(let i=0;i<measured.length/5;i++)measured.set([d.values[i*4],d.values[i*4+1],m.values[i*4],m.values[i*4+1],m.values[i*4+2]],i*5);
    rows.push(...compareLevel(reference,legacy,measured,d.width,d.layers).map(r=>({level,...r})));
  }
  return {rows,status:rows.every(r=>r.floatRelativeL1<.0001)?'PASS':'FAIL',
    scope:'Actual float32 FFT means and GPU mips against float64 moment filtering. Legacy half storage reconstructed with round-to-nearest-even after every mip. Three bilinear offsets per texel. Parameter-space trace variance; excludes deformed BRDF, hardware anisotropic filter and temporal radiance.'};
}
