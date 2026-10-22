"""Analyze originals without rewriting them. Metrics are diagnostics, not realism scores."""
from pathlib import Path
import argparse, json
import numpy as np
from PIL import Image, ImageDraw

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--after',default='v04-p1-final-stills')
parser.add_argument('--output',default='v04-p1-final-review')
args=parser.parse_args()
root=Path('evidence');out=root/args.output;out.mkdir(exist_ok=True)
cases=['clear','broken','covered','golden','storm','twilight','moonlit','underwater-clear','underwater-covered','reflection','body-covered','glitter-covered']
rows=[];missing=[];sheet=Image.new('RGB',(1280,390*len(cases)),(15,25,30));draw=ImageDraw.Draw(sheet)
for i,name in enumerate(cases):
    paths=[root/'v04-p1-baseline'/f'{name}.png',root/args.after/f'{name}.png']
    absent=[str(p) for image in paths for p in [image,image.with_suffix('.json')] if not p.exists()]
    if absent:
        missing.extend(absent);draw.text((8,i*390+8),name+' / MISSING CAPTURE',fill='white');continue
    images=[Image.open(p).convert('RGB') for p in paths];a,b=[np.asarray(im,dtype=float) for im in images];d=np.abs(a-b)
    reports=[json.loads(p.with_suffix('.json').read_text()) for p in paths]
    matched=['seed','quality','sunElev','sunAzim','exposure','swellHs','swellLength','windSpeed','clouds','haze','rain']
    row={'name':name,'meanAbsoluteDisplayCode':float(d.mean()),'p99AbsoluteDisplayCode':float(np.quantile(d,.99)),
         'maximum':float(d.max()),'fractionPixelsAnyChannelOver8':float((d.max(2)>8).mean()),
         'matchedSettings':all(reports[0]['settings'][k]==reports[1]['settings'][k] for k in matched),
         'matchedCamera':reports[0]['camera']==reports[1]['camera'],
         'matchedPoseAndFOV':all(reports[0]['camera'][k]==reports[1]['camera'][k] for k in ['x','y','z','yaw','pitch','fovY']),
         'timeDifference':reports[1]['simulationTime']-reports[0]['simulationTime'],
         'allSharedSettingDifferences':{k:[reports[0]['settings'][k],reports[1]['settings'][k]] for k in reports[0]['settings'].keys() & reports[1]['settings'].keys() if reports[0]['settings'][k]!=reports[1]['settings'][k]},
         'matchedResolution':images[0].size==images[1].size==(1920,1080),
         'baselineSourceCheckpoint':reports[0]['sourceCheckpoint'],'paths':[str(p) for p in paths],
         'adapter':reports[1]['adapter'],'errors':reports[1]['errors'],'light':reports[1].get('light'),
         'sourceCheckpoint':reports[1]['sourceCheckpoint']}
    rows.append(row)
    for j,im in enumerate(images):sheet.paste(im.resize((640,360)),(j*640,i*390+30))
    draw.text((8,i*390+8),name+' / baseline de7b32b',fill='white');draw.text((648,i*390+8),name+' / Phase 1',fill='white')
sheet.save(out/'comparison-sheet.png')
(out/'image-analysis.json').write_text(json.dumps(rows,indent=2))
(out/'capture-completeness.json').write_text(json.dumps({'after':args.after,'expectedPairs':len(cases),'availablePairs':len(rows),'missing':missing,'status':'PASS' if not missing else 'UNVERIFIED','scope':'File availability only; no visual acceptance.'},indent=2))
if missing:print(f'INCOMPLETE: {len(rows)}/{len(cases)} pairs; see capture-completeness.json')
print(json.dumps([{'name':r['name'],'mean':r['meanAbsoluteDisplayCode'],'matched':r['matchedSettings'] and r['matchedCamera']} for r in rows],indent=2))

performance=[]
for directory in ['v04-p1-baseline-performance','v04-p1-performance']:
 for p in sorted((root/directory).glob('*.json')):
    r=json.loads(p.read_text());frames=r.get('frameRecords',[]);m=r.get('measurements',[])
    def stats(values):
        v=np.asarray(values,dtype=float)
        return {k:float(np.quantile(v,q)) for k,q in [('p50',.5),('p95',.95),('p99',.99)]}|{'mean':float(v.mean()),'max':float(v.max())} if len(v) else None
    frame=stats([f['frame'] for f in frames]);gpu={k:stats([v[k] for v in m if k in v]) for k in ['gpu','simulation','atmosphere','surface','post','skyLUT','cloudScreen','cloudShadow','environment','irradiance','transparent']}
    stalls=[]
    for f in frames:
        if f['frame']<500:continue
        tasks=[t for t in r.get('browserTasks',[]) if t['start']<f.get('raf',0) and t['start']+t['duration']>f.get('raf',0)-f['frame']]
        stalls.append({'frame':f,'overlappingBrowserTasks':tasks})
    performance.append({'name':directory+'/'+p.stem,'source':r.get('sourceCheckpoint'),'adapter':r['adapter'],'sampleFrames':len(frames),'fps':1000/frame['mean'] if frame else None,'frame':frame,'gpu':gpu,'stalls':stalls,'allocation':r.get('allocations'),'visibility':list(set(f['visibility'] for f in frames)),
      'cpu':stats([f['cpu'] for f in frames]),'submit':stats([f['submitEnd']-f['submitStart'] for f in frames]),
      'queryCompletionDelay':stats([v['readbackCompleted']-v['submitEnd'] for v in m if 'readbackCompleted' in v and 'submitEnd' in v]),
      'cacheAgeFrames':stats([f['cacheAgeFrames'] for f in frames if 'cacheAgeFrames' in f]),
      'probeAgeFrames':stats([f['probeAgeFrames'] for f in frames if 'probeAgeFrames' in f]),
      'visibilityCounts':{v:sum(f['visibility']==v for f in frames) for v in set(f['visibility'] for f in frames)},
      'browserTaskCount':len(r.get('browserTasks',[])),'wallSeconds':r.get('benchmarkWallSeconds'),'stopReason':r.get('benchmarkStopReason'),'errors':r['errors']})
(out/'performance-analysis.json').write_text(json.dumps(performance,indent=2))
for p in performance:print(p['name'],p['fps'],'FPS',len(p['stalls']),'stalls')
