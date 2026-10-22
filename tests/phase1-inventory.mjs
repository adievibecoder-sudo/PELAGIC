// Check retained evidence without regenerating the frozen Phase 0 manifest.
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
process.chdir(fileURLToPath(new URL('../',import.meta.url)));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const expected={main:'151aadaa6d2402c46f4e02454f2fc33ab7744661','v0.2.0^{}':'151aadaa6d2402c46f4e02454f2fc33ab7744661',
  'development/pelagic-0.3':'87ce051ce43dd03b2967034ae2ca4d560a17f222','v0.3.0-dev.1^{}':'be3f5c47d923e90303dece20ed19dbfc4bb17636'};
const refs=Object.entries(expected).map(([ref,expectedSHA])=>{const actual=git('rev-parse',ref);return {ref,expected:expectedSHA,actual,status:actual===expectedSHA?'PASS':'FAIL'};});
const phase0=JSON.parse(await readFile('evidence/v04-p0-review/manifest.json','utf8'));
const retained=phase0.files.filter(f=>f.kind==='evidence'),mismatches=[];
for(const f of retained){
  try{if(sha(await readFile(f.path))!==f.sha256)mismatches.push(f.path);}catch{mismatches.push(f.path);}
}
const output=process.argv[2]||'evidence/v04-p1-tests/local-inventory.json';
const directories=(await readdir('evidence')).filter(name=>name.startsWith('v04-p1-')).sort();
const originals=[],stages=[];
for(const directory of directories){
  const entries=await readdir('evidence/'+directory).catch(()=>[]);let media=0;
  for(const name of entries.sort()){
    if(!/\.(png|webm|jpg|json|txt)$/.test(name))continue;
    const path='evidence/'+directory+'/'+name,bytes=await readFile(path),record={path,bytes:bytes.length,sha256:sha(bytes)};
    if(path===output)continue;
    if(/\.(png|webm)$/.test(name)){
      media++;
      const report=await readFile(path.replace(/\.(png|webm)$/,'.json'),'utf8').then(JSON.parse).catch(()=>null);
      if(report?.sourceCheckpoint){
        record.reportedCheckpoint=report.sourceCheckpoint;
        try{record.resolvedCommit=git('rev-parse',report.sourceCheckpoint+'^{commit}');}catch{record.resolvedCommit=null;}
        record.reportedAdapter=report.adapter;
      }
    }
    originals.push(record);
  }
  stages.push({directory,media});
}
const sources=[];
for(const path of git('ls-files').split('\n').filter(p=>!p.startsWith('evidence/'))){
  const bytes=await readFile(path);sources.push({path,bytes:bytes.length,sha256:sha(bytes)});
}
const report={createdUTC:new Date().toISOString(),head:git('rev-parse','HEAD'),branch:git('branch','--show-current'),
  scope:'Local inventory only; capture revisions are supplied labels resolved to commits, not contemporaneous source attestations. Not publication verification or phase acceptance.',
  frozenRefs:refs,phase0Evidence:{files:retained.length,mismatches,status:mismatches.length?'FAIL':'PASS'},stages,originals,sources};
await mkdir(output.slice(0,output.lastIndexOf('/')),{recursive:true});
// Existing checkpoint manifests are immutable evidence. Choose a fresh output.
await writeFile(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({frozenRefs:refs,phase0Evidence:report.phase0Evidence,stages,originals:originals.length},null,2));
if(mismatches.length||refs.some(r=>r.status==='FAIL'))process.exitCode=1;
