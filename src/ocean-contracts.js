import {PATCHES, G, omega, groupVelocity, jonswap, cosSpreadNorm, logIntegral} from './numerics.js';
import {windParameters, windSpectrumK, swellAlpha, swellWindow} from './sea-spectrum.js';

export function cascadeBands(n=256) {
  return PATCHES.map((length,c)=>({
    length,
    min:Math.fround(c===0?Math.PI/length:2*Math.PI*6/length),
    max:Math.fround(c<PATCHES.length-1?2*Math.PI*6/PATCHES[c+1]:Math.PI*n/length*.98),
  }));
}

export function directionalWind(theta,w,wp) {
  const ratio=w/wp;
  const beta=ratio<.95?2.61*ratio**1.3:ratio<1.6?2.28*ratio**-1.3:
    10**(-.4+.8393*Math.exp(-.567*Math.log(ratio*ratio)));
  const wrapped=theta-2*Math.PI*Math.floor((theta+Math.PI)/(2*Math.PI));
  return beta/(2*Math.tanh(beta*Math.PI)*Math.cosh(Math.max(-20,Math.min(20,beta*wrapped)))**2);
}

// E(k,theta) dk dtheta is elevation variance; Cartesian density divides by k.
export function spectrumDensity(settings) {
  const wind=windParameters(settings.windSpeed,settings.fetchKm*1000);
  const wp=Math.sqrt(G*2*Math.PI/settings.swellLength);
  const alpha=swellAlpha(settings.swellHs,wp),norm=cosSpreadNorm(settings.swellSpread);
  const windAngle=settings.windDir*Math.PI/180,swellAngle=settings.swellDir*Math.PI/180;
  return (kx,kz)=>{
    const k=Math.hypot(kx,kz);
    if(k===0)return 0;
    const theta=Math.atan2(kz,kx),w=omega(k);
    const windK=windSpectrumK(k,settings.windSpeed,settings.fetchKm*1000)*directionalWind(theta-windAngle,w,wind.wp);
    const swellK=jonswap(w,wp,alpha,6)*swellWindow(w/wp)*groupVelocity(k)*
      norm*Math.abs(Math.cos((theta-swellAngle)*.5))**(2*settings.swellSpread)*Math.exp(-((k*.0012)**2));
    return (windK+swellK)/k;
  };
}

export function discreteSpectrumLedger(settings,n=256) {
  const density=spectrumDensity(settings);
  const cascades=cascadeBands(n).map(band=>{
    const dk=2*Math.PI/band.length;
    let m0=0,xx=0,zz=0,xz=0,phaseMeanVariance=0,occupied=0;
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      const kx=(x>=n/2?x-n:x)*dk,kz=(y>=n/2?y-n:y)*dk,k=Math.hypot(kx,kz);
      if(k<band.min||k>=band.max)continue;
      const energy=density(kx,kz)*dk*dk;
      m0+=energy;xx+=kx*kx*energy;zz+=kz*kz*energy;xz+=kx*kz*energy;
      phaseMeanVariance+=.5*energy*energy;
      if(energy>0)occupied++;
    }
    return {...band,wavelength:[2*Math.PI/band.max,2*Math.PI/band.min],occupied,
      elevationVariance:m0,slopeCovariance:[xx,zz,xz],phaseMeanVariance};
  });
  const total=cascades.reduce((sum,c)=>sum+c.elevationVariance,0);
  const last=cascades.at(-1);
  const omittedWindSlope=logIntegral(k=>k*k*windSpectrumK(k,settings.windSpeed,settings.fetchKm*1000),last.max,10000);
  return {cascades,expectedHs:4*Math.sqrt(total),expectedM0:total,
    linearSlopeCovariance:[0,1,2].map(i=>cascades.reduce((sum,c)=>sum+c.slopeCovariance[i],0)),
    phaseAverageM0StandardDeviation:Math.sqrt(cascades.reduce((sum,c)=>sum+c.phaseMeanVariance,0)),
    omittedWindSlopeAboveLastBand:omittedWindSlope,
    note:'Expected discrete Gaussian ensemble, before choppy deformation, gust modulation or pixel filtering. Standard deviation describes the random phase-averaged m0 estimator, not observed wave-height uncertainty.'};
}

export function transformCovariance(c,a) {
  const [xx,zz,xz]=c,[a00,a01,a10,a11]=a;
  return [a00*a00*xx+2*a00*a01*xz+a01*a01*zz,
    a10*a10*xx+2*a10*a11*xz+a11*a11*zz,
    a00*a10*xx+(a00*a11+a01*a10)*xz+a01*a11*zz];
}
