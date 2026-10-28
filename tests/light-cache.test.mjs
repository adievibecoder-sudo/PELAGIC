import test from 'node:test';
import assert from 'node:assert/strict';
import {needsCurrentLightCache} from '../src/light-cache.js';
const frame=()=>{const f=new Float32Array(124);f[32]=f[104]=f[123]=1;return f;};
test('ordinary fixed and natural-rate celestial lighting retain amortized cache work',()=>{
  const a=frame(),b=frame();
  assert.equal(needsCurrentLightCache(null,b),false);
  assert.equal(needsCurrentLightCache(a,b),false);
  b[33]=Math.sin(2*Math.PI/86400/24);b[32]=Math.cos(2*Math.PI/86400/24);
  assert.equal(needsCurrentLightCache(a,b),false);
});
test('fast Sun, Moon and twilight adaptation request a current snapshot',()=>{
  for(const offset of [32,104]){
    const a=frame(),b=frame();b[offset]=Math.cos(.003);b[offset+1]=Math.sin(.003);
    assert.equal(needsCurrentLightCache(a,b),true);
  }
  for(const gain of [1.01,1/1.01]){const a=frame(),b=frame();b[123]=gain;assert.equal(needsCurrentLightCache(a,b),true);}
});
