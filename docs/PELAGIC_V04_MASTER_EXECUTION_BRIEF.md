# PELAGIC 0.4 — Master R&D, Reconstruction, Execution and Acceptance Brief

**Status:** Authoritative 0.4 development specification; research-gated execution, not advance certification of proposed algorithms.  
**Project:** PELAGIC — naturalistic, real-time open-ocean simulation for desktop Chrome.  
**Development agent:** Astra, single accountable agent.  
**Prepared:** 20 October 2026.  
**Repository:** https://github.com/adievibecoder-sudo/PELAGIC  
**Work branch:** development/pelagic-0.4  
**Parent checkpoint:** development/pelagic-0.3 @ 87ce051ce43dd03b2967034ae2ca4d560a17f222  
**Published rendering baseline:** v0.3.0-dev.1 @ be3f5c47d923e90303dece20ed19dbfc4bb17636  
**Preservation baseline:** v0.2.0 / main @ 151aadaa6d2402c46f4e02454f2fc33ab7744661  
**Execution authority:** This document governs 0.4 goals, work discipline, research gates, deliverables and acceptance. Implementation choices remain evidence-dependent.

> **EXECUTION CONTROL — 0.4 ADDENDUM (20 October 2026):** This is the long-form **reference specification**, not a standing authorization to execute every phase. **Phase 0 only is currently authorized.** Read root `AGENTS.md` and the current `docs/V04-PHASE0-KICKOFF.md` for binding operational rules; `docs/V04-STATE.md` records verified progress. At the end of each phase Astra **MUST STOP, submit evidence for the human owner's visual/technical review, and wait for the owner's explicit approval before starting the next phase.** Astra cannot self-approve. An owner's approval to proceed never converts a FAIL/UNVERIFIED gate into PASS. Where the original master implies uninterrupted progression or reduced user checkpoints, **this addendum and AGENTS.md take precedence**. The approved phase may contain autonomous iteration and commits, but not work in a later phase. All previous scientific, visual, environmental, reliability and scope requirements remain intact.


---

## 0. Read-first mandate, intended result and non-negotiables

Astra: Read **this complete Markdown file, every section and appendix**, before beginning significant 0.4 source changes. Understand the user's intent rather than following isolated sentences mechanically. Reconcile it with the actual code, prior specifications and verified evidence. If an apparent instruction conflicts with physical truth, numerical evidence or another requirement, document the conflict and choose a justified resolution; never hide the conflict.

**Mission:** Deliver the largest, most consequential, most visually transformative upgrade in PELAGIC's history. The goal is not more shaders, higher algorithm counts, polished reports or impressive individual stills. The goal is a **living, physically credible, visually extraordinary, naturally evolving ocean and atmosphere**, convincing across viewpoints, scales, weather, wave regimes and times of day, with polished interaction and stable native WebGPU execution.

The user has repeatedly found the 0.1–0.3 visuals insufficiently realistic. The 0.3 acceptance record agrees: significant mathematical improvements and passing tests did **not** establish photographic or motion naturalism. The central 0.4 objective is to **convert Astra's engineering strengths into demonstrable visual results**.

This standard applies to **every major phenomenon and its interactions**, not only waves, foam, or clouds: water shape, ocean dynamics, fine and large-scale detail, breaking, froth, bubbles, spray, rain, weather, cloud morphology, atmospheric lighting, sun, moon, sky, reflections, colour, underwater visibility, waterline, environmental scale, time evolution, camera, presentation, stability, and user experience.

Non-negotiable engineering direction:

- Native **WebGPU only** in desktop Chrome; a custom renderer using JavaScript ES modules, raw WGSL, and GPU compute. **No WebGL fallback; no Three.js/Babylon.js migration** unless the user explicitly revises this project constraint.
- Preserve validated code and assets. Reconstruct a subsystem when the present representation fundamentally cannot reach the desired quality, but never rewrite or replace components merely for novelty.
- No unjustified cuts to realism or removal of difficult phenomena to meet a schedule, reduce tokens or improve benchmark numbers. Investigate difficult work. Report any genuinely irreducible limitations explicitly; an approximation is not exact physical simulation.
- No hallucinated tests, physics, citations, measurements, GPU results, completion percentages, or quality certifications. Clearly differentiate PASS, FAIL, UNVERIFIED, hypothesis, reference-derived target and engineering estimate.
- Do not import third-party rendering code or adopt additional GitHub repositories by default. Inspect a reference implementation only to resolve a specifically identified problem; justify licence, compatibility, maintenance and measured benefit before integration.
- No subagents. Astra remains the single accountable implementer and technical decision-maker; consult research materials and tools as needed.
- Keep the immutable 0.2 release, main, 0.3 development history, 0.3 release and its evidence **unchanged**. Work and commit only on development/pelagic-0.4 or temporary experiment branches derived from it if necessary; merge intentionally and safely.
- No false choice between physical realism and beauty: demand **scientific validity, numerical correctness, photographic/perceptual naturalism and visual craftsmanship** as separate, jointly required qualities.
- Spend reasoning, tests and tokens where uncertainty or consequence is highest. Maximum useful capability and care; zero tolerance for repetitive analysis, decorative complexity and unproven success claims.
- Do not assume this brief can certify every algorithm in advance. Several high-impact techniques must pass decisive experiments before full adoption.

**Order of operations:** Establish an honest baseline → settle high-risk hypotheses with evidence → execute subsystem upgrades in a defensible dependency order → integrate all systems → independently evaluate against physical and visual references → optimize while preserving appearance → publish only with truthful acceptance evidence.

## 1. Sources of truth and what to inspect

Start with a read-only **fresh audit of the completed 0.3 baseline**, in addition to the earlier research. Source files and reproducible results take precedence over summaries. All inherited problems must be tracked, including new defects discovered during 0.4.

Required project reading:
- docs/V03-BRIEF.md; docs/V03-STAGES.md; docs/V03-ACCEPTANCE.md; docs/V03-EVALUATION.md; docs/V03-PUBLICATION.md.
- Project architecture/history, settings, scripts, shaders, tests, benchmarking and evidence manifests; publication restoration/verifications; relevant issue/history changes.
- The published v0.3.0-dev.1 evidence archive and its representative full-resolution stills, comparison sheets, diagnostic maps, motion videos and timing reports. Record what was **actually inspected** versus what was only described.
- Prior Hark reports and the 0.4 research foundation, its 34-item recommendation ledger, 18 open questions, numerical experiments and independent GPT-5.5 correction review, **where supplied/accessibly available**. The latest research PDF may not be tracked in GitHub. If unavailable, request the precise supplemental artifact instead of claiming full reconciliation. This file includes all mandatory research caveats for the initial phase.
- Scientific primary sources (original papers, official specifications, observational data, production presentations) only as needed to resolve impactful open decisions. Check the source's regime and what was actually read. The bibliography is evidence, not a list of algorithms that must be implemented.

Project links:
- https://github.com/adievibecoder-sudo/PELAGIC/releases/tag/v0.3.0-dev.1
- https://github.com/adievibecoder-sudo/PELAGIC/blob/development/pelagic-0.3/docs/V03-ACCEPTANCE.md
- https://github.com/adievibecoder-sudo/PELAGIC/blob/development/pelagic-0.3/docs/V03-EVALUATION.md

Do not confuse publication completion with quality completion. Version 0.3 has finished its **development/publication cycle**; its published visual, observation and performance gates largely remain FAIL or UNVERIFIED.

Before changing code, create a concise verified **0.4 baseline inventory**: subsystem ownership, source dependencies, coordinate/units contract, known-good tests, GPU timings, media coverage, observed visual defects, uncertainties and regression risks. Map every 0.3 defect to an explicitly named 0.4 closure item. Do not erase an unresolved issue because its old implementation is replaced.

## 2. Inherited 0.3 defect register — mandatory closure coverage

The 0.3 acceptance register is the initial minimum, **not the total possible defect set**:

| 0.3 ID | Inherited obligation for 0.4 | Status at 0.3 checkpoint |
|---|---|---|
| W1 | Natural multi-scale wave structure; consistent geometry/short-wave shading; wave grouping, spatial organization, dynamics and observational calibration | Numerical coupling partly PASS; visual FAIL |
| W2 | Slope variance/covariance, energy/action consistency, unresolved frequency tails, spatial-modulation closure and filtering | Partial PASS; full closure UNVERIFIED; visual FAIL |
| L1 | Cloud-aware shared environmental radiance, below-horizon optical terms, physical units/colour calibration | Irradiance quadrature PASS; integrated transport UNVERIFIED; visual FAIL |
| L2 | Physically plausible Fresnel/glitter, local wave visibility, horizon and roughness behaviour without unacceptable GPU cost | Manufactured rays PASS; full optics UNVERIFIED; visual FAIL |
| B1 | Genuine breaking-event geometry, energy dissipation, turbulent/aerated whitewater, foam, bubbles, spindrift and spray interaction | Transport/coverage tests PASS; breaking naturalism FAIL |
| C1 | Meteorological cloud organization, morphology, lighting, motion, cost, and complete weather responsiveness | Specific sampling artifact fixed; visual FAIL |
| U1 | Dynamic multi-medium visibility, moving waterline, camera/height-probe timing and underwater light | Narrow tests PASS; moving crossing FAIL |
| G1 | Phase and coordinate correctness, large-world stability, full-scene atmospheric and long-flight precision | Wave-origin tests PASS; general scene UNVERIFIED |
| A1 | Sunrise, sunset, twilight, Moon, stars, night colour and proper exposure/photometry | Celestial geometry PASS; visual FAIL |
| T1 | Sustainable native GPU performance, frame pacing, unexplained stalls, GPU/CPU accounting, VRAM | Instrumentation PASS; practical performance FAIL |
| R1 | Cross-condition photographic realism, natural motion, polished integrated world, reference-based visual proof | Visual FAIL |

Initial 0.3 performance facts (RTX 3050 Laptop GPU, 1080p, from 0.3 reports; **not newly re-measured here**):
- Golden Balanced approximately 22.83 FPS; storm Balanced 32.24 FPS.
- Golden High approximately 9.85 FPS; storm High 18.59 FPS.
- Atmosphere/cloud and water-surface/reflection shading are expensive. The approximately 1 Hz frame-scheduling anomaly has no verified root cause.
- Reported 52 integrated 1080p stills, nine motion recordings and two 4K comparison pairs; the existence of recordings is not proof of natural motion.

Add independently identified failures in rain, weather transitions, climate/atmosphere coupling, lightning where appropriate, horizon composition, texture/detail distribution, controls, camera and colour, even where 0.3 has no named ID. Maintain status, reproduction conditions, cause/confidence, dependencies, chosen intervention, tests and actual closure evidence.

## 3. Scientific correction register — do not blindly copy previous research

The research foundation is strong but **hypothesis-bearing**. Preserve its valuable directions without hardcoding disputed claims:

1. **Wind-sea growth:** Investigate whether the local wind-driven component lies outside justified fetch/age ranges. The Pierson–Moskowitz asymptote is an empirical full-development benchmark, not a universal upper limit on mixed seas or remote swell. Carefully distinguish U10 from U19.5, significant height from peak parameters, and wind sea from swell. Do not implement a universal PM clamp or freeze spectral amplitude without verification.
2. **Wave groups:** A Gaussian linear sea **does produce interference groups**. The issue may be insufficient energetic-mode diversity, undesirable finite-domain repetition, inadequate group statistics and the absence of breaking-scale organized variability. Repeat the census using genuinely independent conjugate-paired Fourier degrees of freedom; seed stochastic experiments reproducibly.
3. **Choppiness:** Returning the coefficient to 1.0 is a **controlled candidate test**, not an immutable physical constant or substitute for a correctly calibrated displacement model.
4. **Bound harmonics:** Second-order crest/trough asymmetry is worth testing, especially because choppy horizontal displacement may not reproduce positive elevation skewness. Avoid double-counting: measure the actual displaced Eulerian surface and compare valid sea-state statistics.
5. **Breaking trigger:** The approximate u_surface/c_crest ≈ 0.85 criterion comes from specific wave-breaking studies and **requires matching definitions and applicability**. It is not a magic threshold to apply to the current surface or a substitute for resolved breaking physics.
6. **Coverage:** The fraction of cells eligible for a foam compression threshold is **not** directly equivalent to measured active or total whitecap coverage. Measure projected/physical areas, lifecycle populations, observation geometry, wind/age uncertainty and source-event statistics separately.
7. **Cloud opacity:** Maximum extinction coefficient alone does not determine optical thickness. Evaluate integrated tau = integral(sigma_ext ds), geometric paths, holes, density profile, shadow visibility and solar-disc integration. A visible sun through a largely cloudy sky does not alone prove the entire field is optically too thin.
8. **Cloud ambient feedback:** Reusing cloud-inclusive irradiance from the previous frame removes same-frame algebraic recursion but does **not** guarantee physical energy consistency or temporal stability. Test equilibrium, lag, fast coverage changes and angular/spatial accuracy.
9. **Colour:** A small spectral-vs-three-band calculation does not establish why the entire ocean looks grey or slate-like. Validate source optical coefficients, units, illuminant, XYZ/white-point conversion, working gamut, reflection/body separation and final-display transform. Try refitting simple coefficients where sufficient before creating a larger spectral LUT.
10. **Post-processing:** The extra pre-AgX highlight desaturation is source-confirmed; its removal must be judged in fixed-exposure A/B testing. A wide-gamut working space requires consistent transforms and suitable AgX matrices, not simply changing a texture format.
11. **Cloud and reflection performance:** GPU savings predicted from texture lookups, temporal reprojection, LOD and far-field masking are **unmeasured until profiled**. Visual equivalence and temporal ghosting must be checked.
12. **Scientific citations:** Verify precise definitions and scope for Curcic nonlinear short-wave modulation, Banner breaking probability/steepness, Horvath fetch-growth formulations, and any study that supplies numeric thresholds. Fractions describing physical contributions are not shader weights.
13. **Existing experiments:** Some research scripts depend on the repository and unbundled observational data, and a Monte Carlo used an unseeded RNG; rerun or correct a high-value test before relying on it. A spectrum-ratio sweep is not proof of spectral crossfade continuity.
14. **Temporal metrics:** Do not infer average FPS by simply summing median pass times. Distinguish physical simulation time, presentation time, per-pass GPU medians, mean frame intervals and decode timestamps.
15. **Evidence:** A few selected screenshots or video frames cannot certify an entire atmosphere, weather system or motion history.

When a research proposal is unverified, create the **smallest decisive experiment** and record the decision instead of repeatedly theorizing or silently implementing.

## 4. Whole-world physical coherence — the primary architectural pillar

**A weather preset must not merely recolour a fixed, procedurally stationary cloud field.** Build a shared, spatially and temporally coherent environmental state from which all affected systems derive behaviour.

Physical/state dimensions should include, where justified by fidelity: geophysical time and Sun/Moon geometry; mean wind and direction; gust/turbulence structure; air humidity, temperature/stability proxies and aerosol; mesoscale cloud coverage, type and vertical structure; precipitation/rain shafts; local wind-sea development and swell history; sea-surface roughness, foam, spray and breaking activity; horizon visibility and downwelling radiance.

Choose an efficient representation with bounded error (for example low-resolution advected fields, weather maps, temporal state and event buffers), not an unnecessarily elaborate meteorological general-circulation model. Weather fields may be approximate, but **they must agree across clouds, ocean, rain, illumination, fog, foam, spray and controls**.

**Separate time of day from weather type.** A clear morning, rainy morning, clear sunset, stormy sunset, overcast afternoon, broken-cloud night and moonlit squall must all be legitimate combinations, not six disconnected images.

Two user-facing transition types may be appropriate:
- **Natural evolution:** physically plausible evolution from the current state, retaining cloud/weather/wave history and respecting different response times.
- **Direct preset jump:** an explicit scene-state switch for exploration or benchmarking, resetting/initializing dependent state consistently. Do not misrepresent instant jumps as physically evolving storms.

A change to wind should influence capillary and short gravity waves much earlier than old swell. Clouds should not instantly reorganize through uniform scaling. Precipitation must originate in appropriate cloud structures and evolve with weather. Storm darkness should arise from illumination, optical thickness and visibility, not a global grey tint. Correlated cross-system response and continuity are required.

All consumers must document spatial coordinates, units, phase/history, interpolation and latencies. A single shared state is a *consistency contract*, not permission to share physically inappropriate variables.

## 5. Cloud, sky and atmospheric reconstruction — flagship of 0.4

The user identifies clouds and changing weather as an especially visible, persistent failure. Treat their reconstruction as an **early central workstream**, alongside shared environmental state and lighting.

### 5.1 Meteorological cloud structure

Study and implement (where required by the scene) plausible marine fair-weather cumulus, trade-wind clusters, stratocumulus/open or closed cells, cloud streets, stratus/nimbostratus, marine haze and convective cumulonimbus. Cloud families must have appropriate distributions of size, altitude, depth, coverage, shapes, edges, bases, tops, shadows and directional organization. Avoid a repeated lattice of smooth ellipsoids merely dressed in noise.

Reference WMO International Cloud Atlas, satellite imagery, real ocean footage and meteorological studies with provenance. Cloud generation should respond to physically meaningful stability, moisture, convection, shear, advection, precipitation and environmental history in a tractable reduced model. Do not imply that a graphics approximation is a full cloud microphysics solver.

Required visual properties:
- Multi-scale silhouettes with irregular but structured billows and nonrepeating high-frequency edges.
- Credible layering, cloud streets/cells/banks, distant recession, gaps and weather fronts; no periodic obvious cells or identical puffs.
- Convincing cloud bases and tops, self-shadowing, forward-scattering bright edges, multiple-scattering character, warm/red low-sun illumination and dark rainy undersides as dictated by actual radiance.
- Real formation, growth, merger, shearing, advection, precipitation and dissipation over coherent time—not merely animated noise coordinates.
- Robust camera motion, temporal antialiasing/accumulation, horizon integration, 360° environmental coverage and consistent reflection on the sea.
- Correct overcast shadows and partial skylight: do not force uniformly black clouds or assume every dark cloud is thunderstorm-producing.
- Spatially related cloud-shadow fields and diffuse irradiance, with angular variation where materially visible.

### 5.2 Cloud rendering architecture

Research-gate alternatives: weather-map-driven 2.5D/3D density, physically credible vertical profiles, morphological erosion, sparse volumes/voxel or SDF methods if near-camera fly-through demands them, empty-space traversal, shadow-volume reuse, robust analytic integration and carefully validated multiscattering approximations. Prefer the least complex representation that actually achieves the reference-quality result.

Test cloud optical depth by **actual ray integration**, not a maximum scalar coefficient. Evaluate density and silhouettes independently from lighting. Profile new cloud computation on real native WebGPU. Temporal reprojection is conditional on proving no visible horizon ghosting, disocclusion trails, boiling, smearing or lag during fast yaw and evolving cloud fronts. Do not accept a cheap but still-ugly cloud system.

### 5.3 Sun, horizon and time-of-day atmosphere

Unify atmospheric scattering/transmittance, cloud-aware direct and diffuse illumination, solar-disc visibility, marine aerosols and distant aerial perspective. Morning, bright midday, afternoon, golden hour, sunset, civil/nautical twilight and night must have physically credible colour, contrast, radiance and environmental response. Sunset should not be an orange filter. Low sun must illuminate cloud edges, undersides, ocean, foam, rain and haze consistently; reflections use the same sky radiance. Maintain natural astronomical motion and exposure transitions.

### 5.4 Precipitation and storm weather

Rain must be a **cloud-associated process**, not random camera-local streaks. Research plausible spatial rain rate, cloud-base linkage, rain-shaft shapes, vertical transport, near-camera droplet trajectories, splash/impact ripples, surface disturbance, mist, rain streak visibility, depth cues and absorption/scattering. Partition storm layers by purpose: resolved nearby drops, mid-distance sheets, volumetric rain shafts, boundary-layer fog and wind-blown sea aerosol. Avoid particle-density tricks that look detached from weather or sea.

**Lightning** is required for meteorologically appropriate electrically active thunderstorms, but is **not** obligatory for all ocean windstorms or stratiform rain. Research storm-cell organization and lightning event timing/branching, spatial source, transient cloud-volume illumination, rain/haze lighting, sea reflection/glitter and exposure response. Avoid arbitrary white zigzags, unrealistic frequency, synchronized uniform screen flashes, and inconsistent thunder cues. If thunder audio is included, it should be optional, spatially/time consistent and accessible, not a prerequisite for visual acceptance.

Define distinctly: clear weather, overcast, squall/rainstorm, nonconvective gale and convective thunderstorm. Each requires physically distinct cloud/rain/lightning/wind behaviour rather than only colour or particle-count changes.

### 5.5 Atmosphere and aerial perspective

Assess a physically credible camera/frustum aerial-perspective representation (froxels or another validated solution) for humidity, marine aerosol, rain, spray haze, cloud shadows and sunlight. Preserve correct near/far extinction, in-scatter and transmittance. An ocean storm should acquire appropriate atmospheric depth and visibility while retaining actual geometry and wave definition. Measure cost and avoid double-applying fog.

## 6. Water dynamics, waves and surface geometry

Maintain the validated six-cascade FFT/phasor system unless a specific comparison justifies a partial replacement. Investigate and correct:
- Spectrum/fetch/wind-age applicability; distinguish wind-generated sea from separately prescribed remote swell.
- Directional spreading, peak frequency, spectral realization, discrete mode concentration, 1,103 m-domain recurrence and long-range statistics.
- True realized wave groups, sets, crossing seas, steepness/skewness, phase relationships, crests/troughs, calm ripples and energetic storms.
- Scale-dependent capillary/gravity-wave behaviour, gust response, wind shelter, long-short interaction, current response, short-wave action/moment accounting, wind slicks, convergence and breaking scars.
- Appropriate nonlinearity/bound harmonics where measured crest asymmetry requires them; avoid blindly stacking choppy and nonlinear corrections.
- Consistent geometry, displaced normals, derivatives, BRDF slopes, foam, spray, waterline and camera height queries across every LOD.
- Stable natural surface organization at centimetres, metres, hundreds of metres, kilometres and horizon viewpoints; no periodic/pasted-looking distant water or blanket crumpled-foil texture.
- Actual temporal speeds, group-velocity behaviour, random realization statistics and natural variation in time.

First compare targeted alternatives: split/rotated spectral patches with correct tensor transforms; more concentrated energetic modes; continuous non-grid peak/swell modes; bound harmonics; physically meaningful spatial short-wave amplitude fields. **Do not** raise all cascade resolutions or add numerous waves simply by assumption.

Proof before committing to a new representation: wave autocorrelation across multi-kilometre areas; independent-mode census; group-envelope and skewness statistics; multi-seed height/slope distributions; before/after grey-shaded and fully lit views at low/medium/high altitudes; motion with known weather, exposure and camera. Document spectral energy partition without double counting.

## 7. Breaking, whitewater, bubbles, foam and spray — a connected causal chain

The existing deformation/strain-driven foam source does **not** represent a fully realized breaking process. A major 0.4 target is a common, physically defensible **breaking-event representation**.

Research and experimentally validate the chain:
1. Spectrally consistent wave focusing, crest kinematics, instability and onset conditions.
2. Event localization, tracking, crest propagation and a stable lifecycle; correctly bounded rates.
3. Physically credible geometric steepening, overturning/spilling sheets, active rollers and collapsing water where needed. A single-valued height field cannot itself form an overhang; combine existing surface with local event geometry or another justified method.
4. Transfer of event strength and energy budget to entrained air, active whitewater, foam source, turbulence and spray.
5. Advection/deformation of foam with the moving ocean; evolving surface coverage, age, thickness, lace, streaks, breakup and physically motivated dissipation.
6. Bubble plumes, froth, foam optical properties and scattering near/under the surface.
7. Spume and droplets emitted from relevant crest fronts with realistic initial velocity, wind transport, flight dynamics, breakup, contact with the **moving** surface, fade and spray-haze contribution.
8. Realistic interaction with sun/cloud illumination, reflection, marine mist, rain and near-water camera views.

Keep proven 0.3 foam advection, moment/coverage techniques and the current particle calculations where genuinely useful. Replace inadequate onset and appearance models based on experiments—not an ungrounded complete rewrite.

Do not treat an empirical u/c threshold as the sole event generator or use a thresholded noise texture as proof of breaking. Validate 3D crest geometry, occurrence statistics, energy budget, inter-system consistency, close/distant optical appearance, video motion and storm variation. Target *natural, transient, irregular* breaking—not grey decals, uniform films or disconnected sprite explosions.

Investigate hybrid explicit rollers/ribbons, offline physically simulated breaker exemplars or localized higher-fidelity simulations only when a smaller proof shows a defensible advantage. Check integration, seams, popping, licences and GPU costs.

## 8. Physically and photographically convincing water optics

The water must not look like uniform metallic plastic, grey slate, artificial blue paint or a static mirror.

Audit and develop:
- Correct surface Fresnel response across angles, finite-size Sun/Moon glitter, roughness slope statistics, masking/shadowing, neighbouring-wave occlusion, reflection of the same cloud/sky field and horizon gradients.
- Correct local and far-field visibility; avoid expensive full traversal when a validated statistical representation produces the same appearance, but do not substitute implausible far reflection.
- Proper separation and energy consistency of surface reflection, refraction/transmission, body in-scatter, water-leaving radiance and foam/bubble contributions.
- Scientifically justified wavelength-dependent seawater absorption, molecular/particulate scattering, turbidity/CDOM/biological influence when relevant, directional optical effects and attenuated light underwater.
- Spatially varying wave roughness, non-Gaussian facets where needed, realistic cloud-shadow and weather influence on visible water colour.
- Crest translucency grounded in path length and bubbles instead of arbitrary glow.
- Stable surface detail/mipmap filtering, anti-aliasing of intense sun glitter and correct depth/altitude behaviour.
- Sun/moon/low light, golden hour, heavy overcast, storm, rain haze and underwater views, all under one coherent radiometric ledger.

A small spectral precomputed LUT may help water/atmosphere colour if validated against a properly converted observational reference. **Do not assume full-frame spectral rendering is necessary.** First test whether corrected three-channel optical coefficients, coherent lighting and exposure already solve a substantial portion of the observed failure.

Preserve physically sound slope moments and compute-cascade contracts. Measure the visual gain and pass time of expensive visibility features. Don't let abstract correctness hide visibly defective reflections.

## 9. Astronomical lighting, exposure, grading and image formation

Correct the complete radiance-to-screen pipeline:
- Sun/Moon positions, lunar phase/shading, sky/night luminance, star field where relevant, twilight transport, continuous diurnal change and correct cloud/ocean response.
- Carefully documented physical photometric/radiometric scaling or coherent relative calibration. Do not invent absolute units for an uncalibrated shader.
- Scene-dependent, physically and photographically sensible auto exposure, bounded temporal adaptation, manual exposure-compensation and clear choice of eye-like versus camera-like night appearance.
- Correct white balance, colour matching, gamut, scene-linear space, output encoding, AgX-family transforms and highlight roll-off. If changing working primaries, consistently transform the entire pipeline including input values and tone-mapper matrices.
- Test existing pre-AgX highlight desaturation with a fixed-exposure on/off comparison and decide based on source highlights, not taste alone. Distinguish bloom as lens glare from energy in reflected light.
- Natural sunset reds, bright blue midday, soft diffuse overcast, deep twilight and delicate moonlit water, without preset-specific arbitrary tint corrections that disagree with physical transport.
- Optional HDR output on verified Chrome/Windows/display configurations; graceful SDR correctness. HDR support is not proof of correct colour.
- Diagnostic false-colour linear radiance, sky/sea region luminance, display transform bypass and probe-based comparisons.

Every major look must remain convincing during camera and weather motion. A beautiful still with incorrect dynamics is not success.

## 10. Waterline, underwater, camera and large-world stability

Research and fix dynamic crossings: asynchronously read-back camera-height lag, trajectory/physics consistency, near-plane classification resolution, displaced geometry, coarse/morphed LOD mismatch, folds and multi-hit behaviour. Use a validated synchronous/predicted or GPU-resident height strategy when necessary. Do not conceal topology errors with unphysical blur; physically motivated camera lens-water film/droplets are an independent optional effect.

Build coherent water/air medium transitions, refraction, total internal reflection, submerged radiance, depth-dependent spectral attenuation, cloud-inclusive underwater illumination, caustic effects if justified, bubble/spray interaction and appropriate underwater contrast/colour. Prove slow and fast motion, steep waves, mixed immersion and discontinuity-free camera paths.

Preserve accurate origin rebasing, f64 modulo preparation, phase stability and GPU coordinate coherence; extend precision discipline across clouds, weather maps, rain, reflections, lights and underwater. Test long-duration clocks, extended camera travel, rebases, different FOVs, altitudes and world positions.

Camera motion must be stable and controllable, including near-surface inspection, long-distance views, overhead structure, immersion and weather exploration. The camera system should showcase reality, not mask mistakes.

## 11. Full website and interaction quality

PELAGIC 0.4 upgrades the **whole browser experience**, not only numerical shaders:
- Native-WebGPU capability detection with an explicit **hard stop and meaningful diagnostic** if unavailable; never silently launch WebGL or an inferior rendering backend.
- Polished, understandable desktop Chrome interface, readable controls, robust input handling, camera navigation, realistic time/weather presets, coherent manual physical parameters, safe state transitions and reset.
- Quality presets with documented visual differences; avoid defective default settings or parameter combinations that create physically contradictory conditions without warning.
- Efficient loading/progress, reliable resize, error and device-loss handling, sensible resource lifecycle, no broken textures or missing runtime assets, deterministic replay/seed controls, reproducible screenshot/video/benchmark pathways.
- Responsive interaction, correct pause/time-scale behaviour, proper exposure/visual transition while changing settings, and no camera stutter or event artifacts.
- High-quality coherent presentation, restrained visual design, useful info/diagnostic overlays and appropriate accessibility; no unnecessary UI redesign or framework migration.
- Test normal browsing, sustained operation, preset cycling, hot parameter changes and recovery from errors; do not hide runtime warnings.

## 12. Performance, memory, numerical stability and quality-preserving optimization

Optimization begins in Stage 0 and continues through all phases. PELAGIC must look dramatically better **and** run more efficiently and predictably than the 0.3 measured baseline.

Measure first:
- Per-pass GPU times and overall display-paced frame intervals, median/p95/p99/stalls across representative conditions/resolutions.
- VRAM allocations and peak residency, texture/cascade/clipmap sizes, bandwidth, shader invocation/overdraw and CPU scheduling.
- Cold/warm start, shader compilation, device loss, interactive weather changes, long motion and capture overhead.
- Visibility/minimization/power/thermal/compositor state; do not confuse GPU pass time, serialized capture duration and FPS.
- User's RTX 3050 4 GB laptop is an important **real-hardware test system**, not a pretext to reduce the artistic goal or an assertion of a universal ceiling. VM/no-GPU reports must be marked UNVERIFIED for hardware-only gates. Do not invent performance projections or mark hardware gates PASS based on SwiftShader or desktop screenshots alone.

Target responsive 1080p runtime, with the earlier nominal ~60 FPS Balanced / ~30 FPS High intentions retained as **targets to measure**, not promised outcomes or permission to degrade critical phenomena. Evaluate visually excellent Ultra/Cinematic capture separately from continuously interactive presets; document the exact cost/quality relationship.

Investigate, based on profiling:
- Cloud density representation, weather-map lookups, empty-space skipping, volumetric shadows, optional history reconstruction; reject horizon ghosting and lag.
- Projected ocean geometry/CDLOD over-shading at grazing angles, fragment count and reflection tracing; test before rebuilding LOD.
- Cross-pass lighting/environment updates, reflection caching, temporal reuse only with validated error, water/foam/shader bandwidth, compute scheduling and memory locality.
- GPU format and shader-f16 precision tradeoffs, workload-dependent quality and visibility.
- Efficient batching, selective computations, robust resource reuse, avoiding CPU/GPU readback stalls and redundant recalculation.

**Never solve a performance problem simply by deleting the feature responsible for realism.** Find a better representation or optimize computation. If the measured target is unachievable under current constraints, report what is actually attained and what further work is needed. Do not claim the scene has met its target when it has not.

## 13. Astra's improved scientific and visual development method

This is a required process change, because 0.3's correctness success failed to produce the intended images.

**Before every meaningful rendering change, write a short visual hypothesis:**
1. **Observation:** What exactly looks or moves wrong, under which controlled camera/environment/reference?
2. **Suspected layer/root cause:** Shape/scale, physics, motion, optical material, light, atmosphere, colour, temporal filtering, camera or integration.
3. **Smallest discriminating experiment:** What isolation view, measurement or A/B would prove/disprove the hypothesis?
4. **Expected visible result and risks:** What must change in the real image/motion if correct, and what might regress?

Work from **reference → diagnose → isolated representation/model → code → numerical/physical tests → matched images and motion → integrated assessment → accept/revise/revert**.

Visual methods:
- Research and maintain a provenance-labelled real-world reference board by condition, altitude, light and sea state. Use WMO Cloud Atlas, ocean science/observations, known camera metadata, and credible professional visual examples. When metadata are unknown, compare only well-defined invariant properties.
- Use grey-lit geometry and height/normal debug views to judge waves/breaking before colour grading; morphology-only clouds before lighting; separate reflectance, water body, foam, cloud shadow, in-scatter and tone-mapping views.
- Compare fixed camera, seed, simulation history, weather, astronomical time, output size and exposure. For evolving systems, capture timed continuous clips long enough to establish formation, advection, dissipation and realistic causal delay.
- Realism and beauty require both quantitative comparisons and independent critical viewing. Organize blind paired preference review where feasible, avoid overstated statistical confidence and avoid declaring indistinguishability without a properly designed study.
- Evaluate multiple views and conditions; hero shots cannot substitute for calm, storms, cloudy nights or changing weather.
- Commit and preserve the previous known-good implementation until superiority is established; reversible prototypes and feature switches are encouraged for uncertain hypotheses, but remove dead experimental branches after safe decisions.

**When a correct formula still renders incorrectly, investigate representation, missing interaction, sampling, calibration or data—not just arbitrary shader constants.**

Run the smallest relevant test after a focused change. Run cross-system checks after foundation edits and the complete matrix at milestones. Do not spend tokens reading all unrelated files or re-deriving settled facts every iteration. Preserve a concise evolving verified findings/decision log. Focus effort on the next consequential uncertainty.

Astra may exercise mature engineering judgment and choose an alternative to a proposed algorithm **if it is evidence-backed and explicitly recorded**. This brief controls the outcome and proof standard, not an untested prescribed code recipe.

## 14. Four independent acceptance gates and evidence

Every major subsystem and phase must be evaluated against four separately reported gates:
1. **Scientific/physical validity:** Correct applicability, conservation/statistical constraints, empirical calibration and stated approximations.
2. **Computational correctness and stability:** WGSL/CPU numerical validation, GPU readback, coordinate contracts, deterministic behaviour and regression tests.
3. **Visual/temporal realism:** Physically recognizable morphology, natural motion, correct environment response, convincing interaction, matched references across views and time.
4. **Craftsmanship and experience:** Beautiful coherent composition, lighting, colour, detail, polish, interactive quality and professional visual critique.

Performance and reliability are separately mandatory cross-cutting gates. Passing a test suite does **not** automatically close a visual FAIL. Attractive stills do **not** excuse physically impossible events. An incomplete or inaccessible proof remains UNVERIFIED.

Required representative acceptance matrix (expand where defects demand it):
- Clear calm morning; clear midday; broken-cloud afternoon; near-overcast midday.
- Clear and overcast sunset/golden hour; blue twilight; clear moonlit night; cloudy moonlit/rainy night.
- Moderate wind sea, swell-dominated sea, crossing seas, strong gale, approaching squall, stratiform rainstorm and convective lightning storm.
- Low/surface, 2 m, 5 m, 50 m, 500 m and distant horizon views where applicable; down-Sun, across-Sun, backlit/cloud-shadow and storm-front directions.
- Static and moving cameras, extended flight/rebase, skim and full underwater crossing, repeated weather-preset changes, natural evolution, pause/resume, long-running GPU stability.
- All significant cloud types, real formation and dissipation, sun/moon occlusion, precipitation fronts, correct water reflectance and visibility response.
- Close foam/spray and far whitecap statistics, wave-group dynamics, texture/repetition artifacts and storm breaking geometry.
- Native desktop Chrome on real RTX 3050 hardware when reachable, with other hardware optionally tested.

**Do not render the entire matrix after every tiny fix.** Use focused comparisons plus an unaffected control, broaden after subsystem changes, run the full matrix at milestones and final acceptance. Avoid sacrificing thoroughness by collecting irrelevant repetitive evidence.

## 15. Development phases — research gates, outcomes and dependencies

**Phases 1–9 below are the provisional programme; they are NOT authorized by the present kickoff.** Owner approval is required before each phase. Phases describe **acceptance deliverables**, not a mandate to write every listed system in a fixed implementation. If dependencies require reordering, explain why. Optimization, testing, and visual look development apply continuously.

### Phase 0 — verified baseline, research reconciliation and decisive experiments

- Confirm 0.3 source, release evidence, tests, performance and actual accessible research materials. Build the inheritance/defect and candidate-decision registers.
- Establish real reference boards, condition-sweep harness, neutral lookdev views, reliable timing/VRAM instrumentation, artifact templates and expected scientific error budgets.
- Recheck the disputed wave-sea/PM relation, Fourier independent-mode census, crest/skewness assumptions, breaking thresholds, optical depth, colour pipeline and storm scene logic.
- Run the **smallest decisive proofs** before irrevocable architecture decisions: mode density/group variability; spatial gust short-wave response; breaking onset/roller prototype; cloud weather-map morphology/opacity/cost; grazing-angle overdraw and reflection cost; waterline lag; highlight desaturation/exposure; cloud-light feedback.
- Prioritize experiments by expected decision value and uncertainty, not by easy report generation.
- **Gate:** Signed-off plan for chosen representations, a clear uncertainty register and evidence-backed phase sequencing. Do not imply unrun GPU tests passed.

### Phase 1 — coherent environment state, astronomical/radiometric contracts

- Establish the shared spatial/temporal weather and illumination contracts, phase/history model, coherent presets and physical transition state.
- Repair key confounds in exposure/light flow and identify consistent colour/working-space choices through controlled experiments.
- Baseline full weather × time-of-day response and explicit clouds/rain/surface dependencies.
- **Gate:** Deterministic cross-system tests and visible coherent control response without discontinuities or invalid meteorology.

### Phase 2 — natural cloud/sky reconstruction and high-quality atmospheric lighting

- Reconstruct cloud formation/morphology and spatial weather organization with meteorological reference.
- Replace artificial lattice appearance; support cloud types, fronts, structure, volume lighting, self-shadowing and smooth evolution.
- Coherent Sun/Moon/sky/ocean illumination and cloud-dependent fog/environment, with tested stability of any feedback or temporal method.
- Profile GPU throughout.
- **Gate:** Realistic cloud silhouettes, diversity, lighting and motion in clear, broken, overcast, golden, twilight, rainy and storm settings; credible performance evidence and no procedural repetition/ghosting.

### Phase 3 — weather response, rain, storms, lightning and atmospheric integration

- Integrate gust evolution, sea-state forcing, rain shafts, near-field drops/impacts, aerosol/spindrift haze and marine visibility.
- Create physically distinct squall, stratiform gale/rainstorm and convective lightning scenarios, with appropriate cloud/wind/lightning timing.
- Complete coherent atmosphere-to-water reflections and storm darkening, verifying weather changes really alter the cloud systems.
- **Gate:** Multi-minute natural evolution and shorter explicit preset-jump tests show coupled cloud, rain, wind, waves and illumination without fake particles/flashes or static clouds.

### Phase 4 — natural ocean structure and verified wave-model advancements

- Correct valid spectral concerns, mode diversity, grouping, long-range periodicity, crest/trough statistics, gust/slick/scar response and covariances using Phase 0 decisions.
- Preserve the good FFT/precision core; build nonlinear/patch representations only where proven necessary.
- **Gate:** Neutral geometry, wave statistics, multi-seed, multi-altitude and time-evolution checks all improve, without artificial fine-surface uniformity or physical/numerical regression.

### Phase 5 — physically connected breaking, foam, aeration and spray

- Deliver breaking-event representation, actual crest/roller structure, energy-related source, realistic foam lifecycle, bubble systems, spray motion and atmospheric connection.
- Reuse validated transport and sampling; reconstruct inadequate visual source and geometry.
- **Gate:** Physically and visually convincing storm and wind-sea breakers, independent active/aged whitecap measurements, coherent spray emission and natural motion under changing sea state.

### Phase 6 — water optics, reflections and full photographic rendering

- Calibrate reflected sky/cloud radiance, water-body optics, roughness, glints, long-range wave visibility, golden/sunset, overcast and twilight appearance.
- Repair exposure, white balance, colour space, tone mapping, glare and Moon/night presentation as needed by evidence. Validate consistent cloud/wave/foam appearance in water reflections.
- **Gate:** Full-scene day/night and weather sweep looks credible and beautiful, with physically grounded optics, no metallic/grey water artifact, and controlled photographic comparisons.

### Phase 7 — immersion, underwater environment, precision and temporal continuity

- Resolve fast moving waterline, medium-interface classification, camera probe/trajectory timing, underwater transport, bubbles, caustic/light where justified.
- Extended travel, rebasing, camera and weather state transitions, temporal aliasing/popping and long-running correctness.
- **Gate:** Stable air/water crossings and realistic underwater/near-surface scenes under every relevant environment; no unresolved high-severity temporal or coordinate defect.

### Phase 8 — application polish, quality-preserving performance and integration

- Thorough whole-site UX and camera refinement; resource/device resilience; consistent controls/quality presets and diagnostics.
- Systematically optimize measured bottlenecks while preserving substantive appearance and motion; update budgets after changes.
- Run sustained native WebGPU tests, cross-condition performance/VRAM, long-term stability and regression checks.
- **Gate:** Polished usable site, improved measured runtime and no quality regression obscured by preset downgrades.

### Phase 9 — final independent acceptance, correction and publication

- Restore/test fresh checkout; complete reference-matched condition matrix, full-resolution images, representative continuous motion, diagnostics, unit/CPU/GPU results, performance and traceability matrix.
- Review all inherited W1–R1 defects plus discovered issues. Every item must be PASS with meaningful evidence, or explicitly FAIL/UNVERIFIED with reason and consequences; no unearned claim of total success.
- Correct substantial failed gates before recommending release. If final goals remain unmet, report the actual unfinished state and do not advertise an achieved AAA/VFX certification.
- Preserve published 0.2/0.3 archives and complete 0.4 revision/reproduction integrity; publish only after the user's release decision and appropriately passing gates.

## 16. Phase reports, visual proof and repository hygiene

**Every meaningful completed phase** must deliver:
1. Concise progress summary, work completed, real architectural and mathematical decisions, relevant source files/commits, and reasons.
2. Research/citation evidence, assumptions, known validity ranges, alternative options rejected, and outstanding uncertainty.
3. Unit/CPU numerical validation, GPU test results where hardware is available, regression logs, source/version identification, test commands and failures.
4. **Full-resolution screenshots** for every changed relevant condition, camera and diagnostic; matched before/after pairs with identical reproducible state; appropriately sampled continuous **WebM/video recordings** for morphology/motion and transitions. Capture original files, not only contact sheets.
5. Real-world reference comparisons or explicitly bounded visual assessment, honest flaws, reviewer observations and actual PASS/FAIL/UNVERIFIED verdicts.
6. Performance and VRAM change accounting, stable frame pacing and unexplained stalls; differentiate VM from verified hardware.
7. Open inherited defects, newly discovered defects, dependencies and next-phase risks, including material limitations.
8. A source/evidence handoff artifact: separately accessible easy-to-review report/media plus a self-contained/reconstructible evidence package with manifests and checksums when appropriate.

**Do not generate enormous redundant reports for trivial iterations**; a short visual-lab note and targeted evidence are adequate until the formal phase gate. Every formal phase must still have the comprehensive handoff above.

Source/version/reproduction rules:
- Work only on development/pelagic-0.4. Keep commits small, meaningful and reviewable; avoid touching frozen refs.
- Preserve old verified algorithms behind temporary toggles while conducting measured replacements; remove obsolete experiments after acceptance and retain benchmark reproducibility.
- Record render condition, complete parameter state, seed, simulation start/history, time, camera pose/FOV, weather phase, quality mode, resolution, exposure, browser/GPU, commit SHA and timestamp for comparisons.
- Document exact missing/unavailable assets and tests; no invented video or screenshot evidence.
- Do not silently remove difficult 0.3 cases, suppress tests, omit failure reports, or optimize by taking away required phenomena.

## 17. Decision authority, checkpoint discipline and efficiency

Astra should use high reasoning effort intelligently: deep analysis for uncertain physical/rendering decisions, quick execution for routine code changes. Do not repeatedly consume the entire research archive for a focused edit. Use a verified summary with exact file/source pointers. Avoid pointless parallel workflows, unnecessary third-party installations, repeated broad web searches and premature document rewriting.

At each phase:
- Establish the required outcome and dependency map.
- Select the smallest decisive experiments for unresolved choices.
- Make code changes only after a justified hypothesis.
- Run tests relevant to the change; follow with appropriate cross-system/visual evidence.
- Assess visual benefit **before** allocating substantial effort to polish or extending the same technique.
- If the new representation fails, investigate, revise or revert instead of hiding its flaw with arbitrary tuning.
- Update the ongoing defect/decision register and concise phase handoff.

If a source report conflicts with observed implementation, prefer evidence and flag the disagreement. If a user requirement can only be approximated, explain why, select the strongest justified route and document what remains unachieved—never covertly substitute a lesser goal.

No arbitrary stopping once a hard problem is found; conversely, no endless research when a focused experiment or adequate known answer resolves it.

## 18. Immediate Astra entry instructions

Upon receiving the 0.4 kickoff:
1. Read **this complete file** in its entirety; inspect the relevant existing source and the 0.3 acceptance/evaluation documents. Demonstrate comprehension in a **concise** initial summary rather than restating the brief.
2. Verify the active Git branch is development/pelagic-0.4 and that main, v0.2.0, and the published 0.3 checkpoints will remain untouched.
3. Begin **Phase 0** with the complete W1–R1 inheritance ledger, the critical research corrections, a precise visual-quality/reference plan and actual technical bottlenecks. Retrieve previously delivered Hark research PDFs from the user if necessary rather than pretending they are in the repository.
4. Prioritize decisive experiments for **cloud/weather realism and coherence**, wave structure, breaking-event representation, water optics, under/over-water continuity and GPU performance. Select appropriate test environments and record unavailable hardware verification.
5. Produce the Phase 0 acceptance/evidence package, **STOP and request explicit owner approval**. Proceed into Phase 1 only after an explicit owner go-ahead for that named phase, even if numerical tests are green. For each following phase, repeat this stop-and-review protocol. Iterate autonomously **inside the currently authorized phase** and do not get trapped in endless planning. **Formal transitions between phases always require human approval.** Ask for input when a consequential scientific/visual choice or unavailable hardware evidence genuinely requires it; do not ask for redundant approval for routine work inside an approved phase.
6. Throughout 0.4, pursue the **largest justified improvement in the actual rendered and interactive world**, with no fake visual acceptance, no unproven algorithm lock-in and no avoidable token or engineering waste.

### Final instruction to Astra

**PELAGIC 0.4 must be visibly transformative, not merely technically more complicated.**

Develop the entire integrated ocean-and-atmosphere world with exceptional care for physically grounded naturalism, beautiful cloud and ocean morphology, believable weather and day/night lighting, credible breaking and spray, precise water optics, convincing motion, strong performance, robustness and interaction.

The research determines the mechanisms. The images and motion demonstrate their perceptual success. The mathematical and GPU tests establish computational correctness. All of these are essential.

Preserve what works; rigorously fix what fails; reconstruct only what cannot reach the target; research difficult phenomena instead of skipping them; use your best reasoning and visual judgment efficiently; and report the truth even when a milestone does not pass.

**The finished living ocean is the product. Everything else must serve that outcome.**
