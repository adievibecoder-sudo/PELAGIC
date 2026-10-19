# Consulted sources and provenance

Research date: 2026-10-18. Access status is deliberately narrower than a reading list. Scientific publications are sources of methods, not redistributed licensed assets. Full formulas, units and caveats appear in PHYSICS-RESEARCH.md; source-level observations appear in REFERENCE-AUDIT.md.

## Rendering source actually inspected and reused

- [Noniv/web-ocean](https://github.com/Noniv/web-ocean), commit `a07c7fd522ef0a897601c114f927a49d93d95520`. README, LICENSE and all five WGSL modules plus main renderer inspected. Supplied screenshots and a locally rendered baseline inspected. MIT, Copyright 2026 Maksymilian Dendura. Pelagic retains and modifies its FFT, geometry, atmosphere, foam and postprocessing foundations. Full permission notice retained in THIRD-PARTY-LICENSE.txt. This project is an explicitly attributed derivative.

## Ocean science actually consulted

1. Hasselmann et al. (1973), [JONSWAP report](https://repository.tudelft.nl/record/uuid:f204e188-13b9-49d8-a6dc-4fb7c20562fc). Repository abstract and spectral/mean-parameter sections of original PDF read. Angular-frequency spectrum, fetch dependence, validity limits.
2. Tessendorf (1999-2001), [Simulating Ocean Water](https://www.researchgate.net/publication/264839743_Simulating_Ocean_Water). Primary document text, equations 31-45 and discussion read. [Author PDF](https://jtessen.people.clemson.edu/reports/papers_files/coursenotes2002.pdf) timed out. Fourier evolution, displacement, limits of linear ocean models.
3. Cox & Munk (1954), [Statistics of the Sea Surface Derived from Sun Glitter](https://elischolar.library.yale.edu/journal_of_marine_research/814/). Original abstract only; full download unavailable.
4. NASA, [technical report 19740006157](https://ntrs.nasa.gov/api/citations/19740006157/downloads/19740006157.pdf), section 3.1.3, pp.19-20. Official secondary account consulted for measured slope statistics, 41-foot wind height and scatter. No direct measured slope dataset was obtained.
5. Shaw (1999), [Glittering Light on Water](https://psl.noaa.gov/outreach/education/science/glitter/), NOAA / Optics and Photonics News. Text and field experiment explanation read. Finite glints, slicks, roughness and horizon masking.
6. Barthelemy et al. (2018), [Unified Breaking Onset Threshold](https://arxiv.org/html/1508.06002v2). Author preprint abstract and HTML read. The approximately 0.85 energy-flux/crest-speed criterion is not implemented or claimed by Pelagic's compression heuristic.
7. Monahan & O Muircheartaigh (1980), [Optimal Power-Law Description of Oceanic Whitecap Coverage Dependence on Wind Speed](https://journals.ametsoc.org/abstract/journals/phoc/10/12/1520-0485_1980_010_2094_opldoo_2_0_co_2.xml). Indexed publisher abstract only; direct publisher access returned 403. Fraction `3.84e-6 U10^3.41`, not a universal storm calibration.
8. Randolph et al. (2017), [Optically Measuring Whitecaps under Natural Wave-Breaking Conditions](https://repository.library.noaa.gov/view/noaa/60518/noaa_60518_DS1.pdf). NOAA-hosted original PDF sampling, decay and coverage sections read. Supports uncertainty and sampling requirements, not an exact coverage target.
9. van den Bremer & Breivik (2018), [Stokes Drift](https://pmc.ncbi.nlm.nih.gov/articles/PMC5740299/). Theory and spectral/group-flow sections read. Pelagic uses approximate wind drift plus orbital velocity, not an integrated Stokes solver.
10. Pope & Fry (1997), [Absorption Spectrum of Pure Water](https://omlc.org/spectra/water/abs/pope97.html), [digitized measurements](https://omlc.org/spectra/water/data/pope97.dat). Abstract and numerical data read. Original units cm^-1 converted to m^-1; values at 450/550/650 nm used as three-channel proxies. `pope97.dat` retained as research data with its embedded attribution; no source code copied.
11. NASA (2003), [Ocean Optics Protocols, Vol. IV](https://ntrs.nasa.gov/api/citations/20030093642/downloads/20030093642.pdf). Chapter 1 read. Absorption, beam attenuation, scattering and backscatter distinguished. Corrupt table OCR was not used for coefficients.

## Astronomy and graphics references

- USNO, [Computing Approximate Solar Coordinates](https://aa.usno.navy.mil/faq/sun_approx): equations read; implemented low-cost solar geometry. Approximate geometric position, not a precision apparent ephemeris.
- Paul Schlyter, [Computing planetary positions](https://stjarnhimlen.se/comp/ppcomp.html): lunar orbital elements, perturbations and coordinate conversions read; implemented approximate Moon position and illuminated fraction. No planetary source code copied.
- NOAA, [Solar Calculation Details](https://gml.noaa.gov/grad/solcalc/solareqns.PDF): equations consulted as an independent solar reference.
- Hillaire (2020), [A Scalable and Production Ready Sky and Atmosphere Rendering Technique](https://sebh.github.io/publications/): publication page/abstract consulted. Large PDF fetch failed; full paper was not read. Actual LUT implementation inherited from audited MIT source; no claim of paper-complete implementation.
- Bruneton, Neyret & Holzschuch (2010), [Real-time Realistic Ocean Lighting using Seamless Transitions from Geometry to BRDF](https://inria.hal.science/inria-00443630): abstract/search material consulted. Moment filtering implemented through audited source and algebraic checks, not a claim that full paper experiments were replicated.
- Schneider & Vos (2015), [The Real-Time Volumetric Cloudscapes of Horizon Zero Dawn](https://www.guerrilla-games.com/read/the-real-time-volumetric-cloudscapes-of-horizon-zero-dawn): original publication abstract consulted; full presentation not read. Pelagic cloud code is a separate finite-volume approximation; not Nubis fidelity.

The directional-spreading high-frequency expression was cross-checked against scientific publications/implementations during research. Conflicting presentations exist; the reference's `log(ratio*ratio)` form was retained, not declared a proven transcription bug. A definitive calibrated short-wave spectrum remains future work.

## Authentic visual reference

[NOAA Ocean Exploration, Sun Peeks Through the Clouds](https://oceanexplorer.noaa.gov/multimedia/sun-peeks-through-the-clouds/), 2024 Beyond the Blue: Hawai'i Mapping aboard NOAA Ship Okeanos Explorer. Original page provenance and photograph inspected. Observations: restrained dark water, irregular swell, broken warm highlights, cloud shadow and a locally sharp horizon. Wind, exposure and radiometric calibration unknown. Used qualitatively; no matched quantitative validation. No footage was watched, no imagery bundled into the renderer.

No downloaded assets, neural textures, external fonts, satellite data or stock skies are used at runtime. No claim of a professional footage comparison, LEADR replication, measured whitecap calibration or spectral radiometric validation is made.
