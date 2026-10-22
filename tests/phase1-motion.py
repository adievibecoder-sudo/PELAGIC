"""Decode all originals; extract timestamped evidence frames, never rewrite videos."""
from pathlib import Path
import argparse,json,subprocess
from PIL import Image,ImageDraw
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--after',default='v04-p1-final-motion')
parser.add_argument('--output',default='v04-p1-final-review')
args=parser.parse_args()
root=Path('evidence');out=root/args.output;out.mkdir(exist_ok=True)
results=[]
for directory in ['v04-p1-baseline-motion',args.after]:
 for movie in sorted((root/directory).glob('*.webm')):
    probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(movie)]))
    packets=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_packets','-show_entries','packet=pts_time','-of','json',str(movie)]))['packets']
    pts=[float(p['pts_time']) for p in packets];assert all(b>a for a,b in zip(pts,pts[1:]))
    duration=pts[-1]-pts[0];stream=next(s for s in probe['streams'] if s['codec_type']=='video')
    # Preserve the WebM millisecond time base; nominal-rate quantization can
    # produce duplicate null-mux DTS even when original packet PTS increase.
    decode=subprocess.run(['ffmpeg','-v','error','-i',str(movie),'-enc_time_base','1:1000','-fps_mode','passthrough','-f','null','-'],capture_output=True,text=True)
    times=[.5,duration*.25,duration*.5,duration*.75,max(.5,duration-.5)];sheet=Image.new('RGB',(960*len(times),570),(15,25,30));draw=ImageDraw.Draw(sheet)
    for i,t in enumerate(times):
      path=out/f'{directory}-{movie.stem}-{i}.png'
      subprocess.run(['ffmpeg','-v','error','-ss',str(t),'-i',str(movie),'-frames:v','1','-y',str(path)],check=True)
      sheet.paste(Image.open(path).resize((960,540)),(i*960,30));draw.text((i*960+8,8),f'{movie.stem} / {t:.2f}s',fill='white')
    sheet.save(out/f'{directory}-{movie.stem}-sheet.png')
    r=json.loads(movie.with_suffix('.json').read_text());frames=r.get('frameRecords',[])
    timesW=[f.get('weather',{}).get('clocks',{}).get('weather') for f in frames]
    results.append({'path':str(movie),'width':stream['width'],'height':stream['height'],'duration':duration,'durationScope':'First to last original packet timestamp; no final-frame duration inferred.','fullDecodeReturnCode':decode.returncode,'decodeErrors':decode.stderr,
      'source':r.get('sourceCheckpoint'),'errors':r.get('errors'),'frameRecords':len(frames),'weatherSecondsRange':[timesW[0],timesW[-1]] if timesW else [],
      'swellRange':[min(f['weather']['swellHs'] for f in frames),max(f['weather']['swellHs'] for f in frames)] if frames and 'weather' in frames[0] else None,
      'cameraXRange':[min(f['camera'][0] for f in frames),max(f['camera'][0] for f in frames)] if frames else None,
      'inspectionScope':'Full decode validation plus five extracted original-resolution samples; playback inspection recorded separately. Does not certify all temporal artifacts.'})
    print(movie,duration,decode.returncode)
(out/'motion-analysis.json').write_text(json.dumps(results,indent=2))
