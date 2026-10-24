// Verify the development checkpoint and freshly downloaded Milestone A media.
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';

const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:16*1024*1024}).trim();
const checkpoint=git('rev-parse',process.argv[2]||'HEAD');
const output=process.argv[3];
const baseline=process.argv[4]?git('rev-parse',process.argv[4]):null;
if(!output||!/^evidence\/v04-ma-[a-z0-9-]+\/publication\.json$/.test(output))throw Error('Specify a new evidence/v04-ma-<run>/publication.json');
const expected={
  'refs/heads/main':'151aadaa6d2402c46f4e02454f2fc33ab7744661',
  'refs/tags/v0.2.0^{}':'151aadaa6d2402c46f4e02454f2fc33ab7744661',
  'refs/heads/development/pelagic-0.3':'87ce051ce43dd03b2967034ae2ca4d560a17f222',
  'refs/tags/v0.3.0-dev.1^{}':'be3f5c47d923e90303dece20ed19dbfc4bb17636',
  'refs/heads/development/pelagic-0.4':checkpoint,
};
const refs=Object.fromEntries(git('ls-remote','origin',...Object.keys(expected)).split('\n').map(line=>{
  const [sha,ref]=line.split(/\s+/);return [ref,sha];
}));
for(const [ref,sha] of Object.entries(expected))if(refs[ref]!==sha)throw Error('Remote ref mismatch: '+ref);
const changed=baseline?new Set(git('diff','--name-only',baseline,checkpoint).split('\n')):null;
const files=JSON.parse(git('lfs','ls-files','--json',checkpoint)).files.filter(f=>changed?changed.has(f.name):f.name.startsWith('evidence/v04-ma-'));
const objects=[...new Map(files.map(f=>[f.oid,f])).values()];
if(!objects.length)throw Error('No selected media objects found');
const storage=path.resolve('evidence','.remote-lfs-'+checkpoint.slice(0,12));
await mkdir(storage); // Reject an existing cache so verification requires a fresh download.
execFileSync('git',['-c','lfs.storage='+storage,'lfs','fetch','origin',checkpoint,'--include='+files.map(f=>f.name).join(','),'--exclude='],{stdio:'inherit'});
let bytes=0;
for(const {oid,size} of objects){
  const data=await readFile(path.join(storage,'objects',oid.slice(0,2),oid.slice(2,4),oid));
  if(data.length!==size||createHash('sha256').update(data).digest('hex')!==oid)throw Error('Downloaded object mismatch: '+oid);
  bytes+=size;
}
const report={utc:new Date().toISOString(),status:'PASS',checkpoint,baseline,remote:git('remote','get-url','origin'),remoteRefs:refs,
  lfs:{freshDownload:true,mediaPaths:files.length,uniqueObjects:objects.length,bytes,sha256Matches:true},
  scope:`Published development ref, unchanged frozen refs and ${baseline?'all LFS objects in files changed since '+baseline:'all Milestone A LFS objects'} freshly downloaded and hashed. Git-stored preservation copies remain covered by the commit and local manifest. No ruleset, visual-quality or owner-approval claim.`};
await mkdir(path.dirname(output),{recursive:true});
await writeFile(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(report,null,2));
