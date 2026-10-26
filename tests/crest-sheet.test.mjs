import test from 'node:test';
import assert from 'node:assert/strict';
import {PARTICLE_UPDATE,PARTICLE_RENDER} from '../src/wgsl/particles.js';
import {whitewaterShader} from '../src/wgsl/whitewater.js';
import {crestWhitewaterShader} from '../src/wgsl/crest-whitewater.js';
import {crestSheetShader} from '../src/wgsl/crest-sheet.js';
import {OCEAN} from '../src/wgsl/ocean.js';
import {crestSurfaceShader} from '../src/wgsl/crest-surface.js';
import {breakingEventsShader} from '../src/wgsl/breaking-events.js';
import {foamTransportShader} from '../src/wgsl/foam-transport.js';
import {FOAM_UPDATE} from '../src/wgsl/sim.js';

test('sheet option preserves default and AB7 generated source',()=>{
  for(const options of ['', 'abWhitewater=parcels&maBreaking=gravity&abCrest=phase&abCrestShape=elongated']){
    const q=new URLSearchParams(options);
    for(const source of [PARTICLE_UPDATE,PARTICLE_RENDER,OCEAN]){
      const before=crestWhitewaterShader(whitewaterShader(source,q),q);
      assert.equal(crestSheetShader(before,q),before);
    }
  }
  assert.throws(()=>crestSheetShader(PARTICLE_UPDATE,new URLSearchParams('abCrestShape=sheet')),/require phase/);
});

test('surface fronts compose with handoff optics and preserve legacy source',()=>{
  assert.equal(crestSurfaceShader(OCEAN,new URLSearchParams()),OCEAN);
  const q=new URLSearchParams('maBreaking=gravity&abBreaking=handoff&abFoam=transport&abWhitewater=parcels&abCrest=phase&abCrestShape=sheet&abCrestEvent=shared&abCrestSurface=water&abCrestEdge=fade&abCrestLife=supported');
  const particles=crestSheetShader(crestWhitewaterShader(whitewaterShader(PARTICLE_UPDATE,q),q),q);
  const ocean=crestSurfaceShader(foamTransportShader(breakingEventsShader(OCEAN,q),q),q);
  const history=breakingEventsShader(FOAM_UPDATE,q);
  assert.equal((particles.match(/@compute @workgroup_size/g)||[]).length,1);
  assert.match(particles,/section\[j\]/);
  assert.match(ocean,/@binding\(17\)/);
  assert.ok(ocean.indexOf('foamMask=max(foamMask,attachedMask)')<ocean.indexOf('if (F.post.w > 0.5)'));
  assert.match(ocean,/select\(0.0,crestActivity\(displacedXZ\),F.foamP.z>0.0\)/);
  assert.match(history,/retired=prev.g\*\(1.0-survival\)/);
  assert.doesNotMatch(history,/f=1.0-\(1.0-f\)\*exp\(-U.p1.z\*increment\)/);
  assert.throws(()=>crestSurfaceShader(OCEAN.replace('fn foamCoverage(','fn changedCoverage('),q),/expected 1/);
});

test('sheet integration retains one transport entry and rejects a changed patch contract',()=>{
  const q=new URLSearchParams('abWhitewater=parcels&maBreaking=gravity&abCrest=phase&abCrestShape=sheet');
  const before=crestWhitewaterShader(whitewaterShader(PARTICLE_UPDATE,q),q);
  const code=crestSheetShader(before,q);
  assert.equal((code.match(/fn frothParcel\(/g)||[]).length,1);
  assert.equal((code.match(/@compute @workgroup_size/g)||[]).length,1);
  assert.doesNotMatch(code,/\blet target\b/);
  assert.throws(()=>crestSheetShader(before.replace('  if(dt<=0.0){particles[k]=p;return;}',''),q),/expected 1/);
});
