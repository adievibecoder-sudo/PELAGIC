import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULTS} from '../src/settings.js';
import {createEnvironment,advanceEnvironment,commandEnvironment,environmentUniforms} from '../src/environment.js';
import {regionalSeaUniforms} from '../src/regional-sea.js';
import {FRAME_FLOATS,FOAM_BYTES,localOrigin} from '../src/spatial-origin.js';
import {temporalCamera} from '../src/temporal-camera.js';

test('camera travel through a regional storm cannot change the shared spectrum history',()=>{
  const p={...DEFAULTS,frontEnabled:true,frontSpeed:0,frontX:0,weatherRate:60};
  const a=createEnvironment(p),b=createEnvironment(p);
  commandEnvironment(a,{windSpeed:12});commandEnvironment(b,{windSpeed:12});
  for(let i=0;i<900;i++){
    advanceEnvironment(a,.1,p,0,0);
    advanceEnvironment(b,.1,p,50000*Math.sin(i*.01),50000);
  }
  assert.deepEqual(a,b);
  assert.equal(a.sea.swellHs,DEFAULTS.swellHs);
});

test('regional sea uniforms are bounded, camera independent and share foam/render units',()=>{
  const s=createEnvironment({...DEFAULTS,frontEnabled:true,frontX:20000},30);
  for(const enabled of [false,true])for(const x of [511.9,512.1,1e6]){
    const origin=localOrigin(x,0),frame=new Float32Array(FRAME_FLOATS),foam=new Float32Array(FOAM_BYTES/4);
    regionalSeaUniforms(s,origin,enabled,frame);regionalSeaUniforms(s,origin,enabled,foam,56);
    assert.deepEqual(frame.slice(228,240),foam.slice(56,68));
    const centre=s.front.x+Math.cos(s.front.heading*Math.PI/180)*s.front.speed*30;
    assert.ok(Math.abs(frame[228]+origin[0]-centre)<.04);
    assert.ok(frame[236]>=.25&&frame[236]<=4&&frame[237]>=.25&&frame[237]<=4);
    if(!enabled)assert.deepEqual([...frame.slice(236,240)],[1,1,0,8]);
  }
});

test('camera-local air cannot rotate shared wave and foam pattern coordinates',()=>{
  const s=createEnvironment({...DEFAULTS,frontEnabled:true,frontSpeed:0,frontX:0,frontHeading:0},30);
  s.weather.windDir=75;s.sea.windDir=118;s.sea.windSpeed=8;
  const a=new Float32Array(FRAME_FLOATS),b=new Float32Array(FRAME_FLOATS);
  environmentUniforms(s,{x:0,z:0},a);environmentUniforms(s,{x:50000,z:0},b);
  assert.deepEqual(a.slice(56,59),b.slice(56,59));
  assert.equal(a[58],8);
  assert.notDeepEqual(a.slice(168,170),b.slice(168,170));
});

test('temporal reconstruction retains the previous regional field through rebasing',()=>{
  const h=temporalCamera(),f=new Float32Array(FRAME_FLOATS);f[30]=1;f[36]=1920;f[37]=1080;f[60]=32;
  f.set([10,20,500,15000,1,0,12,30,1,2,1,8],228);
  const original=f.slice(228,240);h.write(f,[0,2,0],1/60,0);
  f[228]-=1024;f[235]+=1/60;h.write(f,[1,2,0],1/60,0);
  assert.deepEqual(f.slice(240,252),original);
});
