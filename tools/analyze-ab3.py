"""Analyze retained matched originals; write only a new checkpoint directory."""
import json
from pathlib import Path
from PIL import Image, ImageChops, ImageStat, ImageDraw

root = Path('evidence')
out = root / 'v04-ma-ab3-checkpoint-02'
out.mkdir(exist_ok=True)
names = ['day-near', 'day-high', 'gold-near', 'gold-high']
def read(p):
    return json.loads(p.read_text(encoding='utf-8-sig'))
def matched(a, b):
    return dict(camera=a['camera'] == b['camera'], settings=a['settings'] == b['settings'],
                time=a['simulationTime'] == b['simulationTime'],
                dimensions=(a['width'],a['height']) == (b['width'],b['height']) == (1920,1080),
                sourceStable=[x['sourceStart']['sha256'] == x['serverEvidence']['source']['sha256'] for x in [a,b]])
rows=[]
for name in names:
    paths=[root/f'v04-ma-ab3-{mode}-02'/(name+'.png') for mode in ['half','f32']]
    a,b=[read(p.with_suffix('.json')) for p in paths]
    difference=ImageChops.difference(*[Image.open(p).convert('RGB') for p in paths])
    rows.append(dict(name=name,matched=matched(a,b),displayMeanAbsoluteRGB=ImageStat.Stat(difference).mean,
       radianceBandChangePercent=[100*(y['meanLuminance']/x['meanLuminance']-1) for x,y in zip(a['hdr']['radianceBands'],b['hdr']['radianceBands'])],
       spectrum=[x['spectral']['status'] for x in [a,b]],errors=[x['errors'] for x in [a,b]],allocationBytes=[x['allocations']['liveBytes'] for x in [a,b]]))
foam_paths=[root/'v04-ma-ab3-foam-01/events.png',root/'v04-ma-ab3-foam-02/gravity.png']
foam=[read(p.with_suffix('.json')) for p in foam_paths]
profiles=[]
for name in ['storm-events','storm-gravity','day-half','day-f32']:
    data=read(root/'v04-ma-ab3-profile-01'/(name+'.json'))
    start=data['frameRecords'][0]['raf']+5000
    frames=[x for x in data['frameRecords'] if x['raf']>=start]
    ids={x['id'] for x in frames}
    samples=[x for x in data['measurements'] if x['id'] in ids]
    times=sorted(x['frame'] for x in frames)
    mean=lambda xs:sum(xs)/len(xs)
    profiles.append(dict(name=name,frames=len(frames),samples=len(samples),
        dimensions=[data['width'],data['height']],adapter=data['adapter'],
        sourceStable=data['sourceStart']['sha256']==data['serverEvidence']['source']['sha256'],
        errors=data['errors'],hiddenFrames=sum(x['visibility']!='visible' for x in frames),
        wallSeconds=data['benchmarkWallSeconds'],timingMode=data['timingMode'],
        queueThroughput=1000/mean(times),completionMs=dict(mean=mean(times),p95=times[int((len(times)-1)*.95)],p99=times[int((len(times)-1)*.99)]),
        gpuMs={k:mean([x[k] for x in samples]) for k in ['gpu','simulation','surface','cloudScreen','environment','post']}))
report=dict(precision=rows,foam=dict(matched=matched(*foam),simulationDensity=[x['foam'] for x in foam]),profiles=profiles,
            scope='Matched original stills. Image code differences are not realism scores. Simulation foam density is not visible whitecap area. Queue timings are not displayed FPS.')
with (out/'analysis.json').open('x',encoding='utf8') as f:json.dump(report,f,indent=2)
sheet=Image.new('RGB',(1920,590),(16,27,32));draw=ImageDraw.Draw(sheet)
for i,(p,label) in enumerate(zip(foam_paths,['BEFORE / broad compression-event foam','CANDIDATE / gravity-wave onset'])):
    im=Image.open(p).convert('RGB');im.thumbnail((960,540))
    sheet.paste(im,(i*960,40));draw.text((i*960+20,12),label,fill=(230,237,231))
sheet.save(out/'storm-comparison.png')
print(json.dumps(report,indent=2))
