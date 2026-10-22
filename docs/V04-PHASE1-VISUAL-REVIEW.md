# Phase 1 visual review - 22 October 2026

## Final controlled review

Fresh Chrome originals: `v04-p1-recovered-stills` (12 PNG/JSON pairs), `v04-p1-recovered-motion` (five20 s movies), `v04-p1-light-controls` (10 still controls), `v04-p1-light-motion` (two20 s movies). NVIDIA/Ampere and RTX process corroboration are documented separately. Earlier unknown-origin stills remain untouched.

All12 supplied stills were inspected at original1920x1080; fresh underwater-covered, storm, broken, veil-golden0/1 and reflection100/700 were opened separately. Fresh reruns reproduce11/12 supplied PNGs byte-for-byte; storm maximum difference1 code. `v04-p1-handoff-review` retains baseline comparisons and shared-setting differences, not realism scores.

Stationary frame100/1000 has identical light readbacks but different display dither. Follow-up1060 matches100 modulo64: PNG byte-identical and light readbacks equal. This explains the two-code display discrepancy in this control.

Twelve baseline/final/light movies decoded completely with strictly increasing timestamps and no corrected-decoder errors. Earlier null-mux DTS warnings remain archived; preserving the original millisecond time base fixes those warnings without rewriting movies.

Nine originals played through normal Chrome controls to `ended`: seven current clips plus baseline broken-cloud and underwater controls. Original1920x1080 video scaled to fit the browser. Every playback callback reported visible. Browser dropped0-3 frames per clip: baseline clips1 each, current front/weather3 each, others0. Playback is not render FPS.

**Inspection scope:** two timestamped browser observations per current clip, one per baseline control, plus five extracted original-resolution samples per movie. Continuous files were decoded and played through; the agent did NOT visually perceive every frame. No blanket ghosting-free, smooth-motion or physical-naturalism claim follows. `v04-p1-playback` retains callback logs and browser screenshots; owner can inspect original footage.

| Clip / observed playback times (s) | Observation | Remaining limitation |
|---|---|---|
| Broken /3.95,13.00 | Swell/glint pattern changes; directional illumination retained | Uniform fine texture and repeated inflated clouds; no major gain over baseline |
| Natural weather /6.09,14.32 | Clear glitter gives way to covered dark sea; supported rain changes in logs | Prescribed600x weather, sparse whitewater and weak rain |
| Front flight /4.22,14.31 | Cover dims reflections and changes haze/cloud support | Artificial ice bands and uniform distant water; not every rebase inspected |
| Instant /6.08,14.30 | Explicit scene states differ; wave time remains monotone | Abrupt preview intentional; these samples cannot establish transition smoothness |
| Underwater /4.22,14.31 | Covered volume darkens with surface illumination | Nearly featureless navy volume; attenuation not observationally calibrated |
| Reflection /4.21,14.31 | Reflected regions move locally while wave time stays20 s | Cache cadence/angular approximation; subtle stepping unverified |
| Golden glitter /4.23,14.32 | Narrow bright glitter diminishes under cover; warm diffuse light remains | Broad horizon glare and artificial cloud silhouettes |
| Baseline broken /6.60 | Similar surface/sky character | Different elapsed protocol; not pixel-matched motion |
| Baseline underwater /6.63 | Bright blue volume persists in historical weather test | Different10 s protocol; static pairs isolate the input correction |

No new real-world reference was inspected during recovery/final validation. Earlier photograph and metadata limits: `V04-PHASE1-SOURCES.md`. No whole-project AAA PASS, full48-view sweep, new waterline repair or all-frame temporal certification is claimed.

## Historical supplied-still review

The pending tests/browser limitations below describe the earlier checkpoint, superseded by current results above.

## Provenance

Twelve PNG/JSON pairs appeared in `evidence/v04-p1-final-stills` between sessions, replacing the previous clear pair. The owner could not identify their browser and explicitly authorized inspection without overwriting. All originals were left untouched. Derived analysis uses the separate `v04-p1-provenance-review` directory; the earlier one-pair checkpoint remains historical.

All reports identify b6349d3, native WebGPU, NVIDIA/Ampere, Chrome 156, 1920x1080, seed 1307, Balanced, frame 100, wave time 21.6666666666666 s. No renderer-source differences exist between b6349d3 and the current reviewed tree. These are supplied revision labels, not per-capture source hashes. The exact browser host and initiating person/process remain UNVERIFIED. Ambient app context showed the in-app laboratory page; that does not prove it generated the files. Prior same-session desktop Chrome corroboration used Chrome 155.

Fresh `nvidia-smi` reports RTX 3050 Laptop GPU, driver 617.14, 4096 MiB. This corroborates installed hardware, not which browser process rendered these images. Do not claim a new complete desktop-Chrome hardware validation.

All twelve reports contain zero logged errors, HDR invalid count zero, and zero invalid shadow/irradiance/angular samples. Tracked requested payload is approximately 195.10 MiB. Neither those counts nor short capture timings constitute a sustained benchmark or measured GPU residency.

## Comparison controls

All poses, FOVs, output sizes and wave times match the de7b32b baseline. All selected physical settings match. All shared settings are also listed by the analyzer: `weatherRate` changes from 60 to 1 in every pair, reflecting the independent clock contract; these stationary captures have no commanded weather transition. `glitter-covered` additionally has camera speed 1.289659336287996 versus 6, despite identical static pose/FOV. Keep its strict whole-camera mismatch flag. Do not describe the entire capture set as identical configurations or matched browser versions.

Mean absolute RGB display-code differences from the baseline (0-255 scale): clear 0.00198045; broken 0.00393792; covered 0.00617702; golden 0.00243248; storm 0.07864921; twilight 0.00029498; moonlit 0.00299029; underwater-clear 1.50771557; underwater-covered 49.24442306. Metrics quantify changed pixels, not realism.

## Original-resolution inspection

All twelve current 1920x1080 PNGs were opened at original resolution. The baseline underwater-covered original was also opened for direct comparison. Other baseline comparisons use pixel analysis and prior recorded inspection; no claim of a new exhaustive baseline visual review.

| Original | VIS observation | Verdict / scope |
|---|---|---|
| clear | Broad swell and bright central glitter present; short-wave texture appears uniform and cloth-like | Surface naturalism remains FAIL; null-control change is very small |
| broken | Reflected cloud light visible; repeated cloud spacing and inflated silhouettes remain obvious | Cloud morphology FAIL; directional motion UNVERIFIED |
| covered | Repeating rows converge toward the horizon; grey surface lacks convincing optical depth | Cloud and water realism FAIL |
| golden | Warm sky/reflected light share a coherent palette; regular cloud silhouettes and uniform short-scale wave texture remain | No substantial surface transformation established |
| storm | Large swells, dark sea, some crest spray and thin foam patches; breaking whitewater remains sparse | Inherited storm-breaking visual FAIL |
| twilight | Dark warm horizon and purple upper sky; ocean retains only weak visible detail | Colour/exposure calibration UNVERIFIED; inherited artificial shapes remain |
| moonlit | Stars, faint directional sheen and dark waves visible; cloud structure stays procedural | Astronomical/photographic realism not established by this still |
| underwater-clear | Cyan-blue volume and bright interface visible; volume remains smooth and nearly uniform | Full underwater realism FAIL |
| underwater-covered | Volume becomes much darker than both clear water and old covered baseline; bright interface remains | Narrow cloud-aware illumination correction visibly demonstrated; full underwater optics FAIL |
| reflection | Broad angular bright/dark reflected regions visible | Static contribution visible; moving-cloud reflection acceptance UNVERIFIED |
| body-covered | Very dark blue water-body contribution, weak structure | Diagnostic only; not a standalone beauty image |
| glitter-covered | Direct glitter strongly suppressed under coverage; small residual glints remain | Consistent with strong attenuation; finite-disc/motion quality not tested |

Covered centre direct-Sun transmittance is 0.0012798309326171875; clear is 1. This is a sampled cloud-transmittance factor, not the full atmospheric transmittance or an empirical radiometric validation. The final ice-veil correction has no isolated veil-only A/B here, so its visible benefit remains UNVERIFIED.

## Remaining gates

Final regional GPU/FFT/optical regression tests, continuous final motion, dedicated angular-cloud crossing, UI save/load/share, sustained baseline/current GPU profiling and stall trace remain pending. No final motion playback was inspected this session. Existing videos and their preliminary decode checks remain preserved. No new real-world reference comparison was performed this session.

Desktop Computer Use stopped again because it could not verify whether the active Chrome URL was allowed. Further UI input was not attempted. The local server remains reachable. Re-entry needs the external desktop Chrome window already open on a local validation page; opening the app's embedded browser does not repair the external-window policy check.
