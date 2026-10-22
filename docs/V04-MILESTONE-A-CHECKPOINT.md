# Milestone A: first cloud-appearance checkpoint

22 October 2026. Owner review checkpoint; **Milestone A is not complete. B/C remain unauthorized.**

## Decision

The opt-in `maCloud=convective` trial reduces the repeated small cloud rows and varies convective height and placement. It does **not** establish photographic cloud quality or a substantial transformation of the ocean. Swollen silhouettes, broad luminous rims, distant sampling bands, glossy water and weak elevated wave structure remain visible. Default rendering stays unchanged. No AAA benchmark is declared achieved.

This is one density-representation experiment, evaluated in the complete scene. FFT, wave spectra, optical coefficients, exposure, tone mapping, cloud light transport, environment ownership and user interface are preserved. A larger reconstruction needs the owner's next checkpoint decision.

## Intervention and diagnosis

Source checkpoint `3541dc813cf40c4d1df32e681197c1e21118e64c`; preserved Phase 1 baseline `bcc501c8965cb5f555801ef494dd71371f81b033`.

- `src/wgsl/clouds.js::thermalShape`: the original 3.6 km cell envelope, narrow centre jitter and shallow depth distribution organize many similar flattened bodies. Density-only trials confirm that changing this support changes the repeated silhouettes. They do not prove that density is the sole remaining defect.
- `src/wgsl/cloud-convection.js`: cumulus-only branch; 5.4 km seeds, wider placement jitter, taller variable envelopes, two smooth world-space distortions and smaller internal billows. Extinction amplitude 0.86 is an empirical morphology calibration, not a measured condensate law. Existing pure stratus/storm density remains exact; intermediate type weights blend the two densities.
- The trial's original noise coordinates used tangent-plane height. A horizontal-transport GPU counterexample gave density error 0.0104235. Using curved-layer altitude reduces it to 8.94e-7. This corrects a coordinate inconsistency; it does not provide moist thermodynamics or evolving convection.
- `src/wgsl/cloud-bank.js`: retained rejected continuous-noise alternatives and centroid/pixel-footprint diagnostics, all opt-in. Their inflated/fragmented shapes and coverage changes did not justify replacing the original model. More ray samples alone did not establish a successful representation.
- `tests/phase0-readback.js`: repaired an inherited diagnostic compile error by ending the density-only shader prefix before `iceDensity`; added column/noise/threshold diagnostics. No production optical equation changed.
- `src/renderer.js`: integrates opt-in transformation, actual GPU invariants and deterministic 20-frame video pre-roll. `tools/evidence-store.mjs` and `server.mjs` reject overwrites, attest source hashes and preserve user-agent/UTC metadata.

The cloud screen, angular environment and direct shadows use the same transformed density. Golden-hour glitter changes because a different cloud arrangement occludes the Sun. That is not proof of improved BRDF, water-body optics or equal sky occupancy.

## Controlled comparison

Four 1920x1080 views: daylight and low Sun, each at 2 m and 50 m. Shared sea: wind 8 m/s, fetch 110 km, swell Hm0 2 m, wavelength 135 m, wind/swell directions 118/94 degrees, seed 1307. Camera x/z zero, yaw 4 degrees, FOV 58 degrees, pitch -5.5/-12 degrees. Solar azimuth 4 degrees; elevations 48/5 degrees; fixed exposures 0.95/1.3. Cloud control 0.5, cumulus type, depth 1.5 km, veil zero, haze 1.4. Balanced, fixed native resolution, adaptive off, sea/weather rates one. Stills start at t=20 s and advance 100 fixed 1/60 s steps.

Original images and reports record all parameters. The four initial pairs match every setting, camera field and simulation time (21.6666666667 s). Source provenance is checked separately: a CPU test-file addition occurred during the candidate daylight-near capture; runtime shader files stayed unchanged. A renderer-file change during the initial low-Sun near capture required a fresh capture in `v04-ma-convection-stills-03`: source remained stable and the new PNG is byte-identical (SHA-256 `a14f080a08ce5dffce6912e8168d4dbf140b4849211df538c52e50b77d82a442`). Both originals are preserved. The gallery selects the stable-source recapture.

Motion protocol: approximately 24 s, 8 s fixed view, 12 s smooth 75-degree yaw change, final hold. Same initial state and pre-roll; actual elapsed-time frames, no synthetic interpolation or retiming. Per-frame state/visibility and packet timestamps expose differing capture cadence. These videos are not 30 rendered FPS merely because `captureStream(30)` requests that ceiling. The inherited 0.1 s simulation-step cap can lose wall time during a stall.

Two additional Cinematic pairs, daylight-near and low-Sun-elevated, are in `v04-ma-base-cinematic-stills` and `v04-ma-convection-cinematic-stills`. All four originals were inspected at 1920x1080. Higher ray counts and full-resolution cloud shading improve some sampled detail, but neither baseline nor candidate becomes photographically convincing: inflated envelopes, broad rim illumination and distant horizontal cloud layers remain. Cinematic here uses its full cloud/geometry/environment settings at an explicitly fixed 1080p output; it does not use the preset's optional 1.5x output scaling. This is a representative comparison, not a full Cinematic matrix or motion certification.

## Numerical acceptance

| Gate | Result | Evidence / limits |
|---|---|---|
| CPU regression | PASS, 35/35 | `node --test tests/*.test.mjs`, source 3541dc8; includes FFT/energy, covariance, environment, optics, configuration, preservation and new transport counterexample |
| GPU FFT | PASS, 9 checks | `v04-ma-gpu-tests-01/gpu-fft.json`; native NVIDIA/Ampere |
| GPU optical contracts | PASS, 5 groups | `v04-ma-gpu-tests-01/gpu-optics.json`; manufactured irradiance, coupling, visibility, lens and coordinates; not photographic validation |
| Cloud density invariants | PASS, 11 | `v04-ma-convection-stills-02/day-near.json`; finite/bounded, empty/outside layer, coverage ordering, exact pure stratus/storm, rebase, advection, continuity, quadrature |
| Rebase / transport | PASS within tested region | Maximum density errors 5.4270e-5 / 8.9407e-7; 2e-4 f32/texture tolerance, 40 km field, 1024 probes; no global guarantee |
| Vertical quadrature | PASS, narrow numerical gate | Mean absolute 256-vs-512 column difference / mean tau = 0.0002775, below 0.02; 128-vs-512 = 0.0011211. This is not ray-march image convergence |
| Cloud optical calibration | UNVERIFIED observationally | 128-sample mean tau 0.86949 baseline / 0.85125 candidate; tau>1 fraction 0.20020 / 0.16992. Same nominal control does not mean equal cloud coverage or equal GPU work |
| HDR finite values | PASS in four candidate stills | No invalid/negative sampled RGB; no claim about measured absolute radiance or desired highlight roll-off |
| New cloud realism | FAIL against target | Less repeated placement; still synthetic silhouettes, broad rim light and distant banding |
| Whole-ocean benchmark | FAIL against target | No new wave/optics/whitewater representation in this slice; all inherited W1-R1 and E1-E6 gates remain open |

## Open acceptance register

| ID / inherited scope | Decision at this checkpoint | Evidence needed next |
|---|---|---|
| MA-C1 / Phase 2 cloud shape | VIS FAIL; placement variation improves locally | Convincing cloud bases, silhouettes and internal volumes across four views, continuous motion and matched real references; owner review |
| MA-C2 / Phase 2, Phase 6 light integration | VIS FAIL / cause partly UNVERIFIED | Separate density, self-shadow/scattering, reconstruction and exposure contributions; broad rims and horizon bands are not closed by density changes |
| MA-W1 / Phase 4 wave presentation | VIS FAIL inherited; untouched | Separate displaced silhouettes from derivative/roughness contributions in near/elevated views; retain spectral-energy tests |
| MA-O1 / Phase 6 water optics/glitter | VIS FAIL inherited; untouched | Body/reflection isolation in linear HDR; physically supported radiometric/roughness changes with motion evidence |
| MA-P1 / Phase 8 performance | TEST FAIL real-time target | Quality-preserving reduction in measured cloud and surface work; matched frame-pacing and image/motion results |
| MA-P2 / inherited one-second stalls | Fresh minimized-window case isolated; historical cause UNVERIFIED | A trace of a historical-style intermittent event with actual window state, CPU/GPU submission and scheduling evidence |
| MA-R1 / benchmark coverage | UNVERIFIED | Full supplied-video perceptual review, provenance-backed real-motion comparison and AAA comparison with disclosed mismatches |
| OWNER | HOLD | Review this bounded experiment before any further reconstruction; B/C unauthorized |

No row replaces or removes an original requirement. Numerical PASS is not visual PASS. The four-view image/motion protocol is delivered; the requested substantial realism improvement is not achieved.

## Motion and performance

`v04-ma-visual-review-01` contains the four-pair checks, all-original decode results, six extracted full-resolution frames per clip and labelled reduced contact sheets. Eight 1080p originals run 23.887-23.974 s (first/last packet timestamps), decode fully without errors and have strictly increasing timestamps. Final motion captures report visible documents, stable source and zero GPU errors. Candidate daylight-near loses 0.0745 s of simulation progression during an interval affected by the existing 0.1 s cap; other recorded ranges agree with elapsed time to rounding. MediaRecorder packet counts range 424-643; these are actual captures, not guaranteed 30 FPS.

All eight originals played to completion in Chrome, with callback traces in `v04-ma-playback-01`. First playback showed 6-74 dropped decoded frames and sparse callbacks; later browser inspection found the validation window minimized. That limits perceptual cadence review. Explicit in-playback image samples cover candidate elevated daylight (~2.6/12.8/21 s), both low-Sun near (~3/15 s) and both low-Sun elevated (~4/16 s). Other daylight clips were inspected through their contact sheets and final playback frame. This is sampled visual review, not all-frame perception. Across the 75-degree pan, cloud locations remain coherent in inspected samples, but horizontal distant slices, broad bright rims and weak elevated wave organization remain. No claim of ghosting-free or naturalistic motion is closed.

Foreground repeat `v04-ma-playback-02` completes the original low-Sun near pair: baseline 473/473 callbacks, zero dropped decoded frames; candidate 420/424 callbacks, four dropped frames. Wall playback is 24.062/24.027 s. Start/end images were inspected; this repeat establishes substantially better playback delivery, not continuous all-frame perceptual certification. The original recordings and earlier playback logs remain intact.

**Scheduling failure reproduced and isolated for this run.** `v04-ma-base-performance-01/day-near.json` records 61 frames in 60.2457 s, about 1 s frame intervals, ~0.6 ms CPU work, and `document.visibilityState=visible`. Supported Chrome window inspection then showed its active validation tab in minimized window 1264826808; the tab was neither discarded nor frozen. Restoring/foregrounding that existing window, without restart, flags or source changes, yields 22.388 FPS, mean GPU 44.598 ms and zero >500 ms intervals in `v04-ma-base-performance-02/day-near.json`. This supports minimized-window throttling for the fresh failure; it does **not** retrospectively establish the cause of earlier intermittent stalls. Page visibility alone is an inadequate validation precondition. Both runs remain preserved.

Renderer payload allocations, whole-board monitoring and actual residency are distinct quantities. The earlier intermittent one-second-stall failure remains open without matching historical window/trace evidence; absence in a short new run cannot close it.

### Measured RTX 3050 results

Desktop Chrome native WebGPU, NVIDIA/Ampere application adapter, corroborated Chrome GPU PID18756 on the RTX 3050 Laptop GPU, driver617.14, 4 GB. Each restored-window benchmark runs for 60 s, with fixed 1920x1080 targets and adaptation off. Analysis excludes frame/submission IDs <=30; GPU timestamps sample approximately every seventh frame, not every displayed frame. Source stayed stable and GPU errors were empty in all completed profiles.

| Balanced scene | Baseline FPS / mean GPU ms | Candidate FPS / mean GPU ms | Frame p95 baseline / candidate ms |
|---|---|---|---|
| Daylight, 2 m | 22.39 / 44.61 | 20.41 / 48.96 | 48.8 / 55.6 |
| Daylight, 50 m | 18.63 / 53.60 | 15.41 / 65.04 | 55.9 / 69.6 |
| Low Sun, 2 m | 21.86 / 45.66 | 20.07 / 49.74 | 48.7 / 55.6 |
| Low Sun, 50 m | 29.86 / 33.36 | 26.62 / 37.48 | 34.8 / 41.7 |

All eight Balanced runs have zero recorded intervals >500 ms. CPU mean 0.44-0.47 ms. Neither renderer meets the 60 FPS target in these views. The candidate is slower in each run; these are single sequential measurements on an active desktop, not statistically isolated estimates of shader overhead. Different cloud occupancy, animation phases, GPU clocks and thermals confound exact causal cost attribution.

Cinematic daylight-near measures **1.89 FPS / 530.08 ms** baseline and **1.75 FPS / 585.74 ms** candidate; GPU sample counts are only 13/11 after warmup. Cloud-screen work is 358.04/400.59 ms, angular environment work 134.96/147.84 ms, surface work 33.13/32.58 ms. Frame p50/p95/p99: baseline527.8/552.8/570.3 ms; candidate569.4/590.6/1294.7 ms. Candidate includes three >1 s intervals, maximum1750.1 ms, whose excess delay is not isolated. Most >500 ms intervals in this preset accompany >500 ms GPU work; they must not all be labelled the earlier scheduling bug.

The inherited 0.1 s timestep cap means Cinematic's post-warmup 46.51/45.04 s wall intervals advance simulation only8.80/7.58 s. These are valid workload costs, **not natural-speed Cinematic motion** or equal-wave-phase comparisons. The fixed-step Cinematic still pairs remain exactly matched. No Cinematic video-quality claim is made.

For practical daylight-near, the screen-cloud pass costs17.40/19.77 ms, cloud shadows0.55/1.34 ms, angular environment4.22/4.21 ms and ocean surface20.11/21.22 ms. Complete p50/p95/p99 and other pass costs are in `v04-ma-profile-review-02/performance.json`. `profile-review-01` is retained as preliminary analysis; its automatic "stalls" label merely counted >500 ms intervals. The final analyzer explicitly separates that count from a cause diagnosis.

Tracked renderer buffer/texture payload: **195.10 MiB Balanced**, **271.93 MiB Cinematic**, equal within each baseline/candidate pair. Additional density instructions need no extra persistent textures. These totals exclude driver alignment, pipelines, diagnostic helper allocations, browser/compositor and residency. Whole-board monitoring spans active and idle periods: 498-1486 MiB, 39-88 C, 210-1980 MHz, 3.11-75.44 W. Other desktop apps were open; the session was not thermally stabilized. The monitor's final interrupted row is preserved and excluded from summary statistics.

**Adoption decision: reject as a default replacement in its current form.** Density variation alone neither fixes the appearance nor supplies an acceptable performance path. If the owner retains this research direction, the next cloud experiment must separate occupied-volume morphology from traversal/light-integration cost: measured empty-space skipping or a shared optical-depth cache with ray-convergence and shadow/reflection-consistency checks are candidates, not implemented benefits. More samples are not the proposed production solution. Wave geometry versus filtered normal/roughness diagnosis remains the recommended next ocean-focused intervention after owner review.

## Research actually used

- Guerrilla, [Nubis 2017](https://www.guerrilla-games.com/read/nubis-authoring-real-time-volumetric-cloudscapes-with-the-decima-engine): density/coverage/weather text consulted; rendered slide/page 36 inspected. Core-preserving remapping informed a rejected experiment. No source or asset copied. Local PDF SHA-256 `0143f9b829e11c1ec30ed50223971450032c8be26f87ac73027fa380332cf9ae`.
- Rare, [The Technical Art of Sea of Thieves, SIGGRAPH 2018](https://history.siggraph.org/wp-content/uploads/2022/09/2018-Talks-Ang_The-Technical-Art-of-Sea-of-Thieves.pdf): two-page text consulted for production integration/craft. Not access to proprietary current shaders. No new matched Sea of Thieves gameplay capture or verified parity claim.
- Owner AAA research and `V04-AAA-TECHNIQUE-DECISIONS.md`: targeted relevant sections, secondary synthesis. Existing atmospheric/FFT findings retained; no claim that a named game necessarily uses our algorithms.
- Supplied MP4: 29.269 s, 1080p, encoded 60 FPS; 2 FPS contact sheets span the duration, with selected original frames inspected. Full continuous perceptual playback remains UNVERIFIED: supported Chrome file selection lacks file access; supported native player approval timed out. Neither permission was bypassed. Renderer, actual native cadence, hardware and colour processing are unknown. No third-party video redistribution.
- NOAA/Kresge cumulus provenance and Commons open-ocean photograph provenance revisited. Fresh image access failed or returned no perceivable image; no new visual inspection is claimed. Existing Phase 0 reference observations remain historical. NOAA rough-sea footage remains the physical-motion reference; a fresh matched four-view real-footage comparison is still incomplete. Crimson Desert, Skull and Bones and Horizon remain reference targets, not newly inspected evidence in this slice.

## Preservation and outstanding decisions

Nine unexpected old evidence differences remain untouched and unstaged. All 24 current files still match their copies in `v04-ma-preservation-20261022`. The published originals remain in Git/LFS. Hash/mtime/source inspection established recapture differences, not the identity of the initiating browser. No restoration, cleaning or replacement is required for this checkpoint.

Development evidence checkpoint **`79505007b6804433fadea23276e082998b2daf83` is published** to `development/pelagic-0.4`. `v04-ma-handoff-01/manifest.json` seals217 evidence files (756,131,438 bytes) plus source hashes; a post-seal read found zero changed hashes. `v04-ma-handoff-01/publication.json` independently verifies the remote checkpoint, unchanged main/0.3/release refs and a fresh download of all96 unique Milestone A LFS objects (101 media paths,657,305,060 bytes), all SHA-256 matches. The report/proof follow-up commit adds documentation only. Raw Windows evidence retains its original CRLF/whitespace bytes. Publication integrity does not confer visual acceptance or GitHub ruleset protection.

No engine migration, scenery, later-milestone VFX or waterline reconstruction. Next work requires owner review: retain/refine/reject this cloud trial; then choose the next bounded Milestone A intervention. Recommended investigation is displaced wave geometry versus filtered normals/roughness under the same four views, with a separate cloud-integration cost/quality experiment if this morphology remains worth pursuing. B/C and the full 48-view final acceptance remain pending, not waived.

## Reproduce and inspect

Run `node server.mjs 8083`; open `/milestone-a-review.html` in desktop Chrome. Existing evidence files are immutable: new captures require a **new** `stage=v04-ma-...` name. Duplicate writes return HTTP 409 and stop the capture. No WebGL fallback exists.

Single baseline daylight-near capture (append `&maCloud=convective` for the candidate):

```text
http://127.0.0.1:8083/?preset=midday&ma=1&cam=0,2,0,4,-5.5&cameraMode=free&quality=Balanced&resolution=1&w=1920&h=1080&seed=1307&t=20&frames=100&ui=0&adaptive=0&stage=v04-ma-owner-new01&validate=1&p0=1&p0Profile=1&clouds=0.5&veil=0&haze=1.4&cloudType=0&sunElev=48&exposure=0.95&weatherRate=1&seaRate=1&shot=day-near.png&p0Columns=1
```

For elevated views use `cam=0,50,0,4,-12`; for low Sun use `sunElev=5&exposure=1.3`, preserving every other setting. For video remove `shot`/`p0Columns`, add `video=<case>&duration=24&motion=ma-pan`. For display-paced benchmarks remove capture keys, use `benchmark=<case>&benchmarkSeconds=60&frames=10000`, and confirm the actual Chrome window is restored and visible. Recording throughput, minimized-window runs and normal display-paced runs must be reported separately. The optional iframe batch harness occasionally stalls between cases in the connected browser; direct navigation to the next **uncaptured** case works without a restart.

```text
node --test tests/*.test.mjs
/tests.html?stage=v04-ma-owner-tests01
/optics.html?stage=v04-ma-owner-tests01
```

Append `maChecks=1` to a new candidate still capture for the 11 GPU cloud invariants. Analysis requires Python, NumPy, Pillow and FFmpeg/ffprobe; tools are for offline evidence only, not application runtime:

```text
python tests/milestone-a-evidence.py --part visual --output v04-ma-owner-review01
python tests/milestone-a-evidence.py --part performance --output v04-ma-owner-profile01
node tests/milestone-a-manifest.mjs evidence/v04-ma-owner-handoff01/manifest.json
```

Analysis output directories are exclusive. The visual script reads the checkpoint's named final original sets, not arbitrary newly captured stages; change its explicit stage selection when analyzing a new experiment. Do not infer scene quality from image-difference magnitudes.
