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

## Phase 5: near-plane immersion

`lens-medium.js` computes signed water height on a 128x72 near-plane map, shared by sky and water. Eight damped horizontal-inverse iterations start at the camera probe's material coordinate. The final version interpolates the same a-c-d/a-d-b triangles as the finest raster grid; the initial smooth-height version retained thin mismatched slivers. This corrects the demonstrated disagreement between sky classification and surface facets. It does not solve folded/multivalued storm surfaces or guarantee convergence of the inverse.

Matched 1080p continuous clips are in `v03-immersion-before`, `v03-immersion-after`, and `v03-immersion-triangles`. Full-resolution sampled frames and contact sheets were inspected. Triangle interpolation removes the conspicuous skim slivers in those sampled frames. Continuous playback acceptance remains pending; the complete immersion visual gate stays open.

Production GPU classifier tests: four manufactured plane/sinusoid/translation cases PASS; maximum signed-height error 0.1311 mm, zero invalid samples or constant-translation inverse residual. The 0.15 mm tolerance includes the 0.075 mm linear-triangle interpolation bound and binary16/texture errors. This is a numerical test of simple surfaces, not a storm-crossing certification. CPU suite remains 21/21 PASS after phase 6.

## Phase 6: separate Sun and Moon

`celestial-light.js`, the two-layer sky-view LUT and shared frame uniforms retain solar and lunar illumination simultaneously. Water, foam, particles, clouds and underwater scattering receive both sources. Cloud and gravity-wave visibility store independent channels. The Moon uses angular radius from distance, a Lambert phase law and a geometrically oriented terminator. Exposure adaptation varies continuously through twilight; the previous single-light switch at -7 degrees is removed.

Twenty matched 1080p captures per side are retained in `v03-celestial-before` and `v03-phase06`. Twilight, moonlit and underwater-window images were inspected at full resolution. Lighting continuity improves structurally, but night remains very dark, stars are conspicuous procedural points, and the lunar surface has no albedo structure. Relative RGB radiometry is not calibrated lux; full-moon irradiance 0.000055 and maximum adaptation 500 are explicit approximations. Lunar glitter still uses a uniform-disc covariance despite the phase-shaped visible disc. Overall night visual acceptance is FAIL.

Independent numerical projected-sphere integration uses 131,072 samples at seven phases and verifies the phase law; exposure tests verify continuity/monotonicity. GPU irradiance, coupling, wave visibility and near-plane tests pass with the extended frame layout. Source consulted: USGS ROLO indexed primary-source excerpts describe phase, libration and albedo complexity; direct full-page access returned HTTP 403. https://www.usgs.gov/centers/astrogeology-science-center/science/rolo-further-details-lunar-calibration . The Lambert model is not ROLO.

## Phase 7: cloud sampling and reflected-wave visibility

Cloud G/H/I comparisons are preserved. Wider, variable-depth thermal clusters reduce the repeated tall cells. A confirmed source discontinuity was the integer ray sample count varying by image row: every integer boundary rephased the whole quadrature. A fixed angular-independent count removes this discontinuity. The H/I matched 1080p images show the prominent horizontal stripes disappearing. Four deterministic subsegment density samples remain; no temporal accumulation is used. Cloud naturalism still FAIL: smooth billows, insufficient mesoscale organization and simplified light transport remain visible.

`ocean.js` now uses the projected slope-density factor and correlated Smith incoming visibility in environment quadrature. `wave-visibility.js` supplies a bounded, 20-step gravity-height reflection traversal. An obstructed ray receives an approximate secondary dielectric bounce and the existing water-body radiance, rather than unrestricted distant sky. It excludes short-wave geometry, reflected whitewater and secondary sun glints; it is not a complete multiple-scattering renderer. Two atlas resolutions and a finite 470 m outer fade limit validity.

Twelve matched 1080p images/diagnostics per side are in `v03-reflection-before` and `v03-reflection-after`. Midday and storm full-resolution images were inspected. The effect is localized and modest, not a wholesale visual transformation. GPU classification against independent dense analytic intersections passes 2,560 flat/sinusoidal upward/downward rays with zero incorrectly classified samples outside declared margins; transition samples are excluded. Numerical optics PASS is separate from the still-open reflection naturalism gate.

Additional source access: Bruneton et al. (2010), manuscript text transcription at https://doczz.net/doc/627823/real-time-realistic-ocean-lighting-using-seamless , sections 3-5 inspected for projected slope measure, correlated Smith visibility and geometric/BRDF separation. This is a secondary transcription; primary INRIA PDF endpoints again failed. No code or illustrations copied. No observational calibration is claimed.

The latest spray revision reduces froth sprite radius to 0.015-0.060 m and spindrift opacity to 0.035; full storm motion remains the required acceptance test. Capture throughput is not a sustained FPS measurement. Integrated matrix, continuous playback review, long-flight precision and sustained visible hardware profiling remain next dependencies.

## Phase 8: spatial precision

`spatial-origin.js` keeps CPU camera coordinates in double precision and rebases GPU geometry in 1024 m blocks. Per-cascade modulo UV offsets are computed in double precision against each float32 patch period. FFT coefficients and temporal phases remain unchanged. All wave consumers use the same coordinate helper, including coupling, foam, spray, lens inversion and gravity visibility. The origin block is an exact multiple of both foam clipmap periods; previous clipmap bounds and live particle positions shift coherently. Foam pattern phases include current drift in CPU double precision. Clouds retain kilometre global coordinates, so their extreme-distance precision remains a separate limitation.

CPU tests 23/23 PASS. Production GPU UV helper: 12,288 points across six cascades and four origins through 1e9 m, maximum phase-equivalent position error 0.0923 mm; maximum unit-sinusoid error 0.000956. Declared bounds are 0.12 mm and 0.0025, accounting for float32 local-coordinate and UV operations. Numerical billion-metre testing is not a billion-metre flight or full-world visual certification. Matched actual 1080p images at x=z=100000 m are in `v03-origin-before/after`. Live crossing of a rebase boundary remains a dedicated motion gate.

Cloud experiment J tried fixed 64 segments and two Gauss samples. The image reintroduced visible distant density slices; it was rejected. The retained version uses fixed 96 Balanced segments and four subsegments (higher quality uses its corresponding larger count). This cost remains visible in GPU measurements; no claim of meeting the historical 60 FPS target is made. Phases 5-7 are checkpoint `15d3de5`; earlier whitewater/visibility checkpoint `29d4d3f` remains separately reviewable.
