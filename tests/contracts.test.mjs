import test from 'node:test';
import assert from 'node:assert/strict';
import {integrate} from '../src/numerics.js';
import {cascadeBands,directionalWind,discreteSpectrumLedger,transformCovariance} from '../src/ocean-contracts.js';
import {preset} from '../src/settings.js';

test('cascade intervals partition the represented radial band without gaps or overlap',()=>{
  const bands=cascadeBands();
  for(let c=1;c<bands.length;c++)assert.equal(bands[c].min,bands[c-1].max);
  for(const band of bands)assert.ok(band.max<Math.PI*256/band.length && band.max>band.min);
});
test('directional wind spreading integrates to one over all supported frequency ratios',()=>{
  for(const ratio of [.1,.94,.95,1,1.59,1.6,3,20,300]){
    const value=integrate(theta=>directionalWind(theta,ratio,1),-Math.PI,Math.PI,8192);
    assert.ok(Math.abs(value-1)<2e-6,`${ratio}: ${value}`);
  }
});
test('covariance transform agrees with independent transformed sample moments, including shear',()=>{
  const samples=[[.2,-.4],[-.2,.4],[.5,.3],[-.5,-.3]];
  const moments=s=>[s.reduce((v,p)=>v+p[0]**2,0)/s.length,s.reduce((v,p)=>v+p[1]**2,0)/s.length,s.reduce((v,p)=>v+p[0]*p[1],0)/s.length];
  for(const a of [[1,0,0,1],[.8,.3,-.2,1.4],[0,-1,1,0]]){
    const expected=moments(samples.map(([x,z])=>[a[0]*x+a[1]*z,a[2]*x+a[3]*z]));
    transformCovariance(moments(samples),a).forEach((v,i)=>assert.ok(Math.abs(v-expected[i])<1e-14));
  }
});
test('discrete sea-state ledger has finite positive energy and positive semidefinite covariance',()=>{
  for(const name of ['calm','midday','storm']){
    const ledger=discreteSpectrumLedger(preset(name));
    for(const c of ledger.cascades){
      const [xx,zz,xz]=c.slopeCovariance;
      assert.ok(c.elevationVariance>0&&Number.isFinite(c.elevationVariance));
      assert.ok(xx*zz-xz*xz>=-1e-12);
    }
    assert.ok(ledger.phaseAverageM0StandardDeviation>0&&ledger.omittedWindSlopeAboveLastBand>=0);
  }
});
