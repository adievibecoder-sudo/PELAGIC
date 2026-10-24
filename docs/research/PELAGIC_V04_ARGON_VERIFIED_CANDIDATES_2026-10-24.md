# PELAGIC 0.4 — Argon Parts I & II: Verified Candidate Digest
**24 October 2026 — research interpretation, not rendering authorization**

**Provenance:** Prepared from the owner's prior Argon Part I and II review discussions and source-level cross-checks on the **public PELAGIC 0.4 branch @ d4f7d80**, not from a new run of the original PDFs or unpublished `c4185ea`. This is a concise reference for Astra, **not proof that proposed shader changes will improve the image**. Inspect current local source and originals before adopting anything.

## Adopt as strong candidates (implementation-first)
1. **Geometry → normals → unresolved BRDF energy.** Test whether resolved wave-gradient variance and unresolved slope covariance are consistently handed off across viewing distance and CDLOD footprints; distinguish wave silhouette errors from filtering and reflection artifacts. Existing covariance/Jacobian operations are already present; measure errors and repair them, not rebuild their mere existence. Compare 2 m / 50 m and multiple angles under stable lighting.
2. **High-frequency slope distribution by cascade.** Quantify which cascades control elevation, rendered normals, microfacet moments and excessive fine wrinkles. Evaluate energy-consistent reshaping of the roughness spectrum and its distance transfer. *Do not blindly add capillary roughness constants or suppress fine waves.* Include derivative consistency; `shortAmplitudeGradient()` and product-rule terms exist.
3. **Visible-facet/reflection integration.** Compare a better-grounded directional BRDF/reflection candidate (including Bruneton/Neyret/Holzschuch ideas, facet visibility and statistical shadowing) against PELAGIC's existing five anisotropic slope-covariance reflection samples/Smith-type factor. These are not absent features. Analyze glint strength, sky reflection, grazing silhouettes, actual visual response and GPU cost.
4. **Water-body illumination and crest optics.** Separate reflected angular sky/sun radiance from water-leaving/body light. Improve directional and depth-dependent water radiance only if supported by plausible absorption/scattering/refraction/aeration; an arbitrary crest-height colour mask is a visual proxy, not validated optical path length. Verify optical units and avoid global blue/teal painting.
5. **Lightweight A/B development loop.** Use reversible shader flags or simple visual comparisons to reduce iteration delay, with matching seed, camera, wave time, Sun, clouds, tone/exposure. Live split screen suits identical geometry; separate identical-condition captures suit geometry changes and isolated GPU profiling. Its overhead is not known in advance; don't expand into a large debug/UI project.

## Useful but secondary observations from Part I
- Revisit cross-scale modulation and swell/short-wave organization as representation quality questions; the underlying directional spreading and long-wave strain modulation **already exist**.
- Explore measured cloud temporal reconstruction and performance measures only if they enable meaningful improved morphology/lighting; dual-lobe scattering, AgX and environment caches are not missing.
- Consider targeted physically based reflection/visibility A/B; **do not** claim a Fresnel substitution alone guarantees non-metallic water.

## Explicitly reject or qualify
- **Don't reimplement already present:** Donelan–Banner-style spreading, long-wave modulation/product-rule derivatives, transformed covariance, capillary variance floor, visibility-weighted sky samples, dual-HG cloud phase, AgX and large-world origin handling. Recheck latest local state for changes.
- **No unmeasured speed claims:** Four FFT cascades vs six; 25→60 FPS; 55+ FPS clouds; <0.02 ms A/B overhead; or any fixed capillary coefficient without evidence. Preserve quality and use actual native RTX 3050 profiling.
- **No inaccurate physics:** Gaussian/linear waves *do* form interference wave groups; one unverified narrow spreading angle isn't universally physical; Jacobian threshold ≠ breaking event; `B≈0.85` is not a direct linear-FFT rule; global monotonic sea luminance is not an acceptance requirement.
- **No unsanctioned Three.js/TSL migration or shader replacement.** This active repo is native WebGPU/raw WGSL; framework comparisons are separately proposed experiments, not requirements.
- Separate code existence, numerical PASS, visual outcome, literature and hypothesis. Actual local `c4185ea` and any newer implementation supersede older source assumptions after safe inspection.

## Recommended actionable use in combined A+B
For the immediate ocean visual sprint, use the strongest existing evidence to pick **one bounded source change** focused on reflected-versus-body radiance, geometrical-scale presentation or slope-energy conservation. Rapidly inspect daylight/low-Sun, near/elevated motion; refine/replace candidate after failure. Don't run all four research experiments by default and don't launch another comprehensive study. Subsequent coupled wave/cloud/foam/weather interventions use Hark Part II plus validated PELAGIC evidence as complementary guidance.

**Source authority:** local tested code/evidence first; current GitHub file + committed research corrections; original Argon PDFs if available; scientific literature with verified scope; other recommendations as hypotheses. The owner's visual sign-off and GitHub development publication remain separate gates.
