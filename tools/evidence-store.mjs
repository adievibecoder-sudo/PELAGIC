import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');

export async function sourceManifest(root) {
  const files = [];
  async function walk(dir) {
    for (const item of await fs.readdir(path.join(root, dir), {withFileTypes:true})) {
      const rel = path.posix.join(dir, item.name);
      if (item.isDirectory() && ['src','tests','tools'].includes(rel.split('/')[0])) await walk(rel);
      else if (item.isFile() && /\.(js|mjs|html)$/.test(rel)) files.push(rel);
    }
  }
  await walk('');
  files.sort();
  const entries = await Promise.all(files.map(async file => ({file,sha256:sha(await fs.readFile(path.join(root,file)))})));
  return {head:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),sha256:sha(JSON.stringify(entries)),files:entries};
}

export async function writeEvidence(root, stage, name, bytes) {
  if (!/^(stage-0[1-4]|v03-[a-z0-9-]{1,40}|v04-(p[01]|ma)[a-z0-9-]{0,40})$/.test(stage) ||
      !/^[a-zA-Z0-9_-]+\.(png|webm|json)$/.test(name)) throw new Error('Invalid evidence path');
  const dir=path.join(root,'evidence',stage);
  await fs.mkdir(dir,{recursive:true});
  await fs.writeFile(path.join(dir,name),bytes,{flag:'wx'});
  return {bytes:bytes.length,sha256:sha(bytes)};
}
