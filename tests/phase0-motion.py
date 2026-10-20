"""Decode every original frame; sampled stills and image deltas are not motion certification."""
from pathlib import Path
from PIL import Image, ImageDraw
import subprocess, json, statistics

dest=Path('evidence/v04-p0-review');dest.mkdir(exist_ok=True)
reports={}
for path in Path('evidence/v04-p0-motion').glob('*.webm'):
    probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(path)]))
    decoded=subprocess.run(['ffmpeg','-v','error','-threads','2','-i',str(path),'-vf','scale=160:90','-fps_mode','passthrough','-enc_time_base','1:1000','-pix_fmt','gray','-f','rawvideo','-'],capture_output=True,check=True)
    raw=decoded.stdout;size=160*90;deltas=[]
    for i in range(size,len(raw),size):
        a=raw[i-size:i];b=raw[i:i+size]
        if len(b)==size:deltas.append(sum(abs(x-y) for x,y in zip(a,b))/size)
    stream=next(s for s in probe['streams'] if s['codec_type']=='video')
    assert len(raw)//size==int(stream['nb_read_frames']), 'Decoder must not synthesize duplicate frames'
    packets=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_packets','-show_entries','packet=pts_time','-of','json',str(path)]))['packets']
    pts=[float(p['pts_time']) for p in packets]
    assert all(b>a for a,b in zip(pts,pts[1:])), 'Original packet timestamps must increase'
    reports[path.stem]={'width':stream['width'],'height':stream['height'],'frames':int(stream['nb_read_frames']),'duration':pts[-1]-pts[0],'durationScope':'First-to-last packet timestamps; live MediaRecorder container has no duration header. Last-frame duration is not inferred.','decodeErrors':decoded.stderr.decode(),'meanFrameDeltaByte':statistics.mean(deltas),'maxFrameDeltaByte':max(deltas),'allFrameDeltas':deltas,'scope':'Decoded grayscale frame differences at 160x90. Camera movement and glitter affect this statistic; no universal pass threshold.'}
    sheet=Image.new('RGB',(1920,298),'#101b20');draw=ImageDraw.Draw(sheet)
    for i,t in enumerate([0,3,6,9]):
        out=dest/f'{path.stem}-{t}s.png'
        subprocess.run(['ffmpeg','-v','error','-threads','2','-ss',str(t),'-i',str(path),'-frames:v','1','-y',str(out)],check=True)
        img=Image.open(out);img.thumbnail((480,270));sheet.paste(img,(i*480,28));draw.text((i*480+8,7),f'{path.stem} / {t}s',fill='white')
    sheet.save(dest/f'{path.stem}-motion-index.png')
(dest/'motion-decode.json').write_text(json.dumps(reports,indent=2)+'\n')
print(json.dumps({k:{f:v[f] for f in ['width','height','frames','duration','decodeErrors','maxFrameDeltaByte']} for k,v in reports.items()},indent=2))
