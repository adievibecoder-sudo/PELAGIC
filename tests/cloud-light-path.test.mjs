import test from 'node:test';
import assert from 'node:assert/strict';
import {CLOUD_VOLUME} from '../src/wgsl/clouds.js';
import {cloudLightPathShader} from '../src/wgsl/cloud-light-path.js';

test('finite cloud-light quadrature preserves default and density source',()=>{
  assert.equal(cloudLightPathShader(CLOUD_VOLUME,new URLSearchParams()),CLOUD_VOLUME);
  const candidate=cloudLightPathShader(CLOUD_VOLUME,new URLSearchParams('maLightPath=finite'));
  const densityEnd=CLOUD_VOLUME.indexOf('fn iceDensity(');
  assert.equal(candidate.slice(0,densityEnd),CLOUD_VOLUME.slice(0,densityEnd));
  assert.ok(candidate.includes('let samples=u32(F.control.x*1.5);'));
  assert.ok(candidate.includes('cloudLightIntegral(p,F.sunDir.xyz,u32(F.control.y))'));
  assert.ok(candidate.includes('cloudLightIntegral(p,F.moonDir.xyz,u32(F.control.y))'));
  assert.ok(!candidate.includes('lightStep*=2.1'));
});

test('dense light reference changes only self-shadow quadrature',()=>{
  for(const count of [128,256,512]){
    const candidate=cloudLightPathShader(CLOUD_VOLUME,new URLSearchParams('maLightPath=reference'+count));
    assert.ok(candidate.includes(`cloudLightReference(p,F.sunDir.xyz,${count}u)`));
    assert.ok(candidate.includes(`cloudLightReference(p,F.moonDir.xyz,${count}u)`));
    const transport=CLOUD_VOLUME.slice(CLOUD_VOLUME.indexOf('      let sigma='),CLOUD_VOLUME.indexOf('          var moonOptical='));
    assert.ok(candidate.includes(transport));
    const density=CLOUD_VOLUME.slice(0,CLOUD_VOLUME.indexOf('fn iceDensity('));
    assert.ok(candidate.startsWith(density));
  }
  assert.equal(cloudLightPathShader(CLOUD_VOLUME,new URLSearchParams('maLightPath=reference1024')),CLOUD_VOLUME);
});
