# PELAGIC 0.2 development record

This file records 0.2 work. `TECHNICAL-REPORT-0.1.md` and earlier research notes preserve 0.1 findings; `TECHNICAL-REPORT.md` reports the delivered 0.2 result. Scientific and visual acceptance remain separate.

## Baseline and reference

The 202-file 0.1 manifest was verified before copying its source into this separate project. Commit `397f021` preserves the foundation; the sibling `pelagic` remains unchanged. New baseline images: `evidence/stage-01/v01-{golden,midday,storm,high}.png`, with full settings in JSON. All use seed 1307, 1920x1080, fixed 1/60 s, initial t=20, 100 frames, Balanced, free camera. Ten-second baseline golden motion is in stage-04.

The original Noniv reference was rendered from commit a07c7fd522ef0a897601c114f927a49d93d95520. A separate harness changes only seed 1 to 1307 and disables the surface-camera guard. Camera (0,2,0; yaw 4; pitch -5.5), fov 58, t=20, 100 frames, resolution, wind/swell, sun 5 degrees, haze 1.8, exposure 1.3, clouds .32, veil .14, bloom .045 and chop 1.12 match. Reference turbidity stays 1.6: its arbitrary colour gain cannot be equated to PELAGIC's optical proxy. Its quantized dispersion, swell normalization, cloud generator and quality system differ. `reference-golden.png` is a controlled shared-input comparison, not an identical-physics comparison.

Observed: the original reference has brighter green water and a much stronger glitter path. Its clouds remain flat. 0.1 clouds obscure the light; its added short-wave energy and Fresnel changes increase wrinkled contrast. This does not establish that the reference's arbitrary body tint is more physically accurate. Its finest cascade amplitude attenuation (.85, .6) was removed in 0.1 without a replacement short-wave spectrum.

`REFERENCE-HARNESS.patch` records the complete two-line modification to the cited original `js/main.js`; all five reference shader files match the original. Apply it in a separate checkout, serve the reference with its own local server, then use:

```text
/?free=1&cam=0,2,0,4,-5.5&fov=58&t=20&frames=100&w=1920&h=1080&ui=0&windSpeed=7&windDir=118&fetchKm=90&swellHs=1.8&swellDir=94&swellLength=120&swellSpread=48&choppy=1.12&turbidity=1.6&foam=1&sunElev=5&sunAzim=4&exposure=1.3&haze=1.8&clouds=0.32&veil=0.14&bloom=0.045&shot=reference-golden.png
```

## Ocean optics checkpoint ec972f3

- New `src/sea-spectrum.js`, mirrored WGSL: remote swell tapers between 1.5 and 3 peak frequencies, then is numerically renormalized to Hm0. Long wind waves retain fetch-limited JONSWAP. A log-wavenumber crossfade from 1 to 8 rad/m introduces Elfouhaily equilibrium branches. This hybrid and its transition are an explicit approximation; not the full validated Elfouhaily directional spectrum.
- Gravity-scale choppiness decreases toward capillary scales. FFT butterflies and phase oscillators stay intact.
- Filtered covariance is transformed into the local tangent frame; positive definiteness is bounded. Removed the redundant derivative variance term. Solar disc covariance follows the half-vector slope Jacobian, after water deformation. Five-point environment quadrature uses visible projected facet weights. This is approximate environment integration, not exact multiple reflection.
- Water-body radiance uses the Gordon quadratic backscatter ratio, downwelling irradiance and air/water radiance conversion. Three RGB wavelength proxies remain, not spectral colourimetry. Crest thickness uses compression, still a heuristic.
- PASS: 12 CPU tests, including all nine inherited tests; normalized tapered swell, wind-spectrum continuity, integration convergence. PASS: hardware spectral readback, six cascades, zero sampled nonfinite heights/slopes. One golden realization Hs about 2.34 m. Observational slope calibration remains UNVERIFIED.
- Visual gate remains OPEN: matched sunset improvement is modest with unchanged clouds. Daylight looks more legible but still synthetic. Clear-sky diagnostic demonstrates glitter suppression was substantially due to cloud shadowing.

## Whitewater, cloud and immersion work in progress

Foam onset uses principal compression rather than requiring nonzero crest slope. Reference-coordinate current velocity is transformed by the inverse deformation; orbital displacement is not applied a second time. Binary16 decay compensation remains. Foam density controls optical thickness. Onset parameters are a visual model, not validated breaking hydrodynamics or a measured whitecap fit. Early storm source was too weak; increasing it produced excessive thin grey films. Both failed intermediate images are retained.

Cloud density now samples a one-time periodic 64-cubed GPU gradient/cellular-noise cache, uses weather organization, vertical profiles and erosion. Reflection, direct shadows and sky share the field. Samples increase while expensive procedural noise loops leave the per-pixel march. Initial morphology was too broad and dark; later coverage/scale calibration remains under review.

Immersion uses a same-frame GPU surface plane at the entrance plane and per-ray coverage. CPU water-height readback remains only for camera avoidance. Wavelength-dependent path extinction, directional volume scattering and refracted environment radiance replace a uniform underwater fill. Local surface-plane approximation and first-surface raster visibility require crossing tests.

## Consulted sources in this cycle

- Noniv/web-ocean source shaders and main renderer, MIT, local commit above. Attribution retained.
- Bruneton, Neyret, Holzschuch (2010), *Real-time Realistic Ocean Lighting using Seamless Transitions from Geometry to BRDF*, DOI 10.1111/j.1467-8659.2009.01618.x. Read author-manuscript transcription, especially scale transitions and Gaussian slope statistics: https://doczz.net/doc/627823/real-time-realistic-ocean-lighting-using-seamless . INRIA PDF timed out. No code copied.
- Elfouhaily et al. (1997), DOI 10.1029/97JC00467: abstract/search excerpts consulted; primary Ifremer PDF returned 403. Formula cross-check through Xiradakis (2009), *The refractive effects of laser propagation through the ocean and within the ocean*, NPS thesis, Appendix B: https://calhoun.nps.edu/bitstreams/2cc8212d-b966-4bd2-812a-b589e6c41895/download . This access distinction matters; not claiming a complete reading of the 1997 paper.
- Werdell et al. (2019), *Sensitivity of Inherent Optical Properties From Ocean Reflectance Inversion Models to Satellite Instrument Wavelength Suites*: quadratic rrs relationship and coefficient limitations. https://www.frontiersin.org/journals/earth-science/articles/10.3389/feart.2019.00054/full . Gordon coefficients are a semi-analytical Case-1-water approximation, not a complete directional radiative-transfer solver.
- Schneider (2017), Nubis presentation landing page: https://www.guerrilla-games.com/read/nubis-authoring-real-time-volumetric-cloudscapes-with-the-decima-engine . PDF exceeded web-tool size limit; consulted description and morphology concepts, not claiming full presentation review. Original cache implementation, no reused cloud assets/code.
- NOAA *Rough Seas*, Seascape Alaska EX2304 (2023): https://oceanexplorer.noaa.gov/multimedia/okeanos-explorations-seascape-alaska-ex2304-gallery-media-dive03-rough-seas/ . Playback opened; visible early deck/ocean view inspected. Obstruction and unreported wind/exposure prevent quantitative matching. Not a calibrated validation dataset.
- NOAA *Changing Sea States*: https://oceanexplorer.noaa.gov/multimedia/changing-sea-states/ . Playback opened; sampled browser views inspected. Same limitations: no matched wind, optics, exposure or calibrated wave measurements. No footage/assets reused.

## Integrated corrections a12cd37 through d6366a8

- HDR readback found 226 RGB samples above 60,000 and a maximum of 65,504 in a direct-sun view. Main HDR now stores radiance divided by 32 in daylight, with inverse compensation in exposure and Karis bloom weighting. Night uses divisor 1 after astronomical light selection. Matched repeat: maximum 5,852, zero nonfinite/negative/saturated samples. This fixes storage clipping, not intentional display highlight roll-off.
- Cloud cache now has seven 3D mip levels. Pixel cones and ray segments filter the full density hierarchy. Exponential segment spacing reaches 200 km instead of cutting the layer at 55 km. Deterministic midpoint integration avoids random screen-space density jitter. Coarse self-shadow sampling retains mean erosion, preventing a denser shadow volume than the visible cloud. Cloud morphology is still visibly procedural; increased complexity is not a visual PASS.
- Seven 10-second 1080p clips at a12cd37 revealed a black waterline band. Surface shading now classifies the incident medium from actual triangle orientation, not a perturbed shading normal or delayed CPU height. Sky-only rays retain the local entrance-plane approximation. The GPU probe uses the same near-mesh displacement filtering. A repeated skim capture at 3e17431 shows markedly narrower artifacts, but a straight boundary remains in some frames. A grazing-facet fallback subsequently prevents an empty five-point reflection integral from returning black.
- Removed arbitrary x-directed motion from the foam microtexture. Persistent foam transport remains in the reference-coordinate current field. The ten-second storm recording demonstrates foam accumulation; after several seconds broad films become too uniform. This remains a failed visual gate, not a physically validated whitecap solution.
- Fixed weather-recording haze updates to invalidate atmospheric LUTs. UI layout and controls remain intact. No new scenery or engine dependency.
- Final matrix at d6366a8: 48 environment views plus four special views, all 1920x1080, seed 1307, t=20 + 100/60 seconds. All 48 baseline input records match exactly. Each capture includes full HDR and spectral readback; scientific correctness remains separate from perceptual realism.

## Evidence map

| Stage | Before | After / verification | Remaining dependency |
|---|---|---|---|
| Spectrum / optics | stage-01/v01-golden, v01-midday | stage-02/v02-ocean-golden, v02-ocean-midday; GPU ensemble and optics tests | Oceanographic slope distribution and nonlinear geometry validation |
| Foam / spray | stage-01/v01-storm; stage-03/v02-foam-storm | stage-03/v02-refined-storm; stage-04/v02-storm-motion | Whitecap coverage calibration, coherent aerated breaking geometry |
| Clouds / HDR | stage-03/v02-cloud-golden, v02-hdr-sun | v02-cloud-filtered-golden, v02-hdr-prescaled; final golden matrix | Better morphology, far-cloud reconstruction and absolute radiance calibration |
| Immersion | stage-04/v02-skim-motion at a12cd37 | v02-skim-corrected at 3e17431; final special views | Curved waterline and refracted multi-intersection visibility |
| Integrated | evidence/baseline-0.1 | stage-04 matrix, review sheets and matched-inputs.json | Failed visual gates in the defect register |

Paths in the table are relative to `evidence/`, except explicit `evidence/` paths. Intermediate failed captures are retained. Motion review consists of decoded frame sequences, selected full-resolution frames, browser playback samples and numerical cadence checks where recorded; it is not a blinded perceptual study.
