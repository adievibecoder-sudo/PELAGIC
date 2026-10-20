import {test} from 'node:test';
import assert from 'node:assert/strict';
import {phase0Shader} from './phase0-shaders.js';
import {CLOUD_VOLUME} from '../src/wgsl/clouds.js';
import * as post from '../src/wgsl/post.js';
import * as sky from '../src/wgsl/sky.js';
import * as ocean from '../src/wgsl/ocean.js';

test('Phase 0 default and unknown switches preserve production shader bytes',()=>{
 for(const s of [CLOUD_VOLUME,...Object.values(post),...Object.values(sky),...Object.values(ocean)].filter(s=>typeof s==='string')){
  assert.equal(phase0Shader(s,new URLSearchParams()),s);
  assert.equal(phase0Shader(s,new URLSearchParams('p0Cloud=unknown')),s);
 }
});
test('Cloud experiment replaces density only, keeps shadow and lighting equations',()=>{
 const light=CLOUD_VOLUME.slice(CLOUD_VOLUME.indexOf('fn cloudDensity('));
 for(const model of ['continuous','cells']){
  const code=phase0Shader(CLOUD_VOLUME,new URLSearchParams({p0Cloud:model}));
  assert.equal(code.slice(code.indexOf('fn cloudDensity(')),light);
  assert.equal(code.match(/fn cloudDensityFiltered\(/g).length,1);
  assert.ok(!code.slice(code.indexOf('fn cloudDensityFiltered(')).includes('thermalShape('));
 }
});
test('Desaturation and cloud-opacity diagnostics reach actual shader operations',()=>{
 const postCode=Object.values(post).filter(s=>typeof s==='string').join('\n');
 // The full-screen sky pass is exported alongside the ocean pass.
 const skyCode=Object.values(ocean).filter(s=>typeof s==='string').join('\n');
 assert.ok(phase0Shader(postCode,new URLSearchParams('p0Desat=off'))!==postCode);
 assert.ok(phase0Shader(skyCode,new URLSearchParams('p0CloudView=opacity'))!==skyCode);
});
