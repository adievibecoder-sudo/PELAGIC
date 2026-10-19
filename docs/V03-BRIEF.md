# PELAGIC 0.3 — Research, Architecture and Development Specification

**Status:** Development authorization and technical research brief  
**Date:** 20 October 2026  
**Project:** PELAGIC — Real-Time Naturalistic Open-Ocean Simulation  
**Repository:** https://github.com/adievibecoder-sudo/PELAGIC  
**Target:** Desktop Chrome, native WebGPU, JavaScript ES Modules, WGSL, custom compute shaders and a custom renderer  
**Foundation:** Preserve PELAGIC 0.2 and its verified numerical infrastructure  
**Primary objective:** A major, demonstrable advance toward AAA/VFX-grade ocean naturalism and photorealism

---

## 1. Mission

PELAGIC is an ambitious, fully custom, real-time open-ocean simulation.

Its objective is not simply to render animated water. It must convincingly reproduce the visual appearance, movement, environmental interactions, optical behaviour and atmospheric character of the real ocean across different scales, viewpoints, times of day and sea states.

The visual benchmark is real-world ocean cinematography, high-end game rendering, Unreal Engine-quality environmental craftsmanship and professional visual-effects work.

This is a demanding quality objective, not a certification that can be achieved by implementing a particular collection of algorithms.

PELAGIC 0.3 must produce a substantial, visible improvement over 0.2 in the actual rendered ocean. The new version must be evaluated through numerical verification, controlled imagery, continuous motion, real-world references and genuine GPU execution.

Preserve everything that is demonstrably correct and valuable. Substantially modify or replace individual subsystems when their limitations prevent the desired quality. Avoid an unnecessary whole-project restart.

Do not confuse sophisticated code with convincing visual results.

## 2. Mandatory first operation: publish PELAGIC 0.2 to GitHub

Before beginning 0.3 implementation, publish the **complete existing PELAGIC 0.2 project** to:

https://github.com/adievibecoder-sudo/PELAGIC

The repository has been identified as public and was empty during the initial access check. Recheck its actual state immediately before making changes.

Verify Git authentication, remote identity and write permissions. Do not assume that access through another AI service proves Astra has permission to push.

### Publication requirements

1. Locate the authoritative final PELAGIC 0.2 working project and confirm its rendering checkpoint, source history, release manifests and evidence records.
2. Inventory the complete project before uploading anything. Include JavaScript modules, WGSL shaders, HTML/CSS, server and launcher files, configuration, tests, numerical harnesses, documentation, licensing, attribution, reproducibility tools, visual evidence and supporting research records that belong to the release.
3. Preserve the original 0.2 files and recorded evidence unchanged.
4. Examine the public release for credentials, tokens, machine-specific secrets, private data, unnecessary temporary files and generated dependencies.
5. Publish actual source directories rather than committing the large ZIP as a substitute for source control.
6. Do not silently discard large screenshots or videos. Where ordinary Git files exceed hosting limits, evaluate Git LFS or versioned GitHub Release assets. Document their locations and verify that they remain retrievable. Consider storage quotas and clean-clone usability.
7. Retain the original Noniv/web-ocean MIT copyright and license obligations, together with all applicable third-party notices.
8. Prepare a clear README describing prerequisites, project structure, native-WebGPU requirements, startup instructions, tests, quality modes, evidence locations and known limitations.
9. Create a clean Git commit representing the preserved final 0.2 release and an immutable version tag such as `v0.2.0`.
10. Verify the remote upload by inspecting the repository, checking file manifests and hashes where available, and testing a fresh clone. Verify any separately hosted evidence assets as well.
11. Preserve the baseline on the main branch, and begin 0.3 work on a separate development branch.
12. Do not force-push over unexpected remote history or claim publication succeeded until the remote state has actually been verified.

**This is a strict dependency: no 0.3 implementation begins until the complete 0.2 publication is successfully verified.**

If authentication, permissions, evidence storage or essential source files prevent a complete publication, explain the blocker rather than skipping it.

A development branch such as `development/pelagic-0.3` is appropriate after the baseline is secured.

## 3. Establish the true 0.2 baseline

The 0.2 technical report documents meaningful engineering progress:

- Six native-WebGPU FFT wave cascades remain functional.
- Swell separation, short-wave spectrum modelling and scale-dependent choppiness were improved.
- Slope covariance, finite-solar-disc filtering and HDR storage handling were corrected.
- Foam generation and reference-coordinate transport were improved and numerically tested.
- Volumetric clouds gained cached three-dimensional density noise, filtering and more extensive atmospheric integration.
- Underwater rendering gained improved refraction, scattering and medium handling.
- Numerical tests and controlled GPU captures were retained.

These improvements are valuable and must not be discarded automatically.

However, Astra's completed 0.2 report explicitly retains major failures:

| Area | Current state | 0.3 requirement |
|---|---|---|
| Natural wave appearance | Improved scale separation, still artificial in motion and distance | Resolve remaining spectral, geometric and scale-coupling defects |
| Surface reflection | Improved numerical treatment, still occasionally metallic and overly smooth | Calibrate full lighting, visibility, roughness and water-body contributions |
| Breaking waves | No convincing physical breaking representation | Develop believable offshore breaking geometry and whitewater |
| Foam | Transport tests pass, but broad grey films remain | Improve lifecycle, coverage, thickness, aeration, structure and optical response |
| Spray | Present but visually weak | Connect spindrift and spray to coherent breaking events |
| Volumetric clouds | Better sampling, visibly procedural shapes | Major morphology and weather-organisation improvement |
| Distant ocean | Weak swell definition and homogeneous appearance | Improve multiscale structure, filtering, horizon and long-range precision |
| Immersion | Partial improvements, planar boundaries and slivers remain | Correct camera-interface visibility and medium classification |
| Twilight/night | Dark twilight and uncalibrated night appearance | Improve radiance, exposure and lunar appearance |
| Temporal behaviour | Multiple systems remain incompletely tested | Add targeted motion reconstruction, diagnostics and long-running tests |
| Frame pacing | Severe stall reproduced in one High/storm test | Isolate scheduling, compositor, runtime and GPU causes without guessing |

Numerical PASS does not imply visual PASS.

The existing 48-view comparison matrix, four special views, seven final motion recordings, source checkpoints and performance measurements should be preserved as the 0.2 baseline.

## 4. How to use the independent research

The external assessments provide valuable technical leads, but they are **not authoritative implementation specifications**.

Several were prepared without inspecting PELAGIC's shaders. Their renderer-specific diagnoses must be treated as hypotheses.

The longer source-specific assessment claims to have inspected important files, including `src/wgsl/ocean.js` and `src/wgsl/sim.js`. Its code references deserve investigation, but the claimed root causes still require verification against the actual current source.

### High-value findings to investigate

The most promising shared conclusions are:

- Correct relationships between resolved waves, unresolved roughness and BRDF slope statistics.
- Better coupling between long gravity waves and shorter wind-generated waves.
- A consistent accounting of sky radiance, direct sunlight, water-leaving radiance, atmospheric scattering and exposure.
- More realistic local wave visibility and masking near the horizon.
- Distinct physical and optical phases of whitewater, aeration and residual foam.
- Realistic nonlinear offshore breaking and associated spray.
- Weather-organised cloud morphology rather than repeated volumetric noise shapes.
- Spatially coherent winds, clouds, precipitation, aerosols and ocean response.
- Correct curved-surface waterline visibility and refracted underwater viewing.
- Reference-driven look development, isolated numerical experiments and better GPU diagnostics.

### Corrections and rejected assumptions

Do not implement the following claims blindly:

**More FFT cascades or larger FFT grids are mandatory.** The existing six-cascade foundation is mathematically verified. Any change in resolution or architecture requires evidence of visual or computational benefit.

**The existing renderer has no cloud shadows, vertical cloud profiles, ozone or atmospheric multiple scattering.** These components already exist in approximate forms. Investigate their accuracy, quality and coupling rather than recreating them without inspection.

**The existing foam system has no transport, history or optical structure.** It already contains these mechanisms. The problems concern their realism, calibration, visual behaviour and incomplete breaking dynamics.

**A Jacobian determinant threshold is a physical breaking solver.** It is an approximate event indicator. True breaking involves additional nonlinear dynamics, energy dissipation, air entrainment and, potentially, changes in surface topology.

**A water-volume LUT automatically fixes metallic water and immersion.** Such a LUT may improve transport, but it does not independently solve reflection visibility, surface geometry or incorrect medium classification.

**The geometric horizon must equal the sky's radiance exactly.** Grazing Fresnel reflection and aerial perspective support an appropriate transition, but atmospheric conditions, wave masking and actual viewing geometry matter. Test physical consistency rather than forcing equality.

**Cox–Munk or Monahan equations provide universal exact targets.** They are empirical relations with measurement assumptions, variable scatter and restricted validity. Use them as observational comparisons with uncertainty.

**One WebGPU compute pass, mandatory SSR, mandatory TAA, four 512² cascades, frequency quantisation or cubemap regeneration every frame are necessary.** None is a universal requirement. Evaluate implementation choices through correctness, output quality and profiling.

**The browser stalling proves GPU watchdog failure.** It does not. The successful visibly presented repeat makes browser scheduling and occlusion important competing explanations.

**A specific percentage of VFX quality or a prescribed frame-time budget establishes success.** It does not. Use reproducible results and explicit quality/performance trade-offs.

The research must support independent engineering decisions, not replace them.

---

## 5. Ocean physics and macro-scale wave naturalism

The wave simulation must represent a coherent, evolving open-ocean sea state rather than a collection of independent oscillating textures.

### Spectral foundation

Preserve the existing FFT mathematics, Hermitian symmetry, field packing, GPU verification and phase-epoch infrastructure unless a defect is demonstrated.

Audit the combined wind-sea and swell system for:

- Correct frequency and directional energy distributions.
- Proper spectral density units and transformation Jacobians.
- Continuous variance partitioning across all six cascades.
- Appropriate distribution of energy between swell, gravity waves and capillary-gravity waves.
- Correct significant wave height, peak period and directional statistics.
- Realistic representation of developing, mature, crossing and swell-dominated seas.
- Coherent wave growth and dissipation when environmental conditions change.
- Numerical stability without artificial phase resets or excessive periodicity.

The existing JONSWAP/Elfouhaily-inspired hybrid is a reasonable starting point, but its directional short-wave behaviour and observational calibration are incomplete.

Investigate established directional spectral research, including Horvath (2015), JONSWAP-family wind seas and appropriate unified short-wave formulations.

Do not force a different model without demonstrating that it improves the simulated statistics and final appearance.

### Scale coupling

One of the strongest new research opportunities is the relationship between large waves and smaller ripples.

Investigate how long-wave strain, surface convergence, orbital advection, local wind stress and sheltered troughs influence small-wave energy and orientation.

The short-wave field must not merely appear as a uniform pattern painted across larger swells.

Evaluate physically motivated short-wave modulation tied to the existing long-wave geometry and velocity fields. Preserve the mean energy budget and verify spatial correlations.

Investigate whether fine-scale textures and shading are sampled in the correct material or spatial coordinates. Incorrect sampling can make ripples appear to crawl over the wave surface independently of the water.

### Wave groups and spatial variation

Improve natural irregularity through:

- Directional crossing swells.
- Realistic wave envelopes and grouping.
- Variation in local steepness and crest shape.
- Wave-age-dependent characteristics.
- Broad wind-gust regions.
- Wind-driven capillary patches and cat's-paws.
- Surface slicks that damp the finest ripples.
- Spatially varying short-wave roughness.
- Wave sheltering and coherent crest modulation.
- Delayed development of larger waves after changes in wind.

Do not equate random amplitude noise with a physically evolving ocean.

A homogeneous FFT field is useful, but realistic oceans exhibit structured environmental variation.

### Nonlinear wave behaviour

Study useful second-order effects, crest-trough asymmetry, bound-wave interactions, steepening and localized nonlinear approximations.

The objective is believable wave geometry and motion, not a claim to simulate complete Navier–Stokes dynamics across the ocean.

Investigate whether relatively inexpensive local corrections substantially improve crest profiles without compromising the verified spectral foundation.

Validate phase propagation, wave grouping, spectral energy and geometry in continuous motion.

---

## 6. Geometry, distance and surface roughness

PELAGIC already has adaptive CDLOD geometry and filtered wave derivatives.

Version 0.3 must make geometry, surface normals and the statistical reflection model consistent at every camera distance.

### Required investigation

Audit the accounting of slope energy through:

1. Explicitly resolved wave geometry.
2. Shading normals and geometric deformation.
3. Pixel-footprint-filtered slope moments.
4. Unresolved short-wave roughness.
5. Frequency content omitted or attenuated by LOD selection.

A wave contribution must not disappear when geometry is filtered, nor be counted more than once in the BRDF.

Build an explicit per-cascade variance and covariance ledger.

Compare the complete represented slope distribution against suitable ocean observations, including Cox–Munk where measurement conditions are compatible.

Preserve the 0.2 full deformation treatment and existing slope-covariance work unless a specific calculation fails.

### Horizon and high-altitude rendering

Improve the transition from close surface geometry to the horizon.

Investigate:

- Camera-relative coordinates.
- Per-cascade modulo origins.
- Origin rebasing without phase discontinuities.
- Large-scale geometric swell retention.
- Filtering based on both geometry density and pixel footprint.
- Correct Earth curvature at relevant altitudes.
- Atmospheric perspective over long distances.
- Distant whitecap statistics and wind/slick variation.
- Stable reflection appearance from 50 m, 500 m and higher.
- Seam-free movement through CDLOD boundaries.

The horizon is a physical geometric feature, not an artifact to hide.

A high-altitude ocean must retain recognizable spatial variation even when fine waves are no longer individually resolved.

---

## 7. Water optics, participating media and reflection

The water must stop behaving visually like a coloured reflective solid.

The full optical model needs to balance reflected radiance, refracted light, scattering and absorption with the actual environment.

### Water-body transport

Investigate the current Gordon-style optically deep water approximation and the limitations of its three-channel spectral proxies.

The present model may lack sufficient dependence on viewing geometry, illumination direction and water path length.

Evaluate reduced-order directional radiative transfer, precomputed optical lookup tables or other tractable methods grounded in seawater optical properties.

Account for:

- Pure-water absorption.
- Phytoplankton-related optical effects.
- Coloured dissolved organic matter.
- Suspended particulates.
- Backscattering and phase functions.
- Water-leaving radiance.
- Surface transmission losses.
- Direction-dependent underwater path length.
- Thin and compressed crest optical behaviour.
- Bubble- and foam-modified scattering.

Distinguish beam attenuation, diffuse attenuation and volume scattering. Do not interchange optical coefficients with different physical meanings.

Use measured optical datasets when possible. Avoid implying that chlorophyll alone determines every water type.

A more sophisticated model is justified only if diagnostic renders show that it improves appearance or corrects measurable optical errors.

### Reflection and local visibility

Investigate the existing reflected-sky sampling and five-point environment integration.

At low viewing angles, neighbouring waves may block portions of the sky or intercept reflected directions. Microfacet Smith masking alone does not necessarily represent large-scale ocean-wave visibility.

Evaluate physically defensible wave self-shadowing and inter-wave reflection approximations.

Consider:

- Directional horizon visibility.
- Ocean self-reflection.
- Crest and trough shadowing.
- Grazing-angle wave masking.
- Correct atmospheric radiance sampling.
- The effect of clouds on the visible reflection field.
- Finite solar-disc reflection and irregular glint statistics.
- Angular and spatial energy conservation.

Do not simply clamp invalid reflection directions into the sky environment.

Compare alternative approximations using isolated lighting passes and consistent HDR diagnostics.

### Surface BRDF

Preserve the already corrected full covariance and tangent-frame transformations.

Audit remaining approximations, including Jacobian conditioning near strongly compressed waves and any residual analytic roughness.

Conduct BRDF reciprocity, normalization and energy-conservation tests where physically applicable.

Test direct solar glitter separately from sky reflection.

Investigate whether improved stochastic integration or specialized temporal reconstruction benefits sun glitter, but do not assume conventional TAA is necessary or always harmful.

---

## 8. Breaking waves, whitewater and aeration

This is a mandatory, high-impact reconstruction area.

PELAGIC 0.2 has foam generation, transport and spray, but the visible storm behaviour remains insufficient.

### Correct target for offshore breaking

The primary visual target is realistic open-ocean breaking, particularly steep spilling and collapsing crests, cascading aerated water and wind-torn spindrift.

Plunging events can occur offshore, but large surfing barrels should not be the default storm representation.

### Breaking development

Investigate localized hybrid methods that operate on top of the verified spectral ocean:

- Crest detection and temporal tracking.
- Steepness, compression and local growth information.
- Physically motivated onset proxies.
- Local geometric breaking representations.
- Surface overturn approximations when appropriate.
- Aerated crest volumes.
- Turbulent water falling down wave faces.
- Energy dissipation estimates.
- Whitewater and particle emission tied to the same events.

Do not claim that principal-stretch or negative-Jacobian detection is equivalent to a fully validated fluid breaking criterion.

Distinguish an engineering heuristic from a hydrodynamic model.

### Foam lifecycle

Preserve working reference-coordinate transport but improve the physical and optical representation.

Study at least three related regimes:

**Fresh active whitewater:** bright, thick, turbulent, aerated, and closely associated with a breaking event.

**Residual surface foam:** aging, fragmenting, stretching, drifting and thinning into nonuniform streaks and patches.

**Submerged bubble-rich water:** optically distinct from surface foam and contributing to crest translucency, scattering and underwater appearance.

Investigate coverage, thickness, lifetime, spatial distribution, advection, stretching, fragmentation and decay.

The final foam must not turn into broad, uniform grey films.

Use suitable whitecap-coverage observations for comparison, recognizing that optical thresholding, wind, wave age, water temperature and observational methodology affect the empirical result.

### Spray and mist

Connect spindrift to actual breaking activity.

Evaluate droplet size distributions, initial velocities, wind transport, gravity, drag, atmospheric extinction and lighting.

Develop a convincing near-surface spray environment for storms without arbitrary particle clutter.

Improve the interaction between sea spray, marine haze and cloud illumination.

---

## 9. Atmosphere, Sun, Moon and photographic exposure

PELAGIC already implements Rayleigh/Mie/ozone atmospheric foundations, approximate multiple scattering, sky lighting and astronomy.

Version 0.3 should improve the accuracy, consistency and visual output of those systems.

### Unified radiometry

Build a documented lighting and radiance ledger identifying the quantities and units used by each subsystem.

Track relationships between:

- Solar irradiance and apparent solar-disc radiance.
- Sky radiance.
- Atmospheric transmittance.
- Cloud scattering and shadowing.
- Water surface reflection.
- Water-leaving radiance.
- Foam illumination.
- Aerosol and rain scattering.
- Moonlight and night-sky illumination.
- Exposure and tone mapping.

Preserve the corrected 0.2 HDR pre-exposure behaviour.

Investigate whether the remaining colour and contrast problems come from incorrect radiance ratios, angular transport, environmental visibility or photographic finishing.

### Daytime and twilight

Improve clear skies, overcast daylight, low-Sun atmosphere, Earth shadow, horizon aerosol layers and post-sunset illumination.

Audit atmospheric LUT implementation against reliable Hillaire-style references.

Particular attention is required for twilight, where the 0.2 renderer loses water detail and atmospheric illumination does not always remain convincing.

### Moonlit conditions

Improve lunar illumination, phase-dependent brightness, surface reflections, cloud response, sky contribution and exposure.

A natural moonlit scene should not simply be daytime rendering with its light intensity reduced.

Human night vision, camera exposure and cinematic night rendering are different appearance models. Select and document the intended result instead of automatically forcing a blue tint.

Maintain realistic dynamic range while preserving enough visible detail for the chosen viewing model.

### Optical finishing

Review HDR precision, highlight compression, white balance, colourimetry, tone mapping, bloom and exposure adaptation.

Avoid unnatural desaturation, over-saturated water colour, clipped glitter, grey daytime images and crushed nighttime detail.

Expose diagnostic controls for linear radiance, displayed luminance and individual lighting contributions.

---

## 10. Volumetric clouds and large-scale weather organisation

This is another mandatory major improvement.

The 0.2 cloud system already includes 3D density caches, filtering, vertical/weather profiles, self-shadowing and ocean shadows.

The problem is that the final cloud morphology remains visibly synthetic.

### Cloud structure

Investigate meteorologically organised cloud fields rather than relying on repetitive procedural density alone.

Useful research includes Nubis, Nubis Evolved and related production cloud techniques.

Evaluate:

- Large-scale weather maps and fronts.
- Cloud-type distributions.
- Convective development.
- Realistic flat or irregular cloud bases as appropriate.
- Cumulus billowing and erosion.
- Stratocumulus layering.
- High cirrus and ice-cloud morphology.
- Cumulonimbus vertical development and anvils.
- Wind shear and altitude-dependent transport.
- Variable atmospheric humidity and inversion layers.
- Distinct storm and fair-weather cloud organisation.

These should produce credible shapes and environments, not merely more complicated noise.

### Cloud lighting

Improve illumination through cloud volumes, including:

- Forward-scattering effects.
- Self-shadowing.
- Multiple-scattering approximations.
- Directional solar attenuation.
- Correct integration with the sky.
- Shadowing onto the water.
- Distant-cloud reconstruction.
- Internal cloud illumination variation.
- Stable motion and temporal reconstruction.

Evaluate cloud geometry and lighting independently.

A cloud generator should not pass merely because its ray marcher is numerically stable.

### Storm atmosphere

Develop meaningful moving weather structures with coherent precipitation, wind, cloud mass and visibility.

Improve rain shafts, marine haze, storm clouds, distant visibility and the relationship between atmospheric conditions and surface appearance.

Avoid isolated effects that do not share the same environmental state.

---

## 11. Ocean–atmosphere interaction and evolving weather

This is a defining new opportunity for 0.3, after the inherited visual failures are addressed.

Real marine environments exhibit coupled behaviour across several time scales.

Develop a coherent environmental state capable of influencing:

- Local and regional wind.
- Wind-generated waves.
- Independent travelling swell.
- Fine surface roughness.
- Breaking probability.
- Foam generation and transport.
- Spray and aerosols.
- Cloud development and movement.
- Rain intensity and visibility.
- Solar attenuation and ocean reflections.

### Sea-state evolution

Investigate physically plausible growth and decay of the local wind sea.

The same wind speed can correspond to very different seas depending on fetch, wave age, duration and prior weather history.

A changing wind field should not instantly replace the entire surface with a new statistical realization.

Evaluate smooth spectral evolution, directional wave memory and persistent swell trains.

### Spatial weather

Investigate large-scale wind-gust fields, rain cells, fog banks, cloud fronts and associated spatial variation.

A travelling gust should have related consequences for short waves, surface roughness, breaking and eventual wave development.

A passing cloud should modify surface illumination and reflections consistently with the sky.

### Rain and aerosols

Investigate rain-induced capillary rings and crowns, possible damping of other small-wave bands under appropriate conditions, surface roughness changes, rain haze and visibility.

Do not assume rain always smooths or always roughens the entire ocean.

Marine sea-salt aerosols, surface mist and fog should be represented with plausible spatial distributions and atmospheric scattering.

These features must improve naturalism, not create excessive decorative weather effects.

---

## 12. Underwater and partial immersion

The waterline remains a confirmed 0.2 failure and must be corrected.

The system should correctly handle visibility when the camera is:

- Fully above water.
- Just above a moving crest.
- Intersecting a passing wave.
- Partially submerged.
- Fully underwater.
- Moving rapidly across the surface.

### Geometry and medium classification

Investigate the relationship between the actual displaced surface, camera near plane, rasterized surface orientation, per-ray intersection and optical medium classification.

The straight local-plane waterline and near-camera slivers are unacceptable final artifacts.

Do not disguise those defects with arbitrary screen effects.

Evaluate curved water-surface intersection, robust ray classification and multi-intersection behaviour where necessary.

Separate medium-classification errors from the underlying refraction model through targeted diagnostics.

### Underwater transport

Investigate directional water-body radiance, spectral attenuation, forward scattering, underwater surface reflections, Snell's window and total internal reflection.

Improve optical variation with depth and visibility.

Submerged bubbles and occasional light focusing should be physically associated with waves and breaking events.

Do not add a seabed merely to make underwater screenshots appear more detailed.

Near-surface caustic patterns and volumetric light shafts may be useful, but their presence and strength must be supported by the optical environment.

---

## 13. Temporal realism, numerical precision and engineering reliability

Several problems can remain hidden in static captures.

### Long-run precision

Verify phase evolution, long flight and large-coordinate sampling.

The existing phase oscillator and epoch testing are useful and should not be replaced casually.

Investigate camera-relative sampling and origin rebasing, ensuring continuity of all wave phases, foam textures, cloud volumes, lighting and motion.

Do not force frequency quantization or wave-loop periods unless an evaluated use case justifies them.

### Temporal reconstruction

Different rendering contributions require different stability strategies.

Evaluate motion for:

- Resolved geometry.
- Short-wave normal fields.
- Sun glitter.
- Foam and aeration.
- Spray particles.
- Volumetric clouds.
- Cloud shadows.
- Refraction and waterline transitions.

Use targeted reconstruction and history rejection where demonstrated beneficial. Avoid treating a single global TAA setting as the only possible solution.

### GPU and browser reliability

Keep native WebGPU and stop clearly if unsupported.

Investigate the 0.2 High/storm pacing anomaly under controlled browser presentation and visibility conditions.

Log and classify CPU submission time, GPU pass time, frame presentation intervals, resource creation, memory behaviour, device loss and shader errors.

A previously observed roughly one-second interval should not be attributed to the GPU watchdog, JavaScript garbage collection or WebGPU synchronization without confirming evidence.

Use WebGPU Inspector, browser profiling and timestamp queries where available.

Evaluate pipeline warm-up, asynchronous pipeline creation, staging-buffer readback and resource reuse as appropriate.

Preserve the user's maximum-quality rendering option while maintaining practical scalable settings.

Do not enforce arbitrary GPU-performance limits in place of visual-quality research; document actual performance and trade-offs.

---

## 14. Permanent scientific and visual validation

PELAGIC 0.3 requires a verification process that examines each subsystem and the integrated world.

### Numerical and physical tests

Retain the passing 0.2 CPU/GPU tests.

Extend testing where necessary to cover:

- Wave spectral density and variance.
- Cascade normalization and overlap.
- Directional slope statistics.
- Geometry-to-BRDF variance accounting.
- Phase and coordinate continuity.
- BRDF reciprocity and energy behaviour.
- Reflection and refraction limits.
- Sun-disc integration and HDR stability.
- Foam advection, decay and material coordinates.
- Whitecap event coverage and age distributions.
- Weather-field continuity.
- Waterline medium classification.
- Atmospheric and underwater optical limiting cases.

Use scientifically justified numerical tolerances, accounting for precision and storage format.

Treat empirical comparisons as measurements with uncertainty rather than mandatory exact equations.

### Visual look-development

Maintain a permanent reference library.

Prioritize real ocean footage and photographs representing comparable:

- Sea states.
- Wind and swell conditions.
- Lighting.
- Camera height and viewing angle.
- Atmospheric visibility.
- Cloud formations.
- Weather.
- Time of day.

Record source provenance and available camera/environment metadata.

Compare wave silhouettes, relative luminance, reflection structures, cloud morphology, foam distribution, spray, horizon appearance, water colour and motion.

Avoid inventing meteorological metadata for references that do not provide it.

Use overlays, regional histograms, calibrated measurements where possible and independent human review.

### Diagnostic visualizations

Provide individually inspectable views for:

- Wave height and derivatives.
- Individual FFT cascades.
- Surface deformation and Jacobians.
- Resolved and unresolved slope variance.
- Surface normals and roughness.
- Reflection and water-body radiance.
- Sun glitter.
- Foam density, age and optical thickness.
- Spray emission.
- Cloud density and shadowing.
- Atmosphere and aerial perspective.
- Underwater optical path and classification.
- HDR luminance, exposure, invalid values and saturation.
- Geometry LOD and coordinate precision.

Diagnostic rendering is an engineering tool, not a replacement for observing the finished image.

### Acceptance matrix

Retain the six established environmental conditions:

1. Calm sea.
2. Clear midday.
3. Golden hour.
4. Storm and overcast.
5. Twilight.
6. Moonlit night.

Retain the established 48-view baseline matrix using camera heights of 0.5 m, 2 m, 50 m and 500 m with two viewing directions per condition.

Keep special underwater, waterline and close-breaking cases.

Extend the evidence with continuous motion and real environmental transitions.

Capture both short deterministic comparisons and longer runs where foam, weather and wave development have sufficient time to evolve.

**No final visual acceptance can be based on one impressive still image.**

### Acceptance classifications

Use separate categories for:

- Mathematical correctness.
- Physical/observational credibility.
- Rendering correctness.
- Visual naturalism.
- Temporal stability.
- Real-device performance.
- Integration quality.

Every requirement must be PASS, FAIL or UNVERIFIED, with links to its supporting evidence.

Unresolved defects remain open in subsequent development phases.

---

## 15. Implementation sequence

The following sequence represents dependencies, not permission to ignore other systems.

### Phase 0 — Repository publication and preservation

Publish and independently verify complete PELAGIC 0.2 on GitHub. Preserve its source, evidence, licenses and baseline state. Tag the release and create the 0.3 development branch.

Do not proceed until this is complete.

### Phase 1 — Source audit, statistical contracts and radiometric diagnosis

Inspect the actual renderer.

Prioritize measured slope variance, reflection visibility, water-body radiance, BRDF behaviour, HDR exposure and near/far ocean transitions.

Isolate causes using diagnostic passes and targeted GPU experiments.

### Phase 2 — Ocean physics and optics reconstruction

Improve natural wave-scale coupling, wave groups, crest profiles, long-distance representation, reflected light and water optical depth.

Maintain mathematical correctness and demonstrate visible improvements against 0.2.

### Phase 3 — Breaking, foam, aeration and spray

Implement and validate improved offshore breaking events, geometric effects where justified, distinct whitewater phases, foam transport, bubble fields and related atmospheric spray.

Use moving storm evidence rather than static foam masks alone.

### Phase 4 — Clouds, sky and environmental light

Substantially improve cloud morphology, meteorological structure, shadowing, Sun/Moon appearance, atmospheric perspective and twilight/night rendering.

Check that the ocean and sky form one coherent environment.

### Phase 5 — Immersion, weather and physical coupling

Resolve near-camera waterline errors, improve underwater transport and integrate spatially evolving wind, sea-state, rain, cloud and visibility systems.

### Phase 6 — Integrated quality, optimization and acceptance

Run the complete comparison matrix, continuous recordings, numerical tests, browser interaction checks, long-flight checks and sustained hardware profiling.

Identify and correct regressions.

Do not close unresolved visual gates merely because the planned phases have been executed.

Development stages can overlap where technically necessary, but all major changes require working code and genuine reviewable evidence.

---

## 16. Required deliverables

Every substantial phase must produce an operational source checkpoint and separately accessible evidence.

Deliver:

- Source changes with clear commit history.
- Research decisions and source references.
- Updated scientific and visual acceptance register.
- Numerical test results, including failures.
- GPU/browser validation records where available.
- Full-resolution captures for affected environments and diagnostic modes.
- Matched 0.2-versus-0.3 before-and-after images.
- Actual video recordings of motion-dependent improvements.
- Per-pass profiling and measured performance where available.
- Outstanding defects and next-phase dependencies.
- Updated setup, licensing and reproducibility documentation.

The final release must include a complete working project and an independently inspectable evidence gallery.

Preserve the older 0.1 and 0.2 baselines so the evolution of the renderer remains verifiable.

## 17. Research sources and implementation references

The following are research leads, not mandatory algorithms or approved drop-in dependencies.

### Ocean dynamics and scale-aware rendering

- Tessendorf, *Simulating Ocean Water* (2001).
- JONSWAP and relevant directional wave spectra literature.
- Elfouhaily et al., *A unified directional spectrum for long and short wind-driven waves* (1997), DOI: 10.1029/97JC00467.
- Horvath, *Empirical Directional Wave Spectra for Computer Graphics* (2015), DOI: 10.1145/2791261.2791267.
- Bruneton, Neyret and Holzschuch, *Real-time Realistic Ocean Lighting using Seamless Transitions from Geometry to BRDF* (2010), DOI: 10.1111/j.1467-8659.2009.01618.x.
- Jeschke and Wojtan, *Water Wave Packets* (2017).
- Research on short-wave modulation by long gravity waves and surface-current strain.
- Cox and Munk sea-surface slope observations.

### Breaking and whitewater

- Dupuy and Bruneton, *Real-time Animation and Rendering of Ocean Whitecaps* (2012), DOI: 10.1145/2407746.2407761.
- Breaking-onset research, including Barthelemy et al., with careful attention to its model and experimental conditions.
- Monahan and O'Muircheartaigh whitecap-coverage research.
- Wave Harmonic's Crest ocean system as an architectural reference, not a replacement engine.

### Water optics

- Mobley, *Light and Water: Radiative Transfer in Natural Waters*.
- Pope and Fry pure-water absorption measurements.
- NASA and IOCCG ocean-optics protocols.
- Gordon-style remote-sensing-reflectance models and their stated limitations.
- Measured particulate, CDOM and seawater optical-property datasets.

### Atmosphere and volumetric clouds

- Hillaire, *A Scalable and Production Ready Sky and Atmosphere Rendering Technique* (2020).
- Guerrilla Games, *Nubis* and *Nubis Evolved*.
- Professional cloud modelling, self-shadowing, scattering and weather-map research.
- Marine boundary-layer, aerosol and precipitation research.
- Reliable Sun/Moon radiometry and lunar phase references.

### Native WebGPU and debugging

- https://github.com/Noniv/web-ocean
- https://github.com/webgpu/webgpu-samples
- https://github.com/webgpu/webgpufundamentals
- https://github.com/brendan-duncan/webgpu_inspector
- https://github.com/wgsl-analyzer/wgsl-analyzer
- https://github.com/greggman/webgpu-utils
- https://github.com/gpuweb/cts
- Official WebGPU and WGSL specifications.

Inspect the actual source and licensing before adapting any external implementation.

Maintain a source-access ledger distinguishing full-paper reading, abstract review, documentation inspection, source-code inspection and experimentally reproduced results.

## 18. Research discipline and final standard

Astra is expected to conduct additional independent research whenever engineering decisions require it.

Do not blindly follow this document's suggested techniques if a better supported method is found. Explain meaningful departures using evidence.

Do not fabricate results, sources, comparisons or runtime execution.

Do not turn PELAGIC 0.3 into another collection of sophisticated systems that fail to look like real seawater.

The first responsibility is to preserve and publish the working foundation. The second is to identify the causes of the remaining visual failures. The third is to carry out substantial, physically credible and demonstrably successful improvements.

PELAGIC 0.3 should feel natural and visually coherent across its complete environment: the wave field, water-body optics, breaking water, foam, spray, sky, clouds, Sun, Moon, atmosphere, weather, underwater interface, horizon and smallest surface details.

**The final objective is not to finish a checklist. It is to deliver a major improvement in the actual realism of the living ocean, supported by reproducible engineering, convincing motion, credible reference comparisons and honest acceptance evidence.**