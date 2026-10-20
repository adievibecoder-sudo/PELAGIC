# Phase 0 reproduction

Use desktop Chrome on the corroborated RTX 3050. Do not use an embedded/headless/software result as target-hardware proof. All commands run from the repository root. Requires Node >=20; Python/Pillow and FFmpeg only for evidence analysis. No production engine dependencies added.

## Local commands

```powershell
git switch development/pelagic-0.4
git lfs pull
npm test
node tests/phase0-science.mjs
node tests/phase0-crest.mjs
node tests/phase0-optics.mjs
npm start
```

Existing evidence is published under `evidence/v04-p0-*`; use a **new stage name** for reruns so original files are not overwritten. Default laboratory URLs overwrite their named captures if reused. Old 0.2/0.3 evidence must never be used as a write destination.

Open these URLs manually in the same desktop Chrome session:

```text
http://127.0.0.1:8080/tests/webgpu-hardware-probe.html?stage=v04-p0-owner-preflight
http://127.0.0.1:8080/tests.html
http://127.0.0.1:8080/optics.html
http://127.0.0.1:8080/phase0.html?stage=v04-p0-owner-stills&revision=OWNER_COMMIT
http://127.0.0.1:8080/phase0.html?mode=motion&stage=v04-p0-owner-motion&revision=OWNER_COMMIT
http://127.0.0.1:8080/phase0-review.html
```

Click **Run comparisons** once. Expected: 22 PNG/JSON pairs for stills; nine WebM/JSON pairs for motion. `start=N` resumes zero-based case N. The host document reloads between cases to release the previous GPU iframe. The renderer remains native WebGPU; any failure should remain visible rather than silently advance. `phase0-review.html` displays the archived stage, not an owner rerun folder.

GPU tests report their own numerical bounds. A passing compute marker alone is insufficient hardware proof: retain adapter JSON plus same-session `chrome://gpu` active GPU/WebGPU/driver/Problems Detected, with OS corroboration if device strings are redacted. Never interpret ANGLE's backend as Dawn's backend.

## Matched display-paced benchmarks

Close unrelated substantial GPU work if possible, keep Chrome foreground on AC, record actual display/power state. The historical camera differs between golden and storm. These URLs keep normal pass grouping:

```text
http://127.0.0.1:8080/?preset=golden&benchmark=golden-balanced&stage=v04-p0-owner-performance&frames=1800&benchmarkSeconds=120&w=1920&h=1080&adaptive=0&quality=Balanced&seed=1307&t=0&cam=0,2,0,4,-5.5&cameraMode=free&ui=0&validate=1&p0=1&revision=OWNER_COMMIT
http://127.0.0.1:8080/?preset=storm&benchmark=storm-balanced&stage=v04-p0-owner-performance&frames=1800&benchmarkSeconds=120&w=1920&h=1080&adaptive=0&quality=Balanced&seed=1307&t=0&cam=0,5,0,79,-9&cameraMode=free&ui=0&validate=1&p0=1&revision=OWNER_COMMIT
```

For High use `quality=High` and a different benchmark filename. Add `p0Profile=1` for cloud/environment subpasses; label these separately because pass splitting may add overhead. Expected title: BENCHMARK DONE, one JSON per run. Stop reason and actual sample count are in JSON. First 30 frames warm up; for endurance use larger frame/time limits supported by runtimeInput, and inspect thermal/power state. Do not call 120 seconds a long-run stability proof.

Optional board telemetry (Ctrl-C after testing):

```powershell
nvidia-smi --query-gpu=timestamp,name,pstate,temperature.gpu,utilization.gpu,memory.used,power.draw,clocks.gr,clocks.mem --format=csv -l 1 -f evidence/v04-p0-owner-performance/board.csv
```

Create that output directory first. This is whole-board usage, not renderer residency. Browser visibility does not establish foreground/unoccluded scheduling by itself.

## Evidence analysis

```powershell
python tests/phase0-evidence.py
python tests/phase0-motion.py
node tests/phase0-manifest.mjs
```

The manifest command is read-only verification: 22 stills, nine motion clips, matched conditions, adapter/error/HDR records and every archived source/evidence SHA-256. It needs a Git checkout and materialized LFS media (`git lfs pull`), not pointer text. After an intentional, reviewed archive change, `node tests/phase0-manifest.mjs --write` regenerates the manifest; never use regeneration to conceal a mismatch. Hashes attest the final delivered source, not contemporaneous per-capture source: `a1092a0-lab` was an uncommitted instrumented tree.

Analysis targets the archived Phase 0 directories. Original images/videos are never rewritten by analysis; derivatives are in `v04-p0-review`. Run integrity verification before regenerating derivatives; Pillow/FFmpeg version differences can change derivative hashes. CIE official CSVs have their own CC BY-SA 4.0 attribution in `tests/data/cie/README.md`; checksums are verified before integration. The spectral colour test is a limited D65 experiment, not seawater validation.

Inspect full-resolution originals, masks and movies, not only contact sheets. Reject visual success claims if cloud rows, blurred decks, shiny uniform water, film-like breaking or immersion discontinuities remain. Video files preserve variable timestamps; frame count/10 seconds is not application FPS. Numerical scene-change metrics are diagnostics, not perceptual acceptance thresholds.

## Independent publication check

The published experiment checkpoint is `62f0f752fea7e211c4aea1addf140ff3ee217679`. To repeat the remote media check without trusting the checkout's existing LFS cache:

```powershell
$verificationStore = Join-Path (Split-Path (Get-Location).Path) ('pelagic-lfs-check-' + [Guid]::NewGuid().ToString('N'))
git -c "lfs.storage=$verificationStore" lfs fetch origin 62f0f752fea7e211c4aea1addf140ff3ee217679
git -c "lfs.storage=$verificationStore" lfs fsck --objects 62f0f752fea7e211c4aea1addf140ff3ee217679
```

Expected: 81 unique downloaded objects, 262,904,474 bytes, `Git LFS fsck OK`. This makes a separate local verification cache and does not change the working checkout. The retained publication JSON also records explicit SHA-256 comparison against every object filename and unchanged frozen remote refs.
