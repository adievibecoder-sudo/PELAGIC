"""Encode existing fixed-step originals; verify every decoded RGB byte."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys

from PIL import Image

folder = Path(sys.argv[1])
scene = sys.argv[2]
count = int(sys.argv[3])
verification = sys.argv[4] if len(sys.argv) > 4 else 'lossless-verification.json'
ffmpeg = 'C:/Users/adity/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe'
video = folder / (scene+'.webm')
subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-n', '-framerate', '24',
    '-i', str(folder/(scene+'_%d.png')), '-frames:v', str(count), '-c:v', 'libvpx-vp9',
    '-lossless', '1', '-pix_fmt', 'gbrp', '-cpu-used', '4', '-row-mt', '1', '-threads', '4', str(video)], check=True)
process = subprocess.Popen([ffmpeg, '-hide_banner', '-loglevel', 'error', '-i', str(video),
    '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
hashes = []
for i in range(count):
    original = Image.open(folder/f'{scene}_{i}.png').convert('RGB').tobytes()
    decoded = process.stdout.read(len(original))
    if decoded != original:
        raise RuntimeError(f'Decoded RGB mismatch at frame {i}')
    hashes.append(hashlib.sha256(decoded).hexdigest())
assert not process.stdout.read(1)
assert process.wait() == 0
report = dict(frames=count, fps=24, seconds=count/24, dimensions=[1920, 1080],
              codec='VP9 lossless gbrp', decodedRGBMatchesAllPNGFrames=True, rgbSHA256=hashes)
with (folder/verification).open('x') as f:
    json.dump(report, f, indent=2)
print(video, 'PASS:', count, 'lossless RGB frames')
