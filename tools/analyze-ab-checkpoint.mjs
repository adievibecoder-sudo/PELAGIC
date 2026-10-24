import fs from 'node:fs';
import path from 'node:path';
const root='evidence',out=path.join(root,'v04-ma-ab-checkpoint-01');
fs.mkdirSync(out,{recursive:true});
const read=(stage,name)=>JSON.parse(fs.readFileSync(path.join(root,stage,name+'.json')));
const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
const quantile=(a,p)=>[...a].sort((a,b)=>a-b)[Math.floor((a.length-1)*p)];
const scenes=['day-near','day-high','gold-near','gold-high'];
const stills=scenes.map(name=>{
 const a=read('v04-ma-base-stills-02',name),b=read('v04-ma-ab-final-stills-02',name);
 const keys=['windSpeed','windDir','swellHs','swellLength','sunElev','exposure','quality','resolution','clouds','seed'];
 return {name,matchedSettings:keys.every(k=>a.settings[k]===b.settings[k]),
  matchedCamera:JSON.stringify(a.camera)===JSON.stringify(b.camera),matchedTime:a.simulationTime===b.simulationTime,
  source:b.sourceStart.sha256,errors:b.errors,spectral:b.spectral.status,hdr:b.hdr.status,
  radianceBandChangePercent:b.hdr.radianceBands.map((v,i)=>100*(v.meanLuminance/a.hdr.radianceBands[i].meanLuminance-1)),
  foam:b.foam.layers.map(x=>({layer:x.layer,meanDensity:x.meanDensity,invalid:x.invalid})),
  scope:'Integrated changes; one-frame pre-tone-map bands include sky. Not a pure glitter energy-closure test.'};
});
const profiles=[];
for(const variant of ['base','candidate'])for(const name of scenes){
 const stage=`v04-ma-ab-profile-${variant}-03`;
 if(!fs.existsSync(path.join(root,stage,name+'.json')))continue;
 const d=read(stage,name),start=d.frameRecords[0].raf+5000;
 const frames=d.frameRecords.filter(x=>x.raf>=start),ids=new Set(frames.map(x=>x.id));
 const samples=d.measurements.filter(x=>ids.has(x.id));
 profiles.push({variant,name,source:d.sourceStart.sha256,adapter:d.adapter,width:d.width,height:d.height,
  wallSeconds:d.benchmarkWallSeconds,timingMode:d.timingMode,frames:frames.length,samples:samples.length,errors:d.errors,
  hiddenFrames:frames.filter(x=>x.visibility!=='visible').length,throughputFramesPerSecond:1000/mean(frames.map(x=>x.frame)),
  performanceComparisonValid:frames.length>=300&&!frames.some(x=>x.visibility!=='visible'),
  frameMs:{mean:mean(frames.map(x=>x.frame)),p95:quantile(frames.map(x=>x.frame),.95),p99:quantile(frames.map(x=>x.frame),.99),max:Math.max(...frames.map(x=>x.frame))},
  gpuMs:Object.fromEntries(['gpu','simulation','surface','cloudScreen','environment','post'].map(k=>[k,mean(samples.map(x=>x[k]))]))});
}
const qa={fft:read('v04-ma-ab-qa-02','gpu-fft').status,optics:read('v04-ma-ab-qa-02','gpu-optics').status,appearance:read('v04-ma-ab-qa-02','appearance-gpu').status};
const report={generated:new Date().toISOString(),stills,profiles,qa,
 scope:'RTX 3050 Laptop/Chrome native WebGPU. Explicit queue-completion 60 s profiles, first 5 s of recorded frames excluded. Throughput is not displayed FPS. Display-paced attempts in base-01/02 are retained separately and invalid for comparison because a one-second cadence recurred. GPU timestamps are quantized; allocation payload is not residency. Appearance remains experimental; A+B incomplete.'};
fs.writeFileSync(path.join(out,'analysis.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
