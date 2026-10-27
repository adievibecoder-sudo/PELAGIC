import test from 'node:test';
import assert from 'node:assert/strict';
import {preset,scenePreset,LIGHTING_PRESETS,lightingPreset,PRESETS,toURL,fromURL} from '../src/settings.js';
import {createEnvironment,commandEnvironment,previewLighting,advanceEnvironment,restoreEnvironment,WEATHER_KEYS} from '../src/environment.js';
import {waterCoefficients} from '../src/water-coefficients.js';
import {celestial} from '../src/astronomy.js';

test('full scenes preserve water properties and viewing preferences while replacing environmental state',()=>{
  const current={...preset('moonlit'),frontEnabled:true,electrified:true,cloudType:2,
    quality:'High',resolution:1.17,adaptive:false,paused:true,cameraMode:'free',cameraSpeed:25,fov:74,
    turbidity:.78,dissolvedAbsorption:.16,mineralScattering:.43};
  const retained=['quality','resolution','adaptive','paused','cameraMode','cameraSpeed','fov','environmentMode',
    'turbidity','dissolvedAbsorption','mineralScattering'];
  for(const name of Object.keys(PRESETS)){
    const p=scenePreset(name,current),expected=preset(name),s=createEnvironment(p,37);
    for(const k of Object.keys(p))assert.equal(p[k],retained.includes(k)?current[k]:expected[k],name+': '+k);
    assert.deepEqual(s.weather,s.target);assert.equal(s.sea.swellHs,expected.swellHs);
    assert.equal(s.clocks.wave,37);assert.equal(s.front.enabled,false);
  }
  assert.throws(()=>scenePreset('missing',current));
});

test('lighting previews preserve a developing crossing sea and pending weather in either edit mode',()=>{
  for(const mode of ['natural','instant'])for(const name of Object.keys(LIGHTING_PRESETS)){
    const p={...preset('calm'),environmentMode:mode,seaRate:1,astronomyRate:60,swellDir:240,
      sunAzim:79,turbidity:.78,dissolvedAbsorption:.16,mineralScattering:.43};
    const s=createEnvironment(p,37);
    commandEnvironment(s,{windSpeed:30,windDir:20,cloudType:2,rain:.8,swellHs:4,swellDir:150});
    advanceEnvironment(s,12,p);
    const before=structuredClone(s),original={...p};
    previewLighting(s,p,name);
    for(const k of Object.keys(s)){
      if(!['utcEpoch','clocks','revision'].includes(k))assert.deepEqual(s[k],before[k],name+': '+k);
    }
    for(const k of ['wave','weather','exposure'])assert.equal(s.clocks[k],before.clocks[k]);
    assert.equal(s.remainder,before.remainder);
    assert.equal(s.revision,before.revision+1);
    for(const k of Object.keys(p)){
      if(!['astronomy','astronomyRate','sunElev','exposure','date','hour','latitude','longitude'].includes(k))assert.equal(p[k],original[k],name+': '+k);
    }
    assert.deepEqual(waterCoefficients(p.turbidity,p.dissolvedAbsorption,p.mineralScattering),
      waterCoefficients(original.turbidity,original.dissolvedAbsorption,original.mineralScattering));
    if(name==='moonlit'){
      assert.equal(s.clocks.astronomy,0);
      const light=celestial(new Date(s.utcEpoch),p.latitude,p.longitude);
      assert.ok(light.sunElevation<-12&&light.moonElevation>0);
    }else{
      assert.equal(s.clocks.astronomy,before.clocks.astronomy);
      assert.equal(s.utcEpoch,before.utcEpoch);
    }
    const url=new URL(toURL(p,{x:0,y:2,z:0,yaw:0,pitch:0},s.clocks.wave,'http://localhost/',s));
    assert.deepEqual(fromURL(url.search),p);
    assert.deepEqual(restoreEnvironment(JSON.parse(url.searchParams.get('environment')),p),s);
  }
  assert.throws(()=>lightingPreset('missing',preset('calm')));
});

test('explicit weather transition remains gradual even with immediate parameter editing',()=>{
  const p={...preset('golden'),environmentMode:'instant'},s=createEnvironment(p,37);
  const before=structuredClone(s),target=preset('storm');
  commandEnvironment(s,Object.fromEntries(WEATHER_KEYS.map(k=>[k,target[k]])),{weatherOnly:true});
  assert.deepEqual(s.weather,before.weather);assert.deepEqual(s.sea,before.sea);
  assert.deepEqual(s.swellTarget,before.swellTarget);assert.deepEqual(s.clocks,before.clocks);
  assert.equal(s.target.rain,.65);assert.equal(s.target.cloudType,2);assert.equal(p.sunElev,5);
});
