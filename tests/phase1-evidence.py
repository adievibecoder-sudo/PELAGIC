"""Analyze originals without rewriting them. Metrics are diagnostics, not realism scores."""
from pathlib import Path
import json, hashlib, subprocess
import numpy as np
from PIL import Image, ImageDraw

root=Path('evidence');out=root/'v04-p1-review';out.mkdir(exist_ok=True)
cases=['clear','broken','covered','golden','storm','twilight','moonlit','underwater-clear','underwater-covered','reflection','body-covered','glitter-covered']
rows=[];sheet=Image.new('RGB',(1280,390*len(cases)),(15,25,30));draw=ImageDraw.Draw(sheet)
for i,name in enumerate(cases):
    paths=[root/'v04-p1-baseline'/f'{name}.png',root/'v04-p1-stills'/f'{name}.png']
    if not all(p.exists() for p in paths):continue
    images=[Image.open(p).convert('RGB') for p in paths];a,b=[np.asarray(im,dtype=float) for im in images];d=np.abs(a-b)
    reports=[json.loads(p.with_suffix('.json').read_text()) for p in paths]
    matched=['seed','quality','sunElev','sunAzim','exposure','swellHs','swellLength','windSpeed','clouds','haze','rain']
    row={'name':name,'meanAbsoluteDisplayCode':float(d.mean()),'p99AbsoluteDisplayCode':float(np.quantile(d,.99)),
         'maximum':float(d.max()),'fractionPixelsAnyChannelOver8':float((d.max(2)>8).mean()),
         'matchedSettings':all(reports[0]['settings'][k]==reports[1]['settings'][k] for k in matched),
         'matchedCamera':reports[0]['camera']==reports[1]['camera'],'timeDifference':reports[1]['simulationTime']-reports[0]['simulationTime'],
         'adapter':reports[1]['adapter'],'errors':reports[1]['errors'],'light':reports[1].get('light'),
         'sourceCheckpoint':reports[1]['sourceCheckpoint']}
    rows.append(row)
    for j,im in enumerate(images):sheet.paste(im.resize((640,360)),(j*640,i*390+30))
    draw.text((8,i*390+8),name+' / baseline de7b32b',fill='white');draw.text((648,i*390+8),name+' / Phase 1',fill='white')
sheet.save(out/'comparison-sheet.png')
(out/'image-analysis.json').write_text(json.dumps(rows,indent=2))
print(json.dumps([{'name':r['name'],'mean':r['meanAbsoluteDisplayCode'],'matched':r['matchedSettings'] and r['matchedCamera']} for r in rows],indent=2))

performance=[]
for directory in ['v04-p1-baseline-performance','v04-p1-performance']:
 for p in sorted((root/directory).glob('*.json')):
    r=json.loads(p.read_text());frames=r.get('frameRecords',[]);m=r.get('measurements',[])
    def stats(values):
        v=np.asarray(values,dtype=float)
        return {k:float(np.quantile(v,q)) for k,q in [('p50',.5),('p95',.95),('p99',.99)]}|{'mean':float(v.mean()),'max':float(v.max())} if len(v) else None
    frame=stats([f['frame'] for f in frames]);gpu={k:stats([v[k] for v in m if k in v]) for k in ['gpu','sim','atmosphere','surface','post','skyLUT','cloudScreen','cloudShadow','environment','irradiance','transparent']}
    stalls=[]
    for f in frames:
        if f['frame']<500:continue
        tasks=[t for t in r.get('browserTasks',[]) if t['start']<f.get('raf',0) and t['start']+t['duration']>f.get('raf',0)-f['frame']]
        stalls.append({'frame':f,'overlappingBrowserTasks':tasks})
    performance.append({'name':directory+'/'+p.stem,'adapter':r['adapter'],'sampleFrames':len(frames),'fps':1000/frame['mean'] if frame else None,'frame':frame,'gpu':gpu,'stalls':stalls,'allocation':r.get('allocations'),'visibility':list(set(f['visibility'] for f in frames)),'errors':r['errors']})
(out/'performance-analysis.json').write_text(json.dumps(performance,indent=2))
for p in performance:print(p['name'],p['fps'],'FPS',len(p['stalls']),'stalls')
