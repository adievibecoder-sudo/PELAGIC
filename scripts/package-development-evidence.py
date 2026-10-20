"""Package every v03 evidence file; retain 0.2 via its immutable release asset."""
import hashlib
import json
from pathlib import Path
import zipfile

root = Path(__file__).resolve().parents[1]
output = root.parent/'pelagic-0.3-dev.1-evidence.zip'
files = sorted(p for d in (root/'evidence').glob('v03-*') for p in d.rglob('*') if p.is_file())
manifest = {'version':'0.3.0-dev.1','scope':'All v03 evidence, including rejected experiments. Visual acceptance FAIL. Historical evidence remains in immutable v0.2.0.', 'files':[]}
for file in files:
    with file.open('rb') as stream:
        checksum = hashlib.file_digest(stream, 'sha256').hexdigest()
    manifest['files'].append({'path':file.relative_to(root).as_posix(),'bytes':file.stat().st_size,'sha256':checksum})
with zipfile.ZipFile(output, 'x', compression=zipfile.ZIP_DEFLATED, compresslevel=1, allowZip64=True) as archive:
    archive.writestr('EVIDENCE-MANIFEST.json', json.dumps(manifest, indent=2))
    for file in files:
        archive.write(file, file.relative_to(root).as_posix())
with output.open('rb') as stream:
    checksum = hashlib.file_digest(stream, 'sha256').hexdigest()
if output.stat().st_size >= 2*1024**3:
    raise SystemExit('Archive exceeds GitHub per-asset limit; split by stage before upload.')
release = {
    'version':'0.3.0-dev.1',
    'release':'https://github.com/adievibecoder-sudo/PELAGIC/releases/tag/v0.3.0-dev.1',
    'visualAcceptance':'FAIL',
    'evidence':{'name':output.name,'bytes':output.stat().st_size,'sha256':checksum,
                'url':'https://github.com/adievibecoder-sudo/PELAGIC/releases/download/v0.3.0-dev.1/'+output.name,
                'files':len(files)},
    'baselineEvidence':{
        'name':'pelagic-0.2-complete.zip','bytes':776649115,
        'sha256':'d75e7b45be765849af10fb303226c1d77aa66c3bf40ca9791d72b384280e35f8',
        'url':'https://github.com/adievibecoder-sudo/PELAGIC/releases/download/v0.2.0/pelagic-0.2-complete.zip',
        'prefix':'pelagic-0.2/','manifest':'pelagic-0.2/RELEASE-MANIFEST.json'
    }
}
(root/'publication/pelagic-0.3-dev.1-assets.json').write_text(json.dumps(release,indent=2)+'\n')
output.with_suffix('.sha256').write_text(checksum+'  '+output.name+'\n')
print(json.dumps(release['evidence'],indent=2))
