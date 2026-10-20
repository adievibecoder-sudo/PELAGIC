import test from 'node:test';
import assert from 'node:assert/strict';
import {runtimeInput,validCamera} from '../src/runtime-input.js';
test('capture URLs cannot upload invalid floats or allocate unbounded targets',()=>{
 const p=runtimeInput('?cam=0,NaN,0,0,0&w=Infinity&h=999999&t=-3&frames=-1&seq=Infinity');
 assert.equal(p.camera,null);assert.equal(p.width,0);assert.equal(p.height,4320);assert.equal(p.time,0);assert.equal(p.frames,1);assert.equal(p.sequence,1);
 assert.equal(runtimeInput('').width,0);assert.equal(runtimeInput('?w=1920&h=1080').width,1920);
 assert.equal(runtimeInput('?benchmarkSeconds=Infinity').benchmarkSeconds,120);
 assert.equal(runtimeInput('?benchmarkSeconds=-2').benchmarkSeconds,10);
 assert.equal(runtimeInput('?benchmarkSeconds=9999').benchmarkSeconds,600);
});
test('imported camera has finite bounded pose including across quality reload',()=>{
 const base={x:0,y:2,z:0,yaw:0,pitch:0,speed:6,fovY:1};
 const cam=validCamera({x:1e200,y:Infinity,z:null,yaw:20,pitch:3,speed:-8},base);
 assert.equal(cam.x,100000);assert.equal(cam.y,2);assert.equal(cam.z,0);assert.equal(cam.pitch,1.5);assert.equal(cam.speed,.1);
 assert.ok(cam.yaw>=0&&cam.yaw<2*Math.PI);assert.ok(Object.values(cam).every(Number.isFinite));
});
