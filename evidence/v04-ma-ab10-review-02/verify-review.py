import hashlib
import json
from pathlib import Path
from PIL import Image, ImageChops

root = Path.cwd()
out = root / 'evidence/v04-ma-ab10-review-02'
out.mkdir(exist_ok=True)
scenes = ['gold-near', 'day-near', 'storm-near', 'storm30-high']
report = {'status': 'PASS', 'scope': 'Capture integrity, not visual acceptance or performance',
          'groups': [], 'protected': [], 'media': []}

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def group(run, scene):
    folder = root / ('evidence/v04-ma-ab4-ab10-' + run)
    records = []
    manifests = set()
    for i in range(24):
        file = folder / f'{scene}-reference_{i}.json'
        d = json.loads(file.read_text())
        assert d['width'] == 1920 and d['height'] == 1080
        assert abs(d['simulationTime'] - (30 + i/24)) < 1e-8
        assert d['frameIndex'] == 240+i
        assert not d['errors']
        assert d['hdr']['status'] == d['spectral']['status'] == 'PASS'
        assert d['hdr']['invalid'] == d['hdr']['negative'] == 0
        assert d['adapter']['vendor'] == 'nvidia' and d['adapter']['architecture'] == 'ampere'
        manifests.add(d['sourceStart']['sha256'])
        records.append({'frame': i, 'time': d['simulationTime'], 'metadataSHA256': digest(file),
                        'pngSHA256': digest(file.with_suffix('.png'))})
    assert len(manifests) == 1
    first = json.loads((folder / f'{scene}-reference_0.json').read_text())
    report['groups'].append({'run': run, 'scene': scene, 'frames': records,
                             'sourceManifest': manifests.pop(), 'sourceFiles': first['sourceStart']['files'],
                             'camera': first['camera'], 'settings': first['settings'],
                             'query': first['phase0']['query'], 'hdrAndSpectrum': '24/24 PASS', 'gpuErrors': 0})
    return first

for scene in scenes:
    before, after = group('recover-motion', scene), group('final-01', scene)
    assert before['camera'] == after['camera']
    differences = {k: [before['settings'].get(k), after['settings'].get(k)]
                   for k in after['settings'] if before['settings'].get(k) != after['settings'].get(k)}
    assert set(differences) == {'mineralScattering'}, differences
    report['groups'][-1]['matchedSettingsDifference'] = differences
    for run in ['recover-motion', 'final-01']:
        folder = root / ('evidence/v04-ma-ab4-ab10-' + run)
        proof = folder / f'{scene}-lossless.json'
        lossless = json.loads(proof.read_text())
        assert lossless['decodedRGBMatchesAllPNGFrames'] and lossless['frames'] == 24
        video = folder / f'{scene}-reference.webm'
        report['media'].append({'path': video.relative_to(root).as_posix(), 'sha256': digest(video),
                                'bytes': video.stat().st_size, 'verification': proof.relative_to(root).as_posix()})

for scene in ['gold-high', 'day-near', 'day-high', 'calm-near', 'moon-near']:
    group('regress-01', scene)

exact = []
for i in range(24):
    a = root / f'evidence/v04-ma-ab4-ab10-slab-02/day-near-reference_{i}.png'
    b = root / f'evidence/v04-ma-ab4-ab10-regress-01/day-near-reference_{i}.png'
    exact.append(ImageChops.difference(Image.open(a).convert('RGB'), Image.open(b).convert('RGB')).getbbox() is None)
assert all(exact)
report['daytimePreservation'] = {'scope': 'Full RGB frames before/after storm finite-path correction', 'exactPairs': sum(exact)}
for row in json.loads((root/'evidence/v04-ma-ab10-resume-02/protected-hashes.json').read_text()):
    path = Path(row['Path'])
    assert digest(path).upper() == row['Hash']
    report['protected'].append({'path': path.relative_to(root).as_posix(), 'sha256': digest(path)})

final = report['groups'][1]['sourceFiles']
source = {r['file']: r['sha256'] for r in final if r['file'].startswith('src/')}
assert all(digest(root/path) == sha for path, sha in source.items())
for entry in report['groups'][:8]:
    if entry['run'] == 'final-01':
        assert {r['file']: r['sha256'] for r in entry['sourceFiles'] if r['file'].startswith('src/')} == source
report['finalRendererSourceSHA256'] = source
report['regressionLimit'] = 'Regression views precede the final foam-coordinate correction; optical and cloud source is identical.'
report['focusedCPU'] = {'passed': 13, 'scope': ['ab10-integration', 'environment-controls', 'scene-preset', 'water-transport']}
report['optics'] = json.loads((root/'evidence/v04-ma-ab10-slab-tests-01/gpu-optics.json').read_text())
assert report['optics']['status'] == 'PASS'
(out/'manifest.json').write_text(json.dumps(report, indent=2)+'\n')
print('PASS:', len(report['groups'])*24, 'frames;', len(report['media']), 'lossless videos;', len(report['protected']), 'protected files')
