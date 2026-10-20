"""Build matched evidence sheets and measured JSON; raw captures remain untouched."""
from pathlib import Path
import json
import statistics
from PIL import Image, ImageDraw, ImageChops, ImageStat

root = Path(__file__).resolve().parents[1]
out = root / 'evidence/v03-review'
out.mkdir(exist_ok=True)
before = root / 'evidence/stage-04'
after = root / 'evidence/v03-integrated'
cases = []
for scene in ['calm', 'midday', 'golden', 'storm', 'twilight', 'moonlit']:
    sheet = Image.new('RGB', (960, 8*292), '#101b20')
    draw = ImageDraw.Draw(sheet)
    for index, (height, azimuth) in enumerate((h,a) for h in ['0p5','2','50','500'] for a in [0,75]):
        name = f'{scene}-h{height}-a{azimuth}'
        records = [json.loads((p/(name+'.json')).read_text()) for p in [before,after]]
        matched = all(records[0][key] == records[1][key] for key in ['camera','settings','simulationTime','width','height','frameIndex'])
        images = [Image.open(p/(name+'.png')).convert('RGB') for p in [before,after]]
        difference = ImageStat.Stat(ImageChops.difference(*images)).mean
        current = records[1]
        cases.append({'name':name,'matchedInputs':matched,'meanAbsoluteRGBDifference':difference,
                      'spectral':current.get('spectral',{}).get('status','UNVERIFIED'),
                      'hdr':current.get('hdr',{}),'errors':current['errors'],
                      'sourceCheckpoint':current['sourceCheckpoint']})
        for side, im in enumerate(images):
            im.thumbnail((480,270));sheet.paste(im,(side*480,index*292+22))
            draw.text((side*480+10,index*292+4),f'{"0.2" if side==0 else "0.3 development"} / {name}',fill='white')
    sheet.save(out/(scene+'-matched.jpg'),quality=94)

for scene in ['golden','storm']:
    sheet=Image.new('RGB',(1920,564),'#101b20');draw=ImageDraw.Draw(sheet)
    for side,stage in enumerate(['v03-cinematic-before','v03-cinematic']):
        im=Image.open(root/'evidence'/stage/(scene+'-4k.png')).convert('RGB');im.thumbnail((960,540))
        sheet.paste(im,(side*960,24));draw.text((side*960+10,5),f'{"0.2" if side==0 else "0.3 development"} / {scene} / 4K Cinematic original',fill='white')
    sheet.save(out/(scene+'-cinematic-matched.jpg'),quality=95)

performance=[]
for path in sorted(after.glob('benchmark-*.json')):
    report=json.loads(path.read_text())
    frames=report['frameRecords'];timings=report['measurements']
    def describe(values):
        values=sorted(values)
        return {'median':statistics.median(values),'p95':values[int((len(values)-1)*.95)],
                'p99':values[int((len(values)-1)*.99)],'maximum':max(values),'mean':statistics.mean(values)}
    performance.append({'name':path.name,'settings':report['settings'],'adapter':report['adapter'],
        'sourceCheckpoint':report['sourceCheckpoint'],'stopReason':report.get('benchmarkStopReason','frame limit'),
        'totalWallSeconds':report.get('benchmarkWallSeconds'),
        'timingMode':report['timingMode'],'frames':len(frames),'measuredSeconds':sum(x['frame'] for x in frames)/1000,
        'averageFPS':1000/statistics.mean(x['frame'] for x in frames),
        'frameMs':describe([x['frame'] for x in frames]),'cpuMs':describe([x['cpu'] for x in frames]),
        'gpuMs':{key:describe([x[key] for x in timings]) for key in ['gpu','simulation','atmosphere','surface','post']},
        'visibility':sorted(set(x['visibility'] for x in frames)),
        'framesOver100ms':sum(x['frame']>100 for x in frames),'errors':report['errors'],
        'memoryEstimate':report['memoryEstimate']})

(out/'matched-inputs.json').write_text(json.dumps({'cases':cases,'status':'PASS' if len(cases)==48 and all(c['matchedInputs'] for c in cases) else 'FAIL'},indent=2))
(out/'performance.json').write_text(json.dumps(performance,indent=2))
print(json.dumps({'matchedViews':sum(c['matchedInputs'] for c in cases),'views':len(cases),'benchmarks':len(performance)}))
