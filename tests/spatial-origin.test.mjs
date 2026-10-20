import test from 'node:test';
import assert from 'node:assert/strict';
import {localOrigin,cascadeOrigin,foamPatternOrigin,modulo} from '../src/spatial-origin.js';
import {PATCHES} from '../src/numerics.js';

test('camera-local cascade phase remains accurate at distant global coordinates',()=>{
  let worst=0;
  for(const distance of [0,511.99,512.01,-512.01,100000.123,1e6+.123,1e9+.123]) {
    const world=[distance,-distance*.73],origin=localOrigin(...world),offset=cascadeOrigin(origin);
    for(let c=0;c<6;c++)for(let axis=0;axis<2;axis++) {
      const length=Math.fround(PATCHES[c]);
      const uv=Math.fround(Math.fround(Math.fround(world[axis]-origin[axis])*Math.fround(1/length))+offset[c*2+axis]);
      const expected=modulo(world[axis],length)/length;
      const error=Math.abs(modulo(uv-expected+.5,1)-.5)*length;
      worst=Math.max(worst,error);
    }
  }
  // Two f32 operations over a <=512 m coordinate, plus f64 modulo roundoff.
  assert.ok(worst<.00012,`Maximum phase-equivalent position error ${worst} m`);
});

test('rebasing preserves both foam toroidal phases and all four pattern coordinates',()=>{
  for(const x of [512,-512,100000]) {
    const before=localOrigin(x-.01,0),after=localOrigin(x+.01,0);
    const point=[x+3.1,7.6],wind=[Math.cos(.73),Math.sin(.73)],drift=[.3,.2],time=86400;
    for(const span of [128,1024])assert.equal(modulo(after[0]-before[0],span),0);
    const coordinate=origin=>{
      const offsets=foamPatternOrigin(origin,wind,time,drift),qx=point[0]-origin[0],qz=point[1]-origin[1];
      const along=qx*wind[0]+qz*wind[1],across=-qx*wind[1]+qz*wind[0];
      return [qx*.29,qz*.29,along*.07,across*.19,along*.035,across*.11,qx*1.9,qz*1.9].map((v,i)=>modulo(v+offsets[i],1));
    };
    const a=coordinate(before),b=coordinate(after);
    for(let i=0;i<8;i++)assert.ok(Math.abs(modulo(a[i]-b[i]+.5,1)-.5)<1e-7);
  }
});
