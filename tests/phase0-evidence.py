"""Summarize original captures; contact sheets are indexes, not replacement evidence."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageChops, ImageStat
import csv, hashlib, json, statistics

root = Path('evidence')
dest = root / 'v04-p0-review'
dest.mkdir(exist_ok=True)
def med(a):
    return statistics.median(a) if a else None
def table(pattern):
    result = {}
    for path in root.glob(pattern):
        data = json.loads(path.read_text())
        samples = data.get('measurements', [])
        frames = data.get('frameRecords', [])
        ms = sorted(v['frame'] for v in frames)
        result[path.stem] = dict(
            errors=data.get('errors'), width=data.get('width'), height=data.get('height'),
            timingMode=data.get('timingMode'),
            medianPassMs={key: med([s[key] for s in samples if key in s]) for key in ['simulation','atmosphere','surface','post','cloudScreen','cloudShadow','environment']},
            frameCount=len(ms), fps=1000/statistics.mean(ms) if ms else None,
            p99=ms[int(.99*(len(ms)-1))] if ms else None, maxMs=max(ms) if ms else None,
            over500ms=sum(t>500 for t in ms), visibility=sorted(set(v['visibility'] for v in frames)),
            probeAgeFrames=sorted(set(v.get('probeAgeFrames', -1) for v in frames)),
            cloudColumns={k:v for k,v in data.get('cloudColumns',{}).items() if k!='tau'})
    return result
report={'clouds':table('v04-p0-clouds/*.json'),'performance':table('v04-p0-performance/*.json'),'motion':table('v04-p0-motion/*.json'),'desaturation':{}}
with (root/'v04-p0-performance/board-telemetry.csv').open() as f:
    rows=list(csv.DictReader(f,skipinitialspace=True))
fields=['temperature.gpu','utilization.gpu [%]','memory.used [MiB]','power.draw [W]','clocks.current.graphics [MHz]','clocks.current.memory [MHz]']
valid=[r for r in rows if all(r.get(k) and r[k].split()[0].replace('.','',1).isdigit() for k in fields)]
report['boardTelemetry']={
    'scope':'Whole-board samples across benchmarks and idle/other work; not per-application residency or thermal attribution.',
    'first':valid[0]['timestamp'],'last':valid[-1]['timestamp'],
    'validRows':len(valid),'rejectedIncompleteRows':len(rows)-len(valid),
    'ranges':{k:{'min':min(float(r[k].split()[0]) for r in valid),'max':max(float(r[k].split()[0]) for r in valid)} for k in fields}}
baseline=root/'v03-integrated/midday-h2-a0.png'
current=root/'v04-p0-preflight/renderer-identity.png'
if baseline.exists():
    original=Image.open(baseline).convert('RGBA')
    fresh=Image.open(current).convert('RGBA')
    identical=original.size==fresh.size and original.tobytes()==fresh.tobytes()
    records=[]
    for p,img in [(baseline,original),(current,fresh)]:
        records.append({'path':p.as_posix(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),
                        'decodedRGBAsha256':hashlib.sha256(img.tobytes()).hexdigest(),'size':img.size})
    (dest/'baseline-pixels.json').write_text(json.dumps({'status':'PASS' if identical else 'FAIL',
        'scope':'Exact decoded RGBA comparison; original v03 archive must be restored to rerun.',
        'identical':identical,'images':records},indent=2)+'\n')
    assert identical, 'Fresh preflight baseline differs from preserved v03 pixels'
for scene in ['midday','golden','storm']:
    a=Image.open(root/'v04-p0-clouds'/f'{scene}-baseline.png').convert('RGB')
    b=Image.open(root/'v04-p0-clouds'/f'{scene}-desat-off.png').convert('RGB')
    d=ImageChops.difference(a,b)
    report['desaturation'][scene]={'meanAbsoluteDisplayByteDifference':ImageStat.Stat(d).mean,'maxDisplayByteDifference':[r[1] for r in d.getextrema()]}
for scene in ['midday','golden','storm','overcast','opacity']:
    sheet=Image.new('RGB',(1920,388),'#101b20');draw=ImageDraw.Draw(sheet)
    for i,model in enumerate(['baseline','continuous','cells']):
        img=Image.open(root/'v04-p0-clouds'/f'{scene}-{model}.png')
        img.thumbnail((640,360));sheet.paste(img,(640*i,28));draw.text((640*i+8,7),scene+' / '+model,fill='white')
    sheet.save(dest/f'{scene}-comparison.png')
(dest/'metrics.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({name:{'cloudScreenMs':d['medianPassMs']['cloudScreen'],'tauMean':d['cloudColumns'].get('mean'),'tauOver1':d['cloudColumns'].get('fractionTauOver1')} for name,d in report['clouds'].items() if d['cloudColumns']},indent=2))
