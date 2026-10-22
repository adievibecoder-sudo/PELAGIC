// Verify a published checkpoint using fresh LFS storage, never the local cache.
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:16*1024*1024}).trim();
const checkpoint=git('rev-parse',process.argv[2]||'HEAD');
const output=process.argv[3]||'evidence/v04-p1-handoff/publication.json';
const expected={
 'refs/heads/main':'151aadaa6d2402c46f4e02454f2fc33ab7744661',
 'refs/tags/v0.2.0^{}':'151aadaa6d2402c46f4e02454f2fc33ab7744661',
 'refs/heads/development/pelagic-0.3':'87ce051ce43dd03b2967034ae2ca4d560a17f222',
 'refs/tags/v0.3.0-dev.1^{}':'be3f5c47d923e90303dece20ed19dbfc4bb17636',
 'refs/heads/development/pelagic-0.4':checkpoint
};
const refs=Object.fromEntries(git('ls-remote','origin',...Object.keys(expected)).split('\n').map(line=>{const [sha,ref]=line.split(/\s+/);return [ref,sha];}));
for(const [ref,sha]of Object.entries(expected))if(refs[ref]!==sha)throw Error('Remote ref mismatch: '+ref);
const storage=path.resolve('..','pelagic-phase1-remote-lfs-'+checkpoint.slice(0,12));
// Nonrecursive creation rejects an existing directory, guaranteeing a fresh fetch.
await mkdir(storage);
execFileSync('git',['-c','lfs.storage='+storage,'lfs','fetch','origin',checkpoint,'--include=evidence/v04-p1-*/*','--exclude='],{stdio:'inherit'});
const files=JSON.parse(git('lfs','ls-files','--json',checkpoint)).files.filter(f=>f.name.startsWith('evidence/v04-p1-'));
const objects=[...new Map(files.map(f=>[f.oid,f])).values()];let total=0;
for(const {oid,size}of objects){
 const bytes=await readFile(path.join(storage,'objects',oid.slice(0,2),oid.slice(2,4),oid));
 if(bytes.length!==size||createHash('sha256').update(bytes).digest('hex')!==oid)throw Error('Downloaded object mismatch: '+oid);
 total+=size;
}
if(!objects.length)throw Error('No Phase 1 media objects found');
const report={createdUTC:new Date().toISOString(),status:'PASS',checkpoint,remote:git('remote','get-url','origin'),remoteRefs:refs,
 lfs:{freshDownload:true,mediaPaths:files.length,uniqueObjects:objects.length,bytes:total,sha256Matches:true},
 scope:'Published checkpoint and unchanged frozen refs; all unique Phase 1 LFS objects freshly downloaded and hashed. No branch/tag ruleset or visual-quality certification.'};
await mkdir(path.dirname(output),{recursive:true});await writeFile(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(report,null,2));
