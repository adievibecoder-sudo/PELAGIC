import {G,CAPILLARY,omega,groupVelocity,jonswap,logIntegral} from './numerics.js';

export const smooth = (a,b,x) => { const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t); };
// A remote swell is a band of long waves, not a second source of wind ripples.
// The taper is a modelling choice, normalized to preserve the requested Hm0.
export const swellWindow = ratio => 1-smooth(1.5,3,ratio);
export function swellAlpha(hs,wp) {
  return (hs/4)**2/logIntegral(w=>jonswap(w,wp,1,6)*swellWindow(w/wp),wp*.1,wp*3);
}
export function windParameters(U,fetch) {
  const wp=22*(G*G/(Math.max(U,.1)*fetch))**(1/3),kp=wp*wp/G,cp=omega(kp)/kp;
  const age=U/cp,z0=3.7e-5*U*U/G*Math.max(age,.01)**.9;
  const friction=.41*U/Math.log(10/Math.max(z0,1e-8));
  return {wp,kp,cp,age,friction,alpha:.076*(U*U/(fetch*G))**.22};
}
// Hybrid: fetch-limited JONSWAP at long scales, Elfouhaily equilibrium branches
// at short scales. A log-k crossfade (1..8 rad/m) is explicit, not a measured law.
export function windSpectrumK(k,U,fetch) {
  if(!(k>0) || U<=.1)return 0;
  const p=windParameters(U,fetch),c=omega(k)/k,km=Math.sqrt(G/CAPILLARY),cm=omega(km)/km;
  const lpm=Math.exp(-1.25*(p.kp/k)**2);
  const alpham=Math.max(0,.01*(1+(p.friction<cm?1:3)*Math.log(Math.max(p.friction/cm,1e-6))));
  const bl=.5*.006*Math.sqrt(p.age)*p.cp/c*lpm*Math.exp(-p.age/Math.sqrt(10)*(Math.sqrt(k/p.kp)-1));
  const bh=.5*alpham*cm/c*Math.exp(-.25*(k/km-1)**2)*lpm;
  const equilibrium=(bl+bh)/k**3;
  const wind=jonswap(omega(k),p.wp,p.alpha)*groupVelocity(k);
  const mix=smooth(0,Math.log(8),Math.log(k));
  return (wind*(1-mix)+equilibrium*mix)*Math.exp(-((k*.0012)**2));
}
export function spectrumLedger(settings) {
  const U=settings.windSpeed,fetch=settings.fetchKm*1000;
  const windM0=logIntegral(k=>windSpectrumK(k,U,fetch),.0001,4000);
  const mss=logIntegral(k=>k*k*windSpectrumK(k,U,fetch),.0001,4000);
  const p=windParameters(U,fetch);
  return {windM0,windSlopeVariance:mss,swellM0:(settings.swellHs/4)**2,windPeakPeriod:2*Math.PI/p.wp,
    combinedHs:4*Math.sqrt(windM0+(settings.swellHs/4)**2),model:'JONSWAP / Elfouhaily hybrid; normalized band-limited swell'};
}
