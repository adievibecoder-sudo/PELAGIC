# PELAGIC 0.2 technical report

Development: 2026-10-19/20. Final rendering checkpoint: `d6366a8`. Later packaging, instrumentation, UI state fixes and documentation commits do not change the rendered algorithms. Preserved 0.1 report: `TECHNICAL-REPORT-0.1.md`. Original project: sibling `pelagic`; all 202 release-manifest entries reverified unchanged at delivery.

## Result and acceptance

PELAGIC 0.2 is a working native-WebGPU upgrade with reproducible numerical tests, a complete matched 48-view comparison, four special views, continuous recordings and real RTX 3050 Laptop measurements. Sunset illumination/glitter, the separation of swell from short waves, foam accumulation and underwater optical depth visibly change. The project does **not** pass the requested AAA/VFX photorealism gate.

The most significant remaining visual failures are procedural cloud forms, broad grey residual foam, insufficient genuinely breaking geometry and spray, weak high-altitude swell definition, dark twilight exposure, and planar/slivered waterline boundaries. The renderer still cannot simulate overturning fluid or multiple refracted surface intersections. See `V02-DEFECTS.md`; these are retained failures, not completed features.

| Acceptance dimension | Result | Evidence / scope |
|---|---|---|
| Native hardware WebGPU | PASS | NVIDIA Ampere adapter; OS reports RTX 3050 Laptop, 4096 MiB, driver 617.14; no WebGL fallback |
| Preserved numerical foundation | PASS | 15 CPU tests; nine GPU FFT cases; 64-seed spectrum ensemble; phase and foam production-kernel tests |
| Controlled still capture | PASS | 48 views + 4 special views, all 1920x1080; zero reported WebGPU errors; finite HDR and spectral readbacks |
| Matched 0.1 inputs | PASS | All 48 pairs match settings, camera, time, frame count and resolution exactly |
| Solar HDR storage range | PASS | Previously saturated binary16 maximum 65,504; corrected matched maximum 5,852 |
| Observational ocean calibration | UNVERIFIED | No calibrated directional slope dataset, long-duration optical whitecap fit, or absolute-radiance camera comparison |
| Seamless immersion | FAIL | Split views improve; straight local-plane boundary and narrow slivers remain |
| Photorealistic breaking, clouds, distant sea | FAIL | Visible artificial structure survives the comparison matrix and motion review |
| Sustained frame pacing everywhere | FAIL | High storm run includes 614 roughly one-second intervals despite short GPU work; retained, investigated separately |
| Long-flight precision / multi-hour continuity | UNVERIFIED | Absolute binary32 world sampling remains; epoch tests are not continuous day-long runs |

## Source changes and engineering decisions

The FFT butterflies, Hermitian assembly and phase oscillator remain intact. The derivative remains explicitly based on Noniv/web-ocean under MIT; attribution and license text are retained. No engine migration, runtime dependency, generated imagery or copied photographic asset was introduced. Existing simulation controls and UI layout remain.

1. `src/sea-spectrum.js` and `src/wgsl/sim.js`: remote swell tapers over 1.5-3 peak frequencies and is numerically renormalized to Hm0. Long wind waves retain fetch-limited JONSWAP. Short waves blend toward Elfouhaily equilibrium branches over 1-8 rad/m. Choppy displacement decreases toward capillary scales. This is a declared hybrid, not the complete validated Elfouhaily directional spectrum or nonlinear wave-action evolution.
2. `src/wgsl/ocean.js`: full deformation and tangent-frame covariance; PSD bounds; removal of a duplicate derivative-variance term; solar-disc half-vector covariance applied after deformation; local Smith masking; five-point projected-facet environment integration. A raster-facet fallback handles an empty visible-facet quadrature at grazing angles. Covariance conditioning near folded surfaces and finite quadrature remain approximations.
3. Water-body radiance now uses a Gordon-style quadratic backscatter ratio, downwelling irradiance, and air/water n-squared conversion. Absorption/backscatter use three wavelength proxies, not spectral colourimetry. Thin-crest transmission depends on compression instead of absolute height, but its path length remains heuristic.
4. Foam onset uses the minimum principal stretch, allowing a compressed crest top with zero elevation slope to emit. Reference-coordinate current transport uses inverse deformation; orbital displacement is no longer applied twice. Binary16 lifetime compensation is retained. Freshness, optical thickness, bubble modulation and wind streaks affect shading. Spray samples the same lighting and cloud shadow field. This is an event/transport model, not measured breaking energy dissipation or an air-entrainment solver.
5. `src/wgsl/cloud-noise.js` and `clouds.js`: original GPU-generated 64-cubed gradient/cellular cache, seven mip levels, multiscale erosion, vertical/weather profiles and depth-dependent light. Pixel cones and march segments filter density. Deterministic exponential quadrature reaches 200 km across curved cloud shells. Coarse self-shadow density retains mean erosion. Morphology still looks artificial; far-cloud aliasing is reduced, not proven eliminated.
6. `src/wgsl/immersion.js` and `ocean.js`: same-frame GPU surface plane for background rays; actual triangle-facing side for surface-hit medium classification; probe filtering matched to nearby geometry; filtered refraction, TIR and directional underwater scattering. CPU readback only supports camera avoidance. No seafloor is added.
7. Main rgba16float HDR stores daylight radiance divided by 32; composite exposure restores it. Bloom's Karis weighting uses original radiance. Astronomical night uses divisor 1. HDR readback now fails saturation as well as nonfinite or negative samples.
8. Weather capture correctly invalidates atmospheric LUTs when haze changes. Final recording and matrix harnesses preserve source checkpoints and raw conditions. No conventional TAA was added. Alternative temporal methods have not been compared; this remains research work, not evidence that TAA must always blur glitter.

Detailed staged decisions and the exact sources actually accessed are in `V02-STAGES.md`. Historical scientific notes remain in `PHYSICS-RESEARCH.md`, `REFERENCE-AUDIT.md` and `BIBLIOGRAPHY.md`, clearly labelled as 0.1 foundation material.

## Numerical verification

CPU suite: **15 PASS**, including all nine inherited tests and six spectrum/optics additions. New checks include normalized tapered swell, hybrid-spectrum nonnegativity/continuity, independently converged integration, finite solar-disc covariance against 16,384-point uniform-disc integration, quadrature covariance and dielectric/Beer limits. The disc approximation differs by less than 0.3% in the tested 5/20/60-degree configurations. These are bounded mathematical tests, not field measurements.

Actual GPU verification retained in `evidence/stage-01`:

- `gpu-fft.json`: nine comparisons with independent double-precision transforms; existing tolerances include binary16 output rounding.
- `gpu-ensemble.json`: 64 seeds, mean m0 0.3393101072 m2 versus continuous target 0.3376342347 m2; 95% interval [0.3332790616, 0.3453411529] m2. Mean linear slope variance 0.0390535083. The target lies inside the interval.
- `gpu-dynamics.json`: phase epochs at 0, 6 and 24 hours, each evolved for 120 seconds. Maximum reported phase error about 0.003343 rad, within 0.02 rad tolerance. This does not constitute 24 hours of continuous rendering.
- Foam translation, pause and 30/60/120 Hz compensated decay pass. A manufactured compressed crest with zero slope gives 0.8507081270 density against 0.8507086434 expected, relative error 6.07e-7. Deliberately different previous/current horizontal displacement verifies orbital movement is not counted twice.
- All 52 final captures have zero reported shader errors, finite nonnegative HDR samples without binary16 saturation, and passing cascade Parseval/Hermitian checks. These checks do not assert perceptual quality.

Cox-Munk comparisons remain **UNVERIFIED**: its wind reference height differs from U10, linear slopes differ from displaced slopes, and the model has not been fitted to directional observations. Foam readback reports parameter-space memory density at several thresholds, not photographically measured whitecap coverage. A numerical transport pass cannot validate a breaking criterion.

The coordinate audit in `evidence/review/coordinate-precision.json` emulates binary32 absolute-coordinate arithmetic on the CPU. At 100 km, the tested lookup has equivalent phase-position errors of roughly 1.6-8.0 mm across cascades. Millimetre ripples therefore cannot be treated as precision-safe there. It is not a GPU flight test; origin rebasing remains required.

## Controlled visual evidence

`gallery.html` presents every before/after pair and final recordings. Raw PNGs are unmodified. Labelled review sheets are downsampled aids, not replacements for the high-resolution originals.

Protocol: seed 1307; initial simulation t=20 s; 100 steps at 1/60 s; final t=21.6667 s; 1920x1080; Balanced; adaptive resolution off; free camera. Six presets times heights 0.5/2/50/500 m times primary-light azimuth offsets 0/75 degrees. Camera pitch is -5.5 degrees near the water and -12 degrees at altitude. The four special views cover underwater window/horizon, fixed-height waterline and close storm waves. Fixed height zero does not guarantee the camera is exactly half submerged in a moving wave.

`evidence/review/matched-inputs.json` records zero input mismatches across all 48 pairs. 0.1 originals are copied into `evidence/baseline-0.1`; the original release is preserved separately. Spectral and cloud algorithms change, so identical seeds/controls do not imply identical realized geometry or cloud coverage.

| Condition | Observed improvement | Remaining failure |
|---|---|---|
| Calm | Distinct long swell, revised fine-wave energy and reflection balance | Cloud silhouettes remain puffy; high-altitude glitter is overly continuous |
| Midday | Less saturated water; clearer separation of wave scales | More cloud coverage makes some clear-midday views too grey; optical calibration incomplete |
| Golden | Restored irregular glitter, more dimensional cloud illumination, stronger sky/water relationship | Smooth distant glitter and procedural distant cloud texture remain |
| Storm | Compression-driven persistent foam appears in sustained evolution and elevated views | Broad grey films, insufficient aerated breaking geometry, weak spindrift and uniform overcast sky |
| Twilight | Earth-shadow behaviour preserved | Exposure loses water detail; no convincing improvement across the full condition |
| Moonlit | Reflections and finite night HDR preserved | Star field, cloud appearance and absolute night exposure remain uncalibrated |
| Underwater | Directional light and visible refracted surface replace a near-uniform dark volume | TIR contrast, planar waterline and multi-intersection visibility remain incomplete |

The original Noniv comparison is distinct: `stage-01/reference-golden.png`, matched camera, seed and shared sunset controls at original commit a07c7fd522ef0a897601c114f927a49d93d95520. Its optical tint semantics and quantized dispersion differ. Its green body colour and strong glitter can look cohesive, but the comparison does not prove optical correctness or identical sea-state energy.

Legitimate real footage consulted: NOAA Rough Seas / Seascape Alaska EX2304 and Changing Sea States. Playback pages and sampled visible frames were inspected. Deck obstruction and missing wind, exposure, optical and camera metadata prevent calibrated matching. No reference assets were copied. No claim of a blinded real-versus-rendered study or AAA production parity is made.

## Motion evidence and limits

Seven final clips use prefix `final-v02-` in `evidence/stage-04`: golden, storm, clear-glitter, flight, waterline, skim and weather. Each requests ten wall-clock seconds at 1080p through MediaRecorder, with conditions, camera trajectory and simulation times in JSON. Encoding requests 30 FPS. Every frame was decoded with FFmpeg; source timestamps are strictly increasing and decoded counts equal timestamp counts. Queue-completion recording timings are not display FPS.

| Clip | Decoded frames | Timestamp span s | Maximum frame gap ms |
|---|---:|---:|---:|
| Golden | 227 | 9.922 | 87 |
| Storm | 279 | 9.965 | 80 |
| Clear glitter | 258 | 9.958 | 91 |
| Flight | 236 | 9.952 | 84 |
| Waterline | 265 | 9.970 | 88 |
| Skim | 271 | 9.955 | 68 |
| Weather | 226 | 9.944 | 63 |

Actual average recording cadence is about 23-28 FPS, not a demonstrated constant 30 FPS. The original streaming WebM containers omit a duration field; timestamp spans above come from decoded frames. `scripts/motion-audit.py` reproduces the audit. `scripts/motion-sheets.py` creates twelve timestamp-labelled samples per clip and full-resolution adjacent frames at each immersion clip's largest luminance change. Raw recordings remain unmodified.

Intermediate clips at a12cd37 remain. The original skim clip exposes a wide black band; `v02-skim-corrected` at 3e17431 records the triangle-facing correction. Final clips include the subsequent grazing-facet fix. The first 0.2 storm clip shows foam becoming broad grey films after several seconds: an explicit failed gate. Final recordings must be inspected alongside stills; screenshots alone do not establish animation quality.

All seven final contact sheets were inspected, plus the full-resolution skim frames surrounding its largest change. Browser playback samples of the final skim and storm clips were inspected. This is not exhaustive human playback or a blinded perceptual evaluation. Golden/clear-glitter sheets show changing crest silhouettes and irregular highlights; they do not rule out short-lived aliasing between samples. Storm foam grows into implausibly broad films. Weather lighting changes continuously in the sampled sequence, but clouds lose structure as coverage rises.

The skim pair at 9.627 s switches from almost fully underwater to almost fully above water. At 320x180 analysis resolution, its largest mean absolute luminance change is 0.421 (unit range); 93.5% of pixels change by more than 0.20. The repeated-crossing clip reaches 0.385 and 90.5%. These are diagnostics, not universal flicker thresholds. Some large changes are physically expected when crossing an interface; the visible straight boundary and abrupt whole-view changes still fail the requested seamless immersion gate. This failure remains in the delivered renderer.

Motion clips are wall-clock driven and not frame-synchronous before/after comparisons. Weather recording compresses a large weather change into ten seconds; the sea uses development time constants and does not instantly become a developed storm.

## Hardware performance

Measured NVIDIA GeForce RTX 3050 Laptop GPU, 4096 MiB; driver 617.14. Browser adapter independently reports NVIDIA Ampere. Native GPU timestamp queries enabled. Each display-paced run requests 6000 frames, 1920x1080, fixed resolution, one active renderer. These are new 0.2 results; the historical 0.1 67/51 FPS figures are not reused.

| Preset / view | Mean display FPS | GPU mean ms | CPU encode mean ms | Frame p99 / maximum ms | Recorded frame-window seconds |
|---|---:|---:|---:|---:|---:|
| Balanced / golden | 67.07 | 14.54 | 0.355 | 20.9 / 27.8 | 59.64 |
| Balanced / storm | 87.67 | 11.25 | 0.346 | 14.1 / 20.9 | 45.63 |
| High / golden | 48.07 | 20.28 | 0.386 | 27.8 / 48.6 | 83.21 |
| High / storm, failed pacing run | 5.91 | 25.59 | 0.401 | 1007.0 / 1007.3 | 676.33 |
| High / storm, visibly presented repeat | 65.96 | 15.02 | 0.359 | 20.9 / 21.0 | 60.65 |

Frame records retain the last 4000 frames; GPU records contain 747 periodic samples spanning each run after frame 30. GPU time and frame-window means therefore cover different windows. No retained frames report document visibility `hidden`, although the Codex browser surface was not visually presented during the failed run. The first three runs contain no retained intervals above 50 ms; the failed storm run contains 614. Their roughly one-second quantization, short CPU encode and much shorter GPU work suggest a scheduling problem. After visibly presenting the same browser, the repeat contains no retained intervals above 50 ms. This supports an occlusion/scheduling explanation but does not isolate causality from other time-varying conditions. Both runs are retained. No universal stall fix is claimed.

Balanced meets the average 60 FPS goal in the two sampled views; golden p99 exceeds 16.67 ms, so this is not a locked 60 FPS guarantee. High golden exceeds the 30 FPS goal. The failed High storm run prevents an unconditional performance PASS.

GPU groups combine work: simulation includes FFT/mips/foam/particles; atmosphere includes sky, volumetric clouds, cloud shadow and cubemap updates; surface includes water/sky/particle draws; post includes bloom and composite. Individual foam/cloud/reflection costs are not separately instrumented. Balanced golden group means are 1.42 / 2.46 / 9.89 / 0.43 ms; High golden 1.40 / 6.64 / 11.50 / 0.42 ms. Surface shading dominates Balanced, with atmosphere cost increasing in High. The sum excludes gaps between pass timestamps and copies.

Analytic render-target storage lower bound in the High storm report is 119.97 MiB, excluding simulation buffers, driver alignment, browser compositor and transient resources. A separate nvidia-smi snapshot after stress reported 1496 MiB used on the whole GPU and 86 C; this is neither per-application usage nor a measured peak. Browser power state, thermal state and desktop workload affect results. Routine document/image processing occurred during this session; these are local development measurements, not a controlled laboratory benchmark.

The additional 3840x2160 Cinematic golden capture (`stage-04/v02-cinematic-4k.png`) has no reported GPU errors and passes HDR readback: maximum 152.125, no negative, nonfinite or saturated samples. Mean GPU time is 172.07 ms in queue-completion capture; this is not measured display FPS. The render-target storage lower bound is 527.34 MiB. The original 4K image was inspected: clearer surface sampling does not resolve puffy cloud morphology or establish photorealism.

## Interactive verification

Browser tests used a separate localhost:8084 origin to avoid overwriting configurations on the development origin. Pause, a 9.3 m/s developed wind setting, free camera at 50 m, Save/Restore after selecting Storm/resetting the camera, and a Balanced-to-High reload were exercised. Wind, swell, camera pose and pause state restored; the quality reload retained simulation time 57.0654 s in its URL. Share emitted those same values. Hide/Show worked; Capture downloaded a 1255x884 PNG, retained as `evidence/review/interactive-capture.png`. These dimensions are the resized interactive viewport, not the 1080p performance matrix.

The check exposed stale panel `aria-expanded` and camera selector state after direct altitude/reset commands. `src/ui.js` now synchronizes those states without changing the interface layout. Gallery condition/height/azimuth and special-view selectors loaded the expected 1920x1080 originals. Final motion selections played. No exhaustive cross-browser, accessibility or every-control visual calibration claim is made. Detailed observations are in `evidence/review/interactive-checks.json`.

## Remaining dependencies

The next visual gate requires localized breaking geometry/air entrainment, calibrated foam occupancy rather than broad thickness films, and cloud morphology/reconstruction that survives distant views. Underwater needs a curved near-lens interface and proper refracted visibility. Distant geometry/roughness requires a measured energy transition study plus modulo cascade origins and origin rebasing. Temporal methods need controlled alternatives rather than assumptions. Historical scheduling stalls need isolation from the host browser's background behaviour. None of these remaining systems is presented as complete.

Setup, controls, reproducible URLs and test entry points are in `README.md`. Git checkpoints preserve separately reviewable source stages. `RELEASE-MANIFEST.json` and `evidence/manifest.json` provide SHA-256 records; generated archives exclude the live `.git` directory. MIT attribution remains in `LICENSE` and `THIRD-PARTY-LICENSE.txt`.
