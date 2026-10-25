import test from 'node:test';
import assert from 'node:assert/strict';
import {PARTICLE_UPDATE,PARTICLE_RENDER,PARTICLE_COUNT,particleMotionShader} from '../src/wgsl/particles.js';
import {whitewaterShader,WHITEWATER_COUNT} from '../src/wgsl/whitewater.js';
import {OCEAN} from '../src/wgsl/ocean.js';

test('whitewater preserves disabled shaders and requires the gravity event contract',()=>{
  for(const source of [PARTICLE_UPDATE,PARTICLE_RENDER,OCEAN])assert.equal(whitewaterShader(source,new URLSearchParams()),source);
  assert.throws(()=>whitewaterShader(PARTICLE_UPDATE,new URLSearchParams('abWhitewater=parcels')),/require maBreaking=gravity/);
});

test('whitewater extends particle capacity without replacing existing spray or rain',()=>{
  const q=new URLSearchParams('abWhitewater=parcels&maBreaking=gravity&abRain=velocity');
  const update=whitewaterShader(PARTICLE_UPDATE,q);
  const render=whitewaterShader(particleMotionShader(PARTICLE_RENDER,q),q);
  assert.equal((PARTICLE_COUNT+WHITEWATER_COUNT)%64,0);
  assert.ok(update.includes(`if(k>=${PARTICLE_COUNT+WHITEWATER_COUNT}u)`));
  assert.ok(update.includes(`if(k>=${PARTICLE_COUNT}u){frothParcel(k);return;}`));
  assert.ok(render.includes(`id<${PARTICLE_COUNT}u&&id%4u==0u`));
  assert.ok(render.includes(`id<${PARTICLE_COUNT}u&&id%4u==1u`));
  assert.equal(whitewaterShader(OCEAN,q),OCEAN);
  assert.throws(()=>whitewaterShader(PARTICLE_RENDER.replace(' return o;\n}',' return o; }'),q),/expected 1/);
});
