// Seal the checkpoint inventory. Original files and frozen refs are read only.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {sourceManifest} from '../tools/evidence-store.mjs';

const output=process.argv[2];
if(!output||!/^evidence\/v04-ma-[a-z0-9-]+\/manifest\.json$/.test(output))throw Error('Specify a new evidence/v04-ma-<run>/manifest.json');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const expected={main:'151aadaa6d2402c46f4e02454f2fc33ab7744661',
  'development/pelagic-0.3':'87ce051ce43dd03b2967034ae2ca4d560a17f222',
  'v0.2.0^{}':'151aadaa6d2402c46f4e02454f2fc33ab7744661',
  'v0.3.0-dev.1^{}':'be3f5c47d923e90303dece20ed19dbfc4bb17636'};
const frozen=Object.fromEntries(Object.keys(expected).map(ref=>[ref,git('rev-parse',ref)]));
for(const ref of Object.keys(expected))if(frozen[ref]!==expected[ref])throw Error('Frozen ref changed: '+ref);
const preserved=JSON.parse(await fs.readFile('evidence/v04-ma-preservation-20261022/manifest.json','utf8'));
for(const item of preserved.files)if(sha(await fs.readFile(item.path))!==item.sha256)throw Error('Preserved original changed: '+item.path);
const files=[];
async function walk(dir){
  for(const entry of await fs.readdir(dir,{withFileTypes:true})){
    const file=path.posix.join(dir,entry.name);
    if(entry.isDirectory())await walk(file);
    else if(file!==output){const bytes=await fs.readFile(file);files.push({path:file,bytes:bytes.length,sha256:sha(bytes)});}
  }
}
for(const entry of await fs.readdir('evidence',{withFileTypes:true}))if(entry.isDirectory()&&entry.name.startsWith('v04-ma-'))await walk('evidence/'+entry.name);
files.sort((a,b)=>a.path.localeCompare(b.path));
const result={utc:new Date().toISOString(),source:await sourceManifest(process.cwd()),frozen,
  preservedCurrentOriginals:preserved.files.length,files,bytes:files.reduce((s,v)=>s+v.bytes,0),
  scope:'Local byte inventory, source attestation and preserved local refs only. Not remote publication, visual acceptance or branch protection. Source snapshots accompany some rejected experiments; hashes alone cannot recreate an unsaved intermediate shader.'};
await fs.mkdir(path.dirname(output),{recursive:true});
await fs.writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log({files:files.length,bytes:result.bytes,preserved:result.preservedCurrentOriginals,output});
