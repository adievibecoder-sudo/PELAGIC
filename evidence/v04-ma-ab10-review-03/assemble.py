import hashlib
import json
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np

root = Path.cwd()
out = Path(__file__).parent
report = {'scope': 'Existing consecutive captures; no new browser rendering or performance measurement', 'groups': [], 'protected': []}

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

for run, scene in [('diffuse-01', 'storm-near'), ('phase-01', 'storm-near'), ('phase-01', 'storm30-high'), ('phase-regress-01', 'day-near')]:
    folder = root / ('evidence/v04-ma-ab4-ab10-' + run)
    stem = scene + '-reference'
    rows = []
    sources = set()
    for i in range(24):
        path = folder / f'{stem}_{i}.json'
        record = json.loads(path.read_text())
        assert (record['width'], record['height']) == (1920, 1080)
        assert record['frameIndex'] == 240 + i
        assert abs(record['simulationTime'] - (30 + i / 24)) < 1e-8
        assert not record['errors']
        assert record['hdr']['status'] == record['spectral']['status'] == 'PASS'
        assert record['hdr']['invalid'] == record['hdr']['negative'] == 0
        assert record['adapter']['vendor'] == 'nvidia' and record['adapter']['architecture'] == 'ampere'
        sources.add(record['sourceStart']['sha256'])
        rows.append({'frame': i, 'time': record['simulationTime'], 'metadataSHA256': digest(path), 'pngSHA256': digest(path.with_suffix('.png'))})
    assert len(sources) == 1
    first = json.loads((folder / f'{stem}_0.json').read_text())
    baseline_run = 'diffuse-01' if run == 'phase-01' and scene == 'storm-near' else 'final-01'
    baseline = root / ('evidence/v04-ma-ab4-ab10-' + baseline_run)
    before = json.loads((baseline / f'{stem}_0.json').read_text())
    assert first['settings'] == before['settings']
    assert first['camera'] == before['camera']
    entry = {'run': run, 'scene': scene, 'baselineRun': baseline_run, 'sourceManifest': sources.pop(),
             'sourceFiles': first['sourceStart']['files'], 'settings': first['settings'], 'camera': first['camera'],
             'query': first['phase0']['query'], 'frames': rows, 'nativeHDRAndSpectrum': '24/24 PASS'}
    for start in ([0, 8, 16] if scene == 'day-near' else [16]):
        sheet = Image.new('RGB', (1920, 588), '#101b20')
        draw = ImageDraw.Draw(sheet)
        for j in range(8):
            im = Image.open(folder / f'{stem}_{start+j}.png').convert('RGB')
            if scene == 'storm-near':
                im = im.crop((250, 410, 1250, 910))
            im.thumbnail((480, 270))
            x, y = (j % 4) * 480, (j // 4) * 294
            sheet.paste(im, (x, y + 24))
            draw.text((x + 8, y + 5), f'{run} {scene} {30+(start+j)/24:.3f}s', fill='white')
        sheet.save(out / f'{run}-{scene}-{start:02d}-{start+7:02d}.jpg', quality=94)
    if run != 'phase-regress-01':
        movie = folder / f'{stem}.webm'
        if not movie.exists():
            subprocess.run(['ffmpeg', '-v', 'error', '-threads', '2', '-framerate', '24', '-i', str(folder / (stem + '_%d.png')),
                            '-frames:v', '24', '-c:v', 'libvpx-vp9', '-lossless', '1', '-pix_fmt', 'gbrp', '-threads', '2', '-n', str(movie)], check=True)
        decoded = subprocess.check_output(['ffmpeg', '-v', 'error', '-threads', '2', '-i', str(movie), '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-'])
        size = 1920 * 1080 * 3
        assert len(decoded) == size * 24
        for i in range(24):
            assert decoded[i*size:(i+1)*size] == Image.open(folder / f'{stem}_{i}.png').convert('RGB').tobytes()
        entry['video'] = {'path': movie.relative_to(root).as_posix(), 'sha256': digest(movie), 'decodedRGBMatchesAllPNGFrames': True, 'frames': 24}
    report['groups'].append(entry)

differences = []
for i in range(24):
    a = np.asarray(Image.open(root / f'evidence/v04-ma-ab4-ab10-final-01/day-near-reference_{i}.png').convert('RGB'))[:400].astype(np.int16)
    b = np.asarray(Image.open(root / f'evidence/v04-ma-ab4-ab10-phase-regress-01/day-near-reference_{i}.png').convert('RGB'))[:400].astype(np.int16)
    delta = np.abs(a-b)
    differences.append({'frame': i, 'maxChannelDifference': int(delta.max()), 'meanChannelDifference': float(delta.mean()), 'changedPixels': int((delta.max(2)>0).sum())})
report['daytimeSkyPreservation'] = {'comparison': 'final-01 versus phase-regress-01', 'crop': [0, 0, 1920, 400],
    'exactRGBPairs': sum(row['changedPixels'] == 0 for row in differences), 'pairs': 24, 'differences': differences}

for item in json.loads((root / 'evidence/v04-ma-ab10-resume-02/protected-hashes.json').read_text()):
    path = Path(item['Path'])
    assert digest(path).upper() == item['Hash']
    report['protected'].append({'path': path.relative_to(root).as_posix(), 'sha256': digest(path)})

(out / 'manifest.json').write_text(json.dumps(report, indent=2) + '\n')
print('PASS: 96 existing consecutive frames, 3 RGB-lossless videos, 10 protected hashes')
