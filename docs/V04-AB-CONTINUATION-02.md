# A+B continuation: 24 October 2026

Owner decision remains **not accepted**. No appearance candidate is promoted to the default renderer. Source checkpoint `97f68a1` preserves the implementation trials; this is not completion of A+B.

## Changes and decisions

- `maGlints=conditional` uses continuous, variance-normalized FFT slope samples and a conditional Gaussian shutter kernel. Neighbour and temporal correlations come from the discrete initial spectrum. This removes the raw-texel rank discontinuity without the excessive smoothing of `maGlints=coherent`. The uniform-rank expectation passes GPU checks. Facet population remains a spectral-moment closure; the conditional kernel is an expected exposure, not a traced shutter. Constants describe the initial sea state only: live wind transitions are not validated. Four matched views and motion determine its visual limits.
- `maReflection=visible` directly samples projected visible Gaussian slopes. Vertical-view degeneracy is guarded. It does not materially solve low-Sun appearance and costs more. `maGlints=footprint` restores the broad silver patch and is rejected as an appearance solution.
- `maWater=facet|wave-path|angular` compares interface-dependent light, approximate wave paths and directional single scattering. None produces a meaningful low-Sun improvement. The wave path is not a full refractive boundary solve; the angular trial omits multiple scattering. Retain as diagnostics, not calibrated water transport.
- `maRoughness=stress` supplies a normalized Gaussian/lognormal wind-stress field with analytic derivatives. Mean squared gain is one in the ensemble; the GPU realization measures 0.99521 at the strongest tested response. Low-Sun visual benefit remains small. No global slope-energy removal.
- `maCloud=plumes|entrained` introduces variable-size updraft clusters, height-linked liquid water, irregular boundaries and entrainment. `maCloudPhase=droplet` isolates a more forward HG phase; `orders` additionally conditions the local higher-order source on incident optical path, reducing some bright edges. New silhouettes vary, but dark flat bases, bright rims, excessive fragments and cost remain failures. These are morphology representations, not cloud-fluid or validated multiple-scattering solvers.
- `maBreaking=onset` deposits residual foam only on positive compression increments. Broad sheets persist. `fold` nearly removes foam; the stricter `crest` steepness proxy also underproduces breaking. Neither is selected. Existing spray follows event activity, but convincing coupled breaking/spray is not demonstrated.

## Validation scope

CPU regression suite: 52/52 PASS. Native NVIDIA/Ampere appearance checks: 24/24 PASS in `evidence/v04-ma-ab2-tests-02`. This includes conditional-glitter mean, visible-slope mean and stress-gradient/energy checks; it does not establish observational realism or temporal acceptance. FFT mathematics is unchanged.

All `v04-ma-ab2-*` originals retain source manifests and experiment parameters. Manifests fingerprint files; intermediate uncommitted edits are not complete source archives. Committed candidates can be reproduced at their source checkpoints; superseded iterations are retained as original images/recordings, not claimed byte-reproducible builds. Nine inherited `v04-p1-final-stills` modifications remain excluded from commits. Final visual observations and measured timing are appended after capture inspection.
