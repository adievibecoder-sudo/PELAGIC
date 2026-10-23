import hashlib
import json
import statistics
import subprocess
import sys
from pathlib import Path
from PIL import Image, ImageChops, ImageStat

root = Path(sys.argv[1]) / 'evidence'

def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))

def stats(values):
    a = sorted(values)
    if not a:
        return None
    def q(p):
        f = (len(a) - 1) * p
        i = int(f)
        return a[i] + (a[min(i + 1, len(a)-1)] - a[i]) * (f-i)
    return dict(mean=statistics.mean(a), p50=q(.5), p95=q(.95), p99=q(.99), max=a[-1], samples=len(a))

profiles = []
for path in sorted(root.glob('v04-ma-wave-perf-*/*.json')):
    r = read(path)
    frames = [f for f in r['frameRecords'] if f['id'] > 30]
    measures = [m for m in r['measurements'] if m['id'] > 30]
    frame = stats([f['frame'] for f in frames])
    profiles.append(dict(path=str(path.relative_to(root)), fps=1000/frame['mean'], frame=frame,
        gpu={k: stats([m[k] for m in measures if k in m]) for k in
             ['gpu','surface','cloudScreen','environment','simulation','post']},
        cpu=stats([f['cpu'] for f in frames]), intervalsOver500ms=sum(f['frame']>500 for f in frames),
        visibility=sorted(set(f['visibility'] for f in frames)), wallSeconds=r['benchmarkWallSeconds'],
        sourceStable=r['sourceStart']['sha256']==r['serverEvidence']['source']['sha256'],
        sourceHash=r['sourceStart']['sha256'], errors=r['errors'],
        simulationSeconds=frames[-1]['time']-frames[0]['time'],
        recordedWallSeconds=(frames[-1]['raf']-frames[0]['raf'])/1000,
        resolution=[r['width'],r['height']], adapter=r['adapter']))

pairs = []
base = {'day-near':'v04-ma-wave-base-02', **{n:'v04-ma-wave-base-01' for n in ['day-high','gold-near','gold-high']}}
for stage in ['v04-ma-order-stills-01','v04-ma-wave-filter2-01','v04-ma-wave-cov-ablation-01']:
    for path in sorted((root / stage).glob('*.png')):
        original = root / base[path.stem] / path.name
        a, b = (Image.open(p).convert('RGB') for p in [original,path])
        delta = ImageStat.Stat(ImageChops.difference(a,b))
        ra, rb = (read(p.with_suffix('.json')) for p in [original,path])
        pairs.append(dict(base=str(original.relative_to(root)), candidate=str(path.relative_to(root)),
            sha256=[hashlib.sha256(p.read_bytes()).hexdigest() for p in [original,path]],
            meanAbsoluteDisplayRGB=delta.mean, settingsMatch=ra['settings']==rb['settings'],
            cameraMatch=ra['camera']==rb['camera'], timeDelta=rb['simulationTime']-ra['simulationTime'],
            sourceStable=[r['sourceStart']['sha256']==r['serverEvidence']['source']['sha256'] for r in [ra,rb]],
            errors=[r['errors'] for r in [ra,rb]]))

result = dict(profiles=profiles, stillPairs=pairs,
    scope='Display RGB difference is not a perceptual or scene-linear radiometric metric. Performance is sequential active-desktop evidence, not thermal isolation. perf-base-01 is a known inactive-tab confound.')
videos = []
if len(sys.argv)>2:
    for path in sorted((root/'v04-ma-order-motion-01').glob('*.webm')):
        probe = json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0',
            '-show_entries','stream=codec_name,width,height:frame=best_effort_timestamp_time',
            '-of','json',str(path)],text=True))
        timestamps = [float(f['best_effort_timestamp_time']) for f in probe['frames']]
        decoded = subprocess.run(['ffmpeg','-v','error','-threads','1','-i',str(path),'-f','null','-'],capture_output=True,text=True)
        r = read(path.with_suffix('.json'))
        baseline = read(root/'v04-ma-base-motion-02'/path.with_suffix('.json').name)
        records = [f for f in r['frameRecords'] if f['id']>=20]
        videos.append(dict(path=str(path.relative_to(root)),sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
            stream=probe['streams'][0], frames=len(timestamps), firstTime=timestamps[0],lastTime=timestamps[-1],
            increasing=all(b>a for a,b in zip(timestamps,timestamps[1:])),
            intervals=stats([1000*(b-a) for a,b in zip(timestamps,timestamps[1:])]),
            decodeExit=decoded.returncode,decodeErrors=decoded.stderr,
            settingsMatch=baseline['settings']==r['settings'],cameraMatch=baseline['camera']==r['camera'],
            baseline=str((root/'v04-ma-base-motion-02'/path.name).relative_to(root)),
            visibility=sorted(set(f['visibility'] for f in records)),
            sourceStable=r['sourceStart']['sha256']==r['serverEvidence']['source']['sha256'],errors=r['errors'],
            recordedWallSeconds=(records[-1]['raf']-records[0]['raf'])/1000,
            simulationSeconds=records[-1]['time']-records[0]['time'],
            phaseScope='Same t=20 start parameter, wall-clock continuous capture; frame phases are not identical between runs.'))
        for second in [3,12,21]:
            target = Path(sys.argv[2]).parent/(path.stem+'-'+str(second)+'s.png')
            subprocess.run(['ffmpeg','-v','error','-threads','1','-ss',str(second),'-i',str(path),
                '-frames:v','1','-n',str(target)],check=True,capture_output=True)
    result['motion'] = videos
if len(sys.argv)>2:
    with Path(sys.argv[2]).open('x',encoding='utf-8') as f:
        json.dump(result,f,indent=2)
        f.write('\n')
for p in profiles:
    print(p['path'], 'fps',round(p['fps'],2),'gpu',round(p['gpu']['gpu']['mean'],2),
          'surface',round(p['gpu']['surface']['mean'],2),'p99',round(p['frame']['p99'],2),
          '>500ms',p['intervalsOver500ms'],'source',p['sourceStable'])
for p in pairs:
    print(p['candidate'], 'deltaRGB', [round(v,4) for v in p['meanAbsoluteDisplayRGB']],
          'match',p['settingsMatch'],p['cameraMatch'],p['timeDelta'])
