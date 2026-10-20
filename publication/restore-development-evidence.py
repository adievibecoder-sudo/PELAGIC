"""Restore versioned development evidence; refuse changed local files."""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import tempfile
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[1]


def digest(path):
    with path.open('rb') as source:
        return hashlib.file_digest(source, 'sha256').hexdigest()


def destination(name):
    relative = PurePosixPath(name)
    if relative.is_absolute() or '..' in relative.parts or '\\' in name or ':' in name or not name.startswith('evidence/'):
        raise ValueError(f'Unsafe evidence path: {name}')
    target = (ROOT/name).resolve()
    if not target.is_relative_to(ROOT):
        raise ValueError(f'Path outside checkout: {name}')
    return target


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archive', type=Path, help='Use an existing evidence archive.')
    parser.add_argument('--baseline-archive', type=Path, help='Use the existing immutable 0.2 complete archive.')
    parser.add_argument('--verify', action='store_true', help='Check local files against the downloaded manifest.')
    args = parser.parse_args()
    release = json.loads((ROOT/'publication/pelagic-0.3-dev.1-assets.json').read_text())
    for asset, local in [(release['baselineEvidence'], args.baseline_archive), (release['evidence'], args.archive)]:
        restore(asset, local, args.verify)


def restore(asset, local, verify_only):
    with tempfile.TemporaryDirectory(prefix='pelagic-evidence-') as temporary:
        archive = local or Path(temporary)/asset['name']
        if not local:
            print('Downloading', asset['url'], flush=True)
            with urllib.request.urlopen(asset['url'], timeout=120) as source, archive.open('wb') as output:
                while block := source.read(4*1024*1024):
                    output.write(block)
        if archive.stat().st_size != asset['bytes'] or digest(archive) != asset['sha256']:
            raise SystemExit('Archive hash/size mismatch; nothing restored.')
        with zipfile.ZipFile(archive) as bundle:
            prefix = asset.get('prefix', '')
            manifest = json.loads(bundle.read(asset.get('manifest', 'EVIDENCE-MANIFEST.json')))
            pending = []
            files = [item for item in manifest['files'] if item['path'].startswith('evidence/')]
            # Validate all archive/local content before the first write.
            for item in files:
                target = destination(item['path'])
                data = bundle.read(prefix+item['path'])
                if len(data) != item['bytes'] or hashlib.sha256(data).hexdigest() != item['sha256']:
                    raise SystemExit('Invalid archive member: '+item['path'])
                if target.exists():
                    if not target.is_file() or digest(target) != item['sha256']:
                        raise SystemExit('Refusing to overwrite different local content: '+item['path'])
                elif verify_only:
                    raise SystemExit('Missing local file: '+item['path'])
                else:
                    pending.append((item, target))
            for item, target in pending:
                target.parent.mkdir(parents=True, exist_ok=True)
                with target.open('xb') as output:
                    output.write(bundle.read(prefix+item['path']))
        print(f"PASS: {len(files)} evidence files verified; {len(pending)} restored.")


if __name__ == '__main__':
    main()
