# Phase 0 experiment log

Source baseline: `6672bfbe14732b120464862cd408f9f91dc3b563`. Production renderer is byte-identical to completed 0.3 at entry. Phase 0 only; no production reconstruction authorized.

## Preflight

- TEST PASS: 23 CPU tests; native Chrome GPU FFT 9/9; five optical/coordinate contract groups PASS.
- SRC/TEST: supplied hardware probe used reserved WGSL identifier `target`. Added compilation/validation reporting, asynchronous pipeline creation and optional evidence saving. Preserved failed JSON; renamed storage variable. Corrected compute readback equals 0x50454c41.
- TEST PASS: actual PELAGIC renderer reports NVIDIA/Ampere, native-webgpu, timestamp queries, no errors. Matched midday 1920x1080 output is pixel-identical to published 0.3 evidence.
- Hardware corroboration: local HP Victus, Windows 11, Chrome 155.0.8059.85, NVIDIA driver 617.14, 4096 MiB. Owner manually reported `chrome://gpu`: WebGPU hardware accelerated, RTX 3050 Laptop GPU ACTIVE; AMD and Microsoft Basic Render Driver also listed. Automated internal-page access was blocked. User report is retained separately; no screenshot of that page has been supplied. ANGLE Direct3D11 does not identify Dawn's WebGPU backend.
- `HypervisorPresent:true` is recorded, not interpreted as proof of a guest VM. Physical machine model, local Chrome process/session, OS GPU and owner corroboration support local desktop execution.

## Decisive experiments planned before changes

| Experiment | Observation / source | Hypothesis | Smallest test / risk |
|---|---|---|---|
| Clouds | Midday original has evenly dispersed rounded clouds; thermalShape scans 3x3 lattice cells per density sample | Discrete ellipsoid construction dominates morphology and cost | Isolated existing model vs continuous weather-shaped density vs advected cellular organization, same lighting; integrated daylight/sunset/storm controls. Density filtering may erase small structures. |
| Waves | Dominant energy occupies cascade 0; fine surface is uniform | Sparse energetic modes/repetition, not absence of linear interference groups | Conjugate-aware census, seeded realizations, analytic correlation and envelope statistics; split-domain/non-grid candidates at equal variance. No production cascade addition. |
| Breaking | No event geometry; source uses principal compression | Compression cannot establish crest-fluid/crest-speed onset or dissipated energy | Analytic packet crest tracking and bounded roller geometry feasibility; distinguish kinematic demonstration from validated breaker. |
| Colour | Extra 55% pre-AgX highlight desaturation; relative three-band optics | Display operation suppresses chroma independently of transport | Fixed exposure on/off with unchanged HDR, plus coefficients/spectral conversion audit; no automatic wide-gamut migration. |
| Waterline | Skim camera follows asynchronously read waterH; near-plane map uses current GPU field | Camera trajectory lag and classifier topology are distinct | Log probe age/delta and near-plane signed ranges; frozen/rapid crossings separately. Do not hide optical switching with a fade. |
| Performance | Historic clouds/surface dominate and 1 Hz pacing unexplained | Representation cost and browser scheduling are separate | Original conditions, visible Chrome, bounded display-paced runs, board telemetry; no FPS inference from summed median pass times. |

No experiment currently closes an inherited visual defect. Owner review remains required.

## Executed outcome, 20 October 2026

The full report and acceptance register now supersede the planned-result fields above. Final CPU suite: 26/26; GPU FFT: nine checks; optical/coordinate groups: five; all PASS within their contracts. Capture package: 22 matched stills and nine original motion clips. Both continuous-profile and cell-wall clouds compile but fail visual quality; neither is promoted. Cloud optical depths differ materially, invalidating equal-quality speedup claims.

Mode census and 64-seed ensembles confirm sparse energetic pairs and strong finite-domain recurrence; linear seas already form interference groups. Wind-height correction reverses the midday/golden PM overdevelopment assertion. Manufactured Eulerian moments show why independently adding choppiness and bound harmonics can double sharpen. Nonlinear onset/roller feasibility remains UNVERIFIED.

Desaturation alone has negligible midday effect. Positive diagonal RGB absorption cannot reproduce all signed spectral-to-sRGB colours; full spectral transport is not thereby mandated. Frozen-sea crossing still shows a straight boundary at constant t=20 s and readback height, excluding moving-wave readback lag as its sole cause.

One-second stalls reproduced; complete app memory/overdraw accounting and isolated endurance remain open. See the report's source-change and inspection ledger. Exact final delivery hashes are in `evidence/v04-p0-review/manifest.json`; per-capture source hashes were not saved. **STOP at owner review; Phase 1 not authorized.**
