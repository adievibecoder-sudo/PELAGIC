"""Inspect every decoded frame for duplicate holds; export full-size review frames.

Requires ffmpeg, ffprobe and Pillow. Metrics do not certify natural motion.
Usage: python tests/inspect-motion.py evidence/v03-phase03
"""
import json
from pathlib import Path
import subprocess
import sys

from PIL import Image, ImageDraw, ImageChops, ImageStat

stage = Path(sys.argv[1]).resolve()
out = stage / 'motion-review'
out.mkdir(exist_ok=True)
reports = []
for video in sorted(stage.glob('*.webm')):
    probe = json.loads(subprocess.check_output([
        'ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(video)
    ]))
    command = ['ffmpeg', '-v', 'error', '-i', str(video), '-vf', 'scale=480:270',
               '-pix_fmt', 'rgb24', '-fps_mode', 'passthrough', '-f', 'rawvideo', '-']
    process = subprocess.Popen(command, stdout=subprocess.PIPE)
    previous = None
    changes = []
    frames = 0
    while True:
        data = process.stdout.read(480*270*3)
        if not data:
            break
        if len(data) != 480*270*3:
            raise RuntimeError('Incomplete decoded frame')
        frame = Image.frombytes('RGB', (480, 270), data)
        if previous is not None:
            changes.append(sum(ImageStat.Stat(ImageChops.difference(frame, previous)).mean)/3)
        previous = frame
        frames += 1
    if process.wait() != 0:
        raise RuntimeError('ffmpeg decode failed')
    subprocess.run(['ffmpeg', '-v', 'error', '-i', str(video), '-vf', 'fps=1',
                    '-frames:v', '10', '-y', str(out / (video.stem+'-%02d.png'))], check=True)
    samples = sorted(out.glob(video.stem+'-*.png'))
    sheet = Image.new('RGB', (1440, 900), '#14232b')
    draw = ImageDraw.Draw(sheet)
    for i, file in enumerate(samples):
        image = Image.open(file).convert('RGB')
        image.thumbnail((480,270))
        x, y = (i % 3)*480, (i//3)*225
        image.thumbnail((480,200))
        sheet.paste(image, (x,y+20))
        draw.text((x+8,y+3), f'{video.stem} / sample {i} s', fill='white')
    sheet.save(out/(video.stem+'-contact.jpg'), quality=94)
    reports.append({'file':video.name, 'decodedFrames':frames, 'container':probe['format'],
                    'stream':probe['streams'][0], 'meanAbsoluteRGBFrameChanges':changes,
                    'exactDuplicateFrames':sum(c == 0 for c in changes),
                    'limitation':'All frames decoded; duplicate metric uses downsampled pixels. Naturalism and glitter quality need visual review; no universal motion quality threshold.'})
(out/'motion-metrics.json').write_text(json.dumps(reports, indent=2), encoding='utf-8')
print(json.dumps([{'file':r['file'],'frames':r['decodedFrames'],'duplicates':r['exactDuplicateFrames']} for r in reports], indent=2))
