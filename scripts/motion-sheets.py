"""Sample source timestamps, never retime clips. Originals remain unmodified."""
from pathlib import Path
from io import BytesIO
import json
import subprocess
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1]
destination = root / 'evidence/motion-review'
reports = json.loads((destination / 'final-motion-audit.json').read_text())
for report in reports:
    clip = root / 'evidence/stage-04' / report['file']
    sheet = Image.new('RGB', (1920, 4 * 388), '#101c23')
    draw = ImageDraw.Draw(sheet)
    for i in range(12):
        time = report['timestampSpanSeconds'] * i / 12
        data = subprocess.check_output([
            'ffmpeg', '-v', 'error', '-threads', '1', '-i', str(clip),
            '-ss', str(time), '-frames:v', '1', '-vf', 'scale=640:360',
            '-f', 'image2pipe', '-vcodec', 'png', 'pipe:1'])
        with Image.open(BytesIO(data)) as frame:
            x, y = (i % 3) * 640, (i // 3) * 388
            sheet.paste(frame, (x, y + 28))
            draw.text((x + 8, y + 8), f'{clip.stem} / {time:.3f} s', fill='#edf0ed')
    sheet.save(destination / f'{clip.stem}-sheet.png')
    if 'skim' in clip.name or 'waterline' in clip.name:
        frame = report['maxChangeFrame']
        for index in [frame - 1, frame]:
            output = destination / f'{clip.stem}-change-{index}.png'
            subprocess.run([
                'ffmpeg', '-v', 'error', '-threads', '1', '-i', str(clip),
                '-vf', f'select=eq(n\\,{index})', '-frames:v', '1',
                '-y', str(output)], check=True)
    print(clip.name)
