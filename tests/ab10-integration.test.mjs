import test from 'node:test';
import assert from 'node:assert/strict';
import {preset,toURL} from '../src/settings.js';
import {renderOptions,sameRenderOptions} from '../src/render-options.js';
import {OCEAN,SKY_BG} from '../src/wgsl/ocean.js';
import {FOAM_UPDATE} from '../src/wgsl/sim.js';
import {waterMaterialShader} from '../src/wgsl/water-material.js';
import {environmentLightShader} from '../src/wgsl/environment-light.js';
import {breakingEventsShader} from '../src/wgsl/breaking-events.js';
import {foamTransportShader} from '../src/wgsl/foam-transport.js';
import {CLOUD_SCREEN,ENV_CUBE,CLOUD_SHADOW} from '../src/wgsl/sky.js';
import {cloudWorkShader,environmentSymmetryShader} from '../src/wgsl/cloud-work.js';
import {crestSurfaceShader} from '../src/wgsl/crest-surface.js';

test('share and quality reload retain rendering choices without replaying evidence commands',()=>{
  const base='http://localhost:8080/?abWater=layered&abBreaking=population&abFoam=transport&shot=private.png&stage=private&validate=1&benchmark=run';
  const camera={x:0,y:2,z:0,yaw:0,pitch:0};
  const q=new URL(toURL(preset('midday'),camera,30,base)).searchParams;
  assert.deepEqual(renderOptions(q),{abWater:'layered',abBreaking:'population',abFoam:'transport'});
  for(const key of ['shot','stage','validate','benchmark'])assert.equal(q.has(key),false);
  const restored=new URL(toURL(preset('midday'),camera,30,base,undefined,{})).searchParams;
  assert.deepEqual(renderOptions(restored),{});
  assert.equal(sameRenderOptions(q,new URL(base).searchParams),true);
  assert.equal(sameRenderOptions(q,restored),false);
  assert.deepEqual(renderOptions(JSON.parse('{"constructor":"x","__proto__":"x","aa":"invalid","abWater":"layered"}')),{abWater:'layered'});
});

test('material, environment and populations compose without changing the FFT or legacy variants',()=>{
  const q=new URLSearchParams('abWater=layered&abEnvironment=coupled&abBreaking=population&abFoam=transport');
  const material=environmentLightShader(waterMaterialShader(OCEAN,q),q);
  const source=foamTransportShader(breakingEventsShader(material,q),q);
  assert.equal((source.match(/@fragment fn fs\(/g)||[]).length,1);
  assert.match(source,/let activeTau=5.0\*bubbleThickness/);
  assert.match(source,/volumeDet/);
  const history=breakingEventsShader(FOAM_UPDATE,q);
  assert.match(history,/let retired=prev.g\*\(1.0-survival\)/);
  assert.doesNotMatch(history,/f=1.0-\(1.0-f\)\*exp\(-U.p1.z\*increment\)/);
  assert.equal(waterMaterialShader(SKY_BG,q),SKY_BG);
  assert.equal(waterMaterialShader(OCEAN,new URLSearchParams()),OCEAN);
  assert.throws(()=>waterMaterialShader(OCEAN.replace('  var body=subsurfaceReflectance*downwelling/(1.333*1.333);',''),q),/expected 1/);
});

test('integrated cloud lighting composes with shared shadow/cache paths and retained crest footprints',()=>{
  const q=new URLSearchParams('abEnvironment=coupled&abWater=layered&abBreaking=population&abFoam=transport&abCrestSurface=water&abCrestShape=sheet');
  for(const source of [CLOUD_SCREEN,CLOUD_SHADOW,ENV_CUBE]){
    const modified=environmentSymmetryShader(cloudWorkShader(environmentLightShader(source,q),q),q);
    assert.ok(modified.includes('let lowerDeck='));
    assert.equal(environmentLightShader(source,new URLSearchParams()),source);
  }
  const source=crestSurfaceShader(foamTransportShader(breakingEventsShader(waterMaterialShader(OCEAN,q),q),q),q);
  assert.ok(source.includes('foamMask=max(foamMask,attachedMask)'));
});
