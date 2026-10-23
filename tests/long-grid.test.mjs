import test from 'node:test';
import assert from 'node:assert/strict';
import {wavePatchLengths} from '../src/numerics.js';

test('long-grid probe keeps defaults and cascade boundary below Nyquist',()=>{
  const baseline=[1103,211.3,39.7,7.43,1.393,0.2617];
  for(const query of ['', 'maLongGrid=unknown'])assert.deepEqual(wavePatchLengths(new URLSearchParams(query)),baseline);
  for(const length of [2207,4093]){
    const values=wavePatchLengths(new URLSearchParams({maLongGrid:String(length)}));
    assert.equal(values[0],length);assert.deepEqual(values.slice(1),baseline.slice(1));
    assert.ok(2*Math.PI*6/values[1]<Math.PI*256/values[0]*.98);
  }
});
