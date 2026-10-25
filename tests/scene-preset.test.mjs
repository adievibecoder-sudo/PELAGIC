import test from 'node:test';
import assert from 'node:assert/strict';
import {preset,scenePreset,PRESETS} from '../src/settings.js';
import {createEnvironment,commandEnvironment,WEATHER_KEYS} from '../src/environment.js';

test('every full scene replaces storm/astronomical state and preserves viewing preferences',()=>{
  const current={...preset('moonlit'),frontEnabled:true,electrified:true,cloudType:2,
    quality:'High',resolution:1.17,adaptive:false,paused:true,cameraMode:'free',cameraSpeed:25,fov:74};
  const retained=['quality','resolution','adaptive','paused','cameraMode','cameraSpeed','fov','environmentMode'];
  for(const name of Object.keys(PRESETS)){
    const p=scenePreset(name,current),expected=preset(name),s=createEnvironment(p,37);
    for(const k of Object.keys(p))assert.equal(p[k],retained.includes(k)?current[k]:expected[k],name+': '+k);
    assert.deepEqual(s.weather,s.target);assert.equal(s.sea.swellHs,expected.swellHs);
    assert.equal(s.clocks.wave,37);assert.equal(s.front.enabled,false);
  }
  assert.throws(()=>scenePreset('missing',current));
});

test('explicit weather transition remains gradual even with immediate parameter editing',()=>{
  const p={...preset('golden'),environmentMode:'instant'},s=createEnvironment(p,37);
  const before=structuredClone(s),target=preset('storm');
  commandEnvironment(s,Object.fromEntries(WEATHER_KEYS.map(k=>[k,target[k]])),{weatherOnly:true});
  assert.deepEqual(s.weather,before.weather);assert.deepEqual(s.sea,before.sea);
  assert.deepEqual(s.swellTarget,before.swellTarget);assert.deepEqual(s.clocks,before.clocks);
  assert.equal(s.target.rain,.65);assert.equal(s.target.cloudType,2);assert.equal(p.sunElev,5);
});
