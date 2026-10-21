# PELAGIC 0.4 — Final Targeted R&D and Technical Decision Report

**Date:** 21 October 2026  
**Purpose:** Independent, **read-only** engineering/scientific assessment for Astra's next PELAGIC 0.4 development decisions  
**Project:** Desktop Chrome · native WebGPU · JavaScript ES Modules · custom raw-WGSL renderer · no Three.js/Babylon/WebGL  
**Scope:** Decisions and decisive experiments, **not** production implementation, source modification, or a new full ocean-physics compendium.

> **Evidence notice.** This report reads the four published documents on the actual GitHub branch `development/pelagic-0.4`, checks selected primary technical and scientific literature and public image records, and derives proposals. It **does not** claim that the author ran the PELAGIC renderer, reproduced the RTX 3050 benchmarks, viewed all 821 retained media files, or inspected every shader. GitHub remains unchanged. The published Phase 0 code, acceptance register, and preserved evidence—not this report—remain the source of truth for test results and defect status. Numerical planning assumptions below are **estimates**, not measured performance.

**Repository source documents:** [P0 report](https://github.com/adievibecoder-sudo/PELAGIC/blob/development/pelagic-0.4/docs/V04-PHASE0-REPORT.md) · [Acceptance/decision register](https://github.com/adievibecoder-sudo/PELAGIC/blob/development/pelagic-0.4/docs/V04-ACCEPTANCE.md) · [Master execution brief](https://github.com/adievibecoder-sudo/PELAGIC/blob/development/pelagic-0.4/docs/PELAGIC_V04_MASTER_EXECUTION_BRIEF.md) · [Performance budgets](https://github.com/adievibecoder-sudo/PELAGIC/blob/development/pelagic-0.4/docs/V04-PERFORMANCE-BUDGETS.md).

---

## A. Executive technical verdict — what actually changes the decision

### A1. The short version

1. **Phase 1 should implement a compact, authoritative environment-state contract and a one-directional lighting/radiance contract, while keeping the existing ocean and cloud renderers.** [SRC→published Phase 0 report; LIT→Guerrilla Nubis 2017, Bruneton atmosphere, Ubisoft Atmos.] The current missing dependencies are more damaging than an absence of advanced algorithms: `volumeWater` consumes clear-sky ambient, cloud lighting partly consumes clear-sky directional light, rain is spawned near the camera independently of cloud structure, and script transitions don't change cloud type. Establishing ownership and shared lighting is an actual defect-directed decision.
2. **Do not adopt either rejected Phase 0 cloud prototype.** The baseline/continuous/cell midday cloud-screen median timings were 15.335/4.915/3.670 ms, but the latter alternatives change coverage/optical thickness and fail morphology. These are **not equal-quality speedups**. Design a comparison that holds sky occupancy, optical depth and exposure comparable before judging performance. [TEST/VIS in P0]
3. **Phase 2 first experiment:** keep the existing light integrator, use one low-frequency regional weather field, independent cloud-type height profiles, and a decorrelated multiscale erosion/density function; isolate density/morphology changes. Compare this against a more direct layered-height-profile candidate. Reserve sparse voxels/SDFs for a later second-stage proof, not an immediate rearchitecture. [HYP; LIT Nubis 2015/2017/2023]
4. **Do not restart FFT.** Phase 0 has already documented pronounced spatial recurrence in the 1,103 m domain and no lack of Gaussian wave groups. Phase 4 should compare **energy-reweighted off-grid long modes** with **covariance-preserving aperiodic tiling**. Neither deserves adoption until spectral variance, orientation, derivative consistency, seams, temporal coherence and GPU cost all pass. [TEST + LIT Ubisoft La Forge 2024]
5. **Do not use the familiar `B≈0.85` breaking criterion on linear FFT velocities.** Its published validation concerns nonlinear near-crest particle/crest speeds in focused or breaking wave groups. Phase 5 should start with a tracked event/energy-dissipation proof, then compare low-cost breaking patch/sheet and explicit roller geometry. [TEST P0; LIT Barthelemy et al.]
6. **Treat optics as an integration and radiance problem before a new color grading pass.** The Phase 0 55% desaturation A/B barely changes midday and has a limited golden highlight effect; it cannot explain the metallic water. Test body/reflected/glitter contributions, slope-moment filtering, sky/cloud illumination and the entire scene-linear → display transformation under controlled exposure. [TEST/VIS P0; LIT LEAN, NASA optics]
7. **The ~1,007 ms stalls have no established root cause.** The identical 1-second-ish spikes in some camera/preset conditions, combined with no stalls in another scene, make a deliberate scheduling or sync diagnostic urgent; neither WebGPU nor thermals nor rAF throttling should be pronounced guilty without correlated traces. [TEST P0; HYP diagnosis]
8. **Do not downscope imagery in pursuit of invented FPS.** Existing 1080p Balanced atmosphere+environment 20.775 ms and surface+transparency 19.726 ms medians massively exceed the proposed 4.7/6.5 ms ownership budgets. These gaps identify *where to investigate*; they are not proof that any particular optimization will achieve the target.

### A2. Verified baseline and deliberately unverified claims

| Status | Fact or decision | Basis |
|---|---|---|
| **TEST** | 26 CPU tests passed; 9 native GPU FFT checks passed; optical/coordinate groups passed | P0 published report, **not reproduced here** |
| **TEST** | RTX 3050 Laptop (4096 MiB) Chrome 155 hardware execution corroborated | P0 Windows/adapter/owner text records; no original `chrome://gpu` screenshot |
| **VIS/TEST** | Two cloud alternatives rejected despite lower selected-pass times; 1,103 m recurrence observed | P0 media/measurements |
| **TEST** | Golden Balanced 22.90 FPS, Golden High 8.22 FPS; visible-document stalls around 1.0 s | P0 bounded display-paced runs; not isolated-machine endurance |
| **SRC in P0 report** | Rain/light/underwater couplings and waterline mismatch remain open | P0 source-level inspection results |
| **LIT** | Weather maps, morphology, volumetric/cloud light transport are shipping production methods | Guerrilla 2015/2017/2023 and Ubisoft Atmos; no claim of PELAGIC equivalence |
| **HYP** | Compact regional field + light contract is the smallest useful Phase 1 representation | Report recommendation; needs integration + visual experiments |
| **UNVERIFIED** | Guaranteed 60 FPS, complete physical radiometry, calibrated cloud morphologies, roller geometry, storm dynamics, exact cause of stalls | No adequate proof available |

### A3. What is already covered; what to reject now

- **Already adequately motivated:** FFT ocean foundation, separating wind sea from remote swell, spectral/statistical checks, atmospheric LUTs, foam persistence, physically coherent glints and real-world visual reference comparisons. Repeating those fundamentals adds little.
- **Reject:** treating a *globally uniform* `stormIntensity` or `cloudCoverage` scalar as all weather; independent rain/lightning toggles; cloud types generated exclusively by a periodic 3×3 cell grid; replacing the ocean with one giant Navier–Stokes solver; uncalibrated spectral band stretching; declaring a 4× cloud speedup when coverage/opacity change; hiding frozen-waterline topology with blur; allocating full 3D weather physics before a 2D regional-map experiment.
- **Defer, not reject:** richer 3D voxel clouds, full localized roller geometry, stochastic aperiodic tiling, Dynamic Wave Trains, spectral-to-RGB underwater radiometry, optional HDR output, subgroup/f16 FFT rewrites. These may be valuable, but each has a specific evidence gate.

---

## B. Phase 1 — recommended authoritative environment architecture

### B1. One owner per quantity, with two distinct timescales

**Recommended design (HYP):** a deterministic *environment controller* holds editable targets and scenario identity; a persistent *environment evolution service* owns evolving spatial fields; dedicated physics/render consumers derive views of that state. **No shader or renderer may silently re-infer weather from its own preset.** Keep independent astronomical time, weather evolution time, wave phase time and exposure adaptation time. A paused weather editor may adjust targets without advancing ocean phase; preset changes need explicit *instant preview* vs *physical transition* semantics.

```text
User presets / controls / scenario seed              Latitude, longitude, UTC → Sun/Moon
              │                                           │
              ▼                                           ▼
  TARGET environment state                     Astronomical geometry
              │                                           │
              ▼                                           │
Deterministic weather evolution (slow)                   │
  regional 2D advected fields + sparse cells              │
              │                                           │
              ├─→ wind at 10 m / gust field               │
              ├─→ cloud organization / profiles           │
              ├─→ precipitable & precipitating cells      │
              ├─→ aerosol/visibility and extinction       │
              └─→ wind-sea target + swell components      │
                          │                                │
                          ├───────────┬────────────────────┤
                          ▼           ▼                    ▼
                     cloud density  atmosphere LUT    direct sources
                          │           │                    │
                          ▼           └───────────┬────────┘
                   cloud transmittance, shadows & shared radiance
                          │
       ┌──────────────────┼───────────────────────┐
       ▼                  ▼                       ▼
  ocean optics       underwater volume      rain / haze / spray
       ▲                  ▲                       ▲
       └──── spectral FFT, history, foam & breakers ┘
```

The *dependency direction is essential*: cloud attenuation feeds irradiance; water consumes it. Water highlights must not feed a delayed cloud-light estimate that in turn changes its source. Phase 0 explicitly demonstrated that a one-frame delay does **not** stabilize positive-gain light feedback by itself.

### B2. Phase 1 minimum environmental record (proposal; limits not physically universal)

**Units below are recommended contracts.** The suggested ranges are practical editable/clamping domains to refine through scenario testing, **not observational limits or validated current-code ranges**. Store physical units where possible; never label uncalibrated RGB as W/m².

| Field / unit | Domain and storage | Update owner and rate | Consumers / rule |
|---|---|---|---|
| `U10` vector, **m/s** | 2D global baseline + regional residual field; editable 0–45 m/s initially | slow field (e.g. 0.2–2 Hz) | wind-sea growth, spray advection, cloud advection; *not* remote swell |
| gust residual, **m/s** | time-coherent multiscale 2D field, mean-neutral; bounded by scenario | ~1–10 Hz or analytic sampled in shader | rain direction, short-wave stress, spray; avoid white noise discontinuities |
| temperature near surface, **K** | regional scalar field; reasonable scenario range, e.g. 250–315 K | slow | condensation/stability proxy; don't assert full thermodynamics |
| relative humidity, **0–1** | regional field, advected + relaxed | slow | available condensation potential, mist/cloud transitions |
| stability/convection proxy, **0–1** | derived from instability, moisture and forcing; not absolute CAPE | slow | cumulus/congestus/Cb organization; explicit meaning documented |
| cloud type weights, **0–1** | per-cell categorical/mix state for low deck, cumulus, deep convective, upper ice; weights normalized | slow + persistent transition | **density profiles**, not arbitrary unlabelled slider |
| layer coverage, **0–1** | spatial cloud-map per layer | slow | density, cloud shadow and insolation; occupancy measurable |
| cloud base/top, **m ASL** | scenario + slow spatial controls; positive thickness | slow | optical-depth & morphology; check WMO ranges by latitude |
| precipitation rate, **mm/h** | **derived** from precipitating cloud water/type; time-integrated field | slow/moderate | 3D rain shafts, water impacts, attenuation; zero where no precipitating support |
| condensate/LWP proxy, **kg/m²** | persistent or scenario-controlled 2D integration/proxy | slow | optical depth and precipitation budget; label proxy unless calibrated |
| aerosol extinction, **m⁻¹** or AOD dimensionless | regional 2D/layer profile; define one authoritative basis | slow | sky LUT, visibility, fog and aerial perspective; avoid double haze |
| local wind-sea spectral target | spectral density with declared units + heading/peak period | slow evolution with stable phases | FFT evolution; never rebuild phases on preset selection |
| remote swell systems | up to a few independent period/direction/energy/age components | persistent advection/decay (can use analytic propagation) | FFT; **not clamped to local U10** |
| squall fronts / convective cells | sparse event list + spatial envelopes, persistent age and velocity | slow/moderate | gust-front displacement, rain shafts, lightning eligibility |
| Sun & Moon direction | unit world vectors from absolute time and location | per display frame or when time changes | direct lighting, radiance, water glitter |
| exposure state, **EV or explicit gain** | independent temporal display adaptation | per frame | display only; should not alter physical cloud generation |

Avoid per-frame simulation of spatially variable full temperature, pressure, humidity, liquid water, ice and 3D wind with coupled Navier–Stokes. A **weather-controlled rendering state** is sufficient for the current objective if its semantics, evolution and optical links are defensible. A physically based global circulation solver would add cost without evidence it fixes the observed morphology.

### B3. Concrete spatial representation and memory estimate

**First experiment**: world-anchored periodic/streaming regional fields covering, illustratively, a **64×64 km region at 256² samples** (250 m sampling). Store coverage, convection/type mix, precipitation potential and moisture in one `rgba16float` 2D texture (**0.5 MiB**); use a second RGBA16F for U10 vector/gust/stability/haze (**another 0.5 MiB**). Optional history buffers double those quantities, yielding about **2 MiB for two 2-texture states** before cloud volumes, shadows, mipmaps, overhead and other fields. One `r16float` 256² field is **0.125 MiB**. **These are byte calculations, not runtime allocation measurements.**

A 250 m grid cannot resolve individual gust filaments or small cloud edges; obtain those *procedurally from coherent finer-scale fields* and cloud-density erosion. A 64 km region is not the entire horizon: anchor regional maps in geospatial coordinates and synthesize low-frequency world-scale weather from deterministic hashed macro-cells, with camera-centered cache updates only when needed. World-origin rebasing must not reseed weather, cause phase jumps or shift precipitation fronts.

**Update proposal**: global target transition every time step; weather fields at 0.5–2 Hz; shadows/environment summaries on dirty-region thresholds with a maximum age; cloud raymarch/render as appropriate every frame or temporally reconstructed; astronomy as camera/time changes; ocean/foam at their existing simulation cadence. Frequency choices remain **unverified engineering settings** to profile, not guaranteed safe performance optimizations.

### B4. Evolution: explicit transitions, not decorative interpolation

- Maintain `current`, `target`, `age`, `history` and `eventSeed`; do not simply lerp unrelated cloud-type enum values.
- Advection: for scalar field `q`, an illustrative model is `∂q/∂t + u·∇q = S(q) − D(q)` with stable numerical transport and bounded correction. It is a reduced visual-weather model, not validated atmospheric fluid mechanics.
- Enforce cross-field constraints: rain shafts require supported precipitating condensate/clouds; lightning requires *electrically active convection*, not just dark overcast; dense low cloud shadow lowers direct illumination while diffuse skylight may vary, not always fall in strict proportion.
- Preserve mature *remote swell* while local wind changes; wind-sea energy should develop and decay without resetting complex Fourier phase. Instant-look preview may change appearance immediately, but must be labelled distinct from a physically evolving simulation.
- Near/large scale: separate regional rain bands and fronts from fine turbulence. Advect storm-cell center, event age and extent over minutes; animate individual rain drops over fractions of seconds.
- Preserve normalized area cloud coverage and optical depth through type blending as practical; arbitrary `mix` of different density functions can produce a physically nonsensical opaque slab.

### B5. Three decisive Phase 1 contract tests

**E1 — State continuity.** Fixed seed/UTC/camera; transition clear → broken marine cumulus → stratiform overcast → squall → clearing over a documented accelerated weather timeline. Export every field; verify boundedness, no sudden cloud-type reset, sustained old swell, no sea phase jumps and rain only where cloud precipitation support exists. Include instant-preview comparison separately.

**E2 — Spatial consistency.** Choose a 10–30 km rain front; move camera outside/inside it. Measure identical world-coordinates queried before and after origin rebasing; check rain field, cloud shadow and attenuated Sun match from above, ocean level and partial immersion.

**E3 — Cost.** Compare global-scalar baseline versus 2D field, at fixed quality, recording weather-update CPU time, GPU upload bytes, downstream atmosphere/cloud invalidations, cache reuse and visible frame-time tails. Do not promote on an isolated small update cost if light-cache recomputation becomes expensive.

### B6. Principal Phase 1 hazards

Confusing *intended design ranges* with observed physical values; shader-local weather controls violating ownership; frame rate controlling weather history; global scene transitions overriding swell; reused caches with stale Sun/cloud state; random visual noise in place of coherent advection; precipitation created from camera proximity; interpreting an accelerated weather demo as literal meteorological evolution. The contract must name all these explicitly.

---

## C. Phase 1 shared environmental lighting / radiance contract

### C1. Radiance, irradiance and transmittance are **different data**

- **Radiance** `L(x,ω,λ)` measures *directional* light reaching a point; spectral radiance has units W·m⁻²·sr⁻¹·nm⁻¹. Band-integrated radiance omits nm⁻¹; calibrated scene-linear RGB radiance has to specify its colorimetric convention. Ocean reflections require **angular** radiance, not only average cloud brightness.
- **Irradiance** `E(x) = ∫_hemisphere L(x,ω) max(0,n·ω)dω` has units W·m⁻². It supports diffuse/volume-light approximations and energy budgets, but one irradiance vector/scalar cannot reproduce a reflected cloud shape.
- **Transmittance** `T(x→y,λ)` is dimensionless and *multiplicative*. Clouds/aerosols attenuate sources; in-scattering is an additional radiance contribution. Never add the same attenuated light through multiple branches.
- **Exposure and white balance** belong to the final image-formation stage. If the inherited LUT/shaders are not absolutely radiometrically calibrated, adopt a clearly named **relative scene-linear radiance scale** and maintain conversion documentation. Do not label uncalibrated values as physically measured luminance or solar irradiance.

### C2. Recommended minimum shared products

| Product | Storage/meaning | Who produces / consumes | Invalidation |
|---|---|---|---|
| `sunDirection`, `moonDirection`, apparent angular radii | world unit vectors and radii | astronomy → all | time/location |
| `Lsun_clear`, `Lmoon_clear` | calibrated or clearly relative band radiance | atmosphere/astronomy → cloud, sea, rain | solar/lunar state/aerosols |
| `T_atmosphere(direction, depth)` | existing atmosphere LUTs | atmosphere → renderers | atmosphere parameters/altitude |
| `L_sky_clear(ω)` | angular sky radiance LUT / analytical eval | atmosphere → ocean, clouds, above/below water | sky LUT dirty |
| `T_cloud_sun(x)` | spatial cloud shadow / direct-beam transmittance | clouds → ocean/underwater/rain | cloud motion/type/Sun position |
| `E_sky_cloud(x)` or low-order angular basis | diffuse skylight under clouds | cloud + sky integration → water volume, foam, objects | cloud/atmosphere change |
| `L_sky_cloud(ω,x)` approximate | low-resolution directional environment representation | cloud + atmosphere → specular ocean | region/camera/cloud updates |
| `β_ext_aerosol(x,z)` and `β_ext_rain` | nonduplicate extinction coefficients | weather/rain → horizon & volume | changing aerosol/rain |
| `exposureEV/whiteBalance/toneMap` | one display transform | post → final output | user/eye adaptation; **not simulation** |

**Energy contract:** A useful decomposition is `L_sky_weather(ω,x) ≈ L_clear_sky(ω)*T_cloud(ω,x) + L_cloud_scattered(ω,x) + L_atmos_in_scattered(ω,x)` **only with carefully non-overlapping definitions**. Do not multiply or add components that already include cloud scattering/atmosphere twice. The decomposition is architectural, not a fully derived radiative-transfer equation. Cloud shading should use Sun + sky radiance that represent the *same* environmental state; its output contributes to sky radiance, but it must not be reintegrated as a self-illuminating new primary light at every frame.

**One-way dependency proposal:**

```text
Astronomical directions & source spectra
                 ↓
Clear atmosphere radiance / transmittance LUTs
                 ↓
Cloud direct transmittance, scattered appearance, diffuse-sky summary
                 ↓
One published scene-linear illumination frame (versioned/time stamped)
                 ↓
Ocean BRDF + volumeWater + foam + rain + spray + final sky
                 ↓
Tone mapping, exposure, output encoding
```

Shared data must carry `weatherVersion`, `sunVersion`, origin and timestamp; consumers either use a coherent published frame or explicitly interpolate compatible snapshots. Cache updates can be asynchronous, but stale results may not be combined with unrelated timestamps without quantified visual error.

### C3. Representation choice: do *not* rebuild cloud renderer for this contract

**Recommended Phase 1:** reuse clear-air atmosphere LUTs; add **world-space cloud direct-transmittance shadow field**, a **small cloud-aware diffuse irradiance product**, and a **low-resolution view-dependent environment radiance** for ocean reflection (or an on-demand angular sky evaluator if cheaper). A scalar sky brightness is not adequate for specular reflections; a full-resolution dynamic cubemap is not automatically justified. 

The accurate consumer expectation should be: direct Sun = source × atmosphere transmittance × cloud transmittance, diffuse sky = integrated cloud-aware radiance, specular sky = directional cloud-aware radiance. Foam/water body/underwater each consume appropriately different products. Underwater illumination must traverse air/cloud and air-sea transmission once, then underwater extinction/scattering; do not reuse clear-sky ambient as the final cloudy underwater input.

### C4. Small falsifiable lighting tests (Phase 1)

- **L1 Fixed exposure:** identical sun angle and ocean geometry, clear vs overcast; sky brightness, direct Sun, cloud shadow, ocean BRDF and underwater light must change coherently. Capture raw scene-linear debug outputs to prevent auto-exposure masking the error.
- **L2 Sun occultation:** sweep a high-optical-depth cloud across the solar disk, plot `T_cloud_sun`, direct illuminance, diffuse sky and ocean glint response. The direct component must dim; diffuse sky response need not be an identical multiplier.
- **L3 No double energy:** render clear atmosphere+Sun alone, then add zero-density clouds and check near-identity, then increase cloud extinction. If adding an empty cloud layer brightens the sea, investigate double counting.
- **L4 Angular reflection:** same ground point, move a dark cloud patch across reflected directions. The ocean specular image should respond directionally; a globally darkened water shader fails this test.
- **L5 Night/twilight:** distinguish lunar direction/phase and illumination from the Sun/twilight, and explicitly choose eye-like vs camera-like nighttime presentation. Do not invent absolute photometric fidelity from visually pleasing exposure.
- **L6 Continuity:** move cloud shadow and change UTC rapidly, verify versioned environment cache freshness, absence of ghosted old cloud reflections and stable chromatic balance.

**Why this is urgent:** published Phase 0 source review confirms `volumeWater` ignores cloud-aware ambient, cloud diffuse illumination partly uses clear-sky directional samples, and camera-centered rain does not track clouds. Contract integration directly addresses these measured integration gaps. [P0] Atmospheric lookup/spectral test methods: [Bruneton implementation and validation](https://ebruneton.github.io/precomputed_atmospheric_scattering/). Production integration evidence: [Nubis authoring](https://www.guerrilla-games.com/read/nubis-authoring-real-time-volumetric-cloudscapes-with-the-decima-engine); [Ubisoft Atmos](https://blog.playstation.com/?p=420230).

---
## D. Phase 2 — cloud reconstruction options, ranked for **experiments**

### D1. Phase 0 cloud diagnosis constrains the candidates

The inherited `clouds.js` density uses 3×3 ellipsoid-cell searches plus periodic volume noise. A separate overcast view exhibits rows even with `thermalShape` bypassed; the **base noise/profile also contributes to repetition**. The two Phase 0 density alternatives showed morphology failure even while the original lighting integrator stayed unchanged. The correct inference is *not* “volumetric clouds are too slow” or “use fewer samples.” It is **density representation and mesoscale organization must change while matching optical output**. The sampled column statistics reinforce this: baseline mean tau=0.788 and 17.97% sampled columns tau>1, while a faster cell prototype produced tau=5.178 and 63.96% tau>1. Such different scenes are invalid performance comparisons. [P0]

### D2. Architecture ranking

| Candidate | Why it might work | Principal cost/risk | Decision |
|---|---|---|---|
| **A. Regional weather-map + cloud-type vertical profiles + independently decorrelated erosion in existing volumetric raymarch** | Phase 0 rows and oversized masses require regional coherence, class-dependent shape, small-scale edge relief. Existing renderer/lighting can remain untouched for density-only A/B. Guerrilla's Nubis 2015/2017 supports regional authoring, coverage/type/precipitation controls and Perlin-Worley/detail noise. | Erosion may recover plausible silhouettes but retain excessive screen cost if empty space isn't skipped. Mapping weather field→density needs careful threshold/coverage calibration. | **First Phase 2 experiment**, not automatic production selection |
| **B. Layered/height-profile hybrid with optional selective volumes for convection** | Efficient broad stratocumulus/overcast with a separate deep-Cb representation; allows distinct vertical structures at lower average cost. | Layer slabs, intersections and visual discontinuity between weather types; may repeat mistakes of rejected cloud prototypes. | **Comparator** at matched optical depth and silhouette statistics |
| **C. Sparse voxel/SDF-accelerated clouds or authored volumes** | Advanced 3D forms, navigable/storm towers, possible empty-space skipping; Guerrilla's Nubis³ describes compressed SDFs, fluid-shaped volumes, light acceleration and voxel up-resolution. | Asset/memory complexity, streaming/history and generation, expensive authoring, uncertain benefit for offshore view. | **Conditional later** if A/B cannot achieve Cb scale + convincing silhouette with acceptable cost |
| D. Rare 2018 efficient geometry clouds | Cheap artist-controlled cloudscape with quarter-resolution treatment and strong stylized shaping. | Less appropriate for volumetric interiors, realistic storm towers and cloud shafts; different aesthetic. | **Technique reference** for low-cost distant layers, not immediate wholesale replacement |
| E. Current two Phase 0 density prototypes | Measured cheaper for selected scene. | Failed visual morphology, optical-depth/area mismatch; one overcast case slower. | **Reject in current form** |

**Production reference, not PELAGIC benchmark:** Guerrilla's [Nubis 2015](https://advances.realtimerendering.com/s2015/The%20Real-time%20Volumetric%20Cloudscapes%20of%20Horizon%20-%20Zero%20Dawn%20-%20ARTR.pdf), [2017 authoring talk](https://www.guerrilla-games.com/read/nubis-authoring-real-time-volumetric-cloudscapes-with-the-decima-engine), [2022 Nubis Evolved](https://www.guerrilla-games.com/read/nubis-evolved), and [2023 Nubis³](https://www.guerrilla-games.com/read/nubis-cubed). Guerrilla specifically documents *moving beyond* widely used 2.5D clouds to voxels for fly-through environments; that does **not** make sparse voxels the least-risk choice for PELAGIC Phase 2.

### D3. Required cloud morphology (WMO as a reference, not a procedural recipe)

| Regime | Morphology tests | Failure to watch |
|---|---|---|
| Marine cumulus | Distinct cells, irregular but organized footprint, buoyant vertical proportions, changing tops and erosion | Identical puffs aligned on a grid, white plastic cotton balls |
| Cloud streets | Elongated streaks **coherent with wind** at mesoscale, smaller embedded cumulus irregularity | Simple repeated 2D stripes without thermal structure |
| Stratocumulus | Large organized deck, cellular/open-vs-closed gaps and local thickness differences | Featureless slab, identical tiled bumps |
| Overcast/nimbostratus | Broad opacity with varied underside, relevant precipitation, limited direct Sun | Dark opaque ceiling regardless of actual cloud optical thickness; lightning in any overcast |
| Convective Cu congestus / Cb | Persistent narrow/updraft feeding region, high vertical towers, anvils where appropriate, associated rain/gust cells | Random thunderbolts in low flat cloud; top-down noise inflated into tower |
| Sunset/twilight | Correct shaded sides, bright silhouettes, deep interior extinction, wavelength-aware incident sky | Uniform orange tint, overbright cloud undersides and delayed lighting |

The [WMO International Cloud Atlas](https://cloudatlas.wmo.int/en/cloud-classification-summary.html) is the authoritative morphology vocabulary; low-cloud base often lies below ~2 km, while cumulonimbus tops can extend into higher levels. Specific cloud heights and color depend on region, climate and view; do not hard-code one universal altitude/type rule.

### D4. The first decisive Phase 2 experiment

1. **Do not alter the atmosphere/cloud integrator.** Use current lighting, camera, output and exposure. Replace density generation behind an opt-in switch.
2. Generate slow coherent macro weather organization using the Phase 1 2D fields; add vertical profiles per family; displace/erode density with decorrelated coarse + medium + fine procedural structure, with amplitudes measured in meters.
3. Define a *morphology/occupancy matched set*: clear cumulus, broken deck, dense overcast, convective tower. Before performance claims, match approximate **projected cloud fraction**, distributions of **integrated vertical optical depth**, and matched exposure, not merely sliders.
4. Vary one density parameter at a time. Keep deterministic 3D seed/clock and fixed camera. Capture opacity-only, density slice, raymarch step counts, cloud-shadow and final HDR/SDR. Independently review silhouette repeat, aspect ratios, cell clustering, edges and scene-specific color.
5. Measure both the cloud raymarch and downstream environment/reflection invalidations. A 5 ms cloud pass that forces a 15 ms environment recompute is not a 5 ms feature.
6. Only if morphology passes, prototype adaptive stepping/empty-space skipping and reduced-resolution integration. Use ocean horizon and camera pan as severe temporal-reprojection tests.

**No premature winner.** Candidate A ranks first because it targets the observed cause with the smallest change. If it fails at matched quality, test B. Move to C only on a documented representational failure. Recorded cloud-screen baseline and prototypes are bounded single-scene timings, not quality-equivalent FPS projections.

---

## E. Storms, precipitation and lightning as causally linked events

### E1. Three different marine weather scenarios

**Non-convective overcast/rain:** layered moisture, wider precipitation region, subdued direct Sun, usually no lightning. **Squall:** rapid wind increase, organized moving front, sometimes (but not always) convective rain. **Electrical convection/thunderstorm:** deep vertical cloud and hydrometeor processes, gust fronts, localized strong shafts, possible lightning. NOAA distinguishes squall as a sudden wind increase and thunderstorm lines as active convective systems; they are not synonyms. [NOAA glossary](https://marine.weather.gov/glossary.php?word=SQUALL+LINE), [NOAA severe-weather types](https://www.noaa.gov/jetstream/tstrmtypes), [NOAA gust front](https://www.nesdis.noaa.gov/about/k-12-education/severe-weather/what-gust-front).

### E2. Recommended connected storm representation

- **Shared sparse cell/front event**: center, velocity, extent, lifecycle, updraft/convection proxy, cloud water, precipitation rate, precipitation footprint, gust-front geometry, lightning eligibility/severity. Events are coarse 2D weather structures, not individual simulated ice crystals.
- **3D cloud density** consumes type/vertical growth fields. A towering Cb should be anchored to an evolving cell, not spawned when the user toggles a random VFX flag.
- **Rain shafts** emerge under precipitating condensate in the cell. A far shaft may be volumetric/opacity-cone or screen-space integrated haze; nearby rain is directional particles/streaks with apparent speed and perspective, attached to world-space front rather than the camera.
- **Wind-driven rain** velocities combine fall and local air advection; spray from sea breaking uses a separate water-surface source and wind field. Rain splash events only occur in affected surface regions.
- **Optical effects**: cloud shadow, rain attenuation, aerosol/fog extinction and diffuse skylight share the Phase 1 contract. Avoid a second arbitrary “storm darkening” multiplier after physical light transport.
- **Lightning**: eligible only for convective electrically active cells; sample 3D branch path within/near cloud, integrate brief pulse through cloud, rain and sky light, then reflect the same flash off ocean. Time-scale variations (sub-flashes, pulses) should be visible in high-fps captures. Do **not** imply every storm fires lightning.
- **Thunder**: if sound later exists, distance-dependent delayed audio is separate; do not let audio drive visuals.

### E3. Ownership by phase

| Work | Phase 1 | Phase 2 | Phase 3 |
|---|---|---|---|
| Storm event state, type distinction, world-space precipitation eligibility, wind/gust metadata | **Interface/data and deterministic transitions** | Consume from cloud density | Populate real cloud-derived rain/gust behavior |
| Cloud development, deep convection, coherent overcast + cloud rain footprint | Contract only | **Cloud morphology + light validation** | Weather evolution/precipitation coupling refinement |
| Direct/diffuse lighting, extinction, sky/cloud reflection | **Shared contract; fix clear-sky coupling defects** | Per-cloud result and shadow refinement | Validate lightning/rain-driven changes |
| Near rain, distant shafts, splash, spray haze | Source/receiver contracts | Test cloud attachment | **Full effects integration** |
| Lightning branching and illumination | Lightning-eligible cell fields + radiance pulse interface | Validate cloud-volume response | **Implement/validate conditional event** |

**Test:** separate stratiform rain, non-electrical squall and electrical Cb, each with a moving front, from three camera distances. The system fails if a rain shaft does not line up with its source, if distant rain moves with camera, if lightning occurs without supported convection, or if the lightning brightens clouds but not the ocean from the same view.

---

## F. Later ocean representation — correct the *measured* periodicity

### F1. The actual Phase 0 diagnosis

P0's independent modal enumeration did **not** find that a linear Gaussian sea inherently lacks wave groups: three-seed envelope coefficient of variation was approximately 0.47–0.56. Sparse energy-dominant modes and a 1,103 m periodic domain still produce visually recognizable recurrence. At an x-shift of 1,103 m expected correlations were 0.8765 (calm), 0.8704 (midday) and **0.9730 (storm)**. The current recurrence is real; the precise minimum-cost cure is not established. A jittered-bin toy reduced correlation but did not reweight modal spectral energy; a stretched extra FFT patch changed wave wavelength/period and was rejected. [TEST P0]

### F2. Candidate experiments for Phase 4

| Candidate | Physical/mathematical merit | Consistency risk | Proposed test and verdict |
|---|---|---|---|
| **Energy-reweighted non-grid low-frequency Fourier modes** | Breaks coherence on the fundamental tile while preserving base FFT for short and medium waves; direct evaluation feasible for modest mode counts | Incorrect quadrature biases Hm0/Tp/direction; derivatives and time phase must follow true k/dispersion | **Highest-value first cheap experiment**: fit mode weights to target energy, compare ensembles and recurrence; reject if statistics drift or cost/aliasing grows |
| **Ubisoft La Forge 2024 covariance-preserving hex tiling/blending** | Explicit published method: randomly selected exemplar content, three hex contributions, smooth barycentric weights, covariance-preserving vector blending; can enhance existing displacement/normal maps | Normal-from-displacement derivative may disagree if transformed separately; tile boundaries, temporal drift, changed physical correlation structure | **Strong second experiment**: derivative agreement, spectral covariance, temporal phase, seams, coast-free horizon, GPU cost |
| Independent long-wave patch/spectral grids | Extends spatial period if genuinely independent long modes with correct wavelengths | Additional FFTs/memory; simple stretches violate dispersion | Conditional; require measured absence of periodicity and calibrated spectrum |
| Rotated/offset identical FFT tiles | Cheap apparent visual change | Rotations may violate wind direction/directional spread; offsets still periodic; choppiness derivatives may mismatch | **Reject as stand-alone physical fix**; perhaps only controlled randomized microdetail |
| Spatially varying phases/amplitudes | Local gusts and different sea patches without repeating patterns | Breaks intended dispersion/energy balance; gradient continuity difficult | Research comparator; do not blend arbitrary wave phases every frame |
| **Dynamic Wave Trains (Fournier et al., 2026)** | Published method builds locally controlled procedural trains with efficient height/normal/roughness evaluation, examples of refraction/diffraction/wind ripples | Different basis and assumptions; not a turnkey drop-in replacement; no direct roller/whitewater geometry | **Isolated supplemental prototype**, not a global FFT migration |

**Crucial reading correction:** Ubisoft's blog states that its synthesis uses **covariance-preserving** rather than naive linear blending so that the synthesized vectors retain statistical coherence with the exemplar. The paper's spatial covariance preservation does not prove every physical dynamical invariant is maintained after PELAGIC adds choppy geometry, sun-glint BRDF and foam. Separate checks are required. [Ubisoft La Forge](https://www.ubisoft.com/en-us/studio/laforge/news/5WHMK3tLGMGsqhxmWls1Jw/making-waves-in-ocean-surface-rendering-using-tiling-and-blending).

The 2026 [Dynamic Wave Trains paper](https://onlinelibrary.wiley.com/doi/full/10.1111/cgf.70495) demonstrates spatial control of wave trains with height/normal/roughness/phase applications and environmental wave behavior, but explicitly remains a height-field-family representation rather than automatically simulating 3D breaking rollers. Its performance on PELAGIC's RTX 3050/Chrome is unknown.

### F3. Decisive spectral/visual gate

- Match **total variance/Hm0** and spectral energy, dominant period/direction, cross-wave/swell distributions, and spatially sampled slopes. Use multiple independent seeds with confidence intervals where stochastic claims are made.
- Verify `∂displacement/∂x,y` against the normal/roughness source after synthesis, including seam crossings. Reject aperiodic imagery with detached glints or geometric creases.
- Measure spatial autocorrelation on world-space transects longer than several FFT tiles; explicitly test storm, calm and crossing seas. Include *time-lag* correlation and continuity during camera movement.
- Evaluate 0.5, 2, 50 and 500 m camera heights at fixed Sun/exposure; compare surface motion videos, not screenshots alone.
- Measure incremental compute/surface shader GPU milliseconds, memory, cache/tile update cost and 99th-percentile frame tails.
- Reject any method that merely scrambles the image to suppress autocorrelation at the price of dispersion, energy conservation or recognizable swell organization.

**Disposition:** FFT stays. Phase 4 compares direct long-mode diversification and Ubisoft-style synthesis before committing to either; Dynamic Wave Trains is an experimental competitor for controlled regions, not a required replacement.

---
## G. Phase 5 — real offshore breaking and connected whitewater

### G1. What is physically justified versus only visually suggestive

**Verified general principle (LIT):** a single-valued height-field ocean cannot explicitly represent a freely overturned lip, hollow roller or multiple free-surface intersections at the same horizontal position. [Guerrilla SIGGRAPH 2022](https://advances.realtimerendering.com/s2022/SIGGRAPH2022-Advances-Water-Malan.pdf) proves one *production* workaround: wave cross-section deformation derived from offline material, directed along wavefronts. **Transfer limit:** Guerrilla's primary use case was authored shoreline breaking, whereas PELAGIC needs irregular spontaneous *offshore* breaking, less predictable in location/direction/duration. The production result is evidence for hybrid representation, **not** validated offshore onset or event statistics.

The [Barthelemy et al. 2018 research](https://www.cambridge.org/core/journals/journal-of-fluid-mechanics/article/abs/on-a-unified-breaking-onset-threshold-for-gravity-waves-in-deep-and-intermediate-depth-water/63A8E661999DEC94EB3B7BADC729DB0F) examines near-crest local energy flux/crest speed for nonlinear focusing waves, with related validations in [Derakhti et al. 2020](https://doi.org/10.1029/2019jc015886). **Do not substitute velocity from a linear FFT into B≈0.85 and call it scientific breaking detection.** P0 already found that extension unjustified. A compression/Jacobian criterion may remain a visually useful *candidate predictor* for whitecaps, but its hit/false-positive rate against independent nonlinear references must be established.

### G2. Two-tier architecture to compare

| Candidate | Pipeline | Strengths | Main deficiency | Verdict |
|---|---|---|---|---|
| **I. Calibrated event-driven whitewater patch** | Track candidate crest region → validate onset against reference/heuristic thresholds → create evolving whitewater/foam patch with source strength, residual lifespan, advection and dissipated energy → sparse spray | Smallest plausible improvement to visible open-sea foam, integrated with current FFT/foam | Does not by itself produce geometric overturning; must never be described as a fully broken crest | **First baseline candidate; conditional** |
| **II. Explicit local 3D roller/sheet patch** | Same event manager → instantiate local parametric/mesh deformation carrying time-varying lip + overhang → blend with FFT boundary and normals → emit foam and spray from collapse → remove with energy accounting | Can create the silhouette the height field fundamentally lacks | Attachment seams, surface multi-hit shading, self-intersections, memory/fragment overdraw, uncertain generalized offshore behavior | **High-value phase 5 experiment after event proof** |
| Full-domain volumetric free-surface fluids | 3D simulation everywhere | Broad physical expressiveness | Prohibitively large scope and no demonstrated necessity for PELAGIC offshore cinematic realism | **Reject for now** |

### G3. Event contract (proposed, not validated)

Every candidate event has `eventId`, world-space location/front tangent, propagation direction, crest length, speed, lifetime, source wave period, triggering measurements, pre-event wave energy proxy, estimated dissipation, roller state, foam mass/coverage, spray emission and all timestamps. During the event the base FFT is continuous; any added breaking representation must join at its boundary and not introduce unaccounted “extra water” or a second contradicting normal field. Foam, bubbles and spray share the event's history rather than independently spawning at aesthetically convenient positions.

**Small tests before implementing full renderer effects:**

1. Manufacture a small nonlinear focusing-wave packet from a validated solver/literature example and track the crest speed and water particle velocity; compare onset predictor to true onset. Report false positives/negatives, not just one good-looking clip.
2. Introduce a single breaker into a fixed FFT sea; turn on wireframe/surface normals and fixed exposure. Inspect lip continuity, local spatial support, waves on either side, spray origin and transport.
3. Repeated sparse events at measured sea-state whitecap coverage; verify that events do not form a uniform grid or burst at the same simulated phase every cycle.
4. Compare a lower-cost no-overhang whitewater-only variant against explicit 3D rollers under same Sun and geometry, measuring matched visual utility vs GPU cost.

**Decision:** Phase 1 should only define the common event and weather/lighting interfaces. Breaker onset and geometry remain **UNVERIFIED until Phase 5**.

---

## H. Phase 6 — water optics, color, sun glitter and photographic image formation

### H1. A scientifically motivated diagnostic decomposition

For surface viewing, separate **reflected sky/cloud/sun radiance** from **water-leaving radiance**. This distinction is basic to ocean remote sensing: NASA explicitly identifies sky/aerosol reflection and sunglint as contributions that must be removed to retrieve water-leaving ocean color. [NASA MODIS ocean reflectance](https://modis.gsfc.nasa.gov/data/dataprod/Rrs.php).

A conceptual shader decomposition (not full ocean radiative transfer) is:

`Lcamera ≈ Fresnel(ω,N) · Lreflection + (1−Fresnel) · Lwater-leaving + Lfoam/spray`, with cloud/atmospheric transmission applied in a **defined** order, and without counting in-scattering twice. For subsurface light, model wavelength-dependent absorption/scattering and path length rather than preset hue. Phase 0 found that a simple positive *diagonal three-channel exponential* could not perfectly fit longer-path spectral results; **this does not mandate that the whole renderer become spectral**. It requires an error budget and a suitable approximate representation.

Phase 0's optically diagnostic color A/B matters: the extra 55% desaturation off/on changed midday maximum display color by only 2/255, while golden highlights had a larger difference. Therefore **do not present removing desaturation as a credible general solution** for metallic water.

### H2. Recommended experiment ranking

| Rank | Experiment | Why it is high value | Cost / caveat |
|---|---|---|---|
| **1** | Lock fixed exposure + isolate body/reflection/glitter/foam/sky in scene-linear HDR | Establishes which layer actually creates gray/metallic look, avoids arbitrary grading | Diagnostic shaders; no core algorithm swap |
| **2** | **Cloud-aware angular sky radiance** reflected from geometry-correct wave normals | Fixes direct evidence of sky/water illumination mismatch | Environment update frequency may be expensive; profile cache invalidation |
| **3** | **Slope-moment BRDF filtering** (LEAN-style or comparable) with geometry/normal/unresolved transition | Suppresses “plastic shine” and sparkly subpixel instability while preserving glints | Requires correct normal covariance and representation; test MIPs and directionality |
| **4** | Finite solar/lunar disk + surface-slope microfacet integration | Improves realistic glitter paths and low-Sun reflectance | Avoid broad artificially widened highlight masking physics |
| **5** | Controlled water-body spectral-fit family and path length | Calibrates dark offshore body and translucency under changing light | RGB approximation residuals at long paths; avoid invented spectral fidelity |
| **6** | Coherent atmosphere horizon & aerial perspective | Repairs separation between water and sky; strong perceptual improvement | Must avoid double aerosol fog and overblurring |
| **7** | Full color pipeline (white point/primaries/AgX, gamut mapping, exposure adaptation) | Night, twilight, golden highlights can be wrong even with correct optics | Matrix inversion PASS alone does **not** prove complete display correctness |

[LEAN Mapping, Olano & Baker, I3D 2010](https://userpages.cs.umbc.edu/olano/papers/lean/) includes a published errata sheet—use the corrected variance/normalization formulas. [Bruneton et al., geometry-to-BRDF ocean transitions](https://doi.org/10.1111/j.1467-8659.2009.01618.x) supports allocating physical geometry, visible normals and statistical roughness by projected scale. [Rare SIGGRAPH 2018](https://history.siggraph.org/wp-content/uploads/2022/09/2018-Talks-Ang_The-Technical-Art-of-Sea-of-Thieves.pdf) supports art-directed but targeted sub-surface color/foam/area-specular approximations; its look is deliberately more stylized than PELAGIC's objective.

**Reflections hierarchy:** At offshore viewpoints with no dominant close objects, the highest-value inputs are Sun/Moon and directional sky/cloud radiance. SSR or full dynamic reflection cubemaps are not justified solely because native AAA engines sometimes have them. Sky/cloud reflection must track the same region/age as the displayed clouds.

### H3. Required test cases

- Three measured/controlled wave states (light wind sea, clean incoming swell, rough/crossing sea) × three angles (toward, across, away from Sun) × six illumination states (midday, overcast, low Sun, storm, twilight, moonlit).
- Distinct debug outputs: surface normal and Jacobian, slope covariance, cloud transmittance, clear/cloud sky, Fresnel, body radiance, sun glitter, foam, pre-tone HDR, gamut diagnostics and final display.
- **Fixed-exposure A/B first**; then subjective exposure and white balance. Test 500 m horizon and near-water glints in continuous panning video.
- A valid change improves the right layer without creating excess total energy or large temporal instability; light leaks or path-length changes under camera motion disqualify seemingly prettier static results.

### H4. Color pipeline audit checkpoint

Track display stages explicitly: source spectral/linear color → chosen scene-linear primaries → direct/diffuse/cloud/water compositing → exposure → white balance/adaptation → tone map/AgX family → gamut mapping → output encoding/canvas color space. The P0 AgX input/output matrices invert accurately in isolation (~3e−15), but this **does not validate the tone curve, calibrated white balance or final output gamut**. Test actual basis vectors, neutral gray, saturated colors, highlights and near-black under both sRGB and any optional HDR/P3 output; label the physical scope of tests.

---

## I. Phase 7 — near-water waterline and underwater correction

**Key confirmed negative control:** At frozen wave time 20 s, camera height readback stayed at `0.20714130997657776 m`, yet a straight slanted partial-immersion boundary remained in the recorded 6 s frame. **Thus moving-wave readback lag alone is disproven as a complete cause.** The live camera-follow probe was 1–8 frames old in capture mode and up to 30 frames old in matched display-paced runs, so lag remains a secondary failure for moving surfaces. P0's optical classification uses a current GPU near-plane map, while `lensDisplacement` represents the finest raster grid and not generally the coarse/morphed visible CDLOD geometry. [TEST/VIS/SRC in P0]

### I1. Plausible causes to discriminate—not assume

1. **Near-plane water classification represents a tangent/local facet**, not a correct per-ray intersection with the actually displaced/LOD-morphed visible surface.
2. **Geometry/optical disagreement:** vertex-displaced CDLOD water mesh and the near-plane sampled wave height or lens displacement differ in filtering, morph state or geometric representation.
3. **Screen-space mask aliasing:** insufficient near-plane resolution or sampling along the steep/water intersection yields straight slivers.
4. **Fold/multiple-hit issue:** an overhanging future breaker invalidates any single-height test even if an FFT height field works elsewhere.
5. **Stale camera tracking:** causes mismatch during moving waves but cannot explain the frozen-wave control by itself.
6. **Air–water ray path and TIR:** incorrect Snell/reflection branch or moving medium classification produces light seams rather than true waterline geometry.

### I2. Lowest-risk test sequence

| Test | Observation to record | Discriminates |
|---|---|---|
| **Frozen flat plane** and moving camera crossing | Compare analytical ray-plane intersection to current classifier | whether base near-plane ray direction/threshold is wrong |
| **Frozen displaced sinusoid** with known analytic intersection | Per-pixel intersection and visible geometry delta | facet approximation vs actual intersection |
| **CDLOD morph on/off**, fixed waves and camera path | Waterline shape/normal and where slivers occur | visible mesh vs optical representation mismatch |
| **Near-plane resolution sweep** | Screen mask errors vs memory/timing | discretization aliasing |
| **Synchronous GPU-resident height classification** in diagnostics | Difference from stale CPU-followed camera height | readback lag contribution |
| **Partial immersion refraction + TIR sweep** | Ray paths, Fresnel, water/air energy | optical vs geometric failure |
| Fast/slow crossings at fixed phase and evolving sea | temporal slivers, continuity and first-hit depth | motion history and multiple hits |

**Implementation shortlist to test in Phase 7:** (i) use a shared displaced-surface query/height+derivative contract consistent with the actual CDLOD morph and optics; (ii) evaluate a bounded ray-to-height-field intersection or higher-order local surface approximation near the camera, with robust epsilon/origin handling; (iii) maintain a GPU-resident camera immersion state/height predictor and decouple gameplay follow from optical per-pixel intersection. Camera readback should never force a frame-blocking synchronization. Any fallback near the camera should be **visibly compared with true geometry**, not hidden by blur or arbitrary fade.

Near-surface mixing and Snell/TIR should follow physically correct medium selection; underwater lighting must consume the same **cloud-aware** illumination product defined in Phase 1, followed by water optical transport. Test origin rebasing, 60°–110° FOV variants, steep wave cases and camera travel over hours of simulation time. All remain proposals until reproduced.

---
## J. Performance/stability — actual measured gaps and one-second stall investigation

### J1. Use the measured per-subsystem ownership, not false arithmetic

The published 1080p, adaptive-off Golden Balanced figures:

| Measured group | P0 median GPU time | Provisional comparable budget | Ratio of median to budget |
|---|---:|---:|---:|
| Simulation/shared compute | **1.507 ms** | 2.0 ms | 0.75× |
| Atmosphere + common environment | **20.775 ms** | 4.7 ms | **4.42×** |
| Surface + transparent effects | **19.726 ms** | 6.5 ms | **3.03×** |
| Postprocessing | **0.393 ms** | 0.8 ms | 0.49× |

**Interpretation:** The observed targets are far away for atmosphere/environment and surface. The per-pass medians *do not sum exactly into display-paced FPS*, since GPU/CPU overlap, queue behavior, instrumentation changes, and median of sums differs from sum of medians. The 60 FPS Balanced (16.67 ms) and 30 FPS High (33.33 ms) targets remain **provisional aspirations**. Do not declare any measured gain before new real-hardware profiling.

The cloud density comparison was visually non-equivalent; it cannot be plugged directly into a calculated 60 FPS projection. High split-pass cloud-screen/environment were 42.697/17.170 ms; splitting itself may add overhead. P0 telemetry up to 87°C, 75.62 W and 1,151 MiB board-wide observed GPU memory includes other system work. Neither proves VRAM pressure nor thermal throttling. See performance contract and P0 evidence provenance.
### J2. Most promising optimization investigations (ranked by observed leverage)

| Rank | Experiment | Evidence to collect | Benefit potential / risk |
|---|---|---|---|
| 1 | **Atmosphere / cloud / env update frequency and invalidation profile** | Separate cloud render, shadow, irradiance, environment radiance, LUT updates; dirty-region frequency and age | Large observed time group; stale lighting/ghosting risk if update too slowly |
| 2 | **Fragment invocation and horizon overdraw instrumentation** | camera height/FOV/yaw × resolution × surface pass, pixel shader cost and overdraw | Large surface budget gap; can identify shader-bound vs geometry-bound work |
| 3 | **Reflection traversal and resolved/unresolved normal LOD** | sample count, max steps, early-outs, projected footprint, worst-case low-angle pixels | Strong prospect for optical savings with filtering; risk losing glint/detail |
| 4 | **Cloud density lookups, empty-space skip, raymarch adaptivity** | matched optical depth, step histograms, visible silhouette fidelity | Potential major savings *only after* morphology equalizes |
| 5 | **Render-graph cache/reuse and resource ledger** | live image bytes, lifetime, per-frame allocation counts, invalidation | Moderate savings, high stability value; risk using stale world/time resources |
| 6 | **FFT organization, subgroup/f16 packing** | FFT isolated timings across sea states, numerical errors at long times | Low immediate priority because current measured sim ~1.5 ms; precision risks |
| 7 | **Temporal upsampling/dynamic resolution** | PSNR/SSIM are insufficient; judge water glitter, thin cloud edges, ghosting on panning | Good if fragment-limited; temporal errors can destroy naturalism |

A reduction in physical representation *only because it is cheaper* is not an accepted improvement; every experiment must preserve the four independent physics/numerics/visual/craft gates.

### J3. Diagnose ~1.0-second frame stalls without guessing

P0 reported p99 1,000.1 ms in an alternate storm view, 42 frames >500 ms in that bounded run, and a different historical storm camera at 32.28 FPS with **no** frames >500 ms. All frame records were marked visible. This makes simple background-tab throttling less likely, **not impossible**: browser/OS scheduling, browser recording, document visibility signal and compositor pacing should still be checked. Repeated near-1,007 ms spikes could be an automation/wait policy, sync/readback, queue pressure, driver/work scheduling or a correlated external process. **There is no confirmed cause.**

**Prioritized discrimination procedure:**

1. **Capture one common clock:** collect `performance.now()` before and after rAF callback start, JS update, command encode, submit, after submit, and presentation proxy. Record every `document.visibilityState`, focus/blur, resize, device loss, UTC, scene, camera, power state. Attach GPU timestamps for passes and record *when* queries resolve, not just their values.
2. **Mark CPU long animation frames:** use DevTools Performance trace and [Chrome Long Animation Frames API](https://developer.chrome.com/docs/web-platform/long-animation-frames). If a ~1000 ms stall contains a visible large JS task/GC, investigate allocation and shader construction. If the rAF **arrival itself** is ~1000 ms late while main thread is free, inspect compositor vsync, scheduling, automation and OS power conditions.
3. **Toggle capture/queries/readbacks** individually: run with all optional GPU readbacks and `mapAsync`/`queue.onSubmittedWorkDone()` consumers disabled; then one diagnostic at a time. A stall disappearing only when a staging readback is removed points toward a CPU–GPU synchronization chain, not toward higher wave complexity.
4. **Isolate GPU-bound work:** run matched scene at half internal raster resolution while preserving simulation. If surface GPU time approximately tracks pixel count, fragment shading/overdraw is implicated. Repeat with cloud pass disabled only as a **diagnostic** (never a quality-equivalent benchmark). Distinguish isolated GPU timestamp increase from presentation pauses.
5. **View and scene matrix:** golden/storm × yaw 4° and 79° × surface/2 m/500 m camera × Balanced/High. P0's view sensitivity is a useful controlled variable. Keep seed, sky Sun, cloud field, scale and output fixed.
6. **Check OS/environment:** Windows power plan/AC, other GPU clients closed when feasible, GPU temperature/power/clock sampled with aligned timestamps, GPU process resets and browser DevTools warnings, graphics-driver version. If thermal or power causal, long-run first/second halves and power traces should covary with spikes.
7. **Trace GPU queue/browser process only after narrowing:** Chrome tracing/performance profiling with reproducible small run; preserve trace and annotate when stall begins/ends. Do not overcollect expensive diagnostic instrumentation in the primary performance benchmark.
8. **Re-run no-instrumentation clean pass** on actual RTX 3050 and only call a root cause confirmed if changing one factor repeatedly changes stall incidence at controlled scene/work conditions.

**Predictions / signatures** (hypotheses, not conclusions):

| Observation | More likely explanation | Countercheck |
|---|---|---|
| long rAF gap, low CPU/GPU per-pass workload, zero long task | scheduling/compositor/automation policy | browser trace and bare rAF probe |
| long JS task or frequent GC event | allocations, compilation, synchronous app work | heap/allocation timeline, stage markers |
| JS frame blocked awaiting mapped buffer/query | GPU readback/synchronization | remove/pipeline asynchronous readbacks |
| GPU pass duration truly spikes with view/angle | fragment overdraw, raymarch traversal, driver saturation | pixel scale, ray-step counters, GPU timestamps |
| stalls grow with thermal trend | clocks/power throttling possible | controlled AC, cooldown/repeat, clock/temperature aligned |
| periodic ~1 s only in automated capture | harness scheduling or capture interaction possible | direct manual foreground run versus harness |

[MDN requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) documents frequency and hidden-tab pauses; that is **not** proof it caused PELAGIC's visible-page spikes. [Chrome WebGPU developer features](https://developer.chrome.com/docs/web-platform/webgpu/developer-features) describes timestamp quantization and deeper diagnostics. Quantized small pass timings must not be overinterpreted.

### J4. Browser-specific engineering decisions

- Standard WebGPU shader stages are compute, vertex and fragment; native hardware tessellation/raytracing assumptions cannot be copied directly. Preserve CDLOD or consider isolated compute geometry only after geometry evidence.
- Device limits/features are **queried** (`adapter.features`, limits) and recorded; shader-f16, subgroups, extra formats are optional experiments only. Windows/RTX support depends on browser/backend/driver, not release-note headlines. [Chrome 155–156 WebGPU updates](https://developer.chrome.com/blog/new-in-webgpu-155-156).
- **Do not depend on temporarily disabled WGSL `fragment_depth`** in Chrome 155–156, whose experimental extension was disabled due to Windows compilation errors. Likewise, experimental bindless features are not a robust mandatory baseline.
- GPU timestamp queries, `getCompilationInfo`, uncaptured errors, device loss and asynchronous pipeline preparation help; they do not replace graphics-driver/GPU process profiling.
- Maintain a byte ledger for all app-owned textures, buffers and staging resources, with explicit physical-VRAM caveat. The current budget's ~3 GiB app-managed envelope on a 4 GiB GPU is a **planning allowance**, not a measured residency guarantee. Render-target **lower bounds** of 117.77/119.97 MiB do not count FFT, cloud volumes, intermediate buffers or browser memory.
- Keep consistent shader coordinates across FFT fields, weather cells, cloud density, shadows, near-field rain and waterline after origin rebasing. Use camera-relative floats plus precision-preserving global origin modulo where appropriate.

### J5. Tier policy

**Balanced:** all essential physically plausible marine behavior and coherent lighting; scale cloud rays, distant detail/filtering, reflection samples and reconstruction after objective comparison. **High:** more sampling and richer volume/foam representation with measured interactive cost. **Cinematic:** quality-first image/video mode without claiming interactive FPS. **Never make storm physically flatter merely because Balanced is selected**; adjust representation accuracy with documented errors. Runtime artifacts (shimmer, cloud lag, frame spikes) are quality failures in every tier.

---

## K. Professional visual-development procedure for a single coding agent

The most useful AAA art-production lesson is not “add details,” but **separate physical diagnosis from final artistic grading**. Astra can adopt this without a large project-management process:

1. **One visual hypothesis card per meaningful change.** Five lines: observed defect, suspected layer, falsifying test, expected difference, and known regression risk. E.g. “storm ocean metallic due to cloud-unaware specular sky: freeze waves and exposure, compare sky reflection vs body output with/without cloud radiance; reject if banded reflection remains.”
2. **Observe before implementing.** Start from 3–5 physically appropriate real reference images/videos for that condition; record what is invariant (scale ratios, cloud shape, glint direction) and what is unknowable (lens exposure, wind measurement).
3. **Isolation order.** For waves: grayscale unlit displaced geometry → derivatives/normals → surface roughness → sky reflection → foam. For clouds: density slices and occupancy → morphology-only contrast → light/shadows → integration. For color: scene-linear fixed exposure → tone mapper → optional auto exposure.
4. **Controlled A/B.** Same code commit except targeted change, same UTC/sun, camera, wave phase, seed, exposure, output resolution, noise histories, cloud optical-depth target and frame sample times. Align original frames by timestamp, not only clip duration.
5. **Temporal evidence.** 10–30 second movement clips with smooth camera orbit, hovering near water, several cloud advection periods, weather transition and onset/decay. Each stage's report must distinguish what screenshots prove and what motion footage proves.
6. **Blind paired review where practical.** Show pairs with random left/right identity; independently rate morphology, temporal coherence, color realism, atmosphere/ocean integration and image craftsmanship. Do not claim statistical significance from a handful of subjective votes.
7. **Acceptance ledger.** Mark each test separately: physical/scientific, numerical/stability, visual/temporal, craftsmanship, plus mandatory performance/reliability. Faster is not “better” if visual morphology fails. Keep a revertible baseline and a one-paragraph why/why-not decision.

**Useful practical visual probes**: cloud binary occupancy map, optical-depth histogram, height/coverage/type maps, sun transmittance map, sky radiance angular slice, radiometric split of water body vs Fresnel reflection, slope covariance, specular MIP footprint, foam event birth/advection/death and visible normal geometry at waterline.

---
## L. Curated real-world reference board — 18 traceable records

**Purpose:** These links are **image/video source records**, not a bundled set of redistributed images. Open original record pages for files, EXIF, context and rights. Satellite observations establish **cloud organization and large-scale reflected radiance patterns**, not water-level appearance or ordinary human-eye color. Coastal photos are marked *proxies* for offshore geometry; don't pretend that their wave heights/periods describe open-ocean swell. Where no actual wind, camera exposure, weather station, direction or wave period is published, this is explicitly **unknown**.

**Licensing:** Each Wikimedia Commons image has its *own* license on the linked file page. CC BY requires attribution; CC BY-SA additionally may impose share-alike on adaptations. NASA imagery generally is usable for educational/informational purposes with credit, subject to [NASA Media Usage Guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/); third-party protected material and NASA insignia have additional limits. **Do not assume NASA as a blanket license for every site image.** Original NASA pages give asset-specific credit, and this report reproduces no photograph. WMO Cloud Atlas is used for educational viewing and cloud classification; downloading/republishing atlas plates requires checking its own rights.

| ID / scene and source link | Author / institution & known capture context | Rights and metadata limitations | Exactly what Astra should inspect |
|---|---|---|---|
| **R01.** [Rolling wave, Raglan, New Zealand](https://commons.wikimedia.org/wiki/File:Rolling_wave_%28Unsplash%29.jpg) | Tim Marshall (Unsplash); Ngarunui Beach, Raglan; 27 Apr 2016; Canon EOS M, 1/4000 s, ISO 100; archival EXIF and coastal geolocation | **CC0 1.0** per Commons archival record; *coastal* breaker, not offshore sea. Local wind, period, processing unknown | Crest lip, surface translucency, spray sheet and close-scale high-frequency shape |
| **R02.** [Waves in the Pacific Ocean](https://commons.wikimedia.org/wiki/File:Waves_in_the_Pacific_Ocean.jpg) | Andywallxyz, own work; uploaded 2025; physical shooting parameters on image page if available | **CC BY 4.0**; camera height, wind and wave measurements **unknown** | Broad ocean-wave aspect, daylight color, layered swell geometry |
| **R03.** [Open ocean with clouds](https://commons.wikimedia.org/wiki/File:Open_ocean_with_clouds.jpg) | Nelsnelson, own work; 2025 upload; iPhone 13 mini EXIF | **CC BY-SA 4.0**; weather/time/geographic location not independently established | Near-horizon ocean/sky separation, broken-cloud occupancy, actual water hue vs sky |
| **R04.** [Ocean waves in the dusk, Arabian Sea, India](https://commons.wikimedia.org/wiki/File:Ocean_Waves_In_The_Dusk_-_Arabian_Sea_India_2026-09-06_05708.jpg) | Biswarup Ganguly / Gangulybiswarup; 6 Sep 2026 around 18:31; Arabian Sea | **CC BY 4.0**; optical grading and exact wind/sea-state **unknown** | Low-light horizon, dusk color, wave shape and contrast; verify EXIF before quantitative luminance use |
| **R05.** [Ocean by Moonlight](https://commons.wikimedia.org/wiki/File:Ocean_by_Moonlight_-_Flickr_-_mikeporterinmd.jpg) | Mike Porter (`mikeporterinmd`); Ocean City, Maryland; 5 Nov 2022 around 19:08; photographer describes bright high moon | **CC BY-SA 2.0**; long-exposure/camera response alters apparent night brightness; not a luminance standard | Moon glitter path, water/sky contrast, exposure bias; **qualitative only** |
| **R06.** [Whitecap](https://commons.wikimedia.org/wiki/File:Whitecap.png) | Ardhuin, own work, 30 Sep 2009 | **CC BY-SA 1.0/2.0/2.5/3.0** options in record; 607×352, limited resolution; offshore sea-state metadata unknown | Small breaking crest vs aerated foam pattern; close-up morphology, not calibrated whitecap coverage |
| **R07.** [Rain over the ocean, Banks Peninsula](https://commons.wikimedia.org/wiki/File:Rain_over_the_ocean_from_Mt_Herbert,_Banks_Peninsula,_Canterbury,_New_Zealand_06.jpg) | Michal Klajban, 1 May 2022 12:19, New Zealand; Canon EOS 6D, 70 mm, f/13, ISO 200; approximate viewpoint geolocation published | **CC BY-SA 4.0**; high viewpoint, regional weather not open-offshore viewpoint; Lightroom processing recorded | Distant rain curtains, precipitation footprint, terrain/ocean background contrast |
| **R08.** [Thunderstorm over the sea](https://commons.wikimedia.org/wiki/File:Thunderstorm_over_the_sea_%2827692031591%29.jpg) | `acquimat4` (Flickr); Ault, Picardie, France; 29 Aug 2015, 23:01; geolocation on Commons | **CC BY 2.0**; precise wind/electric activity/light exposure **not confirmed** | Convective organization, dark/light cloud contrast and marine horizon during storm |
| **R09.** [Underwater surface ripples](https://commons.wikimedia.org/wiki/File:Underwater_surface_ripples.JPG) | Bryan Calloway (`Bryan.calloway`), own work; date/camera conditions check original | **CC BY-SA 3.0** (or GFDL alternative); depth/turbidity and camera calibration unknown | Surface geometry seen from below, Snell's window character, normal variation |
| **R10.** [Underwater internal reflection](https://commons.wikimedia.org/wiki/File:Underwater_internal_reflection.jpg) | Philippe Guillaume, Punta Restinga dive site, El Hierro, Spain, 20 Sep 2009 15:09; cropped/uploaded by Pieter Kuiper | **CC BY 2.0** shown in record; cropped relative to Flickr original; camera depth and calibrated lighting measurements unknown | Total internal reflection, underwater black edge and surface image continuity |
| **R11.** [Hawaiian Islands in sunglint](https://earthobservatory.nasa.gov/images/3510/hawaiian-islands) | NASA/MODIS Terra, 27 May 2003; credited Jacques Descloitres, GSFC; overhead satellite image | NASA imagery guidance; sunlight, sensor view not an eye-level camera; satellite radiance processed | How wave/surface slope and wind alter broad Sun-glitter distribution; **not** a realistic ocean RGB color reference |
| **R12.** [Winter cloud streets, North Atlantic](https://science.nasa.gov/earth/earth-observatory/winter-cloud-streets-north-atlantic-49254/) | NASA MODIS Terra, 24 Jan 2011 at 10:25 EST; Jeff Schmaltz / GSFC; natural color | NASA guidance; satellite angular observation, not ground appearance | Organized rolls aligned with wind and changing cloud dimensions across ocean distance |
| **R13.** [Ex-cell-ent Clouds off Chile's Coast — image and GOES time-lapse](https://earthobservatory.nasa.gov/images/150926/ex-cell-ent-clouds-off-chiles-coast) | NASA MODIS Terra / NOAA GOES-17, 25 Aug 2022; article by Hannah Richter; satellite video/imagery | NASA/NOAA credit; satellite-visible scene; video processing/measurement scope limited to source | Open/closed-cell marine stratocumulus and **temporal breakup/coherence**. Strongest mesoscale-organizing reference in shortlist |
| **R14.** [Ocean Clouds Meet Peru](https://earthobservatory.nasa.gov/images/83796/ocean-clouds-meet-peru) | NASA MODIS / LANCE EOSDIS; coastal Peru satellite observation; NASA credit page | NASA guidance; not ground camera; captured atmospheric conditions described but no near-surface wind field | Low marine-cloud deck edges, optical cover and coast cloud contrast |
| **R15.** [Cloudscape at Dawn, Northwest Atlantic](https://earthobservatory.nasa.gov/images/149490/cloudscape-at-dawn-northwest-atlantic) | ISS external HD camera, published 4 Nov 2021; oblique camera approximately 500 km offshore from Nova Scotia; NASA | NASA guidance; highly elevated oblique view, color/exposure not calibrated | Tightly grouped towering cumulus, distant anvil thunderstorms, low-Sun directional contrast and cloud scale |
| **R16.** [Sunset from the ISS over the Indian Ocean](https://earthobservatory.nasa.gov/images/44267/sunset-from-the-international-space-station) | Expedition 23, 25 May 2010, Nikon D3, looking west over southern Indian Ocean; photo cropped/contrast enhanced/lens artifacts removed | NASA guidance; **edited image explicitly disclosed**; limb-of-Earth view unsuitable for waterline comparison | Atmospheric optical layering and low-Sun chromatic gradients; not a ground sunset exposure standard |
| **R17.** [Moonlight reflecting off Southern Ocean — NOAA/CIRA](https://commons.wikimedia.org/wiki/File:Moonlight_Reflects_off_of_the_Southern_Ocean_%28CIRA_2024-07-18%29.png) | NOAA-20/NOAA-21/S-NPP VIIRS Day/Night Band, 18 Jul 2024 05:08; CSU/CIRA & NOAA/NESDIS | **Public domain** per Commons US government note; this is a processed satellite **night-band** visualization | Spatial moon-glint and marine cloud structure under moonlight; do **not** equate brightness to eye-visible irradiance |
| **R18.** [Signs of Ships in the Clouds](https://earthobservatory.nasa.gov/images/91608/signs-of-ships-in-the-clouds) | NASA Aqua MODIS, 16 Jan 2018, offshore Portugal/Spain; image by Jeff Schmaltz, LANCE/EOSDIS; story Adam Voiland | NASA guidance; ship-track enhanced cloud properties mean not representative of all uncontaminated marine clouds | Open vs closed cellular mesoscale organization, cloud-field coherence and aerosol-linked reflectance changes |

**Coverage caveat:** This library deliberately contains both *water-level/underwater* imagery and *orbital* meteorological observations. It does **not** offer synchronized calibrated offshore video that simultaneously measures `U10`, spectrum `Hs/Tp`, sun angle, cloud structure and ocean reflectance. Those synchronized references remain a gap and should not be represented as delivered. For **movement**, R13 includes actual satellite time lapse but at mesoscale—not waves or 3D clouds from a moving human camera. A follow-up curated shipboard/offshore weather-video set is a desirable later supplement only if recording rights and metadata are established.

**Suggested minimal reference board workflow:** keep selected URL, capture timestamp/UTC if published, author/rights, camera height/sensor and view, processing known/unknown, weather/wave measurements known/unknown, target defect and expected invariant. Do not download or redistribute third-party imagery without checking each asset's current reuse conditions.

---

## M. Engineering decision register (the requested implementation choices)

Every record names the specific defect, evidence and smallest decisive experiment. `P1` = essential Phase 1; `P2` = next phase; `P4–7` = later stage; `D` = defer/reject as stated.

| ID / Candidate | Problem addressed | Evidence | Likely benefit; trade-off | Priority / decisive smallest test / **verdict** |
|---|---|---|---|---|
| **D01 Regional weather maps** | Global presets not spatially coherent | P0 code/report; Guerrilla weather authoring; Ubisoft Atmos | Shared weather and spatial evolution; low memory but field ownership/invalidation complex | **P1 RECOMMEND contract**; run deterministic moving rain-front + world-rebase test |
| **D02 Separate wave wind sea/swell targets** | Abrupt/reset sea changes | P0 transition defects, oceanography | Keeps old swell as local wind changes; spectral evolution needs careful phase handling | **P1 RECOMMEND contract**, no FFT rewrite; test phase/foam continuity during weather changes |
| **D03 Shared direct/diffuse/angular sky radiance** | Cloud-light-water mismatch/metallic reflections | P0 cloud/underwater clear-sky gaps; Bruneton | Coherent direct/ambient/specular water; env-cache update cost | **P1 RECOMMEND**; Sun-blocking/cloud reflection/fixed exposure tests |
| **D04 Cloud-derived precipitation eligibility** | Camera-centered disconnected rain | P0 source inspection; WMO/NOAA meteorology | Local rain bands and believable cloud causal link; needs persistent field | **P1 CONTRACT / P3 IMPLEMENT**; fixed camera front test |
| **D05 WMO cloud-family height profiles** | Wrong cloud types and scale | WMO Atlas; Nubis 2015/2017 | Authentic morphology; classification not full simulation | **P2 COMPARE**, matched optical-depth density prototype |
| **D06 Regional weather + multiscale erosive volumes** | Grid-row puffs and slab | P0 failed density A/B; Guerrilla Nubis | Strongest low-risk morphology candidate; raymarch cost remains | **P2 FIRST EXPERIMENT**; matched opacity/edge detail and GPU passes |
| **D07 Layered hybrid deck + selective convection** | Overcast and tower efficiency | WMO / production cloud methods | Potential volume reduction; transition seams, slabs | **P2 COMPARATOR** vs D06 |
| **D08 Sparse SDF/voxel clouds** | Complex Cb and high-altitude immersion | Nubis³ 2023 | Full 3D cloud modeling; memory/pipeline/authoring high | **DEFER conditional**; only after D06/D07 failure |
| **D09 Full Rare geometry-only cloud swap** | Expensive clouds | Rare SIGGRAPH 2018 | Strong low-cost stylization; uncertain true storm morphology | **DEFER as specialized far layer**; fail if poor storm silhouette |
| **D10 Long off-grid calibrated wave modes** | 1,103 m periodic recurrence | P0 modal census + correlation | Cheap long range variation; error-prone energy/direction weights | **P4 RECOMMEND first candidate test**; ensemble spectra + autocorrelation |
| **D11 Covariance-preserving tiling/blending** | Periodic large-ocean tiles | Ubisoft La Forge 2024 | Aperiodicity with FFT reuse; derivative/temporal mismatch risk | **P4 COMPARE** vs D10; normals, energy, seams and cost |
| **D12 Dynamic Wave Trains** | Local wind/phase variability | Fournier et al. 2026 | Spatial wave controls; new representation and coupling complexity | **DEFER isolated supplement**, don't replace FFT |
| **D13 Blindly stretched or rotated FFT domain** | Repetition (apparent) | P0 stretch rejection; directional physics | Cheap visual decorrelation; altered periods, directional mismatch | **REJECT** as core fix; no justification to implement |
| **D14 Persistent foam transport/event map** | Flat/nonphysical whitewater | P0 still/photo tests; Rare production | Real lifetime/transport; not explicit roller | **P5 RECOMMEND experiment**, event-history continuity test |
| **D15 Explicit local 3D roller** | Missing overturning crest | Guerrilla 2022 + P0 representational gap | Real geometric breaking; unknown onset/shading/overdraw | **P5 CONDITIONAL**, nonlinear onset & single event silhouette test |
| **D16 B≈0.85 on linear FFT velocities** | Claim to predict breaking | Barthelemy 2018 scope; P0 counterexample | Physically misleading false confidence | **REJECT** until nonlinear crest kinematics validated |
| **D17 Slope-moment filtered glints** | Metallic/shimmering surface | LEAN 2010; Bruneton geometry-to-BRDF | Better specular distribution; moments need correct conventions | **P6 RECOMMEND high impact**, matched glint pan at fixed light |
| **D18 Ad-hoc desaturation/tint fix** | Metallic body color | P0 desat A/B | Tiny/local perceptual change; masks true reflection problem | **REJECT** as root-cause solution; retain tone/grade only after optics |
| **D19 Shared displaced surface ray query** | Frozen straight waterline | P0 frozen wave control; CDLOD/source coupling | Topology/camera intersection coherence; ray step cost/complexity | **P7 RECOMMEND investigation**, analytic sinusoid and geom-vs-classifier A/B |
| **D20 GPU scheduling / stall audit** | Recurring ~1 s spikes | P0 visible runs; Chrome rAF/Long Animation Frames | Determines actual cause without random tuning; trace overhead | **P1/P0 immediate**; toggle capture/readbacks + align CPU/GPU/OS clocks |
| **D21 Cloud/environment cache frequency** | 20.775 ms atmosphere group | P0 timing and LUT architecture | Potential substantial time savings if data reuse is valid; ghosting/staleness | **P1 RECOMMEND profiling**, versioned-cache and high-speed weather transition tests |
| **D22 GPU subgroups/f16 FFT rewrite** | Unknown FFT overhead | Chrome WebGPU availability; P0 sim median ~1.5 ms | Could reduce traffic; precision/support risks | **DEFER** until FFT isolated bottleneck is measured |
| **D23 Full-domain 3D fluid and global NWP** | Physical universality | No PELAGIC proof of need | Vast scope/cost, disrupts specialized pipeline | **REJECT** for present milestone |

### M1. Test thresholds and review decisions

No fabricated universal numeric threshold is imposed on stochastic realism. For every Phase 1 candidate the report requires: valid/finiteness test; regression-checked deterministic playback; scientific/empirical constraints where claimed; **matched-appearance** visual A/B; synchronized scene-linear lighting diagnostics; p50/p95/p99 and stall counts; cost versus current known good; explicit unresolved issues. A candidate cannot pass solely because it is faster or visually appealing in one hero screenshot. If objectively calibrated tolerance (e.g., variance error, optical-depth distribution) is not yet available, **record and agree it before the experiment**, rather than selecting one retrospectively.

---

## N. Answer to Astra's eight final implementation questions

**1. What must Astra know before Phase 1?** The existing 0.4 Phase 0 acceptance has NOT granted visual acceptance or automatic Phase 1 approval. The observed defects are specific: artificial cloud organization, common-light coupling gaps, disconnected rain, periodic ocean, nonexistent roller geometry, frozen-waterline artifact and recurrent ~1 s stalls. P0 source/performance measurements control; literature only suggests solutions. Read the actual four repository documents and Phase 0 reproduce/evidence report before changing code.

**2. Phase 1 implement vs interface only?** **Implement and test:** authoritative current/target/time/region weather state with a stable seed/world-anchor; separate wind sea and swell targets/transition semantics; cloud-aware shared direct Sun + diffuse skylight + directional reflection-light products or bounded approximations; versioned cache rules; deterministic transition/integration tests; cost instrumentation. **Interface only:** cloud-density schema, precipitation/front/cell metadata and breaker-event hooks; no complete new cloud renderer, offshore roller or new FFT.

**3. What remains undecided?** The final cloud density architecture (Phase 2), detailed storm and lightning VFX (Phase 3), spectral deperiodization method (Phase 4), true nonlinear offshore breaking criterion/roller geometry (Phase 5), optical transport/filtering changes (Phase 6), displaced-surface waterline solver (Phase 7). Each has an A/B/TEST gate; do not preapprove technologies from developer talks alone.

**4. Greatest potential realism improvements?** Stronger cloud mesoscale morphology, physically consistent cloud-aware ocean/underwater radiance, validated wave-repetition remedy, correctly filtered finite-Sun glitter, believable event-based breaking/whitewater and actual rain/cloud coupling. The relative order for *visible improvement* must be established through standardized captures, not unverified verbal rankings.

**5. Strongest quality-preserving optimization candidates?** Versioned/dirty environment-light cache; cloud empty-space/morphology efficiency; true fragment shading and grazing-angle overdraw diagnosis; normal moment/LOD filtering; measured GPU resource lifetime and scheduling. The **FFT is not currently the first target** when its observed one-view shared compute median is ~1.5 ms against far larger cloud/surface costs.

**6. Corrections/rejections to prior research:** Chrome release feature headlines are not GPU device guarantees; P0's FFT already has Gaussian groups; stretched FFT domains break wavelengths; Ubisoft covariance-preserving tiling is not proof of fully correct displaced geometry/foam; Barthelemy nonlinear velocity threshold is not linear FFT foam test; cloud prototype timings were not equal-quality wins; desaturation is not the core metallic-water defect; frozen-waterline cannot be attributed entirely to stale readback; a one-frame feedback delay is not mathematical stability.

**7. Are any dependencies unsafe for starting Phase 1?** **Owner approval is mandatory** under Phase 0's STOP gate. Technically, Phase 1 can proceed as a *contract-first, reversible* step without selecting a new cloud/ocean solver, provided the owner authorizes it, source hashes and baseline outputs are frozen, state semantics/units are declared, and instrumentation captures current reproducibility. If there is no owner approval or no accessible baseline code/evidence, do **not** interpret this report as authorization to start implementation.

**8. Most rational next decision?** Ask the owner to approve a narrow **Phase 1 architecture-and-lighting contract milestone**, with two demonstrations: (a) coherent clear/overcast/storm/twilight/day-night transitions in shared state with correct swell and rain eligibility; (b) cloud occlusion causes coherent direct, diffuse, specular and underwater responses at fixed exposure. Run the stall diagnosis in parallel as an instrumented, reversible investigation. Do **not** approve a cloud-reconstruction rewrite until Phase 2's optical-depth-matched morphology proof.

---

## O. Auditable source ledger — primary technical/scientific documents

Source classifications: **SRC** = behavior established by repository code inspection (the report explicitly labels when relying on the published Phase 0 team's inspection, not this author's full source reading); **TEST** = reproduced by Phase 0 with logs/results, not independently rerun here; **VIS** = inspected media with stated sampling; **LIT** = public original developer/scientific/standards publication; **HYP** = untested proposed architecture/causal explanation.

1. **[P0 · SRC/TEST/VIS]** [PELAGIC Phase 0 Report, 20 Oct 2026](https://github.com/adievibecoder-sudo/PELAGIC/blob/development/pelagic-0.4/docs/V04-PHASE0-REPORT.md). Bounded hardware tests, cloud prototype failures, FFT recurrence, optics, waterline and stalls; media sampling/provenance limitations explicitly preserved.
2. **[P0 · SRC/TEST]** [PELAGIC Acceptance & Decision Register](https://github.com/adievibecoder-sudo/PELAGIC/blob/development/pelagic-0.4/docs/V04-ACCEPTANCE.md). Active FAIL/UNVERIFIED gates; no owner visual closure.
3. **[P0 · Project instruction]** [PELAGIC 0.4 Master Execution Brief](https://github.com/adievibecoder-sudo/PELAGIC/blob/development/pelagic-0.4/docs/PELAGIC_V04_MASTER_EXECUTION_BRIEF.md). Scope and stage dependencies; this independent report does not override it.
4. **[P0 · TEST/planning]** [PELAGIC Performance Budget](https://github.com/adievibecoder-sudo/PELAGIC/blob/development/pelagic-0.4/docs/V04-PERFORMANCE-BUDGETS.md). Existing GPU group medians, provisional frame and memory envelopes; not a guarantee.
5. **[LIT · developer]** [Rare, The Technical Art of Sea of Thieves, SIGGRAPH 2018](https://history.siggraph.org/wp-content/uploads/2022/09/2018-Talks-Ang_The-Technical-Art-of-Sea-of-Thieves.pdf). FFT, foam feedback, scattering-inspired color, area reflection, efficient clouds; period implementation, not undisclosed 2026 internals.
6. **[LIT · developer]** [Guerrilla, Nubis: Authoring Real-Time Volumetric Cloudscapes, 2017](https://www.guerrilla-games.com/read/nubis-authoring-real-time-volumetric-cloudscapes-with-the-decima-engine). Regional weather, cloud authoring and production integration.
7. **[LIT · developer]** [Guerrilla, Nubis Evolved, 2022](https://www.guerrilla-games.com/read/nubis-evolved), and [Nubis³, 2023](https://www.guerrilla-games.com/read/nubis-cubed). Volumetric sky VFX, immersive sparse voxels, SDF acceleration; no automatic cross-hardware timing transfer.
8. **[LIT · developer]** [Ubisoft Anvil Atmos, developer technical presentation, 2026](https://blog.playstation.com/?p=420230). Linked humidity, temperature, wind and vapor fields; not evidence for its exact weather solver or a PELAGIC requirement.
9. **[LIT · developer]** [Guerrilla, Rendering Water in Horizon Forbidden West, SIGGRAPH 2022](https://advances.realtimerendering.com/s2022/SIGGRAPH2022-Advances-Water-Malan.pdf). Baked wavefront cross-section/3D breaking, mainly coast/artist-authored.
10. **[LIT · research]** [Ubisoft La Forge, Making Waves in Ocean Surface Rendering Using Tiling and Blending, HPG 2024](https://www.ubisoft.com/en-us/studio/laforge/news/5WHMK3tLGMGsqhxmWls1Jw/making-waves-in-ocean-surface-rendering-using-tiling-and-blending). Covariance-preserving hexagonal stochastic synthesis, flow orientation and normal filtering.
11. **[LIT · peer reviewed]** [Fournier et al., Dynamic Wave Trains, Computer Graphics Forum, May 2026](https://onlinelibrary.wiley.com/doi/full/10.1111/cgf.70495). Spatial controls and filterable procedural wave trains; not a nonlinear breaking solution.
12. **[LIT · peer reviewed]** [Barthelemy et al., nonlinear breaking onset, Journal of Fluid Mechanics, 2018](https://www.cambridge.org/core/journals/journal-of-fluid-mechanics/article/abs/on-a-unified-breaking-onset-threshold-for-gravity-waves-in-deep-and-intermediate-depth-water/63A8E661999DEC94EB3B7BADC729DB0F), and [Derakhti et al., 2020](https://doi.org/10.1029/2019jc015886). Scope-constrained crest particle/crest speed, not a linear spectral texture formula.
13. **[LIT · graphics]** [Eric Bruneton, Precomputed Atmospheric Scattering, 2017 implementation with tests](https://ebruneton.github.io/precomputed_atmospheric_scattering/). LUTs, dimensions and atmosphere validation.
14. **[LIT · graphics]** [Bruneton et al., Ocean geometry-to-BRDF, 2010](https://doi.org/10.1111/j.1467-8659.2009.01618.x) and [Olano & Baker, LEAN normal filtering, I3D 2010](https://userpages.cs.umbc.edu/olano/papers/lean/). Screen-space wave detail/radiance sampling; LEAN errata present on paper page.
15. **[LIT · meteorology]** [WMO International Cloud Atlas](https://cloudatlas.wmo.int/en/cloud-classification-summary.html), [NOAA marine squalls](https://marine.weather.gov/glossary.php?word=SQUALL+LINE), [NOAA gust front](https://www.nesdis.noaa.gov/about/k-12-education/severe-weather/what-gust-front). Morphology/phenomenon meanings, not a visual preset API.
16. **[LIT · oceanography]** [NOAA NDBC Wave Measurement Procedures](https://www.ndbc.noaa.gov/wavemeas.pdf). `Hm0=4sqrt(m0)` and spectral analysis. PELAGIC's wave statistics are a separate empirical problem.
17. **[LIT · ocean optics]** [NASA MODIS Remote Sensing Reflectance](https://modis.gsfc.nasa.gov/data/dataprod/Rrs.php). Distinguishes water-leaving radiance from atmospheric/glint signals in ocean color observations.
18. **[LIT · platform]** [W3C WebGPU](https://www.w3.org/TR/webgpu/) and [WGSL](https://www.w3.org/TR/WGSL/) specs; [Chrome 155–156 WebGPU changes](https://developer.chrome.com/blog/new-in-webgpu-155-156); [Chrome developer GPU timestamp facilities](https://developer.chrome.com/docs/web-platform/webgpu/developer-features); [Long Animation Frames](https://developer.chrome.com/docs/web-platform/long-animation-frames). Check implementation and adapter before depending on optional features.
19. **[LIT · imagery reuse]** [NASA imagery and media use guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/) and individual 18 original linked source records above. Asset-specific legal terms override generic assumptions.

### Final research limitations and disposition

- No source edits, commits, branches, tags, deployment or GPU benchmarks were performed by this independent research work.
- Original paper conclusions and technical architecture recommendations are separated; source-code claims that rely on the Phase 0 report are **attributed to its published inspection**, not represented as a new full source audit.
- No full-resolution visual rendering comparison or calibrated photographic measurement was completed here; individual images and their published metadata have been curated as **references**, not reproduced or redistributed.
- Where the correct answer depends on untested shader behavior, an unknown physics parameter, uncertain licensing or the cause of an unexplained stall, the decision is explicitly **unresolved**, with a smallest experiment.
- The owner approval gate remains binding. **This report authorizes no implementation.**

**Recommended action:** Complete the Phase 1 environmental data/lighting contract and paired coherency tests under explicit approval; isolate GPU stalls; only then compare new clouds at matched opacity and morphology. Preserve the existing simulation and raise quality by correcting the highest-impact integrations first.
