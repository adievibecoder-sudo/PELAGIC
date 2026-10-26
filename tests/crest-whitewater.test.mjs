import test from 'node:test';
import assert from 'node:assert/strict';
import {PARTICLE_UPDATE,PARTICLE_RENDER,particleMotionShader} from '../src/wgsl/particles.js';
import {whitewaterShader} from '../src/wgsl/whitewater.js';
import {crestWhitewaterShader} from '../src/wgsl/crest-whitewater.js';
import {OCEAN} from '../src/wgsl/ocean.js';

test('phase crests preserve default and AB6; reject missing upstream contract',()=>{
  const old=new URLSearchParams('abWhitewater=parcels&maBreaking=gravity');
  for(const code of [PARTICLE_UPDATE,PARTICLE_RENDER,OCEAN]){
    assert.equal(crestWhitewaterShader(code,new URLSearchParams()),code);
    const base=whitewaterShader(code,old);assert.equal(crestWhitewaterShader(base,old),base);
  }
  assert.throws(()=>crestWhitewaterShader(PARTICLE_UPDATE,new URLSearchParams('abCrest=phase')),/requires gravity/);
});

test('crest patch composes with velocity rain and keeps unrelated ocean source',()=>{
  const q=new URLSearchParams('abWhitewater=parcels&maBreaking=gravity&abCrest=phase&abCrestShape=elongated&abRain=velocity');
  const update=crestWhitewaterShader(whitewaterShader(PARTICLE_UPDATE,q),q);
  const render=crestWhitewaterShader(whitewaterShader(particleMotionShader(PARTICLE_RENDER,q),q),q);
  assert.equal((update.match(/fn frothParcel/g)||[]).length,1);
  assert.equal((render.match(/@vertex fn vs/g)||[]).length,1);
  assert.ok(render.includes('let projected=vec2f('));
  assert.ok(render.includes('worldToLocal*ray'));
  assert.equal(crestWhitewaterShader(OCEAN,q),OCEAN);
  assert.throws(()=>crestWhitewaterShader(whitewaterShader(PARTICLE_RENDER,q).replace('let drawRadius=max(radius,pixelRadius);',''),q),/expected 1/);
});
