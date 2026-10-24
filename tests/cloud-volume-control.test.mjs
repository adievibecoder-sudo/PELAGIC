import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {CLOUD_VOLUME} from '../src/wgsl/clouds.js';
import {OCEAN} from '../src/wgsl/ocean.js';
import {cloudVolumeControlShader} from '../src/wgsl/cloud-volume-control.js';
import {decodeHalf} from '../src/numerics.js';

test('authored control preserves default, ocean, and light transport',()=>{
  const q=new URLSearchParams('maCloud=volume');
  assert.equal(cloudVolumeControlShader(CLOUD_VOLUME,new URLSearchParams()),CLOUD_VOLUME);
  assert.equal(cloudVolumeControlShader(OCEAN,q),OCEAN);
  const code=cloudVolumeControlShader(CLOUD_VOLUME,q);
  assert.equal(code.slice(code.indexOf('fn iceDensity(')),CLOUD_VOLUME.slice(CLOUD_VOLUME.indexOf('fn iceDensity(')));
  assert.equal((code.match(/fn cloudDensityFiltered\(/g)||[]).length,1);
});

test('licensed volume bytes, mip dimensions, and density mass remain valid',()=>{
  const base=new URL('../assets/experiments/wdas-cloud/',import.meta.url);
  const metadata=JSON.parse(fs.readFileSync(new URL('metadata.json',base)));
  const bytes=fs.readFileSync(new URL('density.r16f',base));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),metadata.sha256);
  let offset=0;
  for(const [index,level] of metadata.levels.entries()){
    assert.equal(level.offset,offset);
    assert.deepEqual(level.size,metadata.levels[0].size.map(n=>Math.max(1,n>>index)));
    assert.equal(level.bytes,level.size.reduce((a,b)=>a*b)*2);
    let sum=0;
    for(let i=0;i<level.bytes;i+=2){const value=decodeHalf(bytes.readUInt16LE(offset+i));assert.ok(Number.isFinite(value)&&value>=0&&value<=1);sum+=value;}
    assert.ok(Math.abs(sum/(level.bytes/2)-metadata.levels[0].mean)<1e-5);
    offset+=level.bytes;
  }
  assert.equal(offset,bytes.length);
});
