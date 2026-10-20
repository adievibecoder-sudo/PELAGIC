import {PATCHES} from './numerics.js';

export const ORIGIN_BLOCK=1024;
export const FRAME_FLOATS=148;
export const FRAME_BYTES=FRAME_FLOATS*4;
export const FOAM_BYTES=192;
export const modulo=(x,period)=>((x%period)+period)%period;

export function localOrigin(x,z) {
  return [Math.round(x/ORIGIN_BLOCK)*ORIGIN_BLOCK,Math.round(z/ORIGIN_BLOCK)*ORIGIN_BLOCK];
}

export function cascadeOrigin(origin,out=new Float32Array(12),offset=0) {
  for(let c=0;c<6;c++) {
    // Match the period actually uploaded to the GPU, retaining the modulo in f64.
    const length=Math.fround(PATCHES[c]);
    out[offset+c*2]=modulo(origin[0],length)/length;
    out[offset+c*2+1]=modulo(origin[1],length)/length;
  }
  return out;
}

export function foamPatternOrigin(origin,wind,time,drift,out=new Float32Array(8),offset=0) {
  const x=origin[0]-drift[0]*time,z=origin[1]-drift[1]*time;
  const along=x*wind[0]+z*wind[1],across=-x*wind[1]+z*wind[0];
  const values=[x*.29,z*.29,along*.07,across*.19,
    (origin[0]*wind[0]+origin[1]*wind[1])*.035,(-origin[0]*wind[1]+origin[1]*wind[0])*.11,x*1.9,z*1.9];
  for(let i=0;i<8;i++)out[offset+i]=modulo(values[i],1);
  return out;
}
