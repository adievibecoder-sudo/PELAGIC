# PELAGIC 0.2: acceptance register

Baseline: preserved sibling `pelagic` 0.1, manifest verified before work. 2026-10-19.

Scientific verification and visual acceptance are independent. OPEN is not PASS.

| ID / priority | Observation and source diagnosis | Intervention and closure evidence | Status |
|---|---|---|---|
| O1 / critical | Wrinkled surface. `spectrum` extends swell JONSWAP into wind-ripple scales; wind travels in x/z polar coordinates while controls use other conventions. Short-wave tail is a capillary dispersion extension, not a measured spectrum. | Separate swell cutoff and wind short-wave branch; continuous energy integration, GPU ensemble, matched stills and evolution. | OPEN |
| O2 / critical | Metallic glints. `ocean.fs` adds derivative variance at coefficient 0.5 after filtered second moments. Finite sun variance is added before deformation, distorting its angular size. Smith masking uses the horizontal reference instead of the local facet. | Explicit covariance budget and tangent-frame lighting, finite-source approximation tested against integration; matched HDR diagnostics and motion. | OPEN |
| O3 / high | Weak body depth. Deep-water proxy lacks air/water radiance conversion; crest transmission depends on absolute height. | Consistent downwelling irradiance/upwelling radiance, crest strain and thickness proxy. Optics unit tests and fixed-exposure comparisons. | OPEN |
| B1 / critical | Storm without whitewater. Foam source multiplies compression, slope and growth gates; density is then thresholded again in shading. `FOAM_UPDATE` advects material in reference coordinates using physical displacement velocity, potentially double-counting orbital movement. | Compression eigenvalue event source, bounded age/coverage and reference-coordinate current transport. Distinguish heuristic onset from hydrodynamic breaking. Decay/transport tests; storm clips and optical masks. | OPEN |
| C1 / high | Soft clouds. `cloudDensityFiltered` uses only positive value-noise sums, tiny erosion, broad flat thresholds. `ds/2` filtering removes morphology at grazing rays. | Cached multiscale 3D shape/erosion noise, weather organization, depth-aware lighting and coherent sampling. Fixed cloud/light captures plus motion and timing. | OPEN |
| U1 / critical | Abrupt immersion. Sky and ocean both branch on CPU-readback water height. | Per-ray near-plane medium and surface visibility; two-sided refraction and water-path attenuation. Repeated crossing footage at fixed path required. | OPEN |
| R1 / high | Frame stalls / excessive work. Simulation copies every displacement mip every frame. Cubemap recomputes all mip faces despite one updated face. Probe maps every eighth frame. | Measure before changing scheduling; retain all failed runs. Sustained foreground hardware pacing, per-pass timing, long-flight stress. | OPEN |
| G1 / high | High-altitude uniformity and coordinate precision. GPU phase lookup uses absolute f32 x/z; geometry filters by grid spacing but normals by pixels. | Camera-relative positions plus per-cascade modulo origins; matched 50/500 m and long-flight checks. | OPEN |

## Stages

1. Controlled 0.1 / original-reference captures and source audit. No rendering edits before baselines.
2. Ocean scale/optics/filtering; preserve FFT and phase kernels. Accept only with core tests and comparative imagery.
3. Breaking memory, foam/spray and cloud/light coherence. Verify production transport before claiming motion.
4. Per-ray immersion, continuity and integrated quality evaluation. Run 48 views plus special cases, continuous clips and hardware profiling. Package failures as failures.

Baseline protocol: seed 1307 (reference harness explicitly sets it), 1920x1080, fixed camera and 1/60 s, initial t=20 plus 100 steps, Balanced unless named otherwise. Original reference retains its wave-frequency quantization and optical semantics; equal controls do not imply identical physical spectra. Record those differences.
