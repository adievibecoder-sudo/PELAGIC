import {N,CASCADES} from '../src/wgsl/common.js';
import {decodeHalf,stats,PATCHES,jonswap,logIntegral} from '../src/numerics.js';
export async function spectralReadback(device,{h0,specA,disp,deriv,mom},settings) {
 const B=GPUBufferUsage,n=N,C=CASCADES,size=n*n*C;
 const h=device.createBuffer({size:size*16,usage:B.COPY_DST|B.MAP_READ});
 const sp=device.createBuffer({size:size*16,usage:B.COPY_DST|B.MAP_READ});
 const arrays=[disp,deriv,mom].map(()=>device.createBuffer({size:size*8,usage:B.COPY_DST|B.MAP_READ}));
 const enc=device.createCommandEncoder();enc.copyBufferToBuffer(h0,0,h,0,size*16);enc.copyBufferToBuffer(specA,0,sp,0,size*16);
 [disp,deriv,mom].forEach((t,i)=>enc.copyTextureToBuffer({texture:t},{buffer:arrays[i],bytesPerRow:n*8,rowsPerImage:n},[n,n,C]));
 device.queue.submit([enc.finish()]);await Promise.all([h,sp,...arrays].map(b=>b.mapAsync(GPUMapMode.READ)));
 const coeff=new Float32Array(h.getMappedRange()),spectrum=new Float32Array(sp.getMappedRange());
 const data=arrays.map(b=>new Uint16Array(b.getMappedRange()));
 const cascades=[];
 for(let c=0;c<C;c++){
   let ensemble=0,actual=0,hermitian=0,sxEnergy=0,szEnergy=0,crossEnergy=0;
   const heights=new Float64Array(n*n),sx=new Float64Array(n*n),sz=new Float64Array(n*n);
   let lostMoment=0;
   for(let y=0;y<n;y++)for(let x=0;x<n;x++){
     const i=(c*n*n+y*n+x)*4,j=(c*n*n+((n-y)%n)*n+(n-x)%n)*4;
     const hr=(spectrum[i+2]+spectrum[j+2])*.5,hi=(spectrum[i+3]-spectrum[j+3])*.5;
     const kx=(x>=n/2?x-n:x)*2*Math.PI/PATCHES[c],kz=(y>=n/2?y-n:y)*2*Math.PI/PATCHES[c];
     const energy=hr*hr+hi*hi;actual+=energy;sxEnergy+=kx*kx*energy;szEnergy+=kz*kz*energy;crossEnergy+=kx*kz*energy;
     ensemble+=2*(coeff[i]*coeff[i]+coeff[i+1]*coeff[i+1]);
     hermitian=Math.max(hermitian,Math.abs(coeff[i+2]-coeff[j]),Math.abs(coeff[i+3]+coeff[j+1]));
     heights[y*n+x]=decodeHalf(data[0][i+1]);sx[y*n+x]=decodeHalf(data[1][i]);sz[y*n+x]=decodeHalf(data[1][i+1]);
     lostMoment=Math.max(lostMoment,Math.abs(decodeHalf(data[2][i])-sx[y*n+x]**2));
   }
   const hStats=stats(heights),xs=stats(sx),zs=stats(sz);
   const parseval=Math.abs(hStats.variance-actual)/Math.max(actual,1e-20);
   const slopeParseval=[Math.abs(xs.variance-sxEnergy)/Math.max(sxEnergy,1e-20),Math.abs(zs.variance-szEnergy)/Math.max(szEnergy,1e-20)];
   cascades.push({patchMetres:PATCHES[c],height:hStats,slopeX:xs,slopeZ:zs,phaseAverageVariance:ensemble,spectralInstantVariance:actual,significantHeightInstant:4*Math.sqrt(hStats.variance),parsevalRelative:parseval,slopeParsevalRelative:slopeParseval,hermitianMaxError:hermitian,slopeVarianceSpectral:[sxEnergy,szEnergy,crossEnergy],momentMaxAbsoluteRounding:lostMoment,status:parseval<.0015&&slopeParseval.every(v=>v<.0015)&&hermitian<1e-7&&hStats.invalid===0&&xs.invalid===0&&zs.invalid===0?'PASS':'FAIL'});
 }
 [h,sp,...arrays].forEach(b=>{b.unmap();b.destroy();});
 const U=settings.windSpeed,F=settings.fetchKm*1000,wp=22*(9.81**2/(U*F))**(1/3),alpha=.076*(U*U/(F*9.81))**.22;
 const windM0=logIntegral(w=>jonswap(w,wp,alpha),wp*.08,wp*100);
 const observedM0=cascades.reduce((s,c)=>s+c.height.variance,0);
 return {status:cascades.every(c=>c.status==='PASS')?'PASS':'FAIL',cascades,
   continuousGravitySpectrum:{windM0,windPeakPeriod:2*Math.PI/wp,swellTargetM0:(settings.swellHs/4)**2,combinedTargetHs:4*Math.sqrt(windM0+(settings.swellHs/4)**2)},
   measuredIndependentCascadeHs:4*Math.sqrt(observedM0),
   slopeVarianceLinear:cascades.reduce((s,c)=>s+c.slopeX.variance+c.slopeZ.variance,0),
   coxMunkReferenceAtUnconvertedU10:.003+.00512*U,
   observationalStatus:'UNVERIFIED: one realization, linear slopes; Cox-Munk uses U12.5, not U10; no ensemble confidence interval.',
   whitecapStatus:'UNVERIFIED: no long-duration, area-weighted coverage observation.',
   tolerance:'Parseval <0.0015 includes binary16 storage; conjugate coefficients <1e-7. Zero NaN/Inf in sampled fields.'};
}
