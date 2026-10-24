# Milestone A continuation: wave geometry, normals and roughness

23 October 2026. Owner-authorized continuation; A incomplete, B/C not authorized.

## Recovered state

Local and remote `development/pelagic-0.4` begin at `d4f7d806ffc5cb6ffc88e9aa9637edbfe3b5d574`. Main, 0.3 and release refs match the recorded frozen SHAs. Nine old final-stills modifications remain untouched; 24 current files match the preserved copies. Existing cloud trials remain opt-in and rejected as default replacements. W1-R1, E1-E6 and MA-C1/C2/W1/O1/P1/P2/R1 remain open within their recorded scopes.

Source/state/acceptance/phase-gate/master brief and relevant targeted R&D F/H read. Prior density-only failures, the correct Gaussian-group finding, existing moment filtering and finite-disc glitter are retained. No repeat of those experiments is proposed.

## First falsifiable visual hypothesis

- Observation (VIS): the preserved 1920x1080 elevated daylight image has weak broad-wave relief beneath dense, bright, wrinkled reflected detail; near-surface and low-Sun cases remain required controls.
- Suspected layers (HYP): mesh displacement filtering, shader-normal bandwidth and unresolved slope covariance may allocate wave structure inconsistently. Environmental radiance and sparse long modes may remain independent contributors.
- Smallest experiment: retain identical displaced vertices and simulation; compare neutral lighting from the actual rasterized facet normal against the production filtered normal, then inspect their angular difference, slope covariance and existing body/reflection/glitter outputs. Keep all four established scene settings and record exact source hashes. Angular difference includes intentional sub-mesh detail; it is NOT by itself a derivative-error test.
- Expected discrimination: coherent large forms in neutral geometry but wrinkles in neutral shader normals implicate detail allocation; weak forms in both implicate spectral/geometry structure. Brightness differences appearing only in the full material implicate optics/environment. No claim that stronger smoothing is physically correct without conserving slope energy.
- Risks: triangle facets in geometry diagnostics, tone-map contrast and uncalibrated neutral illumination can bias judgment. Diagnostics are observation tools, not candidate production materials or proof of naturalism.

## Baseline and constraints

Fresh unchanged-source captures use exclusive `v04-ma-wave-base-*` directories. Daylight/low-Sun, 2/50 m, seed1307, t20 plus100 fixed1/60 s steps, 1920x1080 Balanced, fixed exposures0.95/1.3, moderate wind/swell, weather/sea rates1, adaptive off. Baseline CPU35 PASS; fresh application adapter NVIDIA/Ampere. Exact RTX3050 renderer-process corroboration, new motion and display-paced profiles still pending.

Sandbox worker creation failed before CPU tests ran; approved host run passed. Source server also exited when sandbox blocked its Git child process; approved host server restored source attestation. These are execution-environment failures, not GPU correctness failures. Existing iframe batch capture stalls after its first navigation; use direct navigation to uncaptured cases, preserve originals.

This is a live experiment log. It does not certify A or replace the immutable first-cloud checkpoint report.

## Pixel-bandwidth trial

VIS: neutral raster and shader-normal images confirm broad waves in both, much finer detail in shader normals. The isolated elevated daylight glitter reproduces most of the bright foil texture; reflected environment retains broad forms. Baseline GPU Parseval/height/slope checks and all slope-mip levels PASS within the retained tolerances. The aggregate linear slope variance is0.0442594, independent-cascade Hs2.69051 m at this phase, not an observational match.

HYP: a one-pixel texture footprint leaves excessive resolved specular variation. Trial `maWaveFilter=2` (optional4 convergence comparator) enlarges both first/second-moment sampling footprints identically, preserving their parameter-space energy partition and leaving all displaced vertices, spectra, illumination and optical coefficients unchanged. The removed resolved variance enters the existing covariance path. This is a sampling diagnostic, NOT a calibrated physical roughness change; local deformed-moment closure and supersampled image agreement remain required. Reject if it only blurs the sea, hides needed waves, or fails to improve integrated motion.

VIS result: daylight elevated and low-Sun near images soften, but retain the dominant glossy/wrinkled character. No substantial improvement; not adopted. Do not claim a physical or temporal fix from this trial.

## Opaque patch ordering experiment

SRC: current traversal emits patches in quadtree/spatial order, including distant patches before nearer occluders. HYP: unnecessary overdraw contributes to the measured surface bottleneck. `maOceanOrder=near` performs a stable sort by distance to each undisplaced patch box, retaining identical instance values, topology, shaders and greater-depth testing. No phenomenon is removed. CPU scratch payload229376 bytes, no new GPU allocation. Compare exact fixed-phase full-resolution pixels, motion and display-paced pass times; equal-depth boundaries may depend on draw order. Reject adoption if images change materially or cost does not improve. This is performance work within A, not visual acceptance or a substitute for reconstruction.

## Covariance ablation and decisions

`maWaveCov=unstrained` removes only the inverse-Jacobian transform of unresolved covariance. Geometry and the deformed mean normal remain exact. This is an intentionally incomplete diagnostic, not a physical material replacement. Daylight elevated and low-Sun near originals retain the glossy/wrinkled character. Mean absolute display-channel changes are about 2.89/2.37/1.68 and 1.58/1.27/0.94 out of255. These differences are not perceptual acceptance metrics. Covariance strain is not the dominant cause in these two views; full deformed-moment closure remains UNVERIFIED. The ablation and wider-filter trial are not adopted.

Near-first ordering is adopted as the default after the controlled results below; `maOceanOrder=spatial` retains the old traversal for reproduction. No appearance shader, displacement, spectral energy or optical coefficient is changed by this adoption. The original four baseline PNGs match the published first-checkpoint originals byte-for-byte, and all four reordered PNGs match those baselines exactly. Settings/camera/time match; source manifests are stable and GPU errors empty. This is a performance improvement, not the substantial core-appearance transformation required for A.

## RTX 3050 timing evidence

Native Chrome WebGPU NVIDIA/Ampere; Chrome GPU PID corroboration and RTX3050 Laptop board records are in `v04-ma-wave-hardware-01`. New60 s display-paced runs use fixed1920x1080 Balanced targets, adaptation off. `v04-ma-wave-perf-base-04` and `v04-ma-wave-perf-near-02` form the four-view comparison. Warmup submission/frame IDs<=30 are excluded; timestamp queries sample approximately every seventh frame.

| Scene | FPS baseline / near-first | Mean GPU ms baseline / near-first | Surface ms baseline / near-first |
|---|---|---|---|
| Daylight2 m |21.62 /24.88|46.17 /40.14|20.52 /14.38|
| Daylight50 m |29.72 /29.89|33.56 /33.35|12.70 /12.42|
| Low Sun2 m |18.40 /25.21|54.10 /39.64|24.18 /14.20|
| Low Sun50 m |29.81 /30.10|33.50 /33.19|12.68 /12.32|

Reverse-order daylight-near repeats (`near-03`, then `base-05`) give25.08 /21.56 FPS and14.27 /20.60 ms surface work. This is the strongest evidence for about30% less near-surface surface-pass work and about16% greater frame rate. The low-Sun baseline has larger timing variation; do not attribute its entire improvement to ordering. Elevated savings are small. Active desktop, changing temperatures/clocks and nonidentical continuous phases limit causal precision. Balanced60 FPS remains FAIL. Payload allocations remain195.10 MiB plus229376 bytes CPU scratch; no new GPU allocation and no residency claim.

All eight main runs and the two near-surface repeats have zero recorded intervals>500 ms. Earlier confounded profiles remain preserved: `base-01` about1 Hz/inactive tab, `base-02` ten long intervals, `base-03`42 long intervals with the window found minimized. The owner authorized a dedicated window and keeping it visible. Stable runs were observed restored/active at their boundaries; this is not continuous OS tracing. Page visibility alone remained `visible` during throttling. Historical intermittent-stall cause remains UNVERIFIED. Whole-board monitoring includes idle periods and other applications; its truncated final row is excluded from statistics.

## Motion, regression and limits

Four new original1080p VP9 recordings in `v04-ma-order-motion-01` contain550/653/550/657 frames for day-near/day-high/gold-near/gold-high. Their last frame timestamps are23.928-23.957 s; all decode fully with strictly increasing timestamps and no GPU errors. Recorded simulation progression agrees with recorded wall time; no timestep-cap loss appears in these ranges. Actual encoded intervals, frame callbacks and visual observations must remain separate quantities.

Published `v04-ma-base-motion-02` originals are reused as the baseline: four current stills exactly match `v04-ma-base-stills-02`, and each motion pair has equal settings and final camera. Both use t20 and the same24 s stationary/pan/stationary protocol. Wall-clock warmup and continuous captures are not frame-phase aligned; do not claim pixel-equal videos. Full-resolution extracted3/12/21 s frames are in `v04-ma-wave-review-01`; selected frames and an in-capture low-Sun elevated view were inspected. Complete playback telemetry is separate. No new photographic or natural-motion PASS is claimed.

CPU37/37 PASS after promotion; GPU FFT9/9 and optical5 groups PASS on the same unchanged shader bodies. All scopes/tolerances remain in the raw reports (`v04-ma-wave-gpu-01`). `v04-ma-wave-review-01/analysis.json` contains exact comparisons, p50/p95/p99 timings and media checks. The nine pre-existing evidence modifications remain untouched. A is incomplete: MA-W1/O1/C1/C2/P1/P2/R1 stay open; B/C remain unauthorized.

## Reproduce this investigation

Use the first-checkpoint URL protocol with a new exclusive stage. Current default uses near-first ordering; append `maOceanOrder=spatial` for the old traversal, `maWaveView=geometry|normal-light|normal-angle` for isolated views, `maWaveFilter=2` for the rejected footprint trial, or `maWaveCov=unstrained` for the rejected covariance ablation. Do not combine appearance probes when comparing their individual effects. View originals at `/milestone-a-waves-review.html`.

Reanalyze into a new, already-created directory with `python tests/milestone-a-wave-evidence.py . evidence/v04-ma-NEW-review/analysis.json`. Requires existing Python/Pillow and FFmpeg/ffprobe, no application dependency. The script reads the explicitly named experiment stages; it does not infer visual success.

Next bounded appearance hypothesis: Balanced cloud self-shadow quadrature spans2.173146 km regardless of layer exit, with non-midpoint samples after its first interval. At low Sun it can omit later obstructing cloud. Isolate finite-path optical-depth integration from morphology, retain density and view-ray sample counts, test manufactured slabs and actual-field convergence before judging matched full scenes. This is a source finding and proposed test, not an implemented cloud improvement. Incorrect density shapes remain an independent failure.

Promoted-default check: `v04-ma-order-default-01/day-near.png`, without an ordering query, matches the baseline SHA-256 `cdfd3f9c7900ea3cc40a8dc1caa39e19de243ef8c33594cf6cdd1d3c047e2db1`. Four complete original browser playbacks are recorded separately in `v04-ma-wave-playback-01`; sampled rendered views retain broad wave forms, dense reflective detail and repeated cloud shapes. Playback completion is not continuous human perceptual certification. CPU mean frame work rises from about0.418-0.442 ms to0.504-0.551 ms in the primary profiles. Whole-board monitor ranges are47-88 C,3.36-75.06 W,210-1965 MHz and1121-2182 MiB across active and idle periods; other applications are included.


## 24 October: deformation and geometry closure

The 16384-point4x4 km level-zero probe measures parameter slope second moment0.04448421 and deformed horizontal-area-weighted moment0.04513108:1.45% amplification. Mean Jacobian0.9983398, zero sampled folds/regularized points, resolved slope p95=0.37535, max0.80993. Resolved/unresolved area terms0.04374603/0.00138012. One realization and filtered-mean Jacobian approximation, not exact deformed microgeometry or observational calibration. Source stable, GPU errors empty. Gross total roughness amplification is not supported in this scene. No arbitrary roughness reduction follows. Raw12-column data: `evidence/v04-ma-deformed-slopes-01/day-high.json`.

`maGeometry=48` doubles each patch grid dimension from24, retaining Balanced cloud/environment settings. Elevated daylight and low-Sun near originals retain weak broad relief and the foil/wrinkle appearance. Rejected for default adoption;96 is untested. Matched sequential60 s low-Sun near profiles, candidate then fresh default:21.839/26.006 FPS,45.696/38.394 ms total GPU,21.160/13.972 ms surface. Frame p95=49.0/41.9 ms; p99=55.6/42.2 ms. No recorded intervals>500 ms; source stable, errors empty. Window maximized/focused at boundaries, active desktop and thermals not isolated. Default grid24 retained; no temporal quality certification for failed geometry. `v04-ma-geometry-01`, `v04-ma-geometry-perf-01`, `v04-ma-geometry-perf-default-01`; analysis `v04-ma-continuation-review-02/analysis.json`.

Daylight elevated yaw94-degree off-Sun control (`v04-ma-off-sun-01`) reduces glare but retains fine reflective detail and weak broad relief. All other established settings retained; not a matched observational comparison.
