# PELAGIC 0.3 development checkpoint evaluation

Overall photographic naturalism: **FAIL**. This is a working, measured development checkpoint, not a completed 0.3 release or an AAA-quality certification. Several correctness defects are fixed and whitewater/lighting/coordinate behavior changed substantially; the integrated ocean still looks synthetic. The original brief's visual objective is not yet met.

## Preservation and scope

The publication dependency passed before the first 0.3 edit. The complete 0.2 source/history/evidence is public in immutable `v0.2.0`; `main` remains `151aadaa6d2402c46f4e02454f2fc33ab7744661`. Development uses `development/pelagic-0.3`. See `V03-STAGES.md` for the anonymous download, manifest, fresh-clone, GPU and pixel-equivalence checks.

Rendering checkpoint `8302cf2` produced the integrated matrix and nine motion recordings. `55da508` adds conservative reflection-ray pruning. `70b5a36` adds a bounded benchmark duration, isolated slow-immersion test path and safe evidence defaults. The latter does not change ordinary scene shading. Review/report commits follow those checkpoints.

No engine migration, external rendering assets, islands, boats or interface redesign. The six-cascade FFT, native WebGPU backend requirement, test infrastructure, original MIT attribution and 0.2 evidence remain intact. New methods and approximations are described in the stage record; implementation does not close a visual gate.

## Repeatable image evidence

`evidence/v03-integrated` contains 52 actual 1920x1080 PNGs. All have passing spectral readbacks, finite nonnegative HDR, and no recorded shader errors. The 48 primary input tuples exactly match 0.2: settings, seed, camera, simulation time, dimensions and frame 100. The fixed-step capture starts at 20 s; algorithms differ, so the realized surface may differ. Four special views supplement the matrix.

`review-03.html` displays the original paired images. `evidence/v03-review` contains six labelled paired contact sheets and machine-readable input checks. All six sheets were inspected; selected golden, midday, storm, underwater, distant-origin and immersion originals were inspected at full resolution. This is not a claim that every pixel of all 52 originals received equal scrutiny.

Two additional matched pairs use 3840x2160 Cinematic settings: golden at 2 m, storm at 5 m. The preserved 0.2 fresh clone rendered new baseline images without source changes; both input comparisons PASS. Originals are in `v03-cinematic-before` and `v03-cinematic`. Whole-image previews and native-size golden cloud/water crops were inspected. Increasing resolution/samples preserves the smooth cloud lobes and overly uniform fine waves. At this quality, measured median GPU capture work was approximately 1,517 ms golden and 654 ms storm; these are serialized capture timings, not display-paced FPS. Both images pass HDR/spectral readbacks with no shader errors.

| Condition | Observed change / remaining defect | Visual gate |
|---|---|---|
| Calm | Broad swell remains; the short-wave surface still reads as a uniform wrinkled material. At 50/500 m, resolved structure loses distinction | FAIL |
| Midday | Less blanket grey, stronger blue sky reflection and larger cloud silhouettes. Regular cloud spacing, overly smooth billows and persistent uniform fine texture remain | FAIL |
| Golden | Wave visibility changes low-view glitter and trough reflection; coherent changes are visible. High views retain broad glitter, smooth procedural cloud edges and insufficient sea-state variation | FAIL |
| Storm | Longer motion reveals fragmented whitewater and denser active crests. Frame-100 stills underrepresent accumulated foam. No convincing spilling/overturning geometry; droplets/patches do not reproduce real breaker energy | FAIL |
| Twilight | Separate simultaneous light sources remove the old single-source switch. Scene remains too dark and insufficiently calibrated | FAIL |
| Moonlit | Geometric lunar phase and separate illumination implemented; dark water, conspicuous procedural stars and simplified Moon appearance remain | FAIL |
| Underwater / immersion | Curved near-plane classification reduces prior triangle/sliver disagreement. Abrupt transitions remain in moving crossings; volume lighting is still approximate | FAIL |
| Distant coordinates | 100 km matched captures and a rebase recording supplement manufactured precision checks. No full extreme-distance atmosphere/flight certification | UNVERIFIED |

The still named `half-submerged` uses the historical y=0 camera. At this wave phase it is above the local surface; the filename is not proof of mixed immersion. Use the skim and isolated slow-crossing recordings to inspect actual intersections.

## Motion evidence and inspection limits

Nine continuous native-WebGPU 1080p WebM recordings, about ten seconds each: golden, storm, clear glitter, flight, waterline, skim, weather transition, celestial transition and origin rebase. The celestial path compresses six hours into ten seconds; it is not real-time astronomy. The rebase path crosses x=512 m while travelling from 505 to 525 m.

All source frames were decoded. Counts respectively: 187, 252, 297, 184, 156, 192, 189, 155 and 181. Original presentation timestamps are strictly increasing. Maximum source gaps range from 49 to 81 ms; zero exact duplicate downsampled frames. This does not establish 30 FPS, natural motion, absence of aliasing or temporal reconstruction quality. Raw recordings are unmodified. Downsampled metrics and full-size extracted frames are in `motion-review`; transition windows sampled at 15 Hz are in `motion-dense`.

Ten-frame sheets for every clip and dense waterline, skim, rebase and glitter windows were inspected. The dense crossing samples still show abrupt above/below changes. Rapid motion through a 5 cm near plane and the skim trajectory's delayed camera-height probe are possible contributors; neither is established as the sole cause. No artificial temporal fade was added to hide the issue. A frozen-wave, 1.2 cm/s crossing isolates classification from rapid wave/camera motion; its separate record is described after inspection.

The isolated slow crossing (`v03-immersion-isolated`) records 196 decoded frames with the wave field frozen at 20 s. Its inspected samples show the interface moving gradually across the frame and genuine mixed immersion. The optical split still appears unusually sharp and approximately straight over this centimetre-scale near-plane footprint. This narrow case does not close dynamic immersion. Native browser playback of storm and waterline clips reached the recorded end successfully; browser snapshots and extracted frames were inspected. Complete perceptual motion assessment remains UNVERIFIED.

The rebase window shows no obvious spatial jump at this sampled scale. Glitter changes irregularly across sampled crests; this is not a full perceptual flicker assessment. Storm foam grows and fragments, but there is no spilling sheet or resolved entraining roller. Motion naturalism remains FAIL/UNVERIFIED as specified in the acceptance register. Full continuous perceptual review cannot be inferred from contact sheets.

## Numerical results

| Contract | Executed result | Scope / limitation |
|---|---|---|
| CPU suite | 23/23 PASS | Independent transforms/integration, covariance, optics, celestial geometry, URL validation and coordinate invariance |
| Production GPU FFT | 9/9 PASS, no invalid values | DC, crossing harmonics and seeded broadband; three output fields against independent reference calculation |
| Spectral height | Golden expected/realized 2.333/2.342 m; midday 2.732/2.691 m; storm 7.415/7.758 m; calm 0.693/0.698 m | Finite random realization differs from expected spectrum. Not an observational fit |
| Slope moments | Worst mip energy loss 0.568%, within declared 0.6% budget | Unmodulated parameter-space binary16 moments; modulated cross-moment energy closure remains open |
| Sky irradiance | Isotropic error 0.0308%; angular-gradient error 0.3150% | Analytic integrals, finite cube/quadrature. Relative radiometric units |
| Short-wave modulation | 2,048 GPU samples; amplitude error <=0.000147, gradient <=0.0000583/m | Manufactured weak-strain field; no action conservation or storm validity claim |
| Wave visibility | 2,560 rays PASS outside stated transition margins; no invalid outputs | Dense independent sinusoid/plane reference; 99 grazing transition samples excluded from physical classification |
| Conservative ray pruning | Exact pruned/unpruned output agreement in all 2,560 test rays | Separate algorithm-equivalence check, includes physical transition samples |
| Foam coverage | Texel area error <=0.002886 | Rank-calibrated texture, not projected optical whitecap validation |
| Foam transport | Six retained manufactured tests PASS; exact translation/pause, decay error <0.0036% | Does not validate measured wind-dependent whitecap coverage or full surface turbulence |
| Phase progression | Three epochs (0/21,600/86,400 s), 7,200 steps each; worst phase error 0.003343 rad | Accelerated numerical test, not 24 hours of continuous rendering |
| Near-plane medium | Four manufactured cases PASS; <=0.1311 mm vs 0.15 mm bound | Finest raster triangles, simple surfaces; folds and coarse/morphed nodes excluded |
| Origin precision | 12,288 GPU samples through 1e9 m; <=0.0923 mm equivalent error | Wave UV helper only; not billion-metre world/atmosphere validation |
| Sun/Moon | Independent 131,072-sample projected Lambert sphere integration at seven phases PASS | Not ROLO-calibrated lunar photometry; lunar glitter still uses uniform-disc covariance |

Optical calibration against measured seawater radiance, directional short-wave statistics, wave dissipation, entrainment, breaking onset and measured whitecap ranges remain **UNVERIFIED**. The residual slope floor (0.00005 per axis), relative illumination and simplified multiple scattering are declared approximations. No observational validation is inferred from passing manufactured tests.

## Hardware performance

Actual NVIDIA RTX 3050 Laptop, 4 GB, driver 617.14; browser reports NVIDIA/Ampere native WebGPU with timestamp queries. No software-rendered timings. Render resolution 1920x1080, adaptive resolution off, one active renderer. The first 30 frames are excluded from summarized measurements. Each run targets 1,800 frames; later runs also stop after 120 s wall time. Samples, settings, camera and stop reason are preserved in JSON.

| Run | Measured duration | Mean FPS | p99 / maximum frame ms | Median GPU ms: simulation / atmosphere / surface / post |
|---|---:|---:|---:|---|
| Golden Balanced, before pruning | 83.26 s | 21.26 | 48.8 / 55.6 | 1.77 / 20.25 / 24.25 / 0.39 |
| Golden Balanced, pruned repeat | 77.54 s | 22.83 | 48.8 / 111.1 | 1.77 / 20.64 / 19.99 / 0.39 |
| Storm Balanced, pruned | 54.90 s | 32.24 | 34.9 / 41.8 | 1.77 / 10.16 / 18.22 / 0.39 |
| Golden High, before pruning | 165.72 s | 10.68 | 104.2 / 111.2 | 1.90 / 60.03 / 30.21 / 0.39 |
| Golden High, pruned | 117.51 s | 9.85 | 118.1 / 131.9 | 1.97 / 71.83 / 27.00 / 0.39 |
| Storm High, pruned | 95.23 s | 18.59 | 62.6 / 62.9 | 1.97 / 28.70 / 21.95 / 0.39 |

High golden pruned reaches the wall-clock limit after 1,187 total frames (1,157 measured). Other listed runs reach the frame limit. Surface-pass cost falls in golden comparisons, but the High run's atmosphere cost rises; overall performance does not improve uniformly. Power/thermal/presentation differences prevent treating these sequential runs as a controlled clock-normalized microbenchmark.

An additional attempted Balanced golden run showed 1 FPS / 1000 ms in the HUD while GPU work was approximately 105-112 ms. Both the document and browser capability reported visible. It was navigated away from without a full timing export; `aborted-benchmark-observation.json` explicitly records this limitation. A fresh bounded repeat recovered normal pacing. This reproduces a scheduling/power/presentation concern, not proof of a GPU watchdog or identified root cause. Hardware CSV snapshots are board-wide telemetry, not process-specific VRAM allocation.

The practical 60 FPS Balanced / approximately 30 FPS High goals **FAIL**. Clouds and reflected-wave visibility are the dominant new costs. The analytic render-target estimate in each report excludes simulation resources, browser/driver allocations and transients. No precise renderer VRAM measurement is claimed. Capture-throughput timings are never substituted for display-paced FPS.

## Reference discipline

The actual consulted sources and access failures are listed in `V03-STAGES.md`; the older bibliography is preserved. Noniv source was re-inspected at the retained commit. The previous matched reference harness remains available, but no new matched 0.3 Noniv run was completed. NOAA EX2304 rough-seas provenance and opening browser playback were inspected qualitatively: unknown wind, exposure and camera height prevent calibrated matching. No reference media is redistributed. No unrelated still is presented as proof of superiority.

## Next dependencies

1. Establish local breaker geometry and dissipative event evolution, then compare whitewater/spray against identifiable offshore breaker footage. Coverage and sprites alone cannot close the breaking gate.
2. Close the short-wave energy/roughness budget under modulation; calibrate directional statistics and water-leaving radiance against accessible measurements.
3. Replace repeated thermal-cell cloud organization with a stronger mesoscale model and accelerate density/light evaluation without restoring sampling bands. Keep all rejected experiments.
4. Resolve moving immersion with controlled slow/fast crossings, probe timing, coarse/folded geometry and refracted visibility tested separately.
5. Improve high-altitude wave organization, horizon reflection/masking, lunar appearance and absolute exposure. Repeat the complete matrix and longer continuous/perceptual review after meaningful image changes.
6. Isolate browser scheduling/power behavior with controlled presentation and longer runs. Do not trade away essential water detail to hide unoptimized cloud/reflection work.

These remain development work. The evidence supports measured progress and preserved correctness; it does not support calling the requested visual transformation complete.
