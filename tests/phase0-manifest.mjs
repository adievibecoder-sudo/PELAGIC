// Archive integrity is separate from scientific and visual acceptance.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readdir, readFile, writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

process.chdir(fileURLToPath(new URL('../',import.meta.url)));
const output='evidence/v04-p0-review/manifest.json';
const stages=['preflight','clouds','motion','performance','science','review'];
const json=async path=>JSON.parse(await readFile(path,'utf8'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const checks=[];
function check(name,fn){fn();checks.push({name,status:'PASS'});}
function adapter(data){
  assert.equal(data.adapter.vendor,'nvidia');
  assert.equal(data.adapter.architecture,'ampere');
  assert.doesNotMatch(JSON.stringify(data.adapter),/swiftshader|llvmpipe|lavapipe|warp|microsoft basic render|softpipe/i);
  assert.deepEqual(data.errors,[]);
}
const stillNames=[];
for(const scene of ['midday','golden','storm','overcast'])
  for(const model of ['baseline','continuous','cells'])stillNames.push(`${scene}-${model}`);
for(const model of ['baseline','continuous','cells'])stillNames.push(`opacity-${model}`);
for(const scene of ['midday','golden','storm'])stillNames.push(`${scene}-desat-off`);
for(const term of ['body','reflection','glitter','normals'])stillNames.push(`midday-${term}`);
const stills={};
for(const name of stillNames){
  const d=stills[name]=await json(`evidence/v04-p0-clouds/${name}.json`);
  const png=await readFile(`evidence/v04-p0-clouds/${name}.png`);
  check(`still ${name}: adapter, errors, finite HDR and 1080p`,()=>{
    adapter(d);assert.equal(d.backend,'native-webgpu');
    assert.equal(d.width,1920);assert.equal(d.height,1080);
    assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    assert.equal(png.readUInt32BE(16),1920);assert.equal(png.readUInt32BE(20),1080);
    assert.equal(d.hdr.status,'PASS');assert.equal(d.hdr.invalid,0);
    assert.equal(d.settings.seed,1307);assert.equal(d.settings.adaptive,false);
    assert.equal(d.settings.quality,'Balanced');assert.equal(d.frameIndex,100);
    assert.ok(Math.abs(d.simulationTime-(20+100/60))<1e-9);
    if(d.cloudColumns)assert.equal(d.cloudColumns.invalid,0);
  });
}
const conditions=d=>({settings:d.settings,camera:d.camera,width:d.width,height:d.height,time:d.simulationTime});
for(const scene of ['midday','golden','storm','overcast','opacity']){
  check(`${scene}: baseline/candidate settings, pose, exposure and time match`,()=>{
    for(const model of ['continuous','cells'])assert.deepEqual(conditions(stills[`${scene}-${model}`]),conditions(stills[`${scene}-baseline`]));
  });
}
for(const scene of ['midday','golden','storm'])check(`${scene}: desaturation A/B conditions match`,()=>{
  assert.deepEqual(conditions(stills[`${scene}-desat-off`]),conditions(stills[`${scene}-baseline`]));
});
const clips=['cloud-baseline','cloud-continuous','cloud-cells','storm','waterline','skim','weather-baseline','weather-cells','frozen-skim'];
const decode=await json('evidence/v04-p0-review/motion-decode.json');
for(const name of clips){
  const d=await json(`evidence/v04-p0-motion/${name}.json`);
  check(`motion ${name}: adapter, no logged GPU errors, decoded original`,()=>{
    adapter(d);assert.equal(d.backend,'native-webgpu');
    assert.equal(d.width,1920);assert.equal(d.height,1080);
    assert.equal(decode[name].decodeErrors,'');assert.ok(decode[name].frames>1);
    assert.equal(decode[name].width,1920);assert.equal(decode[name].height,1080);
    // The final frame duration is absent; verify only first-to-last packet span.
    assert.ok(decode[name].duration>9 && decode[name].duration<11);
  });
}
const frozen=await json('evidence/v04-p0-motion/frozen-skim.json');
check('frozen control: time and height unchanged',()=>{
  assert.equal(frozen.settings.paused,true);
  assert.ok(frozen.frameRecords.every(f=>f.time===20));
  assert.equal(new Set(frozen.frameRecords.map(f=>f.readbackHeight)).size,1);
});
const probe=await json('evidence/v04-p0-preflight/hardware-probe.json');
const renderer=await json('evidence/v04-p0-preflight/renderer-identity.json');
const fft=await json('evidence/v04-p0-preflight/gpu-fft.json');
const optics=await json('evidence/v04-p0-preflight/gpu-optics.json');
check('probe, renderer, FFT and optics agree on NVIDIA/Ampere',()=>{
  [probe,renderer,fft,optics].forEach(adapter);
  assert.equal(probe.computeReadback.passed,true);
  assert.equal(probe.computeReadback.value,0x50454c41);
  assert.equal(renderer.backend,'native-webgpu');assert.equal(fft.status,'PASS');
  const channels=fft.tests.flatMap(t=>t.channels);assert.equal(channels.length,9);
  assert.ok(channels.every(c=>c.status==='PASS' && c.invalid===0));
  const groups=Object.values(optics).filter(v=>v?.status);assert.equal(groups.length,5);
  assert.ok(groups.every(v=>v.status==='PASS'));
});
const baseline=await json('evidence/v04-p0-preflight/baseline-integrity.json');
check('preserved 0.3 verification record',()=>{
  assert.equal(baseline.files,821);assert.deepEqual(baseline.mismatches,[]);
  assert.equal(baseline.archiveSHA256,baseline.expectedSHA256);
});
const pixels=await json('evidence/v04-p0-review/baseline-pixels.json');
const baselinePNG=await readFile('evidence/v04-p0-preflight/renderer-identity.png');
check('fresh preflight PNG matches retained 0.3 comparison record',()=>{
  assert.equal(pixels.identical,true);assert.equal(pixels.status,'PASS');
  assert.equal(sha(baselinePNG),pixels.images[1].sha256);
  assert.equal(pixels.images[0].decodedRGBAsha256,pixels.images[1].decodedRGBAsha256);
});
const cpu=await readFile('evidence/v04-p0-science/cpu-tests-final.txt','utf8');
check('retained final CPU test run',()=>{
  assert.match(cpu,/# tests 26\b/);assert.match(cpu,/# pass 26\b/);assert.match(cpu,/# fail 0\b/);
});
for(const name of ['golden-balanced','golden-high-profile','storm-balanced','storm-matched-balanced']){
  const d=await json(`evidence/v04-p0-performance/${name}.json`);
  check(`benchmark ${name}: adapter/errors/visibility`,()=>{
    adapter(d);assert.equal(d.timingMode,'requestAnimationFrame, display paced');
    assert.ok(d.frameRecords.length>0);assert.ok(d.frameRecords.every(f=>f.visibility==='visible'));
  });
}
async function walk(dir){
  const files=[];
  for(const entry of await readdir(dir,{withFileTypes:true})){
    const path=`${dir}/${entry.name}`;
    if(entry.isDirectory())files.push(...await walk(path));else if(entry.isFile())files.push(path);
  }
  return files;
}
const source=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'})
  .split('\0').filter(p=>p && !p.startsWith('evidence/'));
const evidence=(await Promise.all(stages.map(s=>walk(`evidence/v04-p0-${s}`)))).flat().filter(p=>p!==output);
const files=[];
for(const path of [...new Set([...source,...evidence])].sort()){
  const bytes=await readFile(path);files.push({path,bytes:bytes.length,sha256:sha(bytes),kind:path.startsWith('evidence/')?'evidence':'delivery-source'});
}
if(process.argv.includes('--write')){
  await writeFile(output,JSON.stringify({schema:1,createdUTC:new Date().toISOString(),
    sourceScope:'Final delivery source snapshot, not a contemporaneous per-capture source attestation. Captures labeled a1092a0-lab used evolving diagnostic instrumentation; no per-capture source hashes were saved. Default WGSL preservation is separately tested.',
    excluded:'Third-party local research package, old 0.2/0.3 evidence, .git, ignored local files, and this manifest itself.',
    hardwareScope:'NVIDIA/Ampere is application-reported. RTX 3050 corroboration also relies on retained OS diagnostics and attributed owner chrome://gpu text; no original chrome://gpu export.',
    counts:{stills:stillNames.length,motion:clips.length,files:files.length},checks,files},null,2)+'\n');
  console.log(`WROTE ${output}: ${files.length} hashes, ${checks.length} archive checks`);
}else{
  const saved=await json(output);
  assert.deepEqual(files,saved.files,'Archive changed; inspect differences before explicitly regenerating the manifest.');
  assert.deepEqual(checks,saved.checks);
  console.log(`PASS: ${files.length} SHA-256 hashes; ${checks.length} archive checks; 22 stills / 9 motion clips. Visual acceptance is separate.`);
}
