# A+B recovery and crest-foam checkpoint - 25 October 2026

The interrupted local work was recovered beyond published `a3e2a46`. The new gravity-wave breaking candidate reduces broad storm foam sheets to narrower crest-associated patches and residual trails. This is a useful visual improvement, not B1 acceptance. Low-Sun metallic reflections, excessive fine structure, cloud morphology, convincing spray and integrated B2 weather remain open. Appearance experiments remain opt-in; A+B is incomplete.

## Recovery

Entry HEAD was `97f68a1de53a877e5b2b2681c308a08aefbf0c74`, containing unpublished `f38b85a` and `97f68a1`. Seven additional source/document/review changes and nine inherited evidence modifications were present. The authoritative recovery manifest is `evidence/v04-ab3-recovery-verified-20261024-02/manifest.json`: 16 pre-existing files plus the new recovery script were copied and SHA-256 checked; 53 interrupted evidence files (310,425,542 bytes) were inventoried. The local interrupted-commits bundle was verified. Earlier incomplete preservation attempts remain historical, not authoritative manifests.

The recovered cloud scattering edit and review state were committed as `2838ac0`. No known final interrupted source was missing. Overwritten intermediate trials have original images and source fingerprints, not complete source archives. The nine inherited `v04-p1-final-stills` changes remain unstaged and excluded from publication. No reset, clean, reclone or history rewrite occurred.

## Implementation and visual decisions

- `maBreaking=gravity` uses the first three gravity-cascade deformation tensors, divided by chop, to estimate broadband crest steepness. A smooth onset interval from 0.28 to 0.443 drives positive-increment events. The upper value references limiting Stokes steepness; the lower onset is a tunable closure. This is neither a nonlinear overturning model nor a Barthelemy criterion. Residual foam deposits on positive increments; active events feed aeration and existing spray. Outside persistent clipmaps, the same band-limited criterion supplies an instantaneous proxy. Wind coupling and foam lifetimes remain intact.
- Matched storm originals: `v04-ma-ab3-foam-01/events` and `v04-ma-ab3-foam-02/gravity`. Camera, settings, 1920x1080 dimensions and simulation time 30 s match; spectral/HDR checks pass; no GPU errors. Broad sheets shrink visibly. Foam remains film-like in places and sometimes sparse. Near-clipmap mean stored density falls from about 0.28664 to 0.03472; this is simulation memory, **not visible whitecap coverage**. The earlier `foam-01/gravity` predates the far-field consistency correction and remains preserved.
- `maCloud=connected` adds a shared condensation core, radius-scaled erosion and less lobe separation. Matched daylight originals in `v04-ma-ab3-cloud-{entrained,connected}-01` show fewer detached fragments. Dark capsule-like bases and bright rims still fail the target. The candidate is retained for investigation, rejected for default adoption.
- Four precision pairs in `v04-ma-ab3-{half,f32}-02` preserve the established daylight/low-Sun, near/elevated controls. Mean absolute display RGB differences are only 0.013-0.028 8-bit code values per channel. Float32 does not visibly solve metallic water. Earlier `before/gold-near` had an accidental mouse pitch change and is excluded; evidence mode now ignores mouse camera input.

## Focused shader corrections

`3d0d0ac` corrects the solar tangent basis at both poles and distributes six outer disc samples uniformly. Foam bubble warp coordinates now use the same integer periodicity for odd bubble periods 29 and 61. A shared water-optics module separates molecular Rayleigh scattering and particles; HG g=0.70223624 follows the declared particle scattering/backscatter ratio 12. Immersion and optional surface transport use this convention. Cubemap mip taps crossing a face boundary remap by direction. Experimental shader composition asserts expected markers instead of silently missing key splices.

Native GPU results in `v04-ma-ab3-tests-03/shader-gpu.json`: corrected foam seam maximum 0.00004846 versus legacy 1.0; finite solar basis and ring symmetry; cubemap direction round-trip error 2.06e-7; water phase energy relative error 1.98e-6 and backscatter error 3.84e-8. The production cubemap mip kernel's manufactured directional-field boundary MAE improves from 0.00100895 to 0.00032276, with exact constant preservation. This demonstrates numerical boundary improvement, not a visibly confirmed ocean reflection seam fix.

### Slope precision

`34b9ff1` adds `maMoments=f32`, requiring `float32-filterable`. Both derivative means and second moments use rgba32float; displacement remains rgba16float. Allocation payload rises by 8,388,576 bytes, approximately 8 MiB; GPU residency was not measured. The default stays half precision.

Actual float32 FFT slopes and GPU mips are compared with float64 filtering and reconstructed half rounding at every mip. Three bilinear offsets are sampled per texel. At level zero, half variance errors exceed 10% at 1.8-2.9% of nonzero sampled footprints; relative L1 error is about 0.29-0.60%. Float32 relative L1 is about 1.7e-7 to 3.4e-7, with no sampled errors above 10%. Spurious zero-footprint half variance reaches 6.68e-5 versus roughly 3.7e-9 in float32. These measurements establish cancellation but do not establish it as the principal appearance defect. Full numerical results are in `v04-ma-ab3-f32-02/day-near.json`.

### Surface inversion

`v04-ma-ab3-inversion-01/storm-lens.json` measures actual production residuals near the waterline: near gravity-atlas mean/p95/max 0.003390/0.012474/0.062439 m; far 0.003351/0.011696/0.089172 m; lens mean/max 8.07e-8/5.36e-7 m. No nonfinite samples. The gravity atlas intentionally uses three cascades, 0.5/4 m grids and five damped iterations; lens classification uses the raster-triangle surface and eight capped iterations. These are different representations. The camera probe was not independently compared here. No shared solver rewrite is justified by this diagnostic; ambiguity at folded surfaces remains.

## Evidence and validation

CPU regression: 54/54 pass. Native NVIDIA/Ampere FFT9, optical5 and appearance24 checks pass in `v04-ma-ab3-tests-02`; updated shader corrections pass all five groups in `tests-03`. Numerical passes do not close visual defects.

Original 1920x1080, approximately 24-second VP9 recordings are in `v04-ma-ab3-motion-01`: storm events/gravity, daylight and low Sun. The final far-field correction is captured separately in `v04-ma-ab3-motion-02/storm-gravity`, from rendering commit `5f91c2e`; its source fingerprint is stable and it has no GPU errors. Final storm playback reached 23.95 s, 613 frames, two dropped; daylight 23.84 s, 279 frames, zero dropped; low Sun 23.89 s, 278 frames, one dropped. These playback counts are not displayed renderer FPS or a real-time acceptance result. The daylight/low-Sun recordings include the expensive connected-cloud trial, which is excluded from the timing table below.

Original 8 s and 16 s storm frames, plus 12 s daylight/low-Sun frames, are retained under `v04-ma-ab3-motion-samples-01`. They show reduced broad sheets and residual trails, discrete daylight glints, persistent metallic low-Sun reflections and artificial cloud rims. Recording runs use elapsed time and are not exactly frame-matched. Playback completion plus sampled inspection is not exhaustive perceptual certification.

Review originals through `ab3-review.html`. B1 owner review remains pending; B2, Milestone C and final release acceptance are not implied.

## Actual GPU cost

RTX 3050 Laptop, 4096 MiB, driver 617.14, desktop Chrome 156 native WebGPU. Four sequential 60-second runs at 1920x1080 Balanced; first five seconds of retained frame records excluded. No hidden frames or GPU errors; source fingerprints stable. Original reports: `v04-ma-ab3-profile-01`; analysis: `v04-ma-ab3-checkpoint-02/analysis.json`.

| Scene / option | GPU work ms | Surface ms | Screen clouds ms | Queue throughput frames/s |
|---|---:|---:|---:|---:|
| Storm / previous events, float32 | 36.95 | 23.28 | 8.09 | 24.68 |
| Storm / gravity events, float32 | 36.75 | 23.17 | 8.09 | 24.86 |
| Daylight near / half precision | 39.41 | 14.48 | 17.85 | 23.33 |
| Daylight near / float32 reference | 44.66 | 19.56 | 17.86 | 20.76 |

Storm costs are essentially unchanged; one sequential pair does not demonstrate a speedup. Float32 adds about 5.25 ms in this daylight pair, mostly in the surface pass, supporting its diagnostic-only status. Queue completion p95/p99: gravity storm 43.1/44.5 ms, daylight half 46.1/47.3 ms, daylight float32 52.2/53.9 ms. These are not displayed FPS. The one-second display-pacing defect remains unresolved. No thermal-repeat confidence interval, new elevated/low-Sun sustained profiles or isolated reflection/lens-query timings are claimed. No speculative caching optimization was introduced.

## Publication

Checkpoint `f8703f8a6035170281c572fb45b88d5148d34184` was fast-forward published to `development/pelagic-0.4`, including recovered `f38b85a`/`97f68a1` history. The remote development HEAD matched. All 57 changed LFS objects since `a3e2a46` (517,754,863 bytes) were freshly downloaded to a new isolated cache and SHA-256 verified. Main, completed 0.3 and frozen release refs matched their preserved values. Proof: `evidence/v04-ma-ab3-publication-01/publication.json`. The subsequent handoff commit records this proof without changing renderer source or media. Nine inherited evidence modifications remain unstaged and match their recovery hashes. Publication does not confer visual acceptance.
