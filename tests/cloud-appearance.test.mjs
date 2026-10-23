import test from 'node:test';
import assert from 'node:assert/strict';
import {SKY_BG} from '../src/wgsl/ocean.js';
import {ENV_CUBE} from '../src/wgsl/sky.js';
import {cloudAppearanceShader} from './cloud-appearance-shaders.js';

test('cloud opacity probe replaces screen and environment composition',()=>{
  for(const code of [SKY_BG,ENV_CUBE]){
    assert.equal(cloudAppearanceShader(code,new URLSearchParams()),code);
    const next=cloudAppearanceShader(code,new URLSearchParams('maCloudView=opacity'));
    assert.ok(next.includes('if(F.post.w>=0.0){L=vec3f(cl.a);}'));
    if(code===SKY_BG)assert.ok(next.includes('if(F.post.w>=0.0){L=vec3f(cl.a);}\n  L=mix'));
  }
});
