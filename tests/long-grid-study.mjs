// CPU quadrature/reconstruction diagnostic; no observational acceptance claim.
import fs from 'node:fs';
import path from 'node:path';
import {PATCHES} from '../src/numerics.js';
import {spectrumDensity,cascadeBands,discreteSpectrumLedger} from '../src/ocean-contracts.js';
import {spectrumLedger} from '../src/sea-spectrum.js';

const [input,output]=process.argv.slice(2);
if(!input||!output)throw Error('Usage: node tests/long-grid-study.mjs <capture.json> <new-output.json>');
const settings=JSON.parse(fs.readFileSync(input)).settings,density=spectrumDensity(settings),rows=[];
const original=PATCHES[0];
try{
  for(const length of [1103,2207,4093]){
    PATCHES[0]=length;
    const ledger=discreteSpectrumLedger(settings),band=cascadeBands()[0],dk=2*Math.PI/length,dx=length/256;
    let height=0,filteredHeight=0,slope=0,filteredSlope=0,energy=0,squares=0,correlation=0;
    const pairs=[];
    for(let y=-128;y<128;y++)for(let x=-128;x<128;x++){
      const kx=x*dk,kz=y*dk,k=Math.hypot(kx,kz);if(k<band.min||k>=band.max)continue;
      const e=density(kx,kz)*dk*dk;
      // Exact mean-square response of linear interpolation, averaged over one cell.
      const transfer=(2/3+Math.cos(kx*dx)/3)*(2/3+Math.cos(kz*dx)/3);
      height+=e;filteredHeight+=e*transfer;slope+=e*k*k;filteredSlope+=e*k*k*transfer;
      if(y<0||(y===0&&x<=0))continue;
      const pair=(density(kx,kz)+density(-kx,-kz))*dk*dk;
      energy+=pair;squares+=pair*pair;correlation+=pair*Math.cos(kx*1103);pairs.push(pair);
    }
    pairs.sort((a,b)=>b-a);let cumulative=0,pairs50=0;
    for(const e of pairs){cumulative+=e;pairs50++;if(cumulative>=energy*.5)break;}
    rows.push({length,texel:dx,expectedHs:ledger.expectedHs,slopeTensor:ledger.linearSlopeCovariance,
      effectivePairs:energy*energy/squares,pairs50,correlationAt1103:correlation/energy,
      baseLevelReconstruction:{height,filteredHeight,heightRatio:filteredHeight/height,slope,filteredSlope,slopeRatio:filteredSlope/slope}});
  }
}finally{PATCHES[0]=original;}
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify({input,settings,continuous:spectrumLedger(settings),rows,
  scope:'Expected Gaussian spectral energy and uniform-cell bilinear reconstruction. Excludes vertex LOD, choppy map, pixel filtering and temporal ensemble uncertainty.'},null,2)+'\n',{flag:'wx'});
console.log(rows);
