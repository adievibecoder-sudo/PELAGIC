import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULTS,preset,toURL} from '../src/settings.js';
import {createEnvironment,commandEnvironment,advanceEnvironment,sampleEnvironment,environmentSnapshot,restoreEnvironment,environmentUniforms,frontWeight} from '../src/environment.js';
import {FRAME_FLOATS,localOrigin} from '../src/spatial-origin.js';
const near=(a,b,eps=1e-9)=>assert.ok(Math.abs(a-b)<eps,`${a} != ${b}`);

test('weather replay independent of render partition; swell history retained',()=>{
 const p={...DEFAULTS,weatherRate:60,seaRate:1},a=createEnvironment(p),b=createEnvironment(p);
 commandEnvironment(a,preset('storm'),{weatherOnly:true});commandEnvironment(b,preset('storm'),{weatherOnly:true});
 for(let i=0;i<600;i++)advanceEnvironment(a,1/60,p);
 for(let i=0;i<100;i++)advanceEnvironment(b,.1,p);
 assert.deepEqual(a.weather,b.weather);assert.deepEqual(a.sea,b.sea);assert.deepEqual(a.drift,b.drift);
 near(a.sea.swellHs,DEFAULTS.swellHs);assert.ok(a.sea.windSpeed<a.weather.windSpeed);
 near(a.clocks.wave,b.clocks.wave);near(a.clocks.astronomy,0);near(a.clocks.weather,600);
});
test('snapshot preserves targets, clocks, fractional weather tick and drift',()=>{
 const p={...DEFAULTS,astronomyRate:60},a=createEnvironment(p,20);
 commandEnvironment(a,{windSpeed:20,cloudType:2});advanceEnvironment(a,.072,p);
 const b=restoreEnvironment(environmentSnapshot(a),p);advanceEnvironment(a,.04,p);advanceEnvironment(b,.04,p);
 assert.deepEqual(a,b);const u=new URL(toURL(p,{x:0,y:2,z:0,yaw:0,pitch:0},a.clocks.wave,'http://localhost/',a));
 assert.deepEqual(restoreEnvironment(JSON.parse(u.searchParams.get('environment')),p),a);
 const bad=environmentSnapshot(a);bad.drift[0]=Infinity;assert.throws(()=>restoreEnvironment(bad,p));
});
test('natural command preserves phase clock and drift; preview explicitly applies state',()=>{
 const a=createEnvironment(DEFAULTS,51),drift=[...a.drift];commandEnvironment(a,preset('storm'),{weatherOnly:true});
 near(a.clocks.wave,51);assert.deepEqual(a.drift,drift);near(a.weather.windSpeed,7);
 commandEnvironment(a,{}, {instant:true});near(a.weather.windSpeed,20);near(a.sea.swellHs,1.8);near(a.clocks.wave,51);
});
test('regional support bounded, continuous, electrically active only by explicit flag',()=>{
 const a=createEnvironment({...DEFAULTS,frontEnabled:true,frontX:10000,frontZ:0,clouds:0,rain:1});
 for(let x=-50000;x<50000;x+=137){const w=sampleEnvironment(a,x,0);assert.ok(w.frontWeight>=0&&w.frontWeight<=1);assert.ok(w.rain>=0&&w.rain<=1);assert.equal(w.lightningEligible,false);near(w.weights.reduce((a,b)=>a+b,0),1);}
 const clear=sampleEnvironment(a,-50000,0);near(clear.rain,0);
 const centre=sampleEnvironment(a,10000,0);assert.ok(centre.rain>.7);a.front.electrified=true;assert.equal(sampleEnvironment(a,10000,0).lightningEligible,true);
 near(frontWeight(a.front,a.front.x-120,a.front.z,10),1);
});
test('weather field invariant under camera origin rebasing, f32 bounded at 1000 km',()=>{
 const s=createEnvironment({...DEFAULTS,frontEnabled:true,frontX:20000});
 for(const cameraX of [511.9,512.1,1023.9,1024.1,1e6]){
  const f=new Float32Array(FRAME_FLOATS);environmentUniforms(s,{x:cameraX,z:0},f);
  const origin=localOrigin(cameraX,0),physicalX=18000;
  const cameraRelative=(physicalX-origin[0])-(cameraX-origin[0]);
  const dx=Math.fround(cameraRelative*.001)-f[148];
  near(dx,(physicalX-s.front.x)*.001,8e-5);
 }
});
test('astronomy, wave, weather and exposure clocks have independent pause/rates',()=>{
 const p={...DEFAULTS,weatherRate:600,astronomyRate:60,timeScale:0},s=createEnvironment(p);
 advanceEnvironment(s,.1,p);near(s.clocks.weather,60);near(s.clocks.wave,0);near(s.clocks.astronomy,6);near(s.clocks.exposure,.1);
 const before=environmentSnapshot(s);advanceEnvironment(s,.1,{...p,paused:true});assert.deepEqual(s,before);
});
