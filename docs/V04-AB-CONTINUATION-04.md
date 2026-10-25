# A+B continuation 04 - hybrid temporal foundation

25 October 2026. Combined A+B remains in development. This is a substantial renderer checkpoint for owner review, not A, B1, B2 or combined acceptance. MSAA-only remains the default. No release or Milestone C work.

## Resume and preservation

Started on `development/pelagic-0.4`, inspected inherited changes, fetched and fast-forwarded documentation to `87f626ad59b4f4ea4dd72e3dfdf2dc8c15efe331`. Rendering source matched `f8703f8`; no completed correction was rebuilt. Nine historical evidence modifications match the recovery manifest and remain unstaged. The inherited dependency-free `package-lock.json` remains untracked. Entry/hardware records: `evidence/v04-ma-ab4-resume-01`.

Initial implementation commit: `aa13379`; final refinement: `1a992ff`. Final refinement replaces bilinear history with bounded Catmull-Rom sampling and reduces surface history. Exact per-capture source hashes distinguish those revisions; a recorded HEAD alone does not identify uncommitted shader changes.

## Implemented, opt-in

- `aa=taa`: 4x MSAA plus short HDR history. Default MSAA shaders remain unchanged by the temporal shader transform. The new MSAA golden original is byte-identical to the earlier reference.
- `temporal-camera.js`: centered four-phase quarter-pixel jitter; optional centered eight-sample Halton (`taaJitter=halton`); retained unjittered matrices, old camera/origins/chop/wind/roughness/divisor; resize and discontinuity resets.
- `taa.js`, `wgsl/taa.js`: depth-equal multisampled ocean motion using the production vertex geometry and previous FFT displacement/derivatives. Resolve chooses the largest reverse-Z depth and motion from that same MSAA sample. No hardware depth resolve.
- HDR/depth ping-pong, old/current storage-divisor conversion, offscreen/depth/coverage rejection, YCoCg variance clipping, motion-dependent short history, glint/foam/immersion/particle reactivity. Catmull-Rom history avoids the extra smoothing observed with bilinear sampling. Surface history is at most 0.45, falling toward 0.2 with motion; clear sky at most 0.6; cloud opacity limits history further.
- Existing displacement copy now follows motion/rendering; foam and particles still consume the preceding frame's displacement. Previous derivative storage exists only in hybrid mode. Resource ledger and timestamp measurements include the added work.
- Deterministic lossless PNG sequences (`captureStep`, `captureMotion=pan`, `seq`), focused native GPU tests and cloud-shadow diagnostics. Frame uniform layout extends uniformly from 180 to 228 floats.

The separate geometry pass is a correctness-first cost, not a throughput optimization. Surface trajectories do not exactly transport reflected scenery or propagating normal patterns. CDLOD correspondence is approximate. Manufactured resolve tests do not certify all production motion. Halton is available and its centering/signs are tested; perceptual superiority over the four-phase sequence has not been established. S5 cloud reconstruction is not implemented.

## Pacing and low-Sun intervention

Fresh top-level Chrome MSAA run: 509 frames in approximately 20 seconds; 479 retained intervals, median 41.6 ms, p95 41.8 ms, p99 42.7 ms. No hidden frames, GPU errors or 1 Hz gaps. Final 30-second foreground pair also has no 1 Hz gaps. The historical cause is **unresolved**, not fixed. Focus/embedding telemetry now accompanies visibility. No broad browser/power-setting changes were made.

The requested `abCloudShadow=off` experiment isolates direct solar cloud attenuation. Near-camera lower-third relative linear luminance rises from 0.0436685 to 0.404943 and a much stronger sun column appears. Removing physical cloud attenuation is rejected as a correction.

Source inspection found planar sea-to-cloud ray intervals against the cloud density's parabolic altitude, plus inadequate 12-point extinction quadrature. The opt-in `abShadow=curved12|curved48|curved96|reference512` uses matching curved intervals. Actual-density transmittance MAE against 1024 samples in the near 512 m region: legacy12 0.28448, curved12 0.56664, curved48 0.09656, curved96 0.02242, curved512 0.000564. Over 40 km: legacy12 0.10022, curved96 0.00638. Correct geometry alone makes coarse sampling worse; higher sampling is necessary. Dense integration still predicts strong near-camera extinction, so geometry does not explain the whole missing sun column. No default promotion. Failed diagnostic compilation in `shadow-02` is preserved; `shadow-03` contains corrected executed checks.

## Observed visuals and rejected settings

Four matched 1920x1080 controls: daylight and low Sun at 2 m and 50 m. `v04-ma-ab4-controls-01/*-msaa` are MSAA references. `v04-ma-ab4-final-stills-01/*-reference` are the **final hybrid**, despite the harness suffix. Settings, cameras and simulation times match; source fingerprints are stable within each capture.

The initial 0.72 bilinear history visibly softened fine low-Sun detail (about 32% lower lower-third gradient). A 4K MSAA reference and jitter-only control confirm that some lost structure is genuine detail, not simply aliasing. Rejected for adoption. Catmull-Rom plus shorter history improves retention, but final static-view lower-third RGB gradient ratios remain 82.4% golden-near, 84.9% golden-high, 81.7% daylight-near and 92.7% daylight-high. These are image diagnostics, not realism scores. Silver/bronze water, excess fine wrinkles and artificial cloud rims remain visible.

Two matched 48-frame 1080p sequences use 30 Hz fixed simulation and identical camera pan/translation. Each lossless VP9 `gbrp` clip is 1.6 seconds; every decoded RGB frame matches its PNG byte-for-byte. Mean lower-third RGB gradient retention is 95.2%. Raw unregistered frame difference changes 17.7029 to 17.3911 (about 1.8%); this includes real scene motion and **does not establish flicker reduction**. The different capture cadence and camera motion explain why this diagnostic must be reported separately from static controls. Longer, registered specular/foam tests remain necessary before promotion.

Storm regression uses the historical gravity-breaking settings, including diagnostic float32, with 600 frames from t20 to t30. New MSAA differs from the historical PNG in only two pixels by one code value; foam memory matches exactly. Hybrid foam memory also matches. The grey film-like foam remains a B1 failure.

Both lossless clips reached the 1.60 s endpoint in Chrome at quarter speed: 48 frames, zero dropped per clip. Opening/endpoint inspection shows moving wave groups, preserved broad reflections and remaining fine texture; this is sampled inspection, not exhaustive temporal certification. Earlier interactive real-time playback dropped frames. `v04-ma-ab4-checkpoint-01/playback.json` distinguishes media playback from renderer performance.

## Focused validation and cost

Final CPU suite: 58/58 PASS. Final production resolve on native NVIDIA/Ampere: 9/9 PASS (reset, stable history, exposure conversion, deliberately differing MSAA sample depths, disocclusion, mixed coverage, offscreen, reactive material, outlier history). Four-view and storm HDR/spectral readbacks PASS, no GPU errors. These tests do not close appearance failures. Historical FFT/optics/appearance suite totals are not represented as new executions.

Moonlit and twilight hybrid smoke captures also pass HDR/spectral checks with no GPU errors (`v04-ma-ab4-night-01`). They are not matched photometric acceptance tests; no celestial defect is closed. A 24-frame production pan crosses x=512 m: origin changes from 0 to 1024 m at frame 10; history remains valid, HDR finite, no GPU errors, no isolated raw image-difference spike at the crossing (`v04-ma-ab4-rebase-01/crossing-analysis.json`). This checks one transition, not all motion-vector correctness or long flights.

RTX 3050 Laptop 4096 MiB, driver 617.14; NVIDIA/Ampere browser identity corroborated by the Chrome GPU process in the NVIDIA process list. Actual residency unavailable. Other desktop applications remained active.

Final low-Sun near, Balanced 1920x1080: two sequential 30-second **foreground rAF** runs; first five seconds of retained records excluded. No hidden, unfocused or embedded retained frames. Timestamp quantization and lack of thermal-repeat confidence intervals limit small differences.

| Mode | Mean GPU ms | rAF cadence frames/s | Interval p95/p99 ms | Allocation payload MiB |
|---|---:|---:|---:|---:|
| 4x MSAA | 38.94 | 25.65 | 41.9 / 42.1 | 195.10 |
| Hybrid | 40.74 | 24.49 | 48.2 / 48.7 | 309.84 |

Hybrid motion pass 0.548 ms, resolve 0.710 ms. Whole-frame difference +1.81 ms includes other pass/run variation. Allocation increase 114.74 MiB is not residency. rAF cadence is not a compositor presentation trace. **No FPS improvement.** Originals: `v04-ma-ab4-profile-01`; reproducible analysis: `tools/analyze-ab4.py`, `v04-ma-ab4-checkpoint-01/analysis.json`.

## Open work and review

Review `ab4-review.html`: original stills, lossless motion and diagnostic shadow comparisons. Hybrid requires further reflection/normal-motion handling and detail/flicker tradeoff work before becoming the default. Low-Sun optics/body/crest illumination, spectral organization, B1 connected breaking/foam/bubbles/spray, cloud morphology, B2 rain/lightning/weather and night radiometric/precision fixes remain unfinished. The next appearance intervention should address these visible defects; temporal infrastructure must not displace that work.

Owner review is required at this substantial integrated checkpoint by active `AGENTS.md`. Implementation authorization remains in force; this request is visual review, not an assertion that A+B is complete. Frozen releases, main and historical evidence remain preserved.
