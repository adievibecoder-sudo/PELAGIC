# Reproduce Phase 1

Use the `development/pelagic-0.4` checkpoint with Git LFS materialized. Node 20+ and desktop Chrome with native WebGPU are required. There is no WebGL fallback. Do not overwrite a retained evidence stage; substitute a fresh `v04-p1-...` stage name on every run.

```powershell
git lfs pull
npm test
npm start -- 8082
```

Review originals at `http://127.0.0.1:8082/phase1-review.html`. GPU validation is separate from playback or screenshots. `docs/V04-BROWSER-RECOVERY.md` documents the supported Chrome connection and exact limitations; no security change or browser restart is required for normal operation.

## Tests and fixed controls

Use the actual `git rev-parse HEAD` value for `revision`; it is an annotation, not a source attestation.

```text
/environment-tests.html?stage=v04-p1-repro-tests&revision=ACTUAL_SHA&auto=1
/tests.html?stage=v04-p1-repro-tests
/optics.html?stage=v04-p1-repro-tests
/phase1.html?stage=v04-p1-repro-stills&revision=ACTUAL_SHA&auto=1
/phase1.html?mode=motion&stage=v04-p1-repro-motion&revision=ACTUAL_SHA&auto=1
/phase1-light.html?stage=v04-p1-repro-light&revision=ACTUAL_SHA&auto=1
/phase1-light.html?mode=motion&stage=v04-p1-repro-light-motion&revision=ACTUAL_SHA&auto=1
```

Check the harness's visible Run button if it does not auto-start. FFT and optics pages run automatically. Preserve JSON alongside each original PNG/WebM. The still harness fixes 1920x1080, seed1307, pose, wave time and exposure. Natural/instant/front clips use explicit compressed timing; recording duration is not physical weather duration. Render PNGs are original pixels; browser JPEGs show page state.

For the paused lighting control use the `steady-100` settings in `phase1-light.html`. Compare frames 100 and 1060 to match the post shader's frame-modulo-64 dither. Frame 1000 intentionally differs in dither phase. The light readbacks can be compared independently of display pixels.

## Profiling

Keep the rendering Chrome window visible, active and unobscured. Do not decode videos, render another GPU page or run unrelated tests concurrently. Record other open applications, GPU identity, power/temperature/clocks and document visibility. The suite records 60-second display-paced runs, then a 120-second repeat; first 30 frames are omitted from frame records. It is not an isolated-device or long-endurance certification.

```text
/phase1-benchmark.html?stage=v04-p1-repro-performance&revision=ACTUAL_SHA&auto=1
```

Use `only=golden-balanced,storm-balanced,golden-high` for the representative three-case suite. Readback-off cases test instrumentation effects, not the removal of probe compute or all query writes. Frame-time FPS is computed from recorded intervals, never by summing median GPU passes. The final timestamp cadence is seven frames, coprime to six cache-build frames; earlier eight-frame sampling missed irradiance publications.

The preserved baseline server is a separate de7b32b source archive on port8081 with only the laboratory harness added. Its original render sources remain unchanged. Run `/phase1-benchmark.html?baseline=1&revision=de7b32b&auto=1` there. Copy completed JSON files to a new current-repository evidence directory; never regenerate or overwrite Phase 0 captures/manifests. Baseline and current clock semantics differ; report that limitation.

## Analysis and preservation

Python needs NumPy and Pillow; FFmpeg/ffprobe must be available for video checks. These tools analyze actual originals, not generated replacement images.

```powershell
python tests/phase1-evidence.py --after v04-p1-recovered-stills --output v04-p1-repro-review
python tests/phase1-motion.py --after v04-p1-light-motion --output v04-p1-repro-motion-review --skip-baseline
node tests/phase1-inventory.mjs evidence/v04-p1-repro-review/manifest.json
```

The inventory fails rather than overwriting an existing manifest. It checks all 138 frozen Phase 0 evidence hashes and frozen local refs, inventories Phase 1 originals/derived evidence and hashes tracked source files. Remote publication verification remains a separate operation. Decoder success, archive integrity and numerical PASS do not imply visual PASS.

`phase1-motion-review.html` plays retained originals with normal browser controls and records decoded/presented frame information. Visual assessment must state its observation scope; callback logs do not prove photographic motion or absence of every artifact.

For UI save/restore/share tests, preserve any existing saved configuration through the UI before writing a test save. The Phase 1 validation uses a separate localhost origin and a paused snapshot so clocks do not invalidate equality checks. Imported/shared state restores mathematical configuration/history; it does not serialize live foam textures or particles.

STOP at the Phase 1 owner gate. These reproduction commands grant no authorization for Phases 2+3.
