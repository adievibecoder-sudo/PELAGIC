import test from 'node:test';
import assert from 'node:assert/strict';
import {preset,toURL,fromURL} from '../src/settings.js';
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
import {waterCoefficients} from '../src/water-coefficients.js';

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

test('dissolved absorption changes spectral attenuation without creating scattering',()=>{
  for(const turbidity of [0,.25,2]){
    const base=waterCoefficients(turbidity),coloured=waterCoefficients(turbidity,.07);
    assert.deepEqual(coloured.backscatter,base.backscatter);
    const added=coloured.absorption.map((v,i)=>v-base.absorption[i]);
    assert.ok(added[2]>added[1]&&added[1]>added[0]&&added[0]>0);
    assert.ok(Math.abs(added[2]-.07)<1e-12);
    for(const distance of [0,1,10,100])for(let i=0;i<3;i++){
      assert.ok(Math.exp(-coloured.absorption[i]*distance)<=Math.exp(-base.absorption[i]*distance));
    }
  }
  assert.deepEqual(waterCoefficients(.25,0).absorption,[.34375,.06275,.02547]);
});

test('independent mineral scattering preserves legacy water and shares optical coefficients',()=>{
  const base=waterCoefficients(.25,.07),mineral=waterCoefficients(.25,.07,.3);
  for(let i=0;i<3;i++){
    assert.ok(mineral.backscatter[i]>base.backscatter[i]);
    const attenuation=12*(mineral.backscatter[i]-base.backscatter[i])+mineral.absorption[i]-base.absorption[i];
    assert.ok(attenuation>0);
    assert.ok(Math.exp(-attenuation*10)<1);
  }
  assert.deepEqual(waterCoefficients(.25,.07,0),base);
  const settings={...preset('golden'),mineralScattering:.3,dissolvedAbsorption:.07};
  const url=toURL(settings,{x:0,y:2,z:0,yaw:0,pitch:0},30,'http://localhost:8080/?abEnvironment=marine&abFoam=relief');
  assert.deepEqual(fromURL(new URL(url).search),settings);
  assert.deepEqual(renderOptions(new URL(url).searchParams),{abEnvironment:'marine',abFoam:'relief'});
});

test('marine storm lighting and foam relief compose without adding bindings',()=>{
  const q=new URLSearchParams('abWater=volume&abEnvironment=marine&abBreaking=population&abFoam=relief');
  const source=foamTransportShader(breakingEventsShader(environmentLightShader(waterMaterialShader(OCEAN,q),q),q),q);
  assert.match(source,/let foamBase=volumeNormal/);
  assert.match(source,/dot\(foamNormal,Ld\)/);
  assert.doesNotMatch(source,/dot\(nrm,Ld\),0.0\)\+moonE/);
  for(const base of [CLOUD_SCREEN,CLOUD_SHADOW,ENV_CUBE]){
    const modified=environmentSymmetryShader(cloudWorkShader(environmentLightShader(base,q),q),q);
    assert.match(modified,/baseRelief=storm/);
    assert.equal((modified.match(/@binding\(/g)||[]).length,(base.match(/@binding\(/g)||[]).length);
  }
});
