import test from 'node:test';
import assert from 'node:assert/strict';
import {PARTICLE_UPDATE,PARTICLE_RENDER} from '../src/wgsl/particles.js';
import {whitewaterShader} from '../src/wgsl/whitewater.js';
import {crestWhitewaterShader} from '../src/wgsl/crest-whitewater.js';
import {crestSheetShader} from '../src/wgsl/crest-sheet.js';
import {OCEAN} from '../src/wgsl/ocean.js';

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

test('sheet integration retains one transport entry and rejects a changed patch contract',()=>{
  const q=new URLSearchParams('abWhitewater=parcels&maBreaking=gravity&abCrest=phase&abCrestShape=sheet');
  const before=crestWhitewaterShader(whitewaterShader(PARTICLE_UPDATE,q),q);
  const code=crestSheetShader(before,q);
  assert.equal((code.match(/fn frothParcel\(/g)||[]).length,1);
  assert.equal((code.match(/@compute @workgroup_size/g)||[]).length,1);
  assert.doesNotMatch(code,/\blet target\b/);
  assert.throws(()=>crestSheetShader(before.replace('  if(dt<=0.0){particles[k]=p;return;}',''),q),/expected 1/);
});
