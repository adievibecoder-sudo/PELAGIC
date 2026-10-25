import test from 'node:test';
import assert from 'node:assert/strict';
import {CLOUD_SCREEN,ENV_CUBE} from '../src/wgsl/sky.js';
import {cloudWorkShader,environmentSymmetryShader} from '../src/wgsl/cloud-work.js';

test('cloud optimization retains explicit old path and skips incompatible density experiments',()=>{
  assert.equal(cloudWorkShader(CLOUD_SCREEN,new URLSearchParams('abCloudWork=off')),CLOUD_SCREEN);
  for(const flags of ['maCloud=connected','p0Cloud=cells'])assert.equal(cloudWorkShader(CLOUD_SCREEN,new URLSearchParams(flags)),CLOUD_SCREEN);
  assert.equal(environmentSymmetryShader(ENV_CUBE,new URLSearchParams('abEnvWork=off')),ENV_CUBE);
  const optimized=cloudWorkShader(CLOUD_SCREEN,new URLSearchParams());
  assert.ok(optimized.includes('for(var sub=0u;sub<4u;sub++)'));
  assert.ok(optimized.includes('let samples=u32(F.control.x*1.5);'));
  assert.throws(()=>cloudWorkShader(CLOUD_SCREEN.replace('  var field=-1.0;','  var field=-2.0;'),new URLSearchParams()),/expected 1/);
});

test('mirrored cube writes cover each texel once with the same reflected sky direction',()=>{
  const n=16,written=new Set();
  const direction=(f,x,y)=>{const u=(x+.5)/n*2-1,v=(y+.5)/n*2-1;return [[1,-v,-u],[-1,-v,u],[u,1,v],[u,-1,-v],[u,-v,1],[-u,-v,-1]][f];};
  for(let f=0;f<6;f++)for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    if(f===3||(f!==2&&y>=n/2))continue;
    const lower=f===2?3:f,d=direction(f,x,y),r=direction(lower,x,n-1-y);
    assert.deepEqual(r,[d[0],-d[1],d[2]]);
    for(const key of [f+':'+x+':'+y,lower+':'+x+':'+(n-1-y)]){assert.ok(!written.has(key));written.add(key);}
  }
  assert.equal(written.size,6*n*n);
});
