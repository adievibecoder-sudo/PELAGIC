import test from 'node:test';
import assert from 'node:assert/strict';
import {hdrStorageDivisor,lightStorageShader} from '../src/wgsl/light-storage.js';
import {twilightExposure} from '../src/celestial-light.js';
import {ENV_CUBE,CLOUD_SCREEN} from '../src/wgsl/sky.js';
import {OCEAN,SKY_BG} from '../src/wgsl/ocean.js';
import {ENV_IRRADIANCE} from '../src/wgsl/irradiance.js';
import {environmentSymmetryShader} from '../src/wgsl/cloud-work.js';

const enabled=new URLSearchParams('abRadiance=scaled');
test('radiance storage preserves the physical/display product across twilight',()=>{
  for(let elevation=-30;elevation<=90;elevation+=.1){
    const exposure=twilightExposure(elevation),divisor=hdrStorageDivisor(elevation,exposure,true);
    assert.ok(divisor>0&&divisor<=32);
    for(const light of [1e-9,1e-6,.03,4,50000]){
      const displayed=light/divisor*(divisor*exposure);
      assert.ok(Math.abs(displayed/(light*exposure)-1)<1e-12);
    }
    if(elevation>=-3)assert.equal(divisor,hdrStorageDivisor(elevation,exposure));
  }
});
test('cache encoding covers mirrored and full paths without scaling opacity',()=>{
  for(const source of [ENV_CUBE,environmentSymmetryShader(ENV_CUBE,new URLSearchParams())]){
    const code=lightStorageShader(source,enabled);
    assert.match(code,/L\*256\.0/);
    assert.equal(lightStorageShader(source,new URLSearchParams()),source);
  }
  assert.match(lightStorageShader(CLOUD_SCREEN,enabled),/vec4f\(cl.rgb\*256.0,cl.a\)/);
  assert.match(lightStorageShader(SKY_BG,enabled),/vec4f\(storedCloud.rgb\/256.0,storedCloud.a\)/);
  assert.equal(lightStorageShader(ENV_IRRADIANCE,enabled),ENV_IRRADIANCE);
});
test('all ocean cache consumers decode nested texture expressions once',()=>{
  const code=lightStorageShader(OCEAN,enabled);
  const count=(OCEAN.match(/textureSampleLevel\((?:envCube|skyIrradiance),/g)||[]).length;
  assert.equal((code.match(/\.rgb\/256\.0\)/g)||[]).length,count);
  assert.match(code,/normalize\(through\+vec3f\(0,0.000001,0\)\),refractionLod\)\.rgb\/256.0/);
});
