"""Bounded A+B checkpoint evidence; cadence is not compositor presentation."""
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image

root = Path('evidence')
out = root / 'v04-ma-ab5-checkpoint-01'
out.mkdir(exist_ok=True)


def read(p):
    return json.loads(p.read_text(encoding='utf-8-sig'))


def stats(values):
    return dict(mean=float(np.mean(values)), p50=float(np.median(values)),
                p95=float(np.percentile(values, 95)), p99=float(np.percentile(values, 99)))


def matched(a, b):
    return dict(settings=a['settings'] == b['settings'], camera=a['camera'] == b['camera'],
                time=a['simulationTime'] == b['simulationTime'],
                dimensions=(a['width'], a['height']) == (b['width'], b['height']) == (1920, 1080),
                sourceStable=all(x['sourceStart']['sha256'] == x['serverEvidence']['source']['sha256'] for x in (a, b)))


profiles = []
for folder in sorted(root.glob('v04-ma-ab5-profile-*')):
    for path in sorted(folder.glob('*.json')):
        r = read(path)
        if 'frameRecords' not in r:
            continue
        frames = [f for f in r['frameRecords'] if f['raf'] >= r['frameRecords'][0]['raf'] + 5000]
        ids = {f['id'] for f in frames}
        samples = [s for s in r['measurements'] if s['id'] in ids]
        intervals = [f['frame'] for f in frames]
        keys = ['gpu', 'simulation', 'surface', 'cloudScreen', 'environment', 'post', 'atmosphere', 'particles']
        profiles.append(dict(path=path.as_posix(), frames=len(frames), gpuSamples=len(samples),
            dimensions=[r['width'], r['height']], quality=r['settings']['quality'],
            wallSeconds=r['benchmarkWallSeconds'], timingMode=r['timingMode'],
            sourceStable=r['sourceStart']['sha256'] == r['serverEvidence']['source']['sha256'],
            errors=r['errors'], hiddenFrames=sum(f['visibility'] != 'visible' for f in frames),
            unfocusedFrames=sum(not f['focused'] for f in frames), embeddedFrames=sum(f['embedded'] for f in frames),
            rafFramesPerSecond=1000/float(np.mean(intervals)), intervalsMs=stats(intervals),
            gpuMs={k:stats([s[k] for s in samples]) for k in keys if samples and k in samples[0]},
            allocationBytes=r['allocations']['liveBytes']))

stills = []
for name in ['day-near', 'gold-near', 'day-high', 'gold-high']:
    a = root / 'v04-ma-ab4-ab5-work-base-01' / (name+'-reference.png')
    b = root / 'v04-ma-ab4-ab5-work-stills-01' / (name+'-reference.png')
    if not (a.exists() and b.exists()):
        continue
    ra, rb = read(a.with_suffix('.json')), read(b.with_suffix('.json'))
    pa, pb = [np.asarray(Image.open(p).convert('RGB'), dtype=np.int16) for p in (a, b)]
    stills.append(dict(name=name, matched=matched(ra, rb), byteIdentical=a.read_bytes() == b.read_bytes(),
        changedPixels=int(np.any(pa != pb, axis=2).sum()), maxCodeDifference=int(np.abs(pa-pb).max()),
        hdr=[ra['hdr']['status'], rb['hdr']['status']], errors=[ra['errors'], rb['errors']]))

motion = []
for scene, count in [('storm', 96), ('cloud', 48)]:
    folders = [root / f'v04-ma-ab5-motion-{scene}-{v}-01' for v in ['base', 'work']]
    if not all((d/f'{scene}_{count-1}.json').exists() for d in folders):
        continue
    matches, changes, errors = [], [], []
    for i in range(count):
        paths = [d/f'{scene}_{i}.png' for d in folders]
        reports = [read(p.with_suffix('.json')) for p in paths]
        matches.append(matched(*reports))
        changes.append(paths[0].read_bytes() != paths[1].read_bytes())
        errors.extend(r['errors'] for r in reports if r['errors'])
    motion.append(dict(scene=scene, frames=count, fps=24, seconds=count/24,
        allMatched=all(all(m.values()) for m in matches), changedFrames=sum(changes), errors=errors))

preserved = []
for item in read(root/'v04-ma-ab5-resume-01/inherited-evidence.json'):
    digest = hashlib.sha256(Path(item['path']).read_bytes()).hexdigest()
    preserved.append(dict(path=item['path'], unchanged=digest == item['sha256']))
report = dict(profiles=profiles, cloudStills=stills, motion=motion, inheritedEvidence=preserved,
    scope='First five seconds of retained rAF records excluded. GPU timestamps aligned by frame ID. '
          'Sequential foreground runs, no thermal confidence interval; rAF is not compositor presentation. '
          'Allocation payload is not residency. Exact-image comparisons do not establish naturalism.')
with (out/'analysis.json').open('w', encoding='utf8') as f:
    json.dump(report, f, indent=2)
for p in profiles:
    print(p['path'], round(p['rafFramesPerSecond'], 3), 'cadence FPS;',
          round(p['gpuMs']['gpu']['mean'], 3), 'GPU ms;', p['allocationBytes']/1048576, 'MiB payload')
print('stills:', stills)
print('motion:', motion)
print('inherited unchanged:', all(p['unchanged'] for p in preserved))
