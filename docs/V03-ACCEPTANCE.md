# PELAGIC 0.3 acceptance register

Publication gate completed before any 0.3 source change. Baseline: immutable GitHub release `v0.2.0`, publication commit `151aadaa6d2402c46f4e02454f2fc33ab7744661`, original checkpoint `33acb4bb2bc553d721a5a17fff7c5098c124e522`. `main` remains at the publication commit; work proceeds on `development/pelagic-0.3`.

Scientific correctness, rendering correctness, visual naturalism, motion and hardware performance are independent gates. An implemented method does not close a visual gate. The supplied brief is a set of research leads, critically evaluated against source and measurements.

| ID / priority | Observed issue / source evidence | Intervention / required closure evidence | Correctness | Visual |
|---|---|---|---|---|
| P0 / prerequisite | Complete 0.2 publication required | Public archive and all four assets downloaded and hashed; 376 files restored in fresh clone; 15 CPU tests and nine GPU field comparisons pass; golden 1080p image exactly matches every baseline pixel; GitHub `immutable:true` | PASS | Preservation PASS |
| W1 / critical | Uniform short-wave texture; `OCEAN.fs` changes short-wave derivatives with foam-noise gusts, while `vs`, probe and foam use unmodulated displacement | Per-cascade energy/covariance ledger; coherent surface deformation; weak scale-coupling model with declared validity; matched close/eye/high views and continuous motion | UNVERIFIED | FAIL |
| W2 / high | Geometry filters by grid spacing, normals by pixels; no full measured energy accounting through mips and deformation | Production mip readback, covariance conservation and finite-difference transformation checks; preserve FFT kernels | UNVERIFIED | FAIL |
| L1 / critical | Diffuse illumination is a weighted average of five cube samples, not a cosine integral. Below-horizon cube uses a separate arbitrary water approximation | Measured radiance ledger; cosine-convolved environment lighting; unit-environment checks and matched body/reflection/foam diagnostics | UNVERIFIED | FAIL |
| L2 / high | Environment quadrature omits neighbouring-wave visibility; finite-disc direct light uses linearized covariance; residual slope floor is an uncalibrated constant | Separate solar/sky/body diagnostics, directional visibility experiment, BRDF integration checks, glitter motion and high-altitude views | UNVERIFIED | FAIL |
| B1 / critical | Storm still and 6 s frame show grey films, no convincing spilling crest geometry. Foam memory exists; sparse visual foam is not proof of absent generation | Separate active whitewater, residual coverage and submerged aeration; shared breaking event source for spray; transport tests, sustained storm motion, coverage distribution | Transport baseline PASS; onset UNVERIFIED | FAIL |
| C1 / critical | Repeated puffy cloud cells, distant horizontal bands; `cloudDensityFiltered` repeats a 64-cube field with nearly uniform vertical profile | Weather-organised morphology, erosion/shape separation, shared shadow density; clear/storm stills and motion, sampling diagnostics | UNVERIFIED | FAIL |
| U1 / critical | `waterFraction` classifies sky rays against one tangent plane; ocean uses triangle orientation. Mixed geometry explains straight boundary risk | Curved near-plane classification consistent with displaced geometry, optical path tests and repeated skim/waterline motion | UNVERIFIED | FAIL |
| G1 / high | Absolute float32 x/z uploaded before wave UV construction; CPU camera uses doubles | Camera-relative mesh, modulo cascade origins and coherent foam/cloud/particle rebasing; manufactured translation and long-flight motion | UNVERIFIED | FAIL |
| A1 / high | Sun switches to a phase-scaled Moon in one light slot; phase does not shape the disc. Twilight lacks calibrated exposure/illumination | Explicit radiance units and separate celestial appearance; Sun/Moon/twilight diagnostics, continuous transitions | UNVERIFIED | FAIL |
| T1 / high | Historical High/storm approximately one-second stalls; visible repeat passed, root cause not isolated | Display-paced visible sustained runs, per-pass timing, visibility logging; preserve failed data | UNVERIFIED | FAIL |
| R1 / final | Whole environment remains visibly synthetic | Six conditions x four heights x two azimuths, special immersion/close views, continuous videos, reference provenance and explicit defects | UNVERIFIED | FAIL |

## Stage dependencies

1. Audit and statistical/radiometric contracts, keeping 0.2 output available as the immutable reference.
2. Ocean scale coupling, geometry/roughness coherence, reflection and water-body illumination.
3. Breaking events, active whitewater, residual foam, aeration and spray.
4. Cloud morphology and unified atmospheric/celestial light.
5. Curved immersion, weather continuity and coordinate stability.
6. Integrated matrix, motion, sustained hardware profiling and release evaluation.

No arbitrary percentage of AAA quality is assigned. Current overall visual acceptance: **FAIL**.
