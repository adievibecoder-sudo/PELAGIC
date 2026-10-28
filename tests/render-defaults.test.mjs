import test from 'node:test';
import assert from 'node:assert/strict';
import {withRenderDefaults,renderOptions} from '../src/render-options.js';
import {preset,toURL} from '../src/settings.js';
import {OCEAN} from '../src/wgsl/ocean.js';
import {FOAM_UPDATE} from '../src/wgsl/sim.js';
import {breakingEventsShader} from '../src/wgsl/breaking-events.js';
import {breakingPhaseShader} from '../src/wgsl/breaking-phase.js';
import {foamTransportShader} from '../src/wgsl/foam-transport.js';
import {lightStorageShader} from '../src/wgsl/light-storage.js';

test('normal development resolves to the reviewed pair without overriding historical comparisons',()=>{
  const normal=withRenderDefaults('preset=storm&seed=1307');
  assert.deepEqual(renderOptions(normal),{abBreaking:'phase-resident',abFoam:'relief',abRadiance:'scaled',abLightCache:'responsive'});
  assert.equal(normal.get('seed'),'1307');
  for(const choice of ['abDefaults=legacy','maBreaking=gravity','abBreaking=phase-field',
    'abFoam=volume','abWhitewater=parcels','abCrestLife=supported','abFoamPattern=bubbles']){
    const requested=new URLSearchParams(choice);
    assert.equal(withRenderDefaults(requested).toString(),requested.toString());
    assert.equal(requested.toString(),choice);
  }
  assert.deepEqual(renderOptions(withRenderDefaults('abBreaking=phase-resident&abFoam=relief')),
    {abBreaking:'phase-resident',abFoam:'relief'});
  assert.equal(withRenderDefaults('aa=taa').get('abRadiance'),'scaled');
  assert.equal(withRenderDefaults('abRadiance=legacy').get('abRadiance'),'legacy');
});

test('shared effective defaults and the legacy comparison survive reloads',()=>{
  for(const requested of ['', 'abDefaults=legacy','abBreaking=phase-field']){
    const effective=renderOptions(withRenderDefaults(requested));
    const url=toURL(preset('storm'),{x:0,y:8,z:0,yaw:0,pitch:0},30,
      'http://localhost:8080/?shot=private.png&stage=private',undefined,effective);
    const query=new URL(url).searchParams;
    assert.deepEqual(renderOptions(withRenderDefaults(query)),effective);
    assert.equal(query.has('shot'),false);assert.equal(query.has('stage'),false);
  }
});

test('default selection generates the exact reviewed shader paths',()=>{
  const normal=withRenderDefaults(''),reviewed=new URLSearchParams('abBreaking=phase-resident&abFoam=relief&abRadiance=scaled&abLightCache=responsive');
  const foam=q=>breakingPhaseShader(breakingEventsShader(FOAM_UPDATE,q),q);
  const ocean=q=>lightStorageShader(foamTransportShader(breakingEventsShader(OCEAN,q),q),q);
  assert.equal(foam(normal),foam(reviewed));assert.equal(ocean(normal),ocean(reviewed));
  const legacy=withRenderDefaults('abDefaults=legacy');
  assert.equal(foam(legacy),FOAM_UPDATE);assert.equal(ocean(legacy),OCEAN);
});
