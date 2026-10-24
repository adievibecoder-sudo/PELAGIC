import test from 'node:test';
import assert from 'node:assert/strict';
import {roughnessResponse,roughnessUniforms} from '../src/wind-roughness.js';
import {createEnvironment,advanceEnvironment} from '../src/environment.js';
import {preset} from '../src/settings.js';
import {modulo} from '../src/spatial-origin.js';

test('roughness response remains finite and positive across supported winds',()=>{
  for(const speed of [.3,1,3,8,20,30])for(const fetch of [5000,110000,800000]){
    const response=roughnessResponse(speed,fetch);
    assert.ok(Number.isFinite(response)&&response>=0&&response<=.85);
  }
});
test('advected wind phase survives rebasing and disabled mode is exact identity',()=>{
  const p=preset('midday'),state=createEnvironment(p,20);
  advanceEnvironment(state,1.37,p);
  const a=new Float32Array(8),b=new Float32Array(8);
  roughnessUniforms(state,[0,0],true,a,0);
  for(const origin of [[1024,-1024],[100352,-100352]]){
    roughnessUniforms(state,origin,true,b,0);
    const local=[23-origin[0],47-origin[1]];
    const phases=[(local[0]*b[0]+local[1]*b[1])/96+b[4],(-local[0]*b[1]+local[1]*b[0])/32+b[5]];
    const baseline=[(23*a[0]+47*a[1])/96+a[4],(-23*a[1]+47*a[0])/32+a[5]];
    for(let i=0;i<2;i++)assert.ok(Math.abs(modulo(phases[i]-baseline[i]+128,256)-128)<.0002);
  }
  roughnessUniforms(state,[0,0],false,b,0);assert.equal(b[2],0);
});
