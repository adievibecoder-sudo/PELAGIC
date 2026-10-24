import test from 'node:test';
import assert from 'node:assert/strict';
import {integrate} from '../src/numerics.js';
import {OCEAN,SKY_BG} from '../src/wgsl/ocean.js';
import {waterTransportShader} from '../src/wgsl/water-transport.js';
import {finiteGlintsShader} from '../src/wgsl/finite-glints.js';

test('particle phase is normalized and matches the declared backscatter coefficient',()=>{
  const g=.70223624,phase=c=>(1-g*g)/(4*Math.PI*(1+g*g-2*g*c)**1.5);
  assert.ok(Math.abs(integrate(phase,-1,1)*2*Math.PI-1)<1e-7);
  assert.ok(Math.abs(integrate(phase,-1,0)*2*Math.PI-1/12)<1e-8);
});
test('semi-infinite direct scattering agrees with independent depth integration',()=>{
  for(const muSun of [.2,.7,1])for(const muView of [.66,.9,1])for(const extinction of [.03,.4]){
    const scale=extinction*(1/muSun+1/muView);
    const integrated=integrate(z=>Math.exp(-scale*z)/(muSun*muView),0,30/scale,4096);
    assert.ok(Math.abs(integrated*extinction*(muSun+muView)-1)<1e-8);
  }
});
test('appearance candidates remain reversible and do not alter sky transport',()=>{
  assert.equal(waterTransportShader(OCEAN,new URLSearchParams()),OCEAN);
  assert.equal(finiteGlintsShader(OCEAN,new URLSearchParams()),OCEAN);
  assert.equal(waterTransportShader(SKY_BG,new URLSearchParams('maWater=single-scatter')),SKY_BG);
  assert.equal(finiteGlintsShader(SKY_BG,new URLSearchParams('maGlints=finite')),SKY_BG);
});
