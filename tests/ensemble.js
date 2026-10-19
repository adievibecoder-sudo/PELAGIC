import {SIM_INIT} from '../src/wgsl/sim.js';
import {PATCHES,cosSpreadNorm} from '../src/numerics.js';
import {swellAlpha,spectrumLedger} from '../src/sea-spectrum.js';
import {preset} from '../src/settings.js';
export async function verifyEnsemble(device,progress) {
 const B=GPUBufferUsage,N=256,C=6,P=preset('golden'),bytes=N*N*C*16;
 const u=device.createBuffer({size:224,usage:B.UNIFORM|B.COPY_DST});
 const h=device.createBuffer({size:bytes,usage:B.STORAGE|B.COPY_SRC});
 const r=device.createBuffer({size:bytes,usage:B.MAP_READ|B.COPY_DST});
 const pipeline=await device.createComputePipelineAsync({layout:'auto',compute:{module:device.createShaderModule({code:SIM_INIT}),entryPoint:'main'}});
 const bg=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:u}},{binding:1,resource:{buffer:h}}]});
 const f=new Float32Array(56);f.set(PATCHES);
 for(let c=0;c<C;c++){f[8+c]=c===0?Math.PI/PATCHES[c]:f[16+c-1];f[16+c]=c<C-1?12*Math.PI/PATCHES[c+1]:Math.PI*N/PATCHES[c]*.98;}
 f.set([P.windSpeed,P.windDir*Math.PI/180,P.fetchKm*1000,3.3],40);
 const wpS=Math.sqrt(9.81*2*Math.PI/P.swellLength);f.set([P.swellHs,P.swellDir*Math.PI/180,wpS,P.swellSpread],44);
 f[24]=swellAlpha(P.swellHs,wpS);f[25]=cosSpreadNorm(P.swellSpread);f[49]=.0012;f[55]=1;
 const realizations=[];
 for(let seed=1;seed<=64;seed++){
  f[51]=seed;device.queue.writeBuffer(u,0,f);const e=device.createCommandEncoder(),p=e.beginComputePass();p.setPipeline(pipeline);p.setBindGroup(0,bg);p.dispatchWorkgroups(16,16,6);p.end();e.copyBufferToBuffer(h,0,r,0,bytes);device.queue.submit([e.finish()]);await r.mapAsync(GPUMapMode.READ);
  const a=new Float32Array(r.getMappedRange());let m0=0,mss=0,invalid=0;
  for(let c=0;c<C;c++)for(let y=0;y<N;y++)for(let x=0;x<N;x++){
   const i=((c*N+y)*N+x)*4,v=2*(a[i]*a[i]+a[i+1]*a[i+1]);const k2=((x>=128?x-256:x)**2+(y>=128?y-256:y)**2)*(2*Math.PI/PATCHES[c])**2;
   m0+=v;mss+=v*k2;if(!Number.isFinite(v))invalid++;
  }
  r.unmap();realizations.push({seed,m0,mss,invalid});progress('Independent spectral seed '+seed+'/64');
 }
 const mean=realizations.reduce((s,v)=>s+v.m0,0)/64;
 const sd=Math.sqrt(realizations.reduce((s,v)=>s+(v.m0-mean)**2,0)/63),se=sd/8,ci=[mean-1.998*se,mean+1.998*se];
 const ledger=spectrumLedger(P),target=ledger.windM0+ledger.swellM0;
 [u,h,r].forEach(b=>b.destroy());
 return {settings:P,independentSeeds:64,meanVariance:mean,standardError:se,student95Interval:ci,continuousGravityVariance:target,meanSignificantHeight:4*Math.sqrt(mean),targetSignificantHeight:4*Math.sqrt(target),meanLinearSlopeVariance:realizations.reduce((s,v)=>s+v.mss,0)/64,
 status:target>=ci[0]&&target<=ci[1]&&realizations.every(v=>v.invalid===0)?'PASS':'FAIL',realizations,
 interpretation:'64 independent Gaussian initial spectra. Student interval assumes independent seed realizations. CPU integration uses the 0.2 hybrid wind spectrum and normalized swell band. Discretization and domain cutoff bias remain. Compatibility is not oceanographic calibration.',ledger};
}
