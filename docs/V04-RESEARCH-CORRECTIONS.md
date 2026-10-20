# PELAGIC 0.4 — Independent Research Critique and Corrections

**Provenance:** Concise handoff summary of GPT-5.5's independent review supplied by the owner, cross-checked selectively against source and earlier ChatGPT analysis. **Not** a verbatim original transcript or an independent certification of every cited paper. Preserve uncertainties.

## Strong criticisms that must inform Phase 0

1. "Five of six wind seas are overdeveloped" was overstated: the PM comparison used a wind-height reference inconsistency (U10 vs U19.5). Correct for the chosen empirical formulation, fetch, age and swell independence before judging; not every sea above a PM curve is physically invalid. H_s may still be excessive even when omega_p looks marginal.
2. The spectral-to-three-band colour experiment is indicative, not an explanation of entire water appearance. At the default turbidity the reviewer found much smaller differences than the zero-turbidity extreme; run a cheap three-band coefficient refit in the complete render before committing to a spectral lookup.
3. "Clouds ~3× too thin" is unsupported without an **integrated optical depth** distribution and actual Sun-ray occupancy; gaps in 92%-covered sky may still expose the disc.
4. Gaussian linear waves already produce groups. Test **existing group quality, mode diversity, periodicity** and visual structure rather than describing the sea as having no groups.
5. Curcic (2025) should be read precisely. The study's fractions describing nonlinear short-wave steepness effects are not shader coefficients. The claim that slowly varying action theory simply "fails for steep long waves" is oversimplified.
6. Nouguier/Choppy Wave Model may produce negligible or negative elevation skewness for broad spectra. Bound harmonics may be better motivated than Hark claimed, but double counting still requires measurement.
7. The Hark mode/fold Monte Carlo must be **seeded**; count actual independent Hermitian-paired modes; a hybrid/JONSWAP ratio does **not** establish blend continuity.
8. \(B=u_s/c_{\mathrm{crest}}\approx0.85\) is an onset indicator for specific wave conditions, not a universal hard-coded event generator; similarly, whitecap area cannot be inferred from a threshold eligibility count.
9. Check actual scientific definition of Banner's `b_T` significant steepness epsilon before using any formula. Do not substitute H_p/h_s notation arbitrarily.
10. Hark's spectral colour script used an approximate daylight illuminant; wider working gamut requires coherent AgX and white-point transforms.
11. A 1-frame lag in cloud-inclusive irradiance is not proof of energy conservation or perceptual stability; test full darkening, bright transitions and feedback dynamics.
12. Correct citation/source slips: confirm Horvath's precise JONSWAP/PM formulation from primary text; Curcic statements, platform release dates and API details independently. Do not quote exact Fresnel values until reference geometry is fixed.
13. WebGPU extended canvas tone-mapping support was reported since Chrome 129, but **hardware HDR output remains UNVERIFIED** until tested.
14. The publication archive contained ~821 evidence files, but Hark only directly inspected selected images/frames; do not claim a comprehensive pixel-by-pixel visual audit.
15. Separate true frame pacing from sums of *median* GPU-pass costs. Measured 0.3 surface cost rows are specific scene/resolution cases; do not inflate or generalize unmeasured timings.
16. Full 0.4 reconstruction needs per-subsystem frame/VRAM envelopes, a small initial visual slice plus cross-condition controls, and **owner visual acceptance** at every phase boundary.
17. Useful supplemental prior art: Dupuy & Bruneton (2012) whitecaps, Tessendorf FFT-ocean work, Curcic (2025) nonlinear short-wave theory, and a 2025 hybrid FFT/local wave-particle paper. Each is a research lead, not an automatic import, algorithm or source of asserted results.

## Disagreement protocol

Record source/actual model definition, numeric reproduction, assumptions, confidence, visual significance, decision experiment and the exact action selected. "Verified in a CPU toy model" must remain distinct from "validated in PELAGIC GPU with a credible visual change". See `docs/V04-PHASE0-KICKOFF.md`.

## References mentioned by reviewer (verify primary content before adopting specifics)

- Nouguier et al.: https://data-ww3.ifremer.fr/BIB/Nouguier_etal_JGR2009.pdf
- Barthelemy et al.: https://arxiv.org/abs/1508.06002
- Curcic: https://arxiv.org/abs/2410.12960
- Dupuy & Bruneton: https://liris.cnrs.fr/Documents/Liris-5812.pdf
- Ardhuin et al.: https://arxiv.org/pdf/0907.4240
- Chrome WebGPU features: https://developer.chrome.com/docs/web-platform/webgpu/developer-features
- Chrome 129 HDR: https://developer.chrome.com/blog/new-in-webgpu-129
- Chrome 134 subgroups: https://developer.chrome.com/blog/new-in-webgpu-134
- 2025 hybrid FFT/local wave-particle study: https://arxiv.org/abs/2511.02852

**Implementation status:** None of the corrective scientific hypotheses in this document is automatically approved for direct adoption. Phase 0 must independently test and decide.
