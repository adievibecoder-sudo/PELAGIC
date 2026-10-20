# PELAGIC 0.3 development record

## Phase 0: publication

The complete 0.2 archive, history bundle and two verification files are public assets of https://github.com/adievibecoder-sudo/PELAGIC/releases/tag/v0.2.0 . GitHub release immutability is enabled and the published release reports `immutable:true`. The tag resolves to `151aadaa6d2402c46f4e02454f2fc33ab7744661`; the original nine source commits are ancestors. Publication only adds byte-preserving Git attributes, evidence JSON, the manifest and restoration instructions. Existing source content is unchanged; original working-tree line endings are preserved to match the manifest.

Verification actually performed:

- Original manifest: all 376 files match SHA-256.
- Public-source fresh clone: all 211 source/metadata files match the original manifest bytes.
- All four release assets downloaded twice, first as a draft and then anonymously after publication; all sizes and SHA-256 hashes match.
- Downloaded complete archive restored into the fresh clone: all 376 original files match. History bundle verification passes and records complete history.
- Fresh-clone CPU suite: 15/15 PASS. Actual NVIDIA WebGPU FFT: 3 inputs x 3 fields, 9/9 PASS; no validation errors.
- Fresh-clone 1920x1080 golden capture: exactly equal RGB bytes to original `evidence/stage-04/golden-h2-a0.png`; identical settings; spectral and HDR validation PASS.
- `main`, annotated version tag and remote development branch verified through `git ls-remote`. No 0.3 edits preceded these gates.

Archive SHA-256: `d75e7b45be765849af10fb303226c1d77aa66c3bf40ca9791d72b384280e35f8`. Original baseline remains in the release and the preserved local project. New evidence uses `evidence/v03-*` to avoid overwriting prior stages.

## Phase 1: audit and measurement contracts

Read the actual simulation, geometry, water/immersion, sky/cloud, particle, renderer, settings and test code; inspected 0.2 golden/midday/storm images and the retained storm 6 s frame at full resolution. Original Noniv `js/wgsl/ocean.js` and cloud/shading code were re-inspected at `a07c7fd522ef0a897601c114f927a49d93d95520`. Its stronger artistic sunset uses separate, less physical colour and reflection approximations; this does not justify copying those gains into 0.3.

Confirmed implementation concerns are separated from unproven visual causality in `V03-ACCEPTANCE.md`. In particular, nonzero storm foam memory coexists with weak whitewater appearance. Increasing a source threshold alone is not an adequate diagnosis.

Radiometric contract: the atmosphere uses relative RGB radiance normalized by a direct-light irradiance scale of 14. These values are not calibrated watts or lux. Meters are used for ocean geometry and water extinction; atmospheric/cloud paths use kilometres. The solar disc divides irradiance by its angular area. Binary16 HDR divides daytime radiance by 32 and restores that scale before exposure. Exposure is a multiplier, not a physical camera EV model. Gordon-style water radiance uses backscatter/absorption proxies, an approximate downwelling irradiance and the air/water n-squared conversion. Its angular and spectral limitations remain open.

## Source-access ledger for 0.3

### Phase 1/2 executed results

Phase 1 added `src/ocean-contracts.js`, production slope/moment readback, isolated optical diagnostics, HDR band statistics and `lab.html`. CPU tests: 19/19 PASS. All six representative beauty images are pixel-identical to 0.2. Measured cumulative half-float mip energy loss: 0.226-0.568%, within the declared 0.6% budget. This validates the unmodulated mip chain only. Evidence: `evidence/v03-phase01/contracts-summary.json` and twelve 1920x1080 images/reports.

Phase 2 replaces five-point diffuse lighting with a 16x16x6 cosine-convolved irradiance cube, 128 deterministic hemisphere samples per direction. Water uses horizontal downwelling irradiance; foam uses irradiance at its normal divided by pi. Direct sunlight remains separate. No physical radiance calibration is claimed. `optics.html` validates constant radiance and an independently derived linear angular field on native NVIDIA/Ampere WebGPU, 1536 normals each. Maximum relative errors: 0.0308% and 0.3150%; no invalid values or GPU errors. Analytic tolerances are 0.15% and 0.8%, including half-float quantization, cube resolution and finite quadrature.

Twelve matched 1080p captures completed in `evidence/v03-phase02`. Bottom-third midday water-body radiance rises from 0.009988 to 0.010674 relative units. Final midday rises only 0.67%; storm changes -0.22%. This is a correctness improvement with modest visible impact, **not** the requested transformation. Storm clouds remain flat, crests lack whitewater, reflections remain synthetic. These visual gates stay FAIL. Capture timings are queue-throughput samples, not sustained FPS claims. Continuous motion validation remains pending for this stage.

Next dependency: coherent short-wave derivatives, reflection visibility and whitewater; cloud morphology affects the incident-light field and must improve alongside surface shading.

Phase 3 removes the foam-texture gust multiplier that changed normals independently of displacement. `coupling.js` shares a bounded, low-pass long-wave convergence envelope between geometry, optical derivatives, lens probe, foam and particle spawn positions. Existing choppy coordinates already modulate wavelengths; only short-wave amplitude is added. Product-rule terms preserve the non-symmetric deformation matrix. Conditional slope covariance receives the square of the amplitude. Remaining approximation: modulation is bounded to 0.8-1.2, not an action-conserving prognostic solver; unresolved height/envelope cross-moments are omitted under scale separation. No claim that this solves storm nonlinearity or breaking.

GPU manufactured sinusoidal strain: 2048 points, maximum amplitude error 0.000147, gradient error 0.0000583/m, no invalid values. CPU suite 19/19 PASS. Twelve matched 1080p images and three continuous 1080p recordings are saved in `evidence/v03-phase03`; motion inspection is pending. Below-horizon environment lighting now uses dielectric reflection plus the same deep-water body approximation instead of a separately tinted horizon blend. Neighbouring-wave ray visibility is still absent. The new images retain visibly synthetic clouds and inadequate breaking; overall visual acceptance remains FAIL.

- Supplied `PELAGIC_0_3_RD_AND_EXECUTION_BRIEF.md`: entire document read; research suggestions are hypotheses, not proof of defects or mandatory algorithms.
- GitHub official REST repository/release documentation and immutable-release documentation: endpoint schemas and immutability semantics consulted for publication.
- Curcic (2025), *Revisiting the hydrodynamic modulation of short surface waves by longer waves*, https://doi.org/10.1017/jfm.2025.10376 . Publisher full-text HTML introduction, governing equations, analytical wavenumber discussion, numerical comparison and validity discussion inspected. Slowly varying wave-action assumptions fail for steep long waves; a stationary bounded modulation is not a storm breaking solver. No source code or figures copied.
- Bruneton et al. (2010), https://anato-data.inrialpes.fr/Publications/2010/BNH10/article.pdf : indexed abstract and slope-variance excerpts consulted in this cycle; not claiming full-paper experiments reproduced.
- Nubis Evolved (2022), https://www.guerrilla-games.com/read/nubis-evolved and official indexed presentation excerpts: morphology and weather organisation consulted. Full 49 MB PDF failed the web reader size limit. No full-slide-review claim.
- Mobley-related radiance transport: publisher excerpt at https://journals.ametsoc.org/view/journals/atot/20/1/1520-0426_2003_020_0187_paeeoa_2_0_co_2.xml consulted for angular water-leaving radiance and n-squared transmission. Ocean Optics Book direct access returned HTTP 429; not claimed read.
- NOAA *Rough Seas*, Seascape Alaska EX2304, https://oceanexplorer.noaa.gov/multimedia/okeanos-explorations-seascape-alaska-ex2304-gallery-media-dive03-rough-seas/ : provenance and opening browser playback view inspected. Deck obstruction, unknown camera height/wind/exposure and limited sea pixels preclude calibrated matching. No media redistributed.

The prior bibliographies remain intact. New entries describe actual access, not merely intended reading.

## Phase 4: whitewater, resolved light visibility and cloud experiments

`foam-pattern.js` rank-calibrates the generated foam topology once at startup. `ocean.js` separates occupied area from optical depth: fragmented residual patches, denser active coverage and submerged aeration. Texture-texel area error is at most 0.002886 (0.289 percentage points) across seven coverage targets. This does not validate bilinear or projected coverage. Subpixel patches approach their expected area instead of thresholding averaged mip values. The microstructure follows material coordinates plus the same prescribed mean drift as the foam solver; spatially varying inverse-deformation transport is still approximate. Foam reflectance spans 0.48-0.66 before bubble modulation, an artistic calibration informed by measured variation, not a fit to an observational dataset.

`particles.js` separates ballistic froth and strongly dragged spindrift populations, inherits surface orbital velocity, restricts emission to the actual fine foam window and retires particles against the moving surface instead of y=-3 m. Balanced has 24,576 particle slots; other presets 49,152. These sprites represent droplet populations, not individually resolved millimetric droplets. Emission remains driven by the existing principal-stretch proxy. There is no overturning or spilling-fluid solution. At 100 frames the storm still shows overly discrete dark spray flecks; at 600 frames foam fragmentation is clearly visible. The breaking naturalism gate remains FAIL.

`wave-visibility.js` adds two 256-square Eulerian gravity-height/solar-visibility clipmaps, 128 and 1024 m wide. Damped horizontal inversion uses the first three cascades. A 28-step expanding ray search estimates finite-disc occlusion. Unresolved Smith masking stays separate; the atlas excludes capillary cascades. Outside the atlas, visibility smoothly returns to one. Neighbour-wave sky reflection, distant shadow statistics and inversion near folds remain unresolved. GPU manufactured flat/sinusoidal tests pass 1,536 samples, excluding declared penumbra/interpolation margins; zero incorrect classified samples and zero invalid values. Retained irradiance/coupling tests PASS; CPU suite 19/19 PASS.

Cloud experiments A-E and a matched High capture are retained under `evidence/v03-cloud-*`. Higher quality did not fix smooth ellipsoidal morphology. The phase-4 candidate varies thermal-cell dimensions, shears and erodes multiscale cores, adds a connected storm deck and uses two-point segment quadrature. The 128-cube cache is about 9.6 MB. Clear-cloud silhouettes improve in irregularity, but horizontal sampling bands, repeated small formations and exaggerated sunset edges remain visible. Cloud visual gate FAIL. Extinction and multiple-scattering approximations are not condensate-calibrated.

Evidence: twelve matched 1920x1080 images/diagnostics and three continuous 10-second recordings in `evidence/v03-phase04`; additional 600-frame storm captures in `v03-whitewater-a/b`. All executed on NVIDIA/Ampere native WebGPU. No sustained frame-rate claim from capture throughput. Motion decoding/inspection is tracked separately. The entire scene remains visibly synthetic; this checkpoint is not a completed 0.3 release.

Sources actually consulted in this phase:

- Dierssen (2019), https://www.frontiersin.org/journals/earth-science/articles/10.3389/feart.2019.00014/full : abstract, active/residual/submerged-bubble distinction, measured optical examples, optical thickness/void-fraction discussion. Limited Long Island Sound conditions; not universal albedo or wind-coverage thresholds. No figures copied.
- Guerrilla, Nubis (2017), https://www.advances.realtimerendering.com/s2017/Nubis%20-%20Authoring%20Realtime%20Volumetric%20Cloudscapes%20with%20the%20Decima%20Engine%20-%20Final%20.pdf : official PDF downloaded; text extracted. Morphology/height profiles, Perlin-Worley remapping, weather organisation and lighting sections read (approximately slides 28-40, 68-91). Not all slides visually inspected; no code/assets reused.
- Bruneton et al. (2010) indexed primary-source summary rechecked for macro shadow maps and geometry/BRDF separation. Direct PDF fetch returned HTTP 502; no full-paper-read claim.
