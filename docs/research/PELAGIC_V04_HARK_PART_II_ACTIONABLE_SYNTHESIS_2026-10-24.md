# Hark Pro Part II — Actionable Source-aware Research Synthesis (24 Oct 2026)

**Provenance and access:** This is an assistant-prepared *digest* of the owner's 20-page PDF `PELAGIC_0.4_INDEPENDENT_RESEARCH_PART_II.pdf`, **not the original PDF and not its exact reproduction**. Part II audited *read-only* `development/pelagic-0.4@d4f7d80`; no local `c4185ea` code or RTX 3050 renderer run was observed. See `docs/V04-RESEARCH-INDEX.md` and `docs/V04-RESEARCH-CORRECTIONS.md` for earlier source authority. Values below are study claims until verified on the actual relevant source revision.

## Core hypothesis and evidence
Hark's strongest overarching hypothesis: PELAGIC's wave, sky and light **means** can be plausible while its **spatial, height-correlated, directional and temporal variation** remains inadequate. Smooth silver glitter, weak local roughness variation, inadequate crest-dependent optical cues, repetitive/internally bright clouds and event-free whitewater together create synthetic appearance. This is a physically informed perceptual explanation, not a separately proven single causal diagnosis.

**Corrected Part I findings:**
- Cloud columns: original domain-mean τ≈0.85–0.87 mixed clear/cloudy columns. Part II reports 206 cloudy columns out of 1024, in-cloud median τ≈3.5, mean≈4.2, p90≈8.9, max≈12.5. Its 5–15× "thin cloud" interpretation depends on compared cloud type/path and should not be generalized across presets or ray orientations. Calibration target is *in-cloud distribution by cloud type*, not blanket σ multiplication.
- Existing env cubemap refreshes **one face per frame**; per-face cloud raymarch remains expensive. Do not "add time slicing" again.
- Foam is in **Lagrangian labels**, with orbital displacement applied by the surface mesh; additional orbital advection double-counts. Candidate missing terms are Stokes drift, wind drift, streak organization.
- Approximate three-wavelength water-body optics already exist. Part II estimates near-crest spectral-bin colour error ΔE2000≈0.7–1.1 over 1–5 m; larger at 20 m or deep radiance. Spectral LUT is lower priority than correct radiance variation.
- WebGPU timing values may be quantized; small per-pass changes need better profiling. Original publication includes unresolved long stall causes beyond a minimized-window incident.
- The 0.4 branch historically devoted far more files/lines to evidence and documents than source edits; **line counts alone do not measure work quality**, but the repeated stopped experiments and owner visual concerns warrant implementation-first reform.

## Program S0–S5 (candidates, not obligatory serial phases)
| Theme | Representative techniques | Role and caveat |
| --- | --- | --- |
| S0 selective temporal and fast tooling | TAA or temporal upscale, cloud reprojection, reuse low-res environment cloud radiance, lightweight A/B, meaningful GPU timer | Critical cost/variance enabler *if measured*. Do not let a full infrastructure sprint displace the first visible implementation. Test wave/glint/foam ghosting and displacement motion vectors. |
| S1 physically coherent clouds | weather map + morphology/type profile, plausible extinction, droplet phase, multiple-scattering approximation, density-aware ambient attenuation, analytic integration | Core density, AO and scattering are coupled; repeated ellipsoid-lobe silhouettes require representation change, not more samples. Cloud extinction values 40–100 km^-1 and HG+Draine fits are **starting candidates**, not approved constants. |
| S2 Living Sea | advected wind–roughness/slick field applied consistently to short-wave geometry, gradients, unresolved BRDF variance, foam likelihood; long-cascade detiling | Spatial patchiness is promising; energy budget/mss and derivative consistency essential. Proposed field resolution and modulation range are not evidence of optimal values. |
| S3 Water Light + image | facet-aware downwelling and body radiance, physically defensible crest/path dependence, discrete/stochastic glints, remove pre-AgX double desat, auto-exposure, atmosphere-aware haze | The surface already has Fresnel, covariance and reflected-sky visibility. Compare against existing code; keep water colour physically calibrated. Avoid fake colour solely from wave height. |
| S4 Breaking + whitewater | smooth-filtered whitecap baseline; group-aware crest-event onset driving foam age/thickness/bubbles/spray | Empirical Monahan coverage is *statistical guard*, not hardcoded event threshold; B≈0.85 is not applicable as direct linear FFT trigger. Keep Lagrangian foam, add missing material drifts without double-counting. |
| S5 Weather/storm | one evolving regional gust/wind field drives clouds/roughness/whitecaps/spray/rain/squalls/lightning | Build after causal elements work; precipitation/lightning must remain meteorologically justified. |

**Keep separate future Milestone C:** waterline, mixed medium/ray classification, underwater transmission/volume light, Snell/refraction, god rays, wake/object integration, final endurance and release validation. No unapproved C build.

## Six *optional*, narrow decision experiments (E1–E6)
- **E1** matched radiance at water/sky depression angles to distinguish excessive reflection from insufficient body radiance; only if needed to decide shader edit.
- **E2** component toggles (secondary reflection march, submerged branch, short cascades, MSAA, grid density) and high-precision GPU timing to locate the expensive ~20 ms surface path.
- **E3** low-Sun near glitter: debug spec vs wave visibility=1, then check facet/lighting gate. Reuse prior evidence first.
- **E4** physically thick cloud plus scattering/AO under one matching view to ensure density does not merely turn black.
- **E5** 75-degree pan and skimming motion tests for ocean/foam/cloud temporal ghosting.
- **E6** bounded unresolved glint representation vs original Gaussian mean, assess temporal and performance effects.
These are **decision tools, not a new six-experiment audit requirement**. The PDF's one-hour time budget is not evidence an experiment can reliably finish in that period.

## Performance realism (owner RTX 3050, 1080p Balanced)
Part II reports published approximate ranges: screen clouds 13.4–22.5 ms; angular environment face 4.5–7.4 ms; surface 12.7–20.2 ms; total roughly 33–53 ms (different views). The 30–45 FPS Balanced scenario after optimization is *hypothetical*, as are individual saving estimates and cited console-class timings. Do not constrain the quality target to a numerical FPS guess or extrapolate from unrelated hardware.

TAA/temporal cloud work can free budget but cannot repair poor density morphology or incorrect reflection/body balance by itself. Source-aware performance profiling is needed, preferably with unrounded GPU time when available.

## Practical decision cautions
1. Real cumulus opacity, bright edges, dark bases and ambient cannot be set by one constant. Conditioned τ histograms and image/motion tests matter.
2. The cloud model already uses two HG lobes and ad hoc scattering; more physically plausible phase function must be coupled to density and lighting.
3. Large swell can carry small slope variance while remaining visible via geometry, occlusion, reflected environment and sometimes crest-related aeration; height `mask` ≠ independently proven optical path.
4. A wind field should preserve mean and spatially varying slope variance, wave energy, motion and derivatives. No arbitrary global high-frequency attenuation.
5. AgX already exists; removing pre-AgX desaturation needs controlled A/B. A changed tone curve alone cannot repair synthetic water.
6. Finite-disc glitter and anisotropic covariance sampling already exist; investigate discrete glitter/roughness representation and samples instead of starting over.
7. No automatic engine migration or full Navier–Stokes ocean.
8. A failed idea should lead to a new candidate within a bounded visual objective; don't turn each failure into lengthy documentation and compulsory stop.

## Research references (follow original PDF for specific claims and figures)
Primary/reference families in Part II: Tessendorf (2001); Bruneton et al. (2010); Sea of Thieves SIGGRAPH 2018; Horizon Forbidden West water SIGGRAPH 2022; Ubisoft La Forge wave tiling 2024; Monahan & O'Muircheartaigh 1980; Cox & Munk 1954; Dupuy & Bruneton 2012; Barthelemy et al. 2018; Guerrilla Nubis and Nubis Evolved; Hillaire atmospheric render; Jendersie & d'Eon HG+Draine 2023; Toft & Bowles 2016; Karis/Salvi temporal reconstruction; Chermain et al. glints; Deliot & Belcour 2023. Primary sources are general support, **not verified PELAGIC improvements**.

**Recommendation:** Retain Hark's scientific direction; prioritise first measured *visible* renderer intervention, and use temporal S0 only insofar as it enables demonstrable quality/efficiency. Reconcile actual local worktree before any implementation.
