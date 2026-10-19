"""Build labelled comparison sheets; retain original, unmodified PNG captures."""
from pathlib import Path
import json
import shutil
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1]
baseline = root.parent / 'pelagic' / 'evidence' / 'stage-04'
retained = root / 'evidence' / 'baseline-0.1'
review = root / 'evidence' / 'review'
retained.mkdir(exist_ok=True)
review.mkdir(exist_ok=True)
matches = []
for scene in ['calm', 'midday', 'golden', 'storm', 'twilight', 'moonlit']:
    names = [f'{scene}-h{h}-a{a}' for h in ['0p5', '2', '50', '500'] for a in [0, 75]]
    sheet = Image.new('RGB', (2560, 1552), '#101c23')
    draw = ImageDraw.Draw(sheet)
    for i, name in enumerate(names):
        for ext in ['png', 'json']:
            shutil.copy2(baseline / f'{name}.{ext}', retained / f'{name}.{ext}')
        old = json.loads((retained / f'{name}.json').read_text())
        new = json.loads((root / 'evidence/stage-04' / f'{name}.json').read_text())
        keys = ['settings', 'camera', 'simulationTime', 'frameIndex', 'width', 'height']
        mismatch = [k for k in keys if old[k] != new[k]]
        matches.append({'view': name, 'differentFields': mismatch,
                        'note': 'Equal inputs do not imply equal realized wave fields after spectrum changes.'})
        for version, folder in enumerate([retained, root / 'evidence/stage-04']):
            x = (i % 4) * 640
            y = (i // 4 * 2 + version) * 388
            with Image.open(folder / f'{name}.png') as im:
                sheet.paste(im.resize((640, 360), Image.Resampling.LANCZOS), (x, y + 28))
            draw.text((x + 10, y + 8), f'0.{version + 1} | {name}', fill='#e4e9e3')
    sheet.save(review / f'{scene}-comparison.png')
for name in ['underwater-window', 'underwater-horizon', 'half-submerged', 'close-wave']:
    for ext in ['png', 'json']:
        shutil.copy2(baseline / f'{name}.{ext}', retained / f'{name}.{ext}')
(review / 'matched-inputs.json').write_text(json.dumps(matches, indent=2))
print(json.dumps({'comparisons': len(matches), 'mismatched': [r for r in matches if r['differentFields']]}))
