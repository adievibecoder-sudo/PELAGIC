import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const root = process.cwd();
const destination = 'evidence/v04-ab3-recovery-verified-20261024-02';
fs.mkdirSync(destination);
const git = (...args) => execFileSync('git', args, {encoding:'utf8'});
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const files = [...new Set([...git('ls-files','-m','-z').split('\0'),
  ...git('ls-files','--others','--exclude-standard','-z').split('\0')].filter(Boolean))];
const records = files.map(file => {
  const target=path.join(destination,'working',file);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.copyFileSync(file,target,fs.constants.COPYFILE_EXCL);
  if(hash(file)!==hash(target))throw Error(`Copy mismatch: ${file}`);
  return {file,bytes:fs.statSync(file).size,sha256:hash(file)};
});
const evidence=[];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,entry.name);
  if(entry.isDirectory())walk(file);
  else evidence.push({file,bytes:fs.statSync(file).size,sha256:hash(file)});
}}
for(const dir of fs.readdirSync('evidence').filter(x=>x.startsWith('v04-ma-ab2-')))walk(path.join('evidence',dir));
const report={head:git('rev-parse','HEAD').trim(),status:git('status','--short','--branch'),records,evidence};
fs.writeFileSync(path.join(destination,'manifest.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({destination,head:report.head,workingFiles:records.length,evidenceFiles:evidence.length,evidenceBytes:evidence.reduce((s,x)=>s+x.bytes,0)}));
