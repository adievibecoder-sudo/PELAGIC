import test from 'node:test';
import assert from 'node:assert/strict';
import {CLOUD_VOLUME} from '../src/wgsl/clouds.js';
import {OCEAN} from '../src/wgsl/ocean.js';
import {cloudCondensateShader} from '../src/wgsl/cloud-condensate.js';

test('condensate trial preserves default, ocean and complete cloud transport',()=>{
  const query=new URLSearchParams('maCloud=condensate');
  assert.equal(cloudCondensateShader(CLOUD_VOLUME,new URLSearchParams()),CLOUD_VOLUME);
  assert.equal(cloudCondensateShader(OCEAN,query),OCEAN);
  const next=cloudCondensateShader(CLOUD_VOLUME,query);
  assert.equal(next.slice(next.indexOf('fn iceDensity(')),CLOUD_VOLUME.slice(CLOUD_VOLUME.indexOf('fn iceDensity(')));
  assert.equal((next.match(/fn cloudDensityFiltered\(/g)||[]).length,1);
  const preserved=CLOUD_VOLUME.slice(CLOUD_VOLUME.indexOf('fn cloudDensityFiltered('),CLOUD_VOLUME.indexOf('fn cloudDensity(p:'));
  assert.ok(next.includes(preserved.replace('fn cloudDensityFiltered(','fn cloudDensityPreserved(')));
});
