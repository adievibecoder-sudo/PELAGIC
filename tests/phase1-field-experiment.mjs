import fs from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {createEnvironment,frontWeight} from '../src/environment.js';
import {DEFAULTS} from '../src/settings.js';
const s=createEnvironment({...DEFAULTS,frontEnabled:true,frontX:7000,frontHeading:137}),f=s.front;
const n=256,span=64000,map=new Float32Array(n*n),cell=span/(n-1);
for(let y=0;y<n;y++)for(let x=0;x<n;x++)map[y*n+x]=frontWeight(f,x*cell-span/2,y*cell-span/2,0);
function interpolated(x,z){const u=(x+span/2)/cell,v=(z+span/2)/cell,i=Math.floor(u),j=Math.floor(v),a=u-i,b=v-j;return (map[j*n+i]*(1-a)+map[j*n+i+1]*a)*(1-b)+(map[(j+1)*n+i]*(1-a)+map[(j+1)*n+i+1]*a)*b;}
let rng=1307;function random(){rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;}
const points=Array.from({length:100000},()=>[(random()-.5)*60000,(random()-.5)*60000]);
let max=0,sq=0;for(const [x,z]of points){const e=interpolated(x,z)-frontWeight(f,x,z,0);max=Math.max(max,Math.abs(e));sq+=e*e;}
let checksum=0;const runs=[];for(let j=0;j<6;j++)for(const [name,fn]of [['analytic', (x,z)=>frontWeight(f,x,z,0)],['bilinear256',interpolated]]){
 const t=performance.now();for(const [x,z]of points)checksum+=fn(x,z);runs.push({name,ms:performance.now()-t});
}
const report={seed:1307,front:f,points:points.length,domainMeters:span,grid:256,mapSpacingMeters:cell,maxAbsoluteCoverageError:max,rmsCoverageError:Math.sqrt(sq/points.length),runs,checksum,
 decision:'Analytic event selected: exact continuous support, no map upload/coordinate rebake. CPU timings are an implementation experiment, not GPU performance. A larger multi-event meteorological field may justify a map later.',limits:'One prescribed smooth regional event; no observed weather calibration.'};
const output=process.argv[2]||'evidence/v04-p1-tests/field-experiment.json';
await fs.mkdir(output.slice(0,output.lastIndexOf('/')),{recursive:true});await fs.writeFile(output,JSON.stringify(report,null,2),{flag:'wx'});console.log(JSON.stringify(report,null,2));
