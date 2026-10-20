"""Export denser transition evidence without changing original recordings."""
import json
from pathlib import Path
import subprocess
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1] / 'evidence/v03-integrated'
out = root / 'motion-dense'
out.mkdir(exist_ok=True)
metrics = json.loads((root/'motion-review/motion-metrics.json').read_text())
for name in ['waterline', 'skim', 'rebase', 'clear-glitter']:
    record = next(r for r in metrics if r['file'] == f'v03-{name}-motion.webm')
    change = record['meanAbsoluteRGBFrameChanges']
    peak = record['sourceTimestampsSeconds'][change.index(max(change))+1]
    start = max(0, peak-0.6) if name != 'rebase' else 2.9
    subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(start), '-i', str(root/record['file']),
                    '-vf', 'fps=15', '-frames:v', '20', '-y', str(out/(name+'-%02d.png'))], check=True)
    sheet = Image.new('RGB', (1600, 980), '#101b20')
    draw = ImageDraw.Draw(sheet)
    for index, file in enumerate(sorted(out.glob(name+'-*.png'))):
        im = Image.open(file).convert('RGB'); im.thumbnail((400, 225))
        x, y = (index % 4)*400, (index//4)*196
        im.thumbnail((400, 174)); sheet.paste(im, (x, y+20))
        draw.text((x+8, y+2), f'{name}: ~{start+index/15:.3f} s', fill='white')
    sheet.save(out/(name+'-contact.jpg'), quality=95)
print('Dense samples saved; timestamps label resampled targets, not exact source presentation times.')
