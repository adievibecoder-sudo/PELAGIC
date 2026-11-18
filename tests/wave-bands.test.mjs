import test from 'node:test';
import assert from 'node:assert/strict';
import {wavePatchLengths} from '../src/numerics.js';
import {cascadeBands,spectrumDensity,discreteSpectrumLedger} from '../src/ocean-contracts.js';
import {preset,toURL} from '../src/settings.js';
import {renderOptions} from '../src/render-options.js';

const normal=cascadeBands(256,new URLSearchParams());

test('redistributed bands meet exactly and remain below Nyquist',()=>{
  for(const mode of ['legacy','groups']){
    const query=new URLSearchParams({abWaves:mode}),bands=cascadeBands(256,query);
    for(let c=1;c<6;c++)assert.equal(bands[c].min,bands[c-1].max);
    for(const b of bands)assert.ok(b.min>0&&b.max>b.min&&b.max<Math.PI*256/b.length);
    assert.deepEqual(bands.slice(2),normal.slice(2));
    assert.equal(bands[1].length,normal[1].length);
    assert.equal(bands[1].max,normal[1].max);
    if(mode==='legacy')assert.deepEqual(bands,normal);
    else assert.equal(bands[0].max,Math.fround(Math.PI*6/211.3));
  }
});

function reconstructedLongBand(settings,split){
  const q=new URLSearchParams(split?'abWaves=groups':'maLongGrid=2207');
  const density=spectrumDensity(settings,q),b=cascadeBands(256,q)[0],dk=2*Math.PI/b.length,dx=b.length/256;
  let energy=0,reconstructed=0;
  for(let y=-128;y<128;y++)for(let x=-128;x<128;x++){
    const kx=x*dk,kz=y*dk,k=Math.hypot(kx,kz);if(k<b.min||k>=b.max)continue;
    const e=density(kx,kz)*dk*dk;
    energy+=e;reconstructed+=e*(2+Math.cos(kx*dx))*(2+Math.cos(kz*dx))/9;
  }
  return reconstructed/energy;
}

test('redistribution improves the failed wide-domain reconstruction across sea states',()=>{
  for(const name of ['calm','midday','golden','storm']){
    assert.ok(reconstructedLongBand(preset(name),true)>reconstructedLongBand(preset(name),false),name);
  }
});

test('group trial survives sharing without enabling a new default',()=>{
  assert.deepEqual(renderOptions({abWaves:'groups'}),{abWaves:'groups'});
  const camera={x:0,y:2,z:0,yaw:0,pitch:0};
  const url=toURL(preset('midday'),camera,30,'http://localhost:8081/',undefined,{abWaves:'groups'});
  assert.equal(new URL(url).searchParams.get('abWaves'),'groups');
  assert.equal(wavePatchLengths()[0],1103);
});

test('each explicit ledger uses its requested domain and split, not ambient defaults',()=>{
  for(const [request,length,split] of [['',1103,6],['maLongGrid=2207',2207,6],['maLongGrid=4093',4093,6],['abWaves=groups',2207,3]]){
    const query=new URLSearchParams(request),bands=cascadeBands(256,query);
    const ledger=discreteSpectrumLedger(preset('midday'),256,query);
    assert.equal(ledger.cascades[0].length,length);
    assert.equal(ledger.cascades[0].max,Math.fround(2*Math.PI*split/211.3));
    assert.deepEqual(ledger.cascades.map(({length,min,max})=>({length,min,max})),bands);
  }
});
