import test from 'node:test';
import assert from 'node:assert/strict';
import {half,slopeLevel,downsample} from './slope-precision-reference.js';
import {replaceShader} from '../src/wgsl/shader-patch.js';
import {OCEAN} from '../src/wgsl/ocean.js';
import {CLOUD_SCREEN} from '../src/wgsl/sky.js';
import {cloudPlumesShader} from '../src/wgsl/cloud-plumes.js';
import {finiteGlintsShader} from '../src/wgsl/finite-glints.js';

test('binary16 cancellation is removed without changing slope energy',()=>{
  const slopes=new Float32Array([.30001,.201,0,0,.30003,.20102,0,0,.29999,.20098,0,0,.30002,.20101,0,0]);
  const exact=downsample(slopeLevel(slopes,2,1),2,1);
  const binary16=downsample(slopeLevel(slopes,2,1,half),2,1,half);
  const binary32=downsample(slopeLevel(slopes,2,1,Math.fround),2,1,Math.fround);
  const variance=s=>s[2]-s[0]**2+s[3]-s[1]**2;
  const error=s=>Math.abs(variance(s)-variance(exact));
  assert.ok(error(binary16)>1e-6);
  assert.ok(error(binary32)<1e-8);
  assert.ok(Math.abs(binary32[2]/exact[2]-1)<1e-7);
  assert.equal(half(1+2**-11),1);
  assert.equal(half(1+3*2**-11),1+2**-9);
  assert.equal(half(2**-25),0);
});

test('experimental shader marker changes fail loudly',()=>{
  assert.throws(()=>replaceShader('missing','marker','replacement'),/expected 1/);
  assert.throws(()=>replaceShader('aa','a','b'),/found 2/);
  assert.equal(replaceShader('aa','a','b',2),'bb');
  assert.throws(()=>finiteGlintsShader(OCEAN.replace('    s += dv.xy;','    s = s + dv.xy;'),new URLSearchParams('maGlints=conditional')),/marker missing/);
  assert.throws(()=>cloudPlumesShader(CLOUD_SCREEN.replace('fn cloudDensity(p:','fn renamedDensity(p:'),new URLSearchParams('maCloud=connected')),/marker missing/);
});
