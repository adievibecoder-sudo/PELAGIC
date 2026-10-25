# A+B continuation 06 - crest-attached whitewater

25-26 October 2026. Rendering checkpoint `24a88e3`. Combined A+B continues; B1/B2 and overall visual acceptance remain pending. No release promotion.

## Resume and private references

Recovered current AB5 source `173c153`, evidence `6bc4cee`, handoff `1368433`. Reviewed the last ten source changes and AB3/AB4/AB5 decisions: optical/shader boundary corrections, gravity-band onset, rejected float32 appearance hypothesis, opt-in temporal history and its limitations, preset correction and equivalent-output cloud optimization. No unpublished source existed at entry. Fast-forwarded the two owner kickoff commits through `00ba9ea`. Nine inherited evidence modifications match AB5 preservation hashes; the existing lockfile remains untouched and untracked. Current entry hashes cover 25 preserved files.

The supplied folder is `_local_references`, not `local references`. Both names are now explicitly ignored. The 164,761,007-byte ZIP and existing extraction agree for all 16 archive members; 13 manifest entries pass SHA-256 verification. Six video originals and three technical papers are present. Read the supplied findings/kickoff and original paper text; inspected two distributed frames per video and Tessendorf's optical page. This is sampled visual inspection, not six complete temporal reviews. All reference originals, extracted text and derived contact sheets remain private and untracked. No reference media is included in publication.

## Implemented representation

`abWhitewater=parcels&maBreaking=gravity` extends the existing particle compute/draw system with 12,288 High / 6,144 Balanced aerated parcels. Existing spray and rain populations are retained. Added buffer payload: 384 KiB High / 192 KiB Balanced; this is allocation accounting, not GPU residency.

Current gravity-band steepness and recent foam-event activity jointly gate emission. Old residual foam alone cannot create new raised bodies. Parcels retain material anchors, move with mean current mapped through the gravity deformation, and follow the six-cascade displacement. They have finite lifetime and activity decay; origin rebasing updates anchor and position, including while paused. Turning foam off retires them.

The fragment shader intersects a flattened local volume, integrates a porous density field, shades its irregular boundary with sky irradiance, solar/lunar irradiance and cloud/wave visibility, and writes the actual reverse-Z intersection depth for water occlusion. Existing two-flux slab reflectance bounds scattering. Existing residual surface foam, particles, FFT, water optics and AB5 cloud work remain in place.

This is a bounded 2.5D representation, not nonlinear overturning, entrained-bubble fluid transport or a calibrated foam microstructure. Radius, porosity, lifetime and optical thickness remain appearance closures. Gravity-only drift deformation and all-band attachment use different spatial scales. Alpha compositing is unsorted; overlapping local volumes do not form one solved scattering medium. These limitations prevent a physical-breaker or B1-complete claim.

## Visual iteration

The first water trial reconstructed refraction at the illuminated entry flank using the existing gravity height atlas. Near low-Sun comparisons barely changed the metallic appearance. It was rejected for adoption; source and originals remain in `v04-ma-ab6-crest-02`. It is absent from the live renderer. No blanket tint or cloud-light bypass was introduced.

The first whitewater trial produced smooth oval blobs. Flattening and porous density alone retained overly smooth outlines. The final candidate intersects an eroded density field and shades its boundary gradient, producing finer broken crest edges and localized raised froth. Matched storm originals show additional crest volume while retaining residual lace. Some isolated foreground patches remain rounded; continuous roller coherence, impact aeration and convincing spindrift integration remain unfinished. Improvement is local and modest, not an ocean-wide visual transformation.

Evidence: `ab6-review.html`; 72 matched 1920x1080 High frames per variant after ten simulated seconds of storm warmup, three seconds at 24 Hz, matching camera, settings and simulation time. Every report has a stable source fingerprint and no GPU errors. VP9 lossless RGB videos reproduce every original decoded PNG byte. All original PNGs remain local; selected originals and lossless videos are published. The calm control is byte-identical and passes HDR checks in both variants.

Browser playback reached both three-second endpoints at quarter speed: 72 frames, zero dropped each. Initial normal-speed candidate playback dropped five frames; retained in `playback.json`. Opening/endpoint inspection during continuous playback is not exhaustive temporal certification. Particle sampling and near-camera porosity still need longer owner review.

## Focused validation

CPU regression: 64/64 pass. Native GPU manufactured tests: 5/5 pass, covering no-history suppression, finite crest spawning, paused origin rebasing, foam shutoff and mean-current material mapping (maximum position error 1.42e-6 m). They execute the production compute shader with controlled constant textures. They do not establish fluid validity or visual acceptance. Final density refinements compile and render in the matched native captures; they do not change the tested compute kernel.

The unchanged MSAA path remains default. Hybrid TAA is not promoted or retuned. Daylight/low-Sun water, cloud morphology, night and B2 weather remain open. This checkpoint adds an optional whitewater representation; it does not close those inherited defects.

## Measured cost

Sequential 60-second foreground Chrome / native NVIDIA Ampere runs, corroborated RTX 3050 Laptop 4096 MiB, driver 617.14. High 1920x1080, adaptive off, identical storm settings and camera; first five seconds of retained records excluded. No hidden, unfocused or embedded frames, GPU errors or changing source fingerprints.

| Metric | Baseline | Parcels |
|---|---:|---:|
| GPU mean ms | 41.70 | 42.38 |
| Transparent pass mean / p95 ms | 0.078 / 0.262 | 0.487 / 2.081 |
| Simulation mean ms | 1.242 | 1.264 |
| rAF cadence frames/s | 23.81 | 23.56 |
| Frame interval p50 / p95 ms | 7.10 / 118.10 | 7.10 / 118.46 |
| Allocation payload bytes | 213,961,896 | 214,355,112 |

The new representation adds work. Mean whole-frame difference is 0.69 ms in this pair; no repeated-run confidence interval. Both runs have strongly uneven rAF intervals, so the mean cadence is not evidence of smooth 20-30 FPS presentation or resolution of historical pacing. Elapsed-time phases differ between runs. In fixed-step matched captures, the transparent-pass cost also grows with nearby whitewater coverage; one late sample is 0.39 versus 4.06 ms. These are separate observations, not interchangeable frame-rate benchmarks. See `performance.json` and original profile reports.

## Next bounded work

Replace the remaining isolated rounded parcels with more continuous crest-relative breakup and phase-aware lateral support. Couple actual event strength to spray launch and entrained-body decay. Judge the moving crest and calm control before expanding the model. Water directional-light allocation remains the next A priority; the rejected entry-refraction trial is not a reason to repeat the old filtering or TAA loops.

## Publication verified

26 October: rendering `24a88e3` and evidence `57ad49f` published on `development/pelagic-0.4`; remote HEAD matched. All 16 unique new LFS objects (17 media paths, 528,102,276 bytes) freshly downloaded into an isolated cache and SHA-256 verified. Main/0.3/frozen refs unchanged. All 25 entry-preserved files still match, including the nine inherited evidence edits and lockfile. Neither private-reference folder contains a tracked file. Proof: `evidence/v04-ma-ab6-publication-01/publication.json`. The subsequent handoff commit records this proof and gives the review video an initial source/poster; renderer source is unchanged. No B1/B2/A+B acceptance or release promotion.
