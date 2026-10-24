import {spectrumDensity,cascadeBands} from './ocean-contracts.js';
import {omega} from './numerics.js';

// Ensemble covariance of the final FFT cascade at neighbouring texels. This
// normalizes bilinear samples without assuming independent adjacent slopes.
export function glintCorrelation(settings){
  const band=cascadeBands().at(-1),density=spectrumDensity(settings),dk=2*Math.PI/band.length;
  const sums=[0,0,0,0,0,0,0,0,0];
  const shutterOffsets=[.2386191861,.6612093865,.9324695142].map(x=>x/120);
  for(let y=-128;y<128;y++)for(let x=-128;x<128;x++){
    const kx=x*dk,kz=y*dk,k=Math.hypot(kx,kz);
    if(k<band.min||k>=band.max)continue;
    const energy=kx*kx*density(kx,kz),a=x*2*Math.PI/256,b=y*2*Math.PI/256;
    sums[0]+=energy;sums[1]+=energy*Math.cos(a);sums[2]+=energy*Math.cos(b);
    sums[3]+=energy*Math.cos(a+b);sums[4]+=energy*Math.cos(a-b);sums[5]+=energy*omega(k)**2;
    for(let i=0;i<3;i++)sums[6+i]+=energy*Math.cos(omega(k)*shutterOffsets[i]);
  }
  return {neighbours:sums.slice(1,5).map(x=>x/Math.max(sums[0],1e-20)),rmsFrequency:Math.sqrt(sums[5]/Math.max(sums[0],1e-20)),
    shutterCorrelation:sums.slice(6).map(x=>x/Math.max(sums[0],1e-20))};
}
