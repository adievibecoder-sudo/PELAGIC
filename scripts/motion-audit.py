"""Decode every recorded frame. Cadence/change diagnostics are not a realism score."""
from pathlib import Path
import json
import subprocess
from statistics import mean
from PIL import Image, ImageChops, ImageStat

root = Path(__file__).resolve().parents[1]
reports = []
for clip in sorted((root / 'evidence/stage-04').glob('final-*.webm')):
    probe = json.loads(subprocess.check_output([
        'ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries',
        'stream=width,height:format=duration:frame=best_effort_timestamp_time',
        '-show_frames', '-of', 'json', str(clip)]))
    times = [float(f['best_effort_timestamp_time']) for f in probe['frames']]
    proc = subprocess.Popen(['ffmpeg', '-v', 'error', '-threads', '1', '-i', str(clip),
                             '-vf', 'scale=320:180', '-pix_fmt', 'gray',
                             '-fps_mode', 'passthrough', '-enc_time_base', '1:1000',
                             '-f', 'rawvideo', 'pipe:1'], stdout=subprocess.PIPE)
    previous = None
    differences, changed, luminance = [], [], []
    while True:
        data = proc.stdout.read(320 * 180)
        if not data:
            break
        if len(data) != 320 * 180:
            raise RuntimeError('Incomplete decoded frame: ' + clip.name)
        frame = Image.frombytes('L', (320, 180), data)
        luminance.append(ImageStat.Stat(frame).mean[0] / 255)
        if previous is not None:
            difference = ImageChops.difference(frame, previous)
            histogram = difference.histogram()
            differences.append(sum(i*n for i, n in enumerate(histogram)) / (320*180*255))
            changed.append(sum(histogram[52:]) / (320*180))
        previous = frame
    if proc.wait() != 0:
        raise RuntimeError('Decode failed: ' + clip.name)
    gaps = [b-a for a, b in zip(times, times[1:])]
    reports.append({
        'file': clip.name, 'width': probe['streams'][0]['width'],
        'height': probe['streams'][0]['height'], 'decodedFrames': len(luminance),
        'timestampedFrames': len(times),
        'containerDurationSeconds': float(probe.get('format', {}).get('duration', 'nan')) if 'duration' in probe.get('format', {}) else None,
        'timestampSpanSeconds': times[-1] - times[0],
        'meanFrameGapMs': mean(gaps) * 1000, 'maxFrameGapMs': max(gaps) * 1000,
        'nonmonotonicTimestamps': sum(gap <= 0 for gap in gaps),
        'meanAbsoluteLumaChange': mean(differences),
        'maxAbsoluteLumaChange': float(max(differences)),
        'maxChangeFrame': differences.index(max(differences)) + 1,
        'maxChangeTimeSeconds': times[differences.index(max(differences)) + 1],
        'maxFractionPixelsChangingOver20Percent': float(max(changed)),
        'scope': 'Every decoded frame, luminance analysis downsampled to 320x180. '
                 'Camera/waterline changes legitimately produce large differences. '
                 'No universal flicker or realism PASS threshold is inferred.'})
destination = root / 'evidence/motion-review/final-motion-audit.json'
destination.parent.mkdir(exist_ok=True)
destination.write_text(json.dumps(reports, indent=2))
print(json.dumps(reports, indent=2))
