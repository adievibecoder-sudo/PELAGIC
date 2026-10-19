import test from 'node:test';
import assert from 'node:assert/strict';
import {omega,groupVelocity,jonswap,integrate,logIntegral,normalizedSwellAlpha,cosSpreadNorm,fresnel,inverseFFT} from '../src/numerics.js';
import {DEFAULTS,sanitize,preset,toURL,fromURL,approachSea} from '../src/settings.js';
import {celestial} from '../src/astronomy.js';

test('independent recursive inverse FFT agrees with direct DFT, including Parseval',()=>{
 for(const n of [8,16,32]) {
  const r=Float64Array.from({length:n},(_,i)=>Math.sin(i*1.3)),im=Float64Array.from({length:n},(_,i)=>Math.cos(i*2.7));
  const [a,b]=inverseFFT(r,im);
  for(let x=0;x<n;x++) {
   let dr=0,di=0;for(let k=0;k<n;k++){const t=2*Math.PI*k*x/n;dr+=r[k]*Math.cos(t)-im[k]*Math.sin(t);di+=r[k]*Math.sin(t)+im[k]*Math.cos(t);}
   assert.ok(Math.abs(a[x]-dr)<1e-12);assert.ok(Math.abs(b[x]-di)<1e-12);
  }
  const spectral=r.reduce((s,v,i)=>s+v*v+im[i]*im[i],0),spatial=a.reduce((s,v,i)=>s+v*v+b[i]*b[i],0)/n;
  assert.ok(Math.abs(spectral-spatial)/spectral<1e-12);
 }
});
test('JONSWAP normalized swell integrates to Hm0 at multiple peak periods',()=>{
 for(const tp of [5,9,15,20])for(const hs of [.5,2,7]) {
  const wp=2*Math.PI/tp,alpha=normalizedSwellAlpha(hs,wp);
  const m0=logIntegral(w=>jonswap(w,wp,alpha,6),wp*.08,wp*120,16384);
  assert.ok(Math.abs(4*Math.sqrt(m0)/hs-1)<1e-5);
 }
});
test('directional swell normalization and dispersion derivative',()=>{
 for(const s of [2,8,48,100])assert.ok(Math.abs(integrate(t=>cosSpreadNorm(s)*Math.abs(Math.cos(t/2))**(2*s),-Math.PI,Math.PI,2048)-1)<1e-10);
 for(const k of [.001,.1,1,100,1000]){const h=k*1e-5,n=(omega(k+h)-omega(k-h))/(2*h);assert.ok(Math.abs(n/groupVelocity(k)-1)<1e-8);}
});
test('dielectric limits and underwater total internal reflection',()=>{
 assert.ok(Math.abs(fresnel(1)-((1-1.333)/(1+1.333))**2)<1e-12);
 assert.equal(fresnel(0),1);assert.equal(fresnel(Math.cos(49*Math.PI/180),1.333,1),1);
 assert.ok(fresnel(Math.cos(48*Math.PI/180),1.333,1)<1);
});
test('configuration URL restores every setting; malformed input is bounded',()=>{
 const p=preset('storm');p.seed=91234;p.quality='Cinematic';p.astronomy=true;
 const url=toURL(p,{x:5,y:-2,z:31,yaw:.2,pitch:.1},13.4,'http://localhost:8080/');
 assert.deepEqual(fromURL(new URL(url).search),p);
 const bad=sanitize({windSpeed:'NaN',exposure:1e10,quality:'broken',seed:-5});
 assert.equal(bad.windSpeed,DEFAULTS.windSpeed);assert.equal(bad.exposure,24);assert.equal(bad.seed,1);assert.equal(bad.quality,'Balanced');
});
test('weather relaxation is timestep independent and wraps direction',()=>{
 const target={...DEFAULTS,windSpeed:20,windDir:1},a={...DEFAULTS,windDir:359},b={...a};
 for(let i=0;i<60;i++)approachSea(a,target,1/60,60);
 for(let i=0;i<30;i++)approachSea(b,target,1/30,60);
 assert.ok(Math.abs(a.windSpeed-b.windSpeed)<1e-12);assert.ok(Math.abs(a.windDir-b.windDir)<1e-10);
});
test('astronomical vectors are normalized, equinox noon is overhead, lunar phase geometry changes',()=>{
 const a=celestial(new Date('2026-03-20T12:00:00Z'),0,0);
 assert.ok(a.sunElevation>87);assert.ok(Math.abs(Math.hypot(...a.sun)-1)<1e-12);
 const full=celestial(new Date('2026-10-26T02:00:00Z'),32,-30),dark=celestial(new Date('2026-10-10T02:00:00Z'),32,-30);
 assert.ok(full.phase>.95);assert.ok(dark.phase<.03);assert.ok(Math.abs(Math.hypot(...full.moon)-1)<1e-12);
});
