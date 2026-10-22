# Phase 1 implementation and verification

22 October 2026. Phase 1 engineering handoff for owner review. Acceptance is separate from implementation; FAIL/UNVERIFIED items remain open. Phase 2+3 is NOT authorized. No inherited realism failure is closed by this report.

## Result and scope

The environment now has one deterministic current/target owner, independent clocks, preserved remote swell, an explicit regional weather event and a one-way cloud-aware lighting contract. The clearest demonstrated visual correction is reduced underwater illumination under cloud cover. Surface beauty images change very little. This phase does not establish a major photorealism improvement, calibrated meteorology or AAA quality.

Renderer foundation: de7b32b. Implementation: 237c1a3 (environment/cache), 942362f (front full-width convention), b6349d3 (shared ice-veil extinction), 6219765 (minimum-width clamp), 919dfb4 (profiling cadence). Final source hashes and publication proof accompany the handoff. Capture revision strings are supplied labels, not independent source attestations.

## Engineering decisions

- `src/environment.js`: current and target weather; separate astronomy, weather, wave and exposure clocks; serialized fractional tick, cloud drift and sea history. One-second weather ticks give deterministic fixed-location replay. Exponential weather, wind-sea and swell response constants are 180, 1800 and 10800 physical seconds before explicit compression. They are engineering approximations, not measured growth laws. Natural presets preserve UTC, exposure and remote swell; instant preview explicitly replaces scene settings.
- Regional support is an analytic moving ellipse with a smooth edge. UI width is full width in kilometres; internal axes are half widths in metres. CPU and WGSL consume the same field. A seeded 100,000-point comparison with a 256-square map over 64 km measured interpolation error 0.002092 maximum, 0.000216 RMS. Analytic evaluation avoids map uploads and rebaking for this single event. The CPU timing experiment does not prove a GPU speedup or justify a general weather solver.
- `src/wgsl/environment.js`, `clouds.js`, `particles.js`: coverage, blended existing cloud profiles, rain eligibility and regional wind share support. Electrical eligibility requires an explicit electrified flag. There is no new lightning renderer. Rain remains a limited existing particle effect; cloud-family interpolation is not natural cloud formation.
- `src/renderer.js`, `sky.js`: freeze camera/origin/weather/astronomy and atmosphere textures during each six-face angular-light build; publish its completed cube and irradiance together. Below-horizon cache light uses a first reflected sky bounce, omitting a small water-body term to remove the previous feedback path. No recursive cloud-inclusive irradiance input remains. Direct cloud shadows update each frame; cached light necessarily lags.
- `immersion.js`, `ocean.js`, `particles.js`: feed cloud-aware diffuse irradiance and direct Sun/Moon transmittance to existing consumers. Lambertian particle ambient uses irradiance divided by pi. Shared high-ice-cloud extinction now attenuates direct ocean Sun/Moon light as well as the sky. Optical coefficients, FFT, cloud morphology, breaking and waterline reconstruction are unchanged.
- Frame uniform contract is 688 bytes. Existing astronomical geometry and lunar-phase approximation are retained. Working light values remain relative scene-linear RGB; no SI radiance, absolute luminance or spectral colour calibration is claimed. Exposure remains display response.

## Numerical and lighting evidence

At final rendering source919dfb4, all32 CPU tests pass. Fresh Chrome GPU regression: nine FFT channel checks, five optical groups, six regional batches of1024 points, zero reported GPU errors. The added minimum-width test exposed a GPU1 km half-axis clamp versus the CPU0.5 km half-axis; maximum disagreement was1. Correcting it reduces the narrow-front error to7.224687438e-6 against2e-5. The 20 km front at a1000 km camera offset has error4.948281455e-6. Tolerance reflects f32 cancellation in these tested envelopes, not every width/distance combination. Standard captures use disabled or20 km fronts, so this correction does not change their field values.

Fresh fixed-camera 1920x1080 controls, seed 1307, Balanced:

| Experiment | Measured result | Scope |
|---|---|---|
| Clear vs covered direct Sun | Centre shadow transmittance 1 vs 0.00127983 | Cloud factor, not total atmospheric transmittance |
| High ice veil, midday | Sun factor 1 vs 0.91894531 | Same sea/UTC/exposure; no measured-observation calibration |
| High ice veil, golden | Sun factor 1 vs 0.25341797 | Glitter visibly dims; procedural ice bands remain |
| High ice veil, moonlit | Moon factor 1 vs 0.87011719 | Shared attenuation demonstrated |
| Paused cloud-light cache, frame 100 vs 1000 | Irradiance/angular/shadow readbacks exactly equal | Two stationary endpoints; not a proof for every dynamic state |
| Frozen wave time 20 s, weather 120 vs 720 s | Reflected-radiance diagnostic changes locally | Directional response, not a uniform tint; realism judged separately |
| Clear baseline control | Mean absolute display difference 0.00198045/255 | Near-null control; not a physical error norm |

No invalid HDR, shadow, irradiance or angular values were reported in these controls. Frame100/1000 display images differ by at most two8-bit codes; the post shader varies triangular dither with frame modulo64. Follow-up1060 matches100 in dither phase: PNG byte-identical, all light readbacks equal. The observed display difference is explained in this control.

## Evidence and visual assessment

`phase1-review.html` links original images and recordings. Twelve baseline/current still pairs fix pose, FOV, resolution, seed, wave time, selected physical settings and exposure. The inherited clock setting changes weatherRate 60 to 1; static cases have no commanded transition. Do not call these wholly identical configurations. Old owner-retained `v04-p1-final-stills` files remain untouched, with unknown initiating browser provenance. A fresh controlled Chrome rerun reproduces eleven PNGs byte-for-byte; storm differs by at most one display code.

Five fresh approximately 20-second 1080p clips cover broken clouds, natural weather, instant preview, a 25 km flight and underwater weather. Two additional clips isolate reflection drift with frozen waves and golden-hour glitter under weather change. Baseline clips are approximately 10 seconds and use different transition protocols; they are historical comparisons, not matched proof of temporal superiority. Original WebMs remain separate from extracted review images. Queue-completion recording throughput is not display-paced FPS. Some recordings ran with a hidden document; visibility is preserved in reports.

Twelve baseline/final/light originals decoded completely with increasing timestamps and no corrected-decoder errors. Nine played to completion in visible Chrome (seven current, two baseline controls), with0-3 browser-dropped frames each. Visual inspection sampled two playback times per current clip and one per baseline control, alongside extracted frames; it was not all-frame perception. Consult the visual review for exact observations. Natural motion and absence of subtle temporal artifacts remain independent open gates.

UI testing on separate `localhost:8082` found no prior saved configuration. Paused natural storm commands preserve UTC/swell/wave time while changing targets. Instant storm sets current wind20 m/s and swell3.4 m. Front toggle, save/restore, shared URL reload, Balanced-to-High history preservation,50 m/Dive commands and hide/restore pass observed checks. Paused saved/restored/shared state compared exactly; original `127.0.0.1` save untouched. Import/export, exhaustive keyboard/pointer ergonomics and live texture-state restoration are not claimed.

Observed limits: inflated/repeated cloud rows; uniform fine-wave texture; weak water-body depth; sparse storm whitewater; inherited immersion defects. Covered underwater illumination responds more coherently but remains a smooth volume. Golden scenes retain a cohesive warm palette without establishing realistic cloud shapes or water optics. No new full 48-view sweep is claimed; the representative Phase 1 slice precedes later subsystem reconstruction.

## Hardware and performance

Chrome 156.0.8078.48 reports native WebGPU NVIDIA/Ampere. The exact adapter model is privacy-redacted. Host NVIDIA tooling reports RTX 3050 Laptop GPU, driver 617.14, 4096 MiB; its process table includes Chrome GPU PID 18756, matching the actual Chrome GPU process. This corroborates application hardware use. Earlier owner chrome://gpu Chrome155 text is historical, not the current executable version. Dawn backend identity is not independently established.

Sustained display-paced runs use 1080p, adaptive resolution disabled, fixed camera/seed, 60 seconds per case and a 120-second repeat. Per-pass queries, frame intervals, JS time, queue submit, query-completion delay, visibility, yaw and readback ablations are retained. Full browser tracing is unavailable through the connected supported API; LoAF/long-task observers are not a substitute for an internal trace.

Final representative results below use source919dfb4 and corrected seven-frame query cadence. All recorded frame samples are visible; CPU median0.4-0.5 ms. Baseline and upgraded runs were sequential, not randomized or thermally stabilized. FPS uses recorded intervals after the first30 frames; it is not the inverse sum of pass medians.

| Run | FPS | Frame p50 / p95 / p99 (ms) | Mean GPU (ms) | >500 ms intervals |
|---|---:|---|---:|---:|
| Baseline Golden Balanced | 18.45 | 41.70 / 48.70 / 999.90 | 44.18 | 12 |
| Current Golden Balanced | 21.72 | 48.50 / 48.70 / 48.83 | 45.93 | 0 |
| Baseline Storm Balanced | 32.25 | 27.90 / 34.80 / 34.90 | 30.95 | 0 |
| Current Storm Balanced | 31.02 | 34.70 / 34.80 / 35.00 | 32.16 | 0 |
| Baseline Golden High | 10.76 | 90.30 / 97.30 / 104.20 | 92.61 | 0 |
| Current Golden High | 10.87 | 90.30 / 97.30 / 97.30 | 91.79 | 0 |

| Current mean GPU pass (ms) | Golden Balanced | Storm Balanced | Golden High |
|---|---:|---:|---:|
| Simulation and geometry auxiliaries | 1.475 | 1.441 | 1.447 |
| Sky LUT | 0.163 | 0.161 | 0.159 |
| Screen clouds | 17.934 | 8.199 | 45.813 |
| Cloud shadow / particle compute | 0.403 | 0.791 | 0.552 |
| Angular environment | 4.435 | 2.291 | 18.814 |
| Irradiance publication, amortized sampled | 0.0025 | 0.0030 | 0.0015 |
| Main surface/sky pass | 20.756 | 18.466 | 24.225 |
| Transparent particles | 0.0011 | 0.0708 | 0.0022 |
| Post processing | 0.418 | 0.404 | 0.406 |

Pass labels describe actual enclosing GPU passes, not perfectly isolated phenomena. Very short pass estimates are limited by timestamp quantization; samples include zero durations. Query-completion delay means184/129/368 ms in golden/storm/high include queued work and callback delivery; they are not measured input-to-display latency. Copies and inter-pass gaps mean listed times need not sum exactly to total.

Earlier eight-frame sampling aliased the six-frame cache cycle and missed every scheduled irradiance publication. Those raw records are retained in `v04-p1-performance`; do not treat their near-zero irradiance columns as a cost measurement. Source919dfb4 samples every seven frames; recorded IDs cover all six phases.

The earlier eight-case suite records zero>500 ms stalls, including a120 s golden repeat at19.09 FPS. Probe-off20.54, timestamp-readback-off19.77, both-off19.49, alternate-yaw20.02 FPS. These switches do not remove all probe/query compute. Initial Golden Balanced22.74 FPS overlapped offline decoding. Drift across sequential runs and missing baseline ablations prevent attributing a speedup or stall cure to one change. The unchanged baseline reproduces12 approximately1 s stalls despite visible records; no full trace or matched ablation isolates the cause. P2 remains UNVERIFIED, with the failure history retained.

Other desktop applications remained open. A host sample during baseline testing reports83 C,74.68 W,1725 MHz,100% GPU utilization and932 MiB whole-board usage; this is neither a thermal-cause proof nor app residency. Requested live/peak renderer payload is195.10 MiB Balanced,204.05 MiB High, excluding diagnostic helpers, driver/compositor/pipelines/alignment. Long-run residency/endurance remain unverified. Practical60/30 FPS targets FAIL. No visual phenomena were removed for these measurements.

## Remaining dependencies

- Natural weather and sea response are prescribed, camera-sampled approximations. Moving-camera partition independence, full foam material history under changing wind and measured weather calibration remain unverified.
- Wave/environment time increments cap at 0.1 seconds during stalls. Full wall-clock fidelity is not established.
- Cached angular light has spatial/angular approximation and update latency; it does not provide instantaneous global illumination. Low-angle shadow limits and relative optical calibration remain open.
- Practical 60 FPS Balanced / approximately 30 FPS High goals, historical one-second stall cause, long-run endurance and full VRAM residency remain independent gates.
- Sources actually consulted and reference-image limits: `V04-PHASE1-SOURCES.md`. No newly imported third-party shaders or imagery. Existing Noniv MIT attribution remains.

Proposed next programme, subject to explicit owner approval: Phase 2 cloud morphology first, equal-occupancy silhouette/lighting/motion controls and cost measurements, then an owner visual hold. Only afterward expand Phase 3 cloud-linked precipitation/visibility/convection. Preserve FFT, optics and waterline reconstruction for their separately authorized phases. No next-phase implementation has begun.
