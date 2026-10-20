# Phase 0 consulted sources

Access scope is part of every citation. Papers listed by another report are not automatically counted as read. Third-party media is linked in the reference board; it is not copied into the renderer.

| Source | Actually consulted | Decision supported / limits |
|---|---|---|
| Current PELAGIC source and V03/V04 reports | Relevant WGSL, renderer, settings/UI, numerical tests; original evidence manifest; inspected media subset listed in report | Primary implementation truth. Existing claims remain bounded by their tests. |
| Hark, PELAGIC 0.4 Complete Research Package, 52 pages | Local original PDF available; extracted text, 34-item decision register, 18 questions and supplied scripts inspected; original page 6 rendered/visually inspected | Hypotheses only. Mode counts, PM wind height, colour conversion, unseeded fold tests and B threshold require correction. Original PDF SHA-256: a610f3e03b0d316812c5c5c3415a568ec5ab7d1a27ec7dcb88d250fd95388ff8. Other original PDFs located but not newly reviewed end-to-end. |
| [Barthelemy et al., breaking onset](https://arxiv.org/abs/1508.06002) | Abstract | Nonlinear focusing groups, local crest velocity/energy-flow ratio; does not validate linear FFT u/c substitution. Full paper analysis remains necessary before a breaker model. |
| [Curcic, long/short-wave modulation](https://arxiv.org/abs/2410.12960) | Abstract | Idealized steady nonlinear crest/action setting and limited long-wave steepness. Not a calibrated broadband storm coupling law. |
| [Wind-speed scaling in fully developed seas](https://journals.ametsoc.org/view/journals/phoc/29/8/1520-0485_1999_029_1801_wssifd_2.0.co_2.xml) | Search excerpt; full article access returned 403 | Wind reference-height caution. Phase 0 log-law conversion is explicitly assumed; full empirical calibration remains open. |
| [Nubis, Guerrilla Games 2017](https://www.guerrilla-games.com/read/nubis-authoring-real-time-volumetric-cloudscapes-with-the-decima-engine) | Official page, retained official PDF text: density/coverage slides 28-40 and weather 69-72 | Separate weather coverage/type, vertical profiles and erosion. No code copied; this is graphics production experience, not fluid validation. |
| [WMO Cumulus](https://cloudatlas.wmo.int/en/cumulus-cu.html), [Stratocumulus](https://cloudatlas.wmo.int/en/stratocumulus-sc.html), [Cumulonimbus](https://cloudatlas.wmo.int/en/cumulonimbus-cb.html) | Definitions/pages | Distinguish formations and convective storms. Illustrative cartoons not treated as observed ocean photographs. |
| [CIE 1931 observer](https://cie.co.at/datatable/cie-1931-colour-matching-functions-2-degree-observer) | Official page, CSV, metadata and published checksum | 1 nm XYZ integration. DOI 10.25039/CIE.DS.xvudnb9b; CC BY-SA 4.0. |
| [CIE D65](https://cie.co.at/datatable/cie-standard-illuminant-d65) | Official page, CSV, metadata and checksum | Standard illuminant rather than a 6504 K blackbody approximation. DOI 10.25039/CIE.DS.hjfjmt59; CC BY-SA 4.0. |
| Pope & Fry (1997), Applied Optics 36, 8710-8723 | Existing `docs/pope97.dat`, title/header and values | Header says 1/cm. Multiply by 100. Paper itself not newly accessed; table provenance inherited from repository. Pure-water absorption is not complete seawater optical data. |
| [Noniv/web-ocean](https://github.com/Noniv/web-ocean), a07c7fd522ef0a897601c114f927a49d93d95520 | Retained source/audit, post shader re-inspected | Same extra desaturation/AgX structure is inherited. No new matched Noniv runtime comparison. MIT attribution retained. |
| NOAA/NASA media | Exact pages, images and playback scope in `V04-REFERENCE-BOARD.md` | Morphology/context only; unknown meteorology/exposure prevents calibrated image matching. |

No scientific paper is presented as personally verified beyond this stated access scope. The previous research archive remains available; Phase 0 does not claim every bibliography entry was reread.
