import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {writeEvidence} from '../tools/evidence-store.mjs';

test('evidence writes reject collisions and traversal without altering originals',async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'pelagic-evidence-'));
  try{
    const original=Buffer.from('original');
    await writeEvidence(root,'v04-ma-test','capture.png',original);
    await assert.rejects(writeEvidence(root,'v04-ma-test','capture.png',Buffer.from('replacement')),{code:'EEXIST'});
    assert.deepEqual(await fs.readFile(path.join(root,'evidence/v04-ma-test/capture.png')),original);
    await assert.rejects(writeEvidence(root,'../outside','capture.png',original));
    await assert.rejects(writeEvidence(root,'v04-ma-test','../capture.png',original));
  }finally{await fs.rm(root,{recursive:true});}
});
