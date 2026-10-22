"""Read originals; create an exclusive checkpoint analysis, never replace evidence."""
import argparse
import csv
import hashlib
import json
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output', required=True, help='New directory under evidence')
parser.add_argument('--part', choices=['visual', 'performance', 'all'], default='all')
args = parser.parse_args()
root = Path('evidence')
out = root / args.output
out.mkdir(exist_ok=False)
cases = ['day-near', 'day-high', 'gold-near', 'gold-high']

def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))

def save(name, data):
    with (out / name).open('x', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
        f.write('\n')

def stats(values):
    a = np.array(values, dtype=float)
    if not len(a):
        return None
    return dict(zip(['p50', 'p95', 'p99'], map(float, np.quantile(a, [.5, .95, .99]))),
                mean=float(a.mean()), maximum=float(a.max()), samples=len(a))

stills = []
sheet = Image.new('RGB', (1920, 580 * 4), (15, 25, 30))
draw = ImageDraw.Draw(sheet)
for index, name in enumerate(cases if args.part != 'performance' else []):
    candidate = 'v04-ma-convection-stills-03' if name == 'gold-near' else 'v04-ma-convection-stills-02'
    paths = [root / stage / (name + '.png') for stage in ['v04-ma-base-stills-02', candidate]]
    reports = [read(p.with_suffix('.json')) for p in paths]
    a, b = reports
    images = [Image.open(p).convert('RGB') for p in paths]
    difference = np.abs(np.array(images[0], dtype=float) - np.array(images[1], dtype=float))
    setting_diffs = {k: [a['settings'][k], b['settings'][k]] for k in a['settings']
                     if a['settings'][k] != b['settings'][k]}
    row = dict(name=name, paths=list(map(str, paths)), settingDifferences=setting_diffs,
               cameraMatch=a['camera'] == b['camera'], timeDifference=b['simulationTime'] - a['simulationTime'],
               resolutionMatch=images[0].size == images[1].size == (1920, 1080),
               meanAbsoluteDisplayCode=float(difference.mean()),
               columns=[{k: v for k, v in r['cloudColumns'].items() if k != 'tau'} for r in reports],
               sourceStable=[r['sourceStart']['sha256'] == r['serverEvidence']['source']['sha256'] for r in reports],
               gpuErrors=[r['errors'] for r in reports], hdr=[r['hdr'] for r in reports])
    row['sourceChangesDuringCapture'] = []
    for report in reports:
        start = {v['file']: v['sha256'] for v in report['sourceStart']['files']}
        end = {v['file']: v['sha256'] for v in report['serverEvidence']['source']['files']}
        row['sourceChangesDuringCapture'].append([k for k in start.keys() | end.keys() if start.get(k) != end.get(k)])
    stills.append(row)
    for column, image in enumerate(images):
        sheet.paste(image.resize((960, 540)), (column * 960, index * 580 + 30))
        draw.text((column * 960 + 8, index * 580 + 8), name + (' / baseline' if column == 0 else ' / candidate'), fill='white')
if args.part != 'performance':
    sheet.save(out / 'matched-sheet.png')
    save('stills.json', stills)

motion = []
for stage in (['v04-ma-base-motion-02', 'v04-ma-convection-motion-02'] if args.part != 'performance' else []):
    for name in cases:
        p = root / stage / (name + '.webm')
        if not p.exists():
            motion.append(dict(path=str(p), status='UNVERIFIED', reason='Missing recording'))
            continue
        probe = read(p.with_suffix('.json'))
        info = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(p)]))
        packets = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_packets', '-show_entries', 'packet=pts_time', '-of', 'json', str(p)]))['packets']
        pts = [float(v['pts_time']) for v in packets]
        decode = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(p), '-enc_time_base', '1:1000', '-fps_mode', 'passthrough', '-f', 'null', '-'], capture_output=True, text=True)
        stream = next(s for s in info['streams'] if s['codec_type'] == 'video')
        frame_sheet = Image.new('RGB', (1920, 580 * 3), (15, 25, 30))
        d = ImageDraw.Draw(frame_sheet)
        for i, seconds in enumerate([.5, 4, 8, 12, 18, 23]):
            filename = out / f'{stage}-{name}-{seconds:g}s.png'
            subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(seconds), '-i', str(p), '-frames:v', '1', '-n', str(filename)], check=True)
            frame_sheet.paste(Image.open(filename).resize((960, 540)), ((i % 2) * 960, (i // 2) * 580 + 30))
            d.text(((i % 2) * 960 + 8, (i // 2) * 580 + 8), f'{name} / {seconds:g} s', fill='white')
        frame_sheet.save(out / f'{stage}-{name}-sheet.png')
        frames = probe['frameRecords']
        motion.append(dict(path=str(p), width=stream['width'], height=stream['height'], packets=len(pts),
            secondsFirstToLast=pts[-1] - pts[0], packetIntervalMs=stats(np.diff(pts) * 1000),
            timestampsIncreasing=all(b > a for a, b in zip(pts, pts[1:])), fullDecodeExit=decode.returncode,
            decodeErrors=decode.stderr, gpuErrors=probe['errors'],
            simulationRange=[frames[0]['time'], frames[-1]['time']],
            simulationSecondsRecorded=frames[-1]['time'] - frames[0]['time'],
            recordedFrameSeconds=(frames[-1]['raf'] - frames[0]['raf']) / 1000,
            yawDegreesRange=[f['camera'][3] * 180 / np.pi for f in [frames[0], frames[-1]]],
            visibility=sorted(set(f['visibility'] for f in frames)),
            sourceStable=probe['sourceStart']['sha256'] == probe['serverEvidence']['source']['sha256'],
            scope='Full decode plus six full-resolution samples. Browser playback/perception assessed separately. Capture cadence is not display-paced FPS.'))
if args.part != 'performance':
    save('motion.json', motion)

performance = []
for directory in (sorted(root.glob('v04-ma-*-performance-*')) if args.part != 'visual' else []):
    for p in sorted(directory.glob('*.json')):
        r = read(p)
        if not r.get('frameRecords'):
            continue
        frames = r['frameRecords']
        # A delayed GPU readback can arrive after warmup for an earlier frame.
        measures = [v for v in r['measurements'] if v['id'] > 30]
        frame = stats([f['frame'] for f in frames])
        gpu = {k: stats([v[k] for v in measures if k in v]) for k in
               ['gpu', 'simulation', 'skyLUT', 'cloudScreen', 'cloudShadow', 'environment', 'irradiance', 'surface', 'transparent', 'post']}
        long_intervals = [f for f in frames if f['frame'] > 500]
        performance.append(dict(path=str(p), fps=1000 / frame['mean'], frame=frame, gpu=gpu,
            cpu=stats([f['cpu'] for f in frames]), intervalsOver500ms=long_intervals,
            visibility=sorted(set(f['visibility'] for f in frames)), wallSeconds=r['benchmarkWallSeconds'],
            recordedWallSeconds=(frames[-1]['raf']-frames[0]['raf'])/1000,
            recordedSimulationSeconds=frames[-1]['time']-frames[0]['time'],
            timingMode=r['timingMode'], quality=r['settings']['quality'], resolution=[r['width'], r['height']],
            adapter=r['adapter'], allocation=r['allocations'], errors=r['errors'],
            sampleScope='Frame records and GPU submission ids >30. Intervals >500 ms are observations, not scheduling-stall diagnoses; Cinematic GPU work can itself exceed 500 ms. No inference of residency or thermal isolation.',
            sourceStable=r['sourceStart']['sha256'] == r['serverEvidence']['source']['sha256']))
if args.part != 'visual':
    save('performance.json', performance)
    cinematic = []
    for name in ['day-near', 'gold-high']:
        paths = [root / f'v04-ma-{variant}-cinematic-stills' / (name + '.json')
                 for variant in ['base', 'convection']]
        a, b = map(read, paths)
        cinematic.append(dict(name=name, paths=list(map(str, paths)),
            settingsMatch=a['settings'] == b['settings'], cameraMatch=a['camera'] == b['camera'],
            timeDifference=b['simulationTime'] - a['simulationTime'],
            resolution=[[r['width'], r['height']] for r in [a, b]],
            sourceStable=[r['sourceStart']['sha256'] == r['serverEvidence']['source']['sha256'] for r in [a, b]],
            errors=[r['errors'] for r in [a, b]], hdr=[r['hdr'] for r in [a, b]]))
    save('cinematic-stills.json', cinematic)
    monitor = root / 'v04-ma-hardware-20261022' / 'benchmark-monitor.csv'
    with monitor.open() as f:
        rows = list(csv.DictReader(f))
    complete = [r for r in rows if all(r.values())]
    metrics = [' temperature.gpu', ' power.draw [W]', ' clocks.current.graphics [MHz]',
               ' utilization.gpu [%]', ' memory.used [MiB]']
    save('board-monitor.json', dict(path=str(monitor), rows=len(rows), completeRows=len(complete),
        firstTimestamp=complete[0]['timestamp'], lastTimestamp=complete[-1]['timestamp'],
        ranges={k.strip(): [min(float(r[k].split()[0]) for r in complete),
                           max(float(r[k].split()[0]) for r in complete)] for k in metrics},
        scope='Whole-board readings across active runs and idle gaps, other desktop apps open. Not application residency, per-run isolation or a thermal-stability claim. Final interrupted row excluded.'))
preservation = read(root / 'v04-ma-preservation-20261022' / 'manifest.json')
mismatch = [v['path'] for v in preservation['files'] if hashlib.sha256(Path(v['path']).read_bytes()).hexdigest() != v['sha256']]
save('preservation.json', dict(files=len(preservation['files']), mismatches=mismatch,
     status='FAIL' if mismatch else 'PASS', scope='Current originals still match the retained pre-intervention copies. Initiating browser provenance remains unknown.'))
print(json.dumps(dict(stillPairs=len(stills), videos=len(motion), performanceRuns=len(performance), preservationMismatches=mismatch)))
for r in performance:
    print(r['path'], round(r['fps'], 2), 'FPS', round(r['gpu']['gpu']['mean'], 2), 'ms GPU', len(r['intervalsOver500ms']), 'intervals >500 ms')
