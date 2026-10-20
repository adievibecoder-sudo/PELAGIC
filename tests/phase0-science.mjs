// Decision experiments, not observational certification. Run with Node >=20.
import fs from 'node:fs';
import path from 'node:path';
import {preset,PRESETS} from '../src/settings.js';
import {spectrumDensity,cascadeBands,discreteSpectrumLedger} from '../src/ocean-contracts.js';
import {windParameters,spectrumLedger} from '../src/sea-spectrum.js';
import {G,omega} from '../src/numerics.js';

function rng(seed){let s=seed>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return(s+.5)/4294967296;};}
function normal(r){const a=Math.sqrt(-2*Math.log(r())),p=2*Math.PI*r();return [a*Math.cos(p),a*Math.sin(p)];}
function summary(a){const mean=a.reduce((s,v)=>s+v,0)/a.length;const variance=a.reduce((s,v)=>s+(v-mean)**2,0)/a.length;return{mean,sd:Math.sqrt(variance),min:Math.min(...a),max:Math.max(...a)};}
function modes(s){
  const density=spectrumDensity(s),out=[];
  for(const [c,b] of cascadeBands().entries()){
    const dk=2*Math.PI/b.length;
    for(let y=-127;y<=127;y++)for(let x=-127;x<=127;x++){
      const kx=x*dk,kz=y*dk,k=Math.hypot(kx,kz);
      if(k<b.min||k>=b.max)continue;
      const e=density(kx,kz)*dk*dk;if(e>0)out.push({c,x,y,kx,kz,k,e});
    }
  }
  return out;
}
function census(ms){
  const pairs=new Map();for(const m of ms){const sign=m.y>0||(m.y===0&&m.x>0)?1:-1,key=[m.c,m.x*sign,m.y*sign].join(',');pairs.set(key,(pairs.get(key)||0)+m.e);}
  const es=[...pairs.values()].sort((a,b)=>b-a),total=es.reduce((s,e)=>s+e,0);let sum=0,n50=0,n90=0;
  for(let i=0;i<es.length;i++){sum+=es[i];if(!n50&&sum>=total*.5)n50=i+1;if(!n90&&sum>=total*.9)n90=i+1;}
  const hs=[];for(let seed=1;seed<=64;seed++){const r=rng(seed*7919);let m0=0;for(const e of es)m0-=e*Math.log(r());hs.push(4*Math.sqrt(m0));}
  return{total,pairs:es.length,travelingModes:ms.length,pairs50:n50,pairs90:n90,effectiveInstantaneousPairs:total*total/es.reduce((s,e)=>s+e*e,0),hs64:summary(hs),cascade0Share:ms.filter(m=>m.c===0).reduce((s,m)=>s+m.e,0)/total};
}
function correlation(ms,shift){const total=ms.reduce((s,m)=>s+m.e,0);return ms.reduce((s,m)=>s+m.e*Math.cos(m.kx*shift),0)/total;}
function groups(ms,seed){
  const sorted=[...ms].sort((a,b)=>b.e-a.e),total=sorted.reduce((s,m)=>s+m.e,0);let accum=0;const retained=[];
  for(const m of sorted){retained.push(m);accum+=m.e;if(accum>=total*.99)break;}
  const r=rng(seed),terms=retained.map(m=>{const [a,b]=normal(r);return{...m,a:a*Math.sqrt(m.e),b:b*Math.sqrt(m.e),w:omega(m.k)};});
  const eta=[],envelope=[];
  for(let j=0;j<2048;j++){let h=0,q=0;for(const m of terms){const p=m.w*j*.25;h+=m.a*Math.cos(p)+m.b*Math.sin(p);q+=m.a*Math.sin(p)-m.b*Math.cos(p);}eta.push(h);envelope.push(Math.hypot(h,q));}
  const z=summary(eta),e=summary(envelope),skew=eta.reduce((s,h)=>s+((h-z.mean)/z.sd)**3,0)/eta.length;
  return{seed,samples:eta.length,dt:.25,retainedEnergy:accum/total,modes:terms.length,height:z,skewness:skew,envelopeCV:e.sd/e.mean};
}
const output={scope:'CPU linear ensemble/candidate experiments; not GPU realization or nonlinear/observational validation.',seedPolicy:'LCG seed 7919*n for 64 instantaneous Gaussian-pair realizations; group seeds 1307,3001,7919.',presets:{}};
for(const name of Object.keys(PRESETS)){
  const s=preset(name),ms=modes(s),c=census(ms),p=windParameters(s.windSpeed,s.fetchKm*1000),l=spectrumLedger(s);
  // Original PM uses U19.5. This neutral log-law conversion is an explicit assumption.
  const z0=3.7e-5*s.windSpeed**2/G*Math.max(p.age,.01)**.9;
  const u195=s.windSpeed*Math.log(19.5/z0)/Math.log(10/z0),wpPM=(4*.74/5)**.25*G/u195;
  const pmHs=4*Math.sqrt(.0081/(4*.74))*u195*u195/G;
  output.presets[name]={...c,windHs:4*Math.sqrt(l.windM0),windTp:2*Math.PI/p.wp,PMreference:{U10:s.windSpeed,U195:u195,z0,hs:pmHs,tp:2*Math.PI/wpPM,scope:'Neutral log-law wind-height conversion; empirical fully developed wind-sea reference only. No clamp on swell or mixed seas.'},legacyWrongHeightTp:2*Math.PI*s.windSpeed/(.877*G),energyLedgerError:c.total/discreteSpectrumLedger(s).expectedM0-1};
  if(['midday','storm','calm'].includes(name)){
    const second=ms.map(m=>({...m,kx:m.kx/Math.SQRT2,kz:m.kz/Math.SQRT2,e:m.e*.5}));
    // Counterexample only: wavelength stretch preserves m0 but changes Tp. Not a valid production split.
    const split=[...ms.map(m=>({...m,e:m.e*.5})),...second];
    const random=rng(1307),jitter=ms.map(m=>{const dk=2*Math.PI/cascadeBands()[m.c].length;const kx=m.kx+(random()-.5)*dk,kz=m.kz+(random()-.5)*dk;return{...m,kx,kz,k:Math.hypot(kx,kz)};});
    output.presets[name].candidates={correlationAt1103m:{baseline:correlation(ms,1103),naiveStretchedSplit:correlation(split,1103),jitteredBins:correlation(jitter,1103)},groups:[1307,3001,7919].map(seed=>groups(ms,seed)),jitteredGroups:groups(jitter,1307),decision:'Reject naive stretched split: changes wavelengths. Non-grid quadrature candidate reduces recurrence but needs resampled density, energy bands and directional tensor tests before adoption.'};
  }
}
// A narrow-band linear focused packet cannot be assigned a nonlinear breaking criterion.
const k0=2*Math.PI/80,packet=[];
for(let i=-8;i<=8;i++){const k=k0*(1+i*.025);packet.push({k,w:omega(k),a:Math.exp(-.5*(i/3)**2)});}
const norm=packet.reduce((s,m)=>s+m.a,0);
output.breaking={scope:'Analytic linear focused packet at x=t=0; c=-eta_xt/eta_xx. Linear fluid velocity at z=0. Not nonlinear surface u/c.',cases:[.1,.2,.3,.4].map(steepness=>{const crestHeight=steepness/k0;const terms=packet.map(m=>({...m,a:m.a/norm*crestHeight}));const c=terms.reduce((s,m)=>s+m.a*m.k*m.w,0)/terms.reduce((s,m)=>s+m.a*m.k*m.k,0),u=terms.reduce((s,m)=>s+m.a*m.w,0);return{steepness,crestHeight,crestSpeed:c,linearSurfaceVelocity:u,ratio:u/c};}),decision:'Do not apply B=0.85 to linear kinematics: it would demand an already-invalid steep packet. Nonlinear onset/event calibration remains required.'};
output.feedback={model:'Scalar delayed diffuse closure L[n+1]=external+gain*L[n]; one-frame delay alone does not enforce stability.',cases:[.2,.8,1,1.1].map(gain=>{let L=0;for(let n=0;n<120;n++)L=1+gain*L;return{gain,L120:L,finiteEquilibrium:gain<1?1/(1-gain):null};})};
const dest=process.argv[2]||'evidence/v04-p0-science/science.json';fs.mkdirSync(path.dirname(dest),{recursive:true});
fs.writeFileSync(dest,JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(Object.fromEntries(Object.entries(output.presets).map(([k,v])=>[k,{pairs50:v.pairs50,effectivePairs:v.effectiveInstantaneousPairs,windHs:v.windHs,tp:v.windTp,pmTp:v.PMreference.tp,energyLedgerError:v.energyLedgerError}])) ,null,2));
