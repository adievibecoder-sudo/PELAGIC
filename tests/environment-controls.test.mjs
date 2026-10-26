import test from 'node:test';
import assert from 'node:assert/strict';
import {preset} from '../src/settings.js';
import {createEnvironment,commandEnvironment,advanceEnvironment,environmentControls} from '../src/environment.js';

test('controls retain requested targets while weather and the sea evolve separately',()=>{
  const p=preset('calm'),s=createEnvironment(p);
  commandEnvironment(s,{windSpeed:30,clouds:.92,fetchKm:250,swellHs:3.4});
  advanceEnvironment(s,30,p);
  const c=environmentControls(s,p);
  assert.equal(c.values.windSpeed,30);assert.equal(c.values.clouds,.92);
  assert.equal(c.values.fetchKm,250);assert.equal(c.values.swellHs,3.4);
  assert.ok(c.current.windSpeed>2&&c.current.windSpeed<30);
  assert.notEqual(c.current.seaWindSpeed,c.current.windSpeed);
  assert.equal(c.values.exposure,p.exposure);
});

test('explicit apply reports settled targets while paused, including cloud state',()=>{
  const p={...preset('calm'),paused:true},s=createEnvironment(p);
  commandEnvironment(s,{windSpeed:20,clouds:.92,cloudType:2,rain:.65});
  advanceEnvironment(s,30,p);
  assert.equal(environmentControls(s,p).current.windSpeed,2);
  commandEnvironment(s,{}, {instant:true});
  const c=environmentControls(s,p);
  assert.equal(c.current.windSpeed,20);assert.equal(c.current.clouds,.92);
  assert.equal(c.values.cloudType,2);assert.equal(c.values.rain,.65);
});
