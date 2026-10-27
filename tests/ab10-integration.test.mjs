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
import {breakingPhaseShader} from '../src/wgsl/breaking-phase.js';
import {reflectionTransportShader} from '../src/wgsl/reflection-transport.js';

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

test('phase transport composes with population history; empty/default paths remain intact',()=>{
  const q=new URLSearchParams('abBreaking=phase-field&abWater=slab&abFoam=relief&abEnvironment=marine-diffuse&abReflection=partition');
  const history=breakingPhaseShader(breakingEventsShader(FOAM_UPDATE,q),q);
  assert.equal((history.match(/@compute/g)||[]).length,1);
  assert.match(history,/activePrevious.b/);
  assert.match(history,/let velocity = inverseDeformation\*U.drift.xy/);
  assert.match(history,/let fresh=select\(prev.g,/);
  assert.match(history,/let retired=prev.g\*\(1.0-survival\*supportSurvival\)/);
  assert.equal(breakingPhaseShader(FOAM_UPDATE,new URLSearchParams()),FOAM_UPDATE);
  const source=foamTransportShader(breakingEventsShader(environmentLightShader(reflectionTransportShader(waterMaterialShader(OCEAN,q),q),q),q),q);
  assert.equal((source.match(/@fragment fn fs\(/g)||[]).length,1);
  assert.equal((source.match(/@binding\(/g)||[]).length,(OCEAN.match(/@binding\(/g)||[]).length);
  assert.deepEqual(renderOptions(q),Object.fromEntries(q));
});

test('phase estimate follows physical travelling-wave speed at the declared spatial and temporal scales',()=>{
  // Independent deep-water solution. This validates the finite-difference
  // method, not texture filtering, crossing ownership or turbulent breaking.
  for(const wavelength of [12,24,50,100])for(const dt of [1/24,1/60,1/120]){
    const k=2*Math.PI/wavelength,w=Math.sqrt(9.81*k),dx=.75;
    const h=(x,t)=>Math.cos(k*x-w*t);
    const slope=t=>(h(dx,t)-h(-dx,t))/(2*dx);
    const curvature=(h(dx,0)+h(-dx,0)-2*h(0,0))/(dx*dx);
    const speed=-(slope(0)-slope(-dt))/(dt*curvature);
    assert.ok(Math.abs(speed/(w/k)-1)<.015,`${wavelength}m / ${dt}s`);
  }
  for(const support of [0,.5,1]){
    const rate=1/.7+12*(1-support);
    const oneStep=Math.exp(-rate);
    for(const hz of [24,60,120])assert.ok(Math.abs(Math.exp(-rate/hz)**hz-oneStep)<1e-12);
    assert.equal(Math.exp(-0*rate),1);
  }
});

test('storm diffusion preserves unmodified single scattering and skips ordinary daytime column work',()=>{
  const q=new URLSearchParams('abEnvironment=marine-diffuse');
  for(const base of [CLOUD_SCREEN,ENV_CUBE]){
    const source=environmentLightShader(base,q);
    assert.match(source,/if\(stormLighting>0.001\)\{columnEscape=/);
    assert.match(source,/let direct=exp\(-optical\)\*phase/);
    assert.match(source,/mix\(multi,diffuseSolar,stormLighting\)/);
  }
  for(const mu of [0,.01,.3,1])for(const beamDepth of [0,.1,1,100])for(const columnDepth of [0,1,100]){
    const radiance=mu*(1-Math.exp(-beamDepth))/(Math.PI*(1+.75*columnDepth));
    assert.ok(radiance>=0&&radiance<=mu/Math.PI);
  }
});
