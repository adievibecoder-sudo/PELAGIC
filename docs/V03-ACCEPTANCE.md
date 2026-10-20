# PELAGIC 0.3 acceptance register

Publication gate completed before any 0.3 source change. Baseline: immutable GitHub release `v0.2.0`, publication commit `151aadaa6d2402c46f4e02454f2fc33ab7744661`, original checkpoint `33acb4bb2bc553d721a5a17fff7c5098c124e522`. `main` remains at the publication commit; work proceeds on `development/pelagic-0.3`.

Scientific correctness, rendering correctness, visual naturalism, motion and hardware performance are independent gates. An implemented method does not close a visual gate. The supplied brief is a set of research leads, critically evaluated against source and measurements.

| ID / priority | Observed issue / source evidence | Intervention / required closure evidence | Correctness | Visual |
|---|---|---|---|---|
| P0 / prerequisite | Complete 0.2 publication required | Public archive and all four assets downloaded and hashed; 376 files restored in fresh clone; 15 CPU tests and nine GPU field comparisons pass; golden 1080p image exactly matches every baseline pixel; GitHub `immutable:true` | PASS | Preservation PASS |
| W1 / critical | The old foam-noise multiplier altered normals independently of geometry | Replaced by shared bounded long-wave strain modulation in mesh, derivatives, probe, foam and spray. GPU 2,048 samples: amplitude error 0.000147, derivative error 0.0000583/m. Need action/energy budget and observational calibration; calm/high views still uniform | Manufactured coupling PASS; physical calibration UNVERIFIED | FAIL |
| W2 / high | Geometry and pixels resolve different wave scales | Cascade ledger and mip readback added; maximum unmodulated moment loss 0.568% against 0.6% rounding budget. Non-symmetric inverse-transpose and product rule tested. Full modulated cross-moment closure and omitted tail fit remain open | Tested transforms/mips PASS; complete energy closure UNVERIFIED | FAIL |
| L1 / critical | Five sky samples were used as diffuse illumination | Replaced by cosine irradiance convolution; isotropic error 0.0308%, angular-gradient error 0.3150%. Below-horizon cube shares dielectric/body approximation. Radiance is still relative RGB, not absolute photometric calibration | Quadrature PASS; transport calibration UNVERIFIED | FAIL |
| L2 / high | No neighbouring-wave visibility, incorrect projected slope weighting | Gravity-height solar/lunar masks and bounded reflected-ray intersections added; projected measure and incoming Smith visibility corrected. Manufactured 2,560 rays PASS outside stated margins. Reflection omits secondary glints/foam, has finite 470 m reach, retains uncalibrated residual slope floor | Tested visibility PASS; full optical/roughness calibration UNVERIFIED | FAIL |
| B1 / critical | Grey films, inadequate breaking whitewater | Active/residual/submerged optical phases, rank-calibrated coverage and froth/spindrift populations added. Coverage texel error <=0.289 percentage points. Transport/decay tests PASS. Storm motion develops fragmented whitewater; no overturning/spilling geometry, dissipation or measured event statistics | Transport/coverage PASS; onset/entrainment UNVERIFIED | FAIL |
| C1 / critical | Repeated puffy cells, horizontal sampling bands | Larger cache, variable-depth clusters and weather modulation. Removed angle-dependent integer quadrature rephasing; H/I images remove prominent bands. Cheaper J rejected for visible slices. Smooth billows/weak mesoscale organization remain | Rephasing defect corrected; light transport UNVERIFIED | FAIL |
| U1 / critical | Tangent-plane sky classifier disagreed with raster surface | Shared curved near-plane map interpolates finest raster triangles. Four manufactured cases: <=0.1311 mm error against 0.15 mm bound. Sampled skim slivers reduced. Folded/coarse/morphed surfaces and fast storm crossings remain open | Manufactured classification PASS; general topology UNVERIFIED | FAIL |
| G1 / high | Large absolute float32 coordinates lost wave phase precision | Camera-local 1024 m origins; CPU double modulo cascade coordinates; coherent foam and particle shifts. GPU 12,288 points through 1e9 m: <=0.0923 mm equivalent error. 100 km image pairs and rebase clip saved. Atmosphere remains global kilometres | Wave-coordinate tests PASS; extreme atmosphere/full flight UNVERIFIED | UNVERIFIED |
| A1 / high | Single light switched at -7 degrees; Moon was an unphased disc | Separate simultaneous solar/lunar lighting, geometric lunar terminator, Lambert phase and continuous exposure. Independent projected-disc integration PASS. Twilight/night too dark; lunar/star appearance and absolute radiometry uncalibrated | Geometry/continuity PASS; photometry UNVERIFIED | FAIL |
| T1 / high | Historical approximately one-second stalls; upgraded passes cost too much | Sustained runs, per-pass queries and source-timestamp audit. Pruned golden Balanced 22.83 FPS, High 9.85; storm 32.24/18.59. An additional attempt reproduced 1 Hz scheduling despite visible document/browser; interrupted-run observation retained. Bounded repeat recovered. Conservative ray pruning tested independently | Completed instrumented runs PASS; stall cause UNVERIFIED | Performance FAIL |
| R1 / final | Whole environment remains visibly synthetic | 52 actual 1080p images, 48/48 exact primary input matches; nine continuous 1080p clips. All 52 finite HDR/spectral readbacks PASS. No new calibrated real-ocean or matched Noniv comparison. See integrated evaluation for inspection limits | Capture/matching PASS; observational validation UNVERIFIED | FAIL |

## Stage dependencies

1. Audit and statistical/radiometric contracts, keeping 0.2 output available as the immutable reference.
2. Ocean scale coupling, geometry/roughness coherence, reflection and water-body illumination.
3. Breaking events, active whitewater, residual foam, aeration and spray.
4. Cloud morphology and unified atmospheric/celestial light.
5. Curved immersion, weather continuity and coordinate stability.
6. Integrated matrix, motion, sustained hardware profiling and release evaluation.

No arbitrary percentage of AAA quality is assigned. Current overall visual acceptance: **FAIL**.
