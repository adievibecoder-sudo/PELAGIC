"""Compare retained originals. Image gradients are diagnostics, not quality scores."""
import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

root = Path('evidence')
out = root / 'v04-ma-ab4-checkpoint-01'
out.mkdir(exist_ok=True)

def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))

def pixels(path):
    return np.asarray(Image.open(path).convert('RGB'), dtype=np.float32)

def gradient(a):
    a = a[720:]
    return float((np.abs(np.diff(a, axis=0)).mean() + np.abs(np.diff(a, axis=1)).mean()) / 2)

def paired(a, b):
    return dict(camera=a['camera'] == b['camera'], settings=a['settings'] == b['settings'],
                time=a['simulationTime'] == b['simulationTime'],
                dimensions=(a['width'], a['height']) == (b['width'], b['height']) == (1920, 1080),
                sourceStable=[x['sourceStart']['sha256'] == x['serverEvidence']['source']['sha256'] for x in (a, b)])

stills = []
for name in ['gold-near', 'gold-high', 'day-near', 'day-high']:
    paths = [root / 'v04-ma-ab4-controls-01' / (name + '-msaa.png'),
             root / 'v04-ma-ab4-final-stills-01' / (name + '-reference.png')]
    reports = [read(p.with_suffix('.json')) for p in paths]
    images = [pixels(p) for p in paths]
    g = [gradient(a) for a in images]
    stills.append(dict(name=name, paths=[str(p) for p in paths], matched=paired(*reports),
                      lowerThirdGradient=g, gradientRatio=g[1]/g[0],
                      meanAbsoluteCodeDifference=float(np.abs(images[0]-images[1]).mean()),
                      hdr=[r['hdr']['status'] for r in reports],
                      spectrum=[r['spectral']['status'] for r in reports], errors=[r['errors'] for r in reports]))
    sheet = Image.new('RGB', (1920, 580), '#101b20')
    draw = ImageDraw.Draw(sheet)
    for i, p in enumerate(paths):
        sheet.paste(Image.open(p).convert('RGB').resize((960, 540)), (960*i, 40))
        draw.text((960*i+16, 12), name + (' / 4x MSAA' if i == 0 else ' / experimental hybrid'), fill='white')
    sheet.save(out / (name + '-comparison.png'))

motion = []
for mode in ['msaa', 'taa']:
    folder = root / ('v04-ma-ab4-motion-' + mode + '-01')
    reports = [read(folder / f'gold_{i}.json') for i in range(48)]
    previous = None
    gradients, differences = [], []
    for i in range(48):
        a = pixels(folder / f'gold_{i}.png')
        gradients.append(gradient(a))
        if previous is not None:
            differences.append(float(np.abs(a[720:]-previous[720:]).mean()))
        previous = a
    motion.append(dict(mode=mode, frames=48, fps=30, seconds=1.6,
                       lowerThirdMeanGradient=float(np.mean(gradients)),
                       rawUnregisteredFrameDifference=float(np.mean(differences)),
                       sourceStable=all(r['sourceStart']['sha256'] == r['serverEvidence']['source']['sha256'] for r in reports),
                       errors=[r['errors'] for r in reports if r['errors']],
                       lossless=read(folder / 'lossless-verification.json')['decodedRGBMatchesAllPNGFrames']))

profiles = []
for path in sorted((root / 'v04-ma-ab4-profile-01').glob('*.json')):
    r = read(path)
    frames = [f for f in r['frameRecords'] if f['raf'] >= r['frameRecords'][0]['raf'] + 5000]
    ids = {f['id'] for f in frames}
    samples = [s for s in r['measurements'] if s['id'] in ids]
    intervals = [f['frame'] for f in frames]
    keys = ['gpu', 'simulation', 'surface', 'cloudScreen', 'environment', 'post', 'motion', 'taa']
    profiles.append(dict(name=path.stem, frames=len(frames), gpuSamples=len(samples),
        wallSeconds=r['benchmarkWallSeconds'], timingMode=r['timingMode'],
        sourceStable=r['sourceStart']['sha256'] == r['serverEvidence']['source']['sha256'],
        errors=r['errors'], hiddenFrames=sum(f['visibility'] != 'visible' for f in frames),
        unfocusedFrames=sum(not f['focused'] for f in frames),
        embeddedFrames=sum(f['embedded'] for f in frames),
        rafFramesPerSecond=1000/float(np.mean(intervals)),
        intervalsMs=dict(mean=float(np.mean(intervals)), median=float(np.median(intervals)),
                         p95=float(np.percentile(intervals,95)), p99=float(np.percentile(intervals,99)), maximum=max(intervals)),
        gpuMs={k:float(np.mean([s[k] for s in samples])) for k in keys if samples and k in samples[0]},
        allocationBytes=r['allocations']['liveBytes']))

report = dict(stills=stills, motion=motion, profiles=profiles,
    scope='Original 1080p images; lower-third gradients and unregistered differences are not realism/flicker scores. One sequential foreground timing pair; no thermal confidence interval. Allocation payload is not GPU residency.')
with (out / 'analysis.json').open('x', encoding='utf8') as f:
    json.dump(report, f, indent=2)
print(json.dumps(report, indent=2))
