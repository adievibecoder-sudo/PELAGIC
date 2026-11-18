import test from 'node:test';
import assert from 'node:assert/strict';
import {equilibriumDirection,hybridWindDirection,windSpectrumK} from '../src/sea-spectrum.js';
import {windDirectionShader} from '../src/wgsl/wind-direction.js';
import {SIM_INIT,SIM_EVOLVE} from '../src/wgsl/sim.js';
import {spectrumDensity} from '../src/ocean-contracts.js';
import {preset} from '../src/settings.js';

test('spectrum ledger follows the selected GPU angular model',()=>{
  const settings={...preset('midday'),swellHs:0};
  const query=new URLSearchParams('abDirection=equilibrium');
  const candidate=spectrumDensity(settings,query),legacy=spectrumDensity(settings,new URLSearchParams());
  for(const k of [.3,1,2,8,100,370])for(const theta of [0,.7,2.4]){
    const angle=theta+settings.windDir*Math.PI/180;
    const kx=k*Math.cos(angle),kz=k*Math.sin(angle);
    const expected=windSpectrumK(k,settings.windSpeed,settings.fetchKm*1000)*
      hybridWindDirection(k,theta,settings.windSpeed,settings.fetchKm*1000)/k;
    assert.ok(Math.abs(candidate(kx,kz)-expected)<Math.max(1e-25,Math.abs(expected)*1e-10),`${k}/${theta}`);
    if(k<=1)assert.equal(candidate(kx,kz),legacy(kx,kz));
  }
});

test('short-wave direction conserves angular mass and radial spectral energy',()=>{
  const n=8192,step=2*Math.PI/n;
  for(const U of [.3,7,30])for(const fetch of [5000,90000,800000])for(const k of [.3,1,2,8,100,370,2000]){
    let mass=0,orientation=0;
    for(let i=0;i<n;i++){
      const theta=-Math.PI+(i+.5)*step,d=hybridWindDirection(k,theta,U,fetch);
      assert.ok(d>=0&&Number.isFinite(d));mass+=d*step;
      orientation+=equilibriumDirection(k,theta,U,fetch)*step;
      if(k>=8)assert.ok(Math.abs(d+hybridWindDirection(k,theta+Math.PI,U,fetch)-
        2*equilibriumDirection(k,theta,U,fetch))<1e-12);
    }
    assert.ok(Math.abs(mass-1)<2e-7,`${U}/${fetch}/${k}: ${mass}`);
    assert.ok(Math.abs(orientation-1)<1e-12);
    const radial=windSpectrumK(k,U,fetch);
    assert.ok(Math.abs(radial*mass-radial)<Math.max(1e-20,radial*2e-7));
  }
});

test('direction trial changes only the wind angular term, leaving phase and swell code intact',()=>{
  const query=new URLSearchParams('abDirection=equilibrium');
  const changed=windDirectionShader(SIM_INIT,query);
  assert.equal(windDirectionShader(SIM_EVOLVE,query),SIM_EVOLVE);
  assert.equal(windDirectionShader(SIM_INIT,new URLSearchParams()),SIM_INIT);
  assert.equal(changed.slice(changed.indexOf('  // swell:')),SIM_INIT.slice(SIM_INIT.indexOf('  // swell:')));
  for(const k of [1,8])for(const theta of [0,.7,2.4]){
    const a=hybridWindDirection(k*(1-1e-6),theta,7,90000);
    const b=hybridWindDirection(k*(1+1e-6),theta,7,90000);
    assert.ok(Math.abs(a-b)<1e-6);
  }
});
