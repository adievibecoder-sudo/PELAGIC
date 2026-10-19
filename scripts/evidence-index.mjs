import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),evidence=path.join(root,'evidence');
const mean=(a,k)=>a.length?a.reduce((s,v)=>s+v[k],0)/a.length:null;
const percentile=(a,p)=>a.length?[...a].sort((a,b)=>a-b)[Math.min(a.length-1,Math.floor(a.length*p))]:null;
const files=[];async function walk(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())await walk(f);else if(e.name!=='manifest.json'&&e.name!=='results.json')files.push(f);}}
await walk(evidence);const manifest=[];
for(const f of files){const bytes=await fs.readFile(f);manifest.push({file:path.relative(root,f).replaceAll('\\','/'),bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});}
const matrix=[],benchmarks=[];
for(const f of files.filter(f=>f.endsWith('.json'))){let r;try{r=JSON.parse(await fs.readFile(f,'utf8'));}catch{continue;}
 const name=path.basename(f,'.json');
 if(path.basename(path.dirname(f))==='stage-04' && (/^(calm|midday|golden|storm|twilight|moonlit)-h/.test(name)||['underwater-window','underwater-horizon','half-submerged','close-wave'].includes(name)))matrix.push({name,width:r.width,height:r.height,checkpoint:r.sourceCheckpoint,status:r.errors?.length?'FAIL':'PASS',hdr:r.hdr?.status||'UNVERIFIED',spectral:r.spectral?.cascades.every(c=>c.status==='PASS')?'PASS':'UNVERIFIED',meaning:'Capture completed without reported WebGPU errors; visual quality separately assessed.',errors:r.errors});
 if((name.includes('paced')||name.includes('isolated'))&&r.measurements){const m=r.measurements,f=r.frameRecords||[];benchmarks.push({name,method:r.timingMode||'queue-completion capture throughput',runFrameCount:r.frameIndex,gpuSamples:m.length,frameSamples:f.length,frameWindowSeconds:f.reduce((s,x)=>s+x.frame,0)/1000,windowNote:'Frame records retain the last 4000 frames; GPU samples span the run after frame 30.',gpuMeanMs:mean(m,'gpu'),cpuMeanMs:mean(f.length?f:m,'cpu'),frameMeanMs:mean(f.length?f:m,'frame'),derivedFPS:1000/mean(f.length?f:m,'frame'),p95FrameMs:percentile(f.map(x=>x.frame),.95),p99FrameMs:percentile(f.map(x=>x.frame),.99),maxFrameMs:Math.max(...f.map(x=>x.frame)),framesOver50Ms:f.filter(x=>x.frame>50).length,framesOver100Ms:f.filter(x=>x.frame>100).length,hiddenFrames:f.filter(x=>x.visibility==='hidden').length,passMs:Object.fromEntries(['simulation','atmosphere','surface','post'].map(k=>[k,mean(m,k)]))});}
}
await fs.writeFile(path.join(evidence,'manifest.json'),JSON.stringify({generated:new Date().toISOString(),files:manifest},null,2));
await fs.writeFile(path.join(evidence,'results.json'),JSON.stringify({matrixCount:matrix.length,matrix,benchmarks},null,2));
console.log(JSON.stringify({matrixCount:matrix.length,files:manifest.length,benchmarks},null,2));
