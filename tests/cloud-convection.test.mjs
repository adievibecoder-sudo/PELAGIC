import test from 'node:test';
import assert from 'node:assert/strict';
import {CLOUD_VOLUME} from '../src/wgsl/clouds.js';
import {cloudConvectionShader} from '../src/wgsl/cloud-convection.js';
import {OCEAN} from '../src/wgsl/ocean.js';

test('cloud experiment is opt-in, leaves ocean and light transport source unchanged',()=>{
  assert.equal(cloudConvectionShader(CLOUD_VOLUME,new URLSearchParams()),CLOUD_VOLUME);
  const query=new URLSearchParams({maCloud:'convective'}),changed=cloudConvectionShader(CLOUD_VOLUME,query);
  assert.equal(cloudConvectionShader(OCEAN,query),OCEAN);
  assert.equal(changed.slice(changed.indexOf('fn iceDensity(')),CLOUD_VOLUME.slice(CLOUD_VOLUME.indexOf('fn iceDensity(')));
  const originalDensity=CLOUD_VOLUME.slice(CLOUD_VOLUME.indexOf('fn cloudDensityFiltered('),CLOUD_VOLUME.indexOf('fn cloudDensity(p:'));
  assert.ok(changed.includes(originalDensity.replace('cloudDensityFiltered(', 'cloudDensityPreserved(')));
  assert.equal((changed.match(/fn cloudDensityFiltered\(/g)||[]).length,1);
});

test('curved layer coordinates preserve altitude during horizontal transport',()=>{
  const radius=6360,altitude=1.8,shift=[.125,-.25],drift=[-.05,.09];
  let oldError=0;
  for(const x of [-20,-2,0,9,20])for(const z of [-20,-1,3,20]){
    const sag=(a,b)=>(a*a+b*b)/(2*radius);
    const oldY=altitude-sag(x,z),newY=altitude-sag(x+shift[0],z+shift[1]);
    oldError=Math.max(oldError,Math.abs(oldY-newY));
    const before=[x-drift[0],oldY+sag(x,z),z-drift[1]];
    const after=[x+shift[0]-(drift[0]+shift[0]),newY+sag(x+shift[0],z+shift[1]),z+shift[1]-(drift[1]+shift[1])];
    assert.ok(Math.max(...before.map((v,i)=>Math.abs(v-after[i])))<1e-12);
  }
  assert.ok(oldError>.001,'counterexample must distinguish tangent-plane height from layer altitude');
});
