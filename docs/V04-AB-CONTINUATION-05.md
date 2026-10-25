# A+B continuation 05 - presets, cloud work and whitewater trials

25 October 2026. Owner reconciliation commit `cc3a222a6ad6bb731f8f6e4dcb8044b361edf279` fast-forwarded onto the preserved local `22007566` checkpoint. Nine inherited evidence edits and the untracked lockfile remain untouched. Combined A+B continues; B1/B2 visual acceptance, Milestone C and release promotion are not granted by this checkpoint.

## Immediate scenes and intentional evolution

Reproduced in the actual Chrome UI: selecting Midday from Golden under Natural evolution retained Sun elevation 5 degrees and swell 1.8 m. The old Instant path did replace the scene, but reset adaptive resolution and retained old foam/particles. This establishes a concrete cause for the reported switching behavior; it does not establish every possible failure on the owner's installation.

Scene buttons now apply complete presets immediately, independently of the parameter-edit mode. They preserve quality, resolution, adaptive choice, pause and camera preferences. A separate **Evolve weather** command preserves gradual weather-only targets, Sun, swell and time. **Apply current targets** settles pending transitions and refreshes environment/temporal history. Full scene replacement rebuilds the spectrum, lighting LUT and complete environment cache, resets foam/particles and temporal history, and removes cross-scene velocity on the cut frame.

Verified while paused with opt-in hybrid: Moonlight to Midday gives manual Sun 48, wind 8, swell 2; Storm gives Sun 18, wind 20, swell 3.4; Calm gives Sun 24, wind 2, swell 0.65. Explicit gradual Storm from Calm leaves current wind 2 with target 20, retaining Sun 24/swell 0.65 even with Immediate parameter edits. Pause, free camera and adaptive-off persist. Original before/after state and the final controls screenshot are in `v04-ma-ab5-resume-01`.

## Adopted cloud optimization

The existing density evaluates nine thermal cells, each containing three lobe distances, at many view/light samples. The cumulus contribution is exactly zero when thermal support is at or below -0.32. A contributing normalized lobe radius is therefore below 1.32; conservative bounds are h<=1.1008 and lateral extent<=1.5184. The implementation rounds those bounds outward, rejects unsupported cells before their distance calculations, and avoids the shape texture in provably empty pure-cumulus regions. Mixed stratus/storm deck contributions remain intact. Incompatible morphology experiments retain their original path.

The environment's lower hemisphere already uses an exact mirrored upper-sky ray multiplied by Fresnel. Compute that ray once and write the corresponding lower texel. Six-face frozen-snapshot publication remains unchanged. Neither optimization reduces output resolution, cloud sample count, cloud textures, waves, shadows or lighting. Opt-out controls: `abCloudWork=off&abEnvWork=off`.

Native GPU comparisons evaluate 65,536 densities across pure/mixed cloud types, coverage endpoints, varying footprints, fronts, 0.3/5 km depth and a 120 km domain: **zero changed values, zero maximum error, all finite**. All four High 1920x1080 daylight/low-Sun near/elevated PNG pairs are byte-identical. All 48 frames of the matched elevated low-Sun pan are also byte-identical. This certifies the tested output equivalence; it does not improve or accept cloud morphology.

A further three-distance-to-one-distance trial was measured, then removed: its roughly 0.8 ms short-run advantage lacked repeat confidence. Its original `day-high-compact.json` remains historical evidence, not an available mode.

## Appearance trials, still opt-in

`abFoam=transport` replaces separate grey albedo and opacity multipliers with the conservative two-flux slab limit R=tau/(1+tau), using the existing active/residual optical-depth proxies and bubble-thickness modulation. Coverage overlap is integrated explicitly. It gives modest brightening. Absorption, anisotropy and measured thickness remain uncalibrated; this is a bounded hypothesis, not full whitewater radiative transfer.

`abFoamPattern=bubbles` reuses the existing cellular texture channel for coverage, retaining its original channel for thickness. Existing rank equalization preserves the intended occupied area; footprint filtering uses the actual 61-cell texture frequency. Matched warmed storm stills show finer breakup than the previous large grey strips. The distant appearance is softer; whitewater remains a flat surface layer without a convincing roller/entrained body. Simulation foam memory is unchanged.

`abRain=velocity` projects simulated drop velocity into the billboard plane, including perspective, with a safe fallback for degenerate projected velocity. Width and length filter independently: a subpixel width no longer inflates a drop into a twelve-pixel needle. Opacity compensates projected sprite area. Rainfall units, shutter calibration, distant rain curtains and integrated storm atmosphere remain unresolved. All three appearance changes remain opt-in; hybrid MSAA+TAA also stays opt-in.

Storm motion: matched 96-frame, 4-second, 24 Hz fixed-step pans after 10 simulated seconds of warmup. A separate 48-frame, 2-second cloud pan verifies performance equivalence. Published VP9 `gbrp` videos preserve every decoded RGB byte; original PNGs remain locally retained with hashes. Playback observations and performance measurements are recorded separately.

## Measured performance

Native WebGPU NVIDIA/Ampere, corroborated RTX 3050 Laptop, 4096 MiB, driver 617.14. Fixed 1920 x 1080, adaptive off, MSAA-only, same daylight-near camera/seed/environment. First five seconds of retained rAF records excluded; timestamps aligned by frame ID. No hidden, unfocused or embedded frames in these runs. rAF cadence is not a compositor presentation trace.

Initial 30-second tier census:

| Tier | Cadence FPS | Mean GPU ms | Screen clouds ms | Allocation payload MiB |
|---|---:|---:|---:|---:|
| Balanced, previous work | 24.81 | 40.20 | 18.19 | 195.10 |
| High, previous work | 11.60 | 86.11 | 46.92 | 204.05 |
| Ultra, previous work | 8.77 | 113.86 | 64.85 | 236.06 |

Ultra is normalized to 1080p here; its normal 1.2 output scale costs additional work and is not represented by that number. High's nominal cloud pixel-times-step ratio is 2.8125 relative to Balanced; the measured screen-cloud ratio is about 2.58. This verifies the hotspot without equating sample opportunities with executed GPU time.

Final sequential 60-second High pair:

| Metric | Previous work | Optimized work |
|---|---:|---:|
| rAF cadence FPS | 11.96 | 17.42 |
| Frame interval p50 / p95 ms | 83.30 / 90.30 | 55.60 / 62.70 |
| Total GPU mean / p50 / p95 ms | 83.61 / 83.53 / 87.00 | 57.29 / 57.41 / 62.42 |
| Screen clouds mean / p50 / p95 ms | 45.67 / 45.68 / 46.53 | 31.57 / 31.39 / 32.93 |
| Environment mean / p50 / p95 ms | 18.23 / 18.64 / 19.70 | 6.48 / 7.21 / 10.29 |
| Ocean surface mean / p50 / p95 ms | 16.61 / 16.35 / 19.99 | 16.35 / 16.06 / 19.62 |
| Allocation payload MiB | 204.05 | 204.05 |

About 31.5% less GPU work and 45.7% higher cadence in that pair. The earlier optimized 30-second run reached 17.86 FPS / 55.92 ms; another 60-second run reached only 14.80 FPS / 67.49 ms. Retain the slower result. Hardware logs include peaks of 86-87 C and varying clocks, including idle tails; these observations do not independently isolate the cause of variation. No thermal confidence interval or sustained 20-30 displayed-FPS achievement is claimed. Actual residency remains unavailable; allocations are payload accounting only.

The target remains open. At the measured final 57.29 ms, 20 FPS needs another approximately 7.3 ms saved, and 30 FPS approximately 24.0 ms. Screen clouds still dominate; water is the next major cost. No resolution/sample/feature cuts or temporal cloud reconstruction were adopted. Optimized Balanced/Ultra sustained rates and wider scene cost curves remain unmeasured; capture timings are not substituted for sustained profiles.

Original runs: `v04-ma-ab5-profile-base-01`, `v04-ma-ab5-profile-work-01`, `v04-ma-ab5-profile-final-01`; analysis includes per-pass p50/p95/p99, visibility and allocation payload.

## Validation and limits

Rendering checkpoint: `173c153`. Both storm videos reached their 4.00-second endpoint at quarter speed with 96 frames and zero dropped; the cloud video reached 2.00 seconds with 48 frames and zero dropped. Opening/endpoint screenshots were sampled during continuous playback. This establishes playback completion, not exhaustive temporal visual acceptance. Sampled storm views retain broad flat foam; cloud motion retains artificial caps/rims. Original playback status is in `v04-ma-ab5-checkpoint-01/playback.json`.

Integrated CPU suite 62/62 passed during implementation and again on committed rendering source `173c153`; final raw output is `v04-ma-ab5-checkpoint-01/cpu-tests.txt`. Focused preset/cloud tests 4/4 also pass after the small control/cache follow-up. Native captures report no GPU errors; four-view HDR/spectrum checks pass. These numerical results do not close visual failures. Reproduction/analysis: `tools/analyze-ab5.py`, `tools/encode-ab5-motion.py`, `ab5-review.html` and each capture's exact query/source fingerprint.

The meaningful default improvements are complete preset switching and lower GPU work at equivalent tested output. Foam/rain remain reviewable experiments. Metallic daylight and low-Sun water, dull glitter, weak crest transmission, unnatural scale separation, cloud morphology, B1 volume/spray, B2 rain/lightning/weather and night radiometry remain unfinished. No visual transformation, 20-30 FPS achievement, photorealism or A+B acceptance is claimed.

Next implementation should address the remaining whitewater body/crest connection and water directional-light allocation using the existing scattering, slope filtering and FFT contracts. Cloud temporal reconstruction remains conditional on credible morphology and measured motion/cost gains; no duplicate temporal system was added.

All 626 local checkpoint files are inventoried with SHA-256. Publication selects 348 paths, including all frame reports, complete lossless videos, selected motion PNG endpoints and all matched stills. Original motion PNGs remain local; each is recoverable from verified lossless RGB video. The byte-identical cloud baseline does not need a duplicate video. `v04-ma-ab5-checkpoint-01/evidence-inventory.json` records this distinction; publication does not imply owner visual acceptance.
