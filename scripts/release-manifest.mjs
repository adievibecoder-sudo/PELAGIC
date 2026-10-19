import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destination = path.join(root, 'RELEASE-MANIFEST.json');
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const paths = [];
async function walk(directory) {
  for (const entry of await fs.readdir(directory, {withFileTypes: true})) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(filename);
    else if (filename !== destination) paths.push(filename);
  }
}
await walk(root);
const files = [];
for (const filename of paths.sort()) {
  const bytes = await fs.readFile(filename);
  files.push({path: path.relative(root, filename).replaceAll('\\', '/'), bytes: bytes.length, sha256: sha256(bytes)});
}
if (process.argv.includes('--verify')) {
  const expected = JSON.parse(await fs.readFile(destination, 'utf8')).files;
  const actual = new Map(files.map(file => [file.path, file]));
  const errors = [];
  for (const file of expected) {
    const found = actual.get(file.path);
    if (!found) errors.push(`Missing: ${file.path}`);
    else if (found.bytes !== file.bytes || found.sha256 !== file.sha256) errors.push(`Changed: ${file.path}`);
    actual.delete(file.path);
  }
  for (const name of actual.keys()) errors.push(`Additional: ${name}`);
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  else console.log(`PASS: ${files.length} files match the release manifest.`);
} else {
  await fs.writeFile(destination, JSON.stringify({version: '0.1.0', generated: new Date().toISOString(), files}, null, 2) + '\n');
  console.log(`Wrote ${files.length} SHA-256 records.`);
}
