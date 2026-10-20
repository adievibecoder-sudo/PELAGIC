# PELAGIC 0.4 Phase 0 assessment

20 October 2026. Investigation and reversible experiments only. **STOP: Phase 1 requires explicit owner approval.** No production cloud, wave, optics or breaking reconstruction has been accepted. Scientific correctness, visual naturalism and performance remain separate gates.

## Result

- **PASS / TEST:** RTX 3050 application execution corroborated; corrected compute probe, 9/9 native GPU FFT cases, optical/coordinate GPU contracts and 26/26 final CPU tests pass.
- **PASS / TEST:** all 821 original 0.3 evidence files match their manifest. Fresh production midday capture is pixel-identical to the preserved 0.3 capture. Frozen refs remain unchanged.
- **FAIL / VIS:** both cloud candidates remain artificial. They remove conspicuous rows but produce overly broad, blurred masses and change occlusion/illumination. Neither is ready for adoption.
- **FAIL / VIS:** ocean fine structure remains monotonous; breaking is predominantly foam shading, not crest overturning. Skim immersion remains visibly discontinuous.
- **FAIL / TEST:** practical frame-rate targets are not met across conditions. Approximately one-second visible-document stalls recur. Cause is unresolved.
- **UNVERIFIED:** observational wave/slope/whitecap calibration, full radiometry, nonlinear breaker onset, complete colour transport, long-flight atmosphere, owner visual approval and final reference selection.

This phase supplies evidence and eliminates weak approaches. It does not demonstrate the requested final transformation.

## Reproduction and provenance

Entry source: `6672bfbe14732b120464862cd408f9f91dc3b563`, tracking `development/pelagic-0.4`. Preflight checkpoint: `a1092a0`. Experimental captures identify `a1092a0-lab`, which is not a Git commit. The evidence manifest records exact final delivery source hashes. Instrumentation evolved between captures; contemporaneous per-capture source hashes were not saved. This provenance limitation is retained rather than retroactively claiming a frozen capture commit. Source and capture commands: [reproduction guide](V04-PHASE0-REPRODUCE.md). Review originals through `phase0-review.html` after `npm start`.

The 0.3 archive SHA-256 is `402a635b09fd9b3579972aebc269ca2bdbf7c7dfdc8e77a71b17d1226653be03`. Original evidence is preserved, not regenerated. This phase captures a representative subset, not a fresh 48-view acceptance matrix.

Published experiment checkpoint: `62f0f752fea7e211c4aea1addf140ff3ee217679` on `development/pelagic-0.4`. Remote SHA and frozen branch/peeled-tag SHAs verified. All 81 unique LFS objects (262,904,474 bytes; 82 media paths) were downloaded into fresh storage, SHA-256 checked and passed `git lfs fsck`. Proof: `evidence/v04-p0-review/publication.json`. This verifies publication, not GitHub protection rules or visual quality. A subsequent documentation/manifest commit records this verification; no rendering algorithms changed afterward.

## Actual hardware proof

Local HP Victus 15-fb0xxx; Windows 11 10.0.26300; desktop Chrome 155.0.8059.85, executable in Program Files, desktop session 1. NVIDIA driver 617.14 / Windows 32.0.16.1714; RTX 3050 Laptop, 4096 MiB. Primary display reports 1920x1080 at 144 Hz through AMD graphics. AC corroboration and host records are retained. `HypervisorPresent:true` is disclosed; this alone does not establish a guest VM.

The actual renderer, standalone compute probe and GPU tests report NVIDIA/Ampere. Device/description strings are privacy-redacted. The owner supplied same-session `chrome://gpu` text: WebGPU hardware accelerated, RTX 3050 ACTIVE. Combined OS, owner and application records corroborate the target GPU. Automated internal-page access was blocked; no screenshot/export or Problems Detected list was supplied. ANGLE Direct3D11 is **not** proof of Dawn's WebGPU backend. No software renderer identity appears. A false fallback flag alone was not used as proof.

The supplied probe initially failed compilation because `target` is reserved WGSL. The failed JSON is retained. Renaming the storage variable and adding explicit compilation/validation reporting yields the expected `0x50454c41` readback. This is the only production-adjacent correctness repair in Phase 0.

## Cloud experiment

Source: `src/wgsl/clouds.js::thermalShape`, `cloudDensityFiltered`, `cloudLayers`. Baseline density combines 3x3 ellipsoid-cell searches with a periodic noise volume. An independent overcast control exposes pronounced rows even when the thermal branch is bypassed; the noise/profile construction is also implicated. More ray samples alone cannot remove this spatial organization.

`tests/phase0-shaders.js` provides opt-in continuous-profile and cell-wall candidates. It replaces density only; scattering, atmosphere, shadow and reflection equations remain unchanged. Twelve matched 1080p captures cover midday, golden, overcast and storm. Three opacity diagnostics isolate silhouette from light, though the displayed opacity still passes through tone mapping. Fixed seed 1307, camera `(0,2,0,4,-5.5)` degrees, initial t=20 s, 100 fixed 1/60 s frames, Balanced, adaptive off; final t=21.666667 s. Each condition retains its preset exposure. No cloud geometry match is claimed.

| Midday model | Median cloud-screen GPU ms | Mean vertical optical depth | Fraction of sampled columns with tau > 1 | Visual decision |
|---|---:|---:|---:|---|
| Baseline | 15.335 | 0.788 | 17.97% | Repeated compact lobes, fine distant rows |
| Continuous | 4.915 | 0.971 | 35.16% | Reject: broad soft masses, missing edge structure |
| Cells | 3.670 | 5.178 | 63.96% | Reject: dark connected slab, overcoverage |

These are short capture-pass timings, not display-paced FPS or equal-quality speedups. GPU subpass separation may add overhead. Optical depth uses 1024 fixed vertical columns over 40 km, 128 midpoint samples. These are deterministic diagnostics, not unbiased cloud-area estimates, solar occupancy or converged transport. No uncertainty interval is invented for this fixed grid. Storm tau means are 21.02 / 4.56 / 19.95; the continuous candidate substantially thins the storm. Overcast cloud-screen cost can **increase** (2.10 to 3.80 ms). Preserve these negative controls.

NASA cellular-cloud imagery and NOAA cumulus photography support multiscale regional organization and irregular silhouette detail. They do not validate this prototype's world scales or radiance. The preferred research direction is a separate regional weather field, cloud-type profiles and independently controlled erosion, with occupancy/optical-depth matching before timing comparisons. **No production representation is locked.**

## Wave and breaking decisions

`tests/phase0-science.mjs` independently enumerates travelling modes and conjugate-pair instantaneous variance. Pairs holding 50% of expected variance: calm 12, midday 84, golden 67, storm 22, twilight 25, moonlit 34. Sixty-four seeded Gaussian realizations provide sample spread; these counts are not a claim of that many independent visible waves. The census agrees with the retained energy ledger to about 4e-14 relative error.

Linear Gaussian seas already contain interference groups: three-seed envelope coefficients of variation are approximately 0.47-0.56. The claim that they have no groups is rejected. At an x displacement of 1103 m, expected correlations are 0.8765 calm, 0.8704 midday, 0.9730 storm. A jittered-bin toy quadrature suppresses this recurrence, but holds old modal weights: it is not an energy/direction-calibrated replacement. A naive stretched second domain changes wavelength/period and is rejected despite conserving variance.

The original PM reference uses wind at 19.5 m. Under the documented neutral log-law conversion, midday/golden peak periods are 5.972/5.343 s versus PM references 6.204/5.420 s. They are not overdeveloped by that test. Calm/twilight/moonlit exceed the converted reference; wind-sea height/development needs separate review. Remote swell must never be clamped to local wind equilibrium.

`phase0-crest.mjs` measures Eulerian moments using the displacement Jacobian. At ka=0.2, skewness is 0.2128 for horizontal choppiness, 0.2090 for second-order Stokes, 0.4293 for their naive combination. Thus adding full harmonics independently risks double sharpening. This is a manufactured unidirectional example, not a calibrated random nonlinear sea.

The focused linear-packet calculation shows that substituting linear surface velocity into B approximately 0.85 is unjustified. Barthelemy's published scope concerns nonlinear focusing groups and local crest kinematics. **Crest-event/roller feasibility remains UNVERIFIED:** no defensible onset, energy dissipation or multivalued optical contract has yet been demonstrated. A decorative rolled mesh would not resolve this. Next decisive work must compare tracked nonlinear packet crests and energy loss before coupling event mass to foam/spray.

## Optics and illumination

Matched desaturation A/B retains the HDR path. Midday/golden HDR summaries are identical; storm summaries differ by at most approximately 1.6e-7 in mean RGB, so byte-identical storm HDR is not claimed. Midday maximum display difference is only 2/255. Golden maximum blue-channel difference is 25/255, concentrated in highlights. Removing the extra 55% desaturation cannot explain or repair the general metallic-water defect.

Body/reflection/glitter/normal diagnostics are retained. The body term remains smooth and relatively dark; detailed surface appearance is dominated by reflected illumination and resolved/unresolved slopes. These displayed debug terms have diagnostic exposure normalization and are not directly summable radiometric images.

`phase0-optics.mjs` uses checksum-verified official CIE observer/D65 data and the repository Pope/Fry absorption table. Units are explicitly converted from cm^-1 to m^-1. D65 integrates to XYZ `(0.950471,1,1.088829)` without per-channel white normalization. The absorption data end at 700 nm; truncation is disclosed. A three-coefficient positive fit improves the limited 1/3/10 m training cases, but spectral transmission at 10/30 m has negative linear-sRGB red. A diagonal positive RGB exponential cannot reproduce it. The held-out 30 m fit remains imperfect. This establishes a representation limit, not a requirement to migrate the entire renderer to a spectral pipeline.

AgX input/output matrices invert to approximately 3e-15 error. This does **not** certify the full display transform, tone curve, gamut mapping or absolute exposure. The inherited Noniv post source uses the same desaturation and matrix structure; it is not evidence that PELAGIC uniquely introduced the colour issue. New matched Noniv runtime comparison was not performed in this phase.

Cloud diffuse illumination currently uses clear-sky directional samples plus heuristic multiple scattering; rain particles spawn around the camera independently of cloud water. Underwater `volumeWater` also uses clear-sky ambient rather than the cloud-aware irradiance field. These source-level coupling gaps survive the existing quadrature tests. A delayed scalar feedback counterexample demonstrates that one-frame latency does not make a light-feedback loop stable when gain is >=1.

## Motion and immersion

Nine original 1920x1080 WebM recordings cover three cloud models, storm whitewater, waterline, skim, two weather transitions and a frozen-wave slow crossing. Original compressed recordings remain untouched. Decode/readback records, four sampled full-resolution frames per clip and browser playback inspection are separate evidence. Playback inspection is sampled; no frame-by-frame human temporal certification is claimed.

Baseline storm footage develops fragmented foam films; it still lacks credible overturning crest geometry. Rain is visible as sparse streaks. Weather footage changes depth/coverage, but the existing scripted transition never changes `cloudType`; it cannot certify conversion into storm towers. Preset UI selection separately applies an immediate new configuration and resets foam. These are distinct flaws, not one weather test.

Moving skim footage produces slivers/straight boundaries and large above/below-view changes. Probe age is 1-8 frames in capture mode; the matched display-paced benchmark records ages up to 30 frames. Camera following uses this stale height, but optical classification uses a current GPU near-plane map. `lensDisplacement` reproduces only the finest raster grid; folds, morphed/coarse surfaces and general ray intersections remain open. In the frozen slow-crossing control, every logged simulation time is 20 s and readback height stays 0.20714130997657776 m; a straight slanted boundary still appears in the 6 s full-resolution frame. Moving-wave readback lag is therefore not its sole cause. A near-plane intersection with a local facet is a remaining hypothesis, not a confirmed complete diagnosis. Maximum grayscale frame delta falls from 65.78 in moving skim to 4.34 in this control, but differing camera trajectories prevent causal attribution of that numeric reduction. No fade is proposed as a physical fix.

## Fresh performance

| Run / 1080p, adaptive off | Display-paced FPS | p99 frame ms | Maximum ms | Frames >500 ms |
|---|---:|---:|---:|---:|
| Golden Balanced, original grouping | 22.90 | 76.3 | 1006.8 | 3 |
| Storm Balanced, yaw 4 (alternate view) | 17.17 | 1000.1 | 1007.0 | 42 |
| Storm Balanced, historical yaw 79 | 32.28 | 34.9 | 438.0 | 0 |
| Golden High, split-subpass instrumentation | 8.22 | 1006.9 | 1007.0 | 42 |

All frame records report visible. These are bounded runs, not an isolated-machine endurance certification; other owner applications were not closed. High stops at the 120-second wall cap; others at 1800 frames. First 30 frames are excluded from statistics. GPU timestamps are quantized, and summed pass medians are not FPS. Golden High median cloud-screen/environment costs are 42.70/17.17 ms; original Golden Balanced atmosphere/surface costs are 20.77/19.73 ms. Matched storm performance reproduces history; the alternative camera is not evidence of a source regression.

The session includes 2,872 complete board-wide NVIDIA telemetry samples, 20:35:43-21:23:56 local time; one truncated final row is excluded. Observed peaks: 1,151 MiB memory, 87 C, 75.62 W. These include idle/other application work and are not renderer residency or proof of thermal causation. Main render-target estimates are 117.77 MiB Balanced / 119.97 MiB High, explicitly excluding simulation, driver/browser and transient allocations. Full resource accounting, fragment invocation/overdraw instrumentation and sustained power-isolated profiling remain UNVERIFIED. Budgets remain targets, with measured gaps and revised allocation ownership in [performance budgets](V04-PERFORMANCE-BUDGETS.md).

## Delivery and inspection scope

| Source changes | Purpose / limits |
|---|---|
| `tests/webgpu-hardware-probe.html` at `a1092a0` | Reserved-identifier repair, explicit compilation/validation reports and saved compute result |
| `src/renderer.js` | Opt-in shader transform and subpass timestamps; probe-age/query/browser metadata; opt-in cloud-column readback. Production shader defaults preserved |
| `tests/phase0-shaders.js`, `phase0-readback.js` | Two rejected density candidates, desaturation/opacity diagnostics, deterministic vertical optical-depth sampling |
| `tests/phase0-science.mjs`, `phase0-crest.mjs`, `phase0-optics.mjs` | Independent narrow numerical investigations; no production wave/optics replacement |
| `tests/phase0.test.mjs`, `phase0-evidence.py`, `phase0-motion.py`, `phase0-manifest.mjs` | Isolation tests, measured summaries, original-frame decode/PTS checks, archive hashes and matched-condition checks |
| `phase0.html`, `phase0-review.html` | Reproducible capture harness and original-media review; existing product interface retained |
| `tests/data/cie/`, V04 reports/register | Attributed CIE data, decisions, evidence scope and persistent phase gate |

All 22 stills have 1920x1080 output, no logged GPU errors and finite final HDR readback. All nine original movies decode; original timestamps increase. Movies do not contain full-frame HDR readback at every time, so continuous invalid-value absence is UNVERIFIED. Readable old failed probe/test/analyzer logs are retained alongside successful corrections.

Inspected full-resolution subset: midday baseline/continuous/cells; overcast baseline; storm cells; golden desaturation-off; water body/glitter; frozen-skim 6 s. Comparison/contact sheets cover remaining conditions. Original browser playback was sampled for cloud, storm, crossing and weather cases; this is not exhaustive human inspection of every frame. Four full-resolution decoded frames per clip remain accessible. Real-reference inspection scope is separately documented in the reference board; no calibrated photograph match or fresh Noniv runtime comparison was completed.

Outstanding Phase 0 investigations remain explicit: validated roller/event geometry, spatial gust/action modulation proof, equal-optical-depth cloud comparisons with refinement uncertainty, grazing-angle overdraw counts, complete GPU allocation accounting, isolated endurance/stall diagnosis, complete display-pipeline colour checks, calibrated reference coverage and owner visual review. They are UNVERIFIED, not implied successes. The present investigation package is submitted at the gate with these limitations; further Phase 0 work may be requested before Phase 1 approval.

## Phase 1 proposal only

Follow the master brief: coherent environment state and astronomical/radiometric contracts first. Establish distinct present/target sea state, regional cloud type/coverage/precipitation, independent squall and convective-thunderstorm states, shared direct/diffuse light and explicit exposure units. Preserve current working controls while making transitions continuous and inspectable. Do not declare every dark storm a thunderstorm or add lightning independent of a convective cell.

Acceptance: deterministic transition tests; no wave-phase/foam reset during gradual changes; cloud/rain/light dependencies visible at fixed exposure; daylight/golden/overcast/storm/twilight/night controls; same seed/camera before/after stills and continuous clips; no new invalid GPU values; measured performance and documented compromises. Retain the full 48-view matrix for integrated milestones. Cloud reconstruction follows in Phase 2; wave/breaker/optics decisions remain subject to their own evidence gates.

**Phase 0 investigation delivered; visual acceptance is not granted. Await explicit Phase 1 approval.**
