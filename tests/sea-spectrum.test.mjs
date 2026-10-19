import test from 'node:test';
import assert from 'node:assert/strict';
import {swellAlpha,swellWindow,windSpectrumK,spectrumLedger} from '../src/sea-spectrum.js';
import {jonswap,logIntegral} from '../src/numerics.js';
import {preset} from '../src/settings.js';

test('remote swell taper conserves Hm0, excludes wind-ripple tail',()=>{
  for(const period of [5,9,15,20])for(const hs of [.5,2,7]){
    const wp=2*Math.PI/period,alpha=swellAlpha(hs,wp);
    const variance=logIntegral(w=>jonswap(w,wp,alpha,6)*swellWindow(w/wp),wp*.08,wp*12,32768);
    assert.ok(Math.abs(4*Math.sqrt(variance)/hs-1)<2e-6);
    assert.equal(swellWindow(3),0);assert.equal(swellWindow(6),0);
  }
});
test('hybrid wind spectrum is nonnegative, finite and continuous at branch boundaries',()=>{
  for(const U of [.3,2,7,12,20,30])for(const fetch of [5000,90000,800000]){
    for(let k=.001;k<4000;k*=1.1)assert.ok(Number.isFinite(windSpectrumK(k,U,fetch))&&windSpectrumK(k,U,fetch)>=0);
    for(const k of [1,8]){
      const l=windSpectrumK(k*(1-1e-6),U,fetch),r=windSpectrumK(k*(1+1e-6),U,fetch);
      assert.ok(Math.abs(l-r)/Math.max(l,r,1e-20)<1e-4);
    }
  }
});
test('spectral integration converges independently of log quadrature resolution',()=>{
  for(const scene of ['calm','golden','midday','storm']){
    const p=preset(scene),f=k=>windSpectrumK(k,p.windSpeed,p.fetchKm*1000);
    const reference=logIntegral(f,.0001,4000,32768),actual=spectrumLedger(p).windM0;
    assert.ok(Math.abs(actual/reference-1)<2e-5);
  }
});
