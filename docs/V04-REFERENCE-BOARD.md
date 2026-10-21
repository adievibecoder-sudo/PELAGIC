# PELAGIC 0.4 — Real-World Reference Board and Visual Acceptance Matrix

**Phase 0 status, 20 October 2026:** Three documented media sources selected below; cloud photographs inspected, ocean video sampled during browser playback. No calibrated scene match or owner approval is claimed. Remaining slots explicitly stay unfilled. The user is final judge of visual success.

## Source discovery (check individual image permissions/provenance)

- WMO International Cloud Atlas — https://cloudatlas.wmo.int/
- NOAA NDBC wind/sea-state observation data — https://www.ndbc.noaa.gov/
- NOAA GOES imagery for mesoscale cloud structure — https://www.star.nesdis.noaa.gov/GOES/
- NASA Worldview satellite imagery — https://worldview.earthdata.nasa.gov/
- NOAA Ocean Exploration photographs/video — https://oceanexplorer.noaa.gov/
- NOAA National Weather Service thunderstorm and marine weather references — https://www.weather.gov/
- Original wave-breaking, whitecap, water-optics and cloud-structure scientific literature as cited in the research archive.

## Reference slots — select actual files and metadata during Phase 0

| ID | Phenomenon / acceptance look | Important observed features | Verified photo/video and provenance |
|---|---|---|---|
| R01 | Clear midday, moderate wind sea | Accurate wave-group geometry, glitter, fine ripples, sea colour, horizon | **NOT YET SELECTED** |
| R02 | Daylight broken clouds, moderate sea — vertical slice | Convincing cloud shape/scale/distribution, moving shadow, water reflection, neutral colour | **NOT YET SELECTED** |
| R03 | Offshore swell and calm air | Broad coherent groups; distinct small capillary response; convincing reflection | **NOT YET SELECTED** |
| R04 | High-altitude sea / long fetch | Non-repeating wave groups, patches, atmospheric scale, foam statistics | **NOT YET SELECTED** |
| R05 | Mature marine stratocumulus overcast | Authentic connected deck, varied cloud base, diffuse light, dark/silver structure | NASA Terra/MODIS open/closed cells, source A below; organization only, not sea-level lighting |
| R06 | Scattered cumulus and cloud streets | Nonuniform placement, natural turrets/erosion, correct wind/mesoscale organization | NOAA/Kresge photograph, source B below; cumulus silhouettes, not measured cloud streets |
| R07 | Golden hour/sunset with clouds | Scattering, backlit/side-lit cloud detail, warm/cool separation, sea glitter | Source B: low-light contrast reference; exact solar geometry unknown |
| R08 | Blue twilight and natural Moon/night sea | Credible radiance, cloud silhouettes, low-light water, exposure context | **NOT YET SELECTED** |
| R09 | Offshore breaking crest and whitecaps | Event-linked rollers, sheets, foam evolution, wind-attached spray | NOAA Seascape Alaska rough-sea video, source C below; useful broad motion context, insufficient close-breaker calibration |
| R10 | Strong gale/squall and rain shafts | Spatially related cloud darkening, precipitation, visibility, gust seas, spray | **NOT YET SELECTED** |
| R11 | Convective marine thunderstorm | Anvil/tower, local rain, lightning inside associated cell, transient cloud/sea light | **NOT YET SELECTED** |
| R12 | Half-submerged / underwater | Dynamic wave interface, near-field refraction, under-surface illumination and bubbles | **NOT YET SELECTED** |

## Per-reference metadata schema

Record: reference ID; exact media URL or local permitted path; author/source; licence/reuse conditions; capture date/time/location if available; camera height, framing/FOV and exposure if available; wind speed at measurement height and direction; buoy Hs/Tp if independently linked; cloud type/coverage; Sun/Moon geometry if known; aspect to compare; which variables are **unknown**. Never infer measurements from a dramatic-looking image.

Prefer several references per scene rather than one perfect-looking stock photo. For unknown shooting conditions, compare bounded or invariant properties (cloud morphological distribution, relative optical contrast, angular glitter geometry, foam-size shapes) instead of claiming pixel-perfect validation.

## Review procedure

1. Select a controlled 1080p **daylight broken-cloud/moderate-sea** slice with fixed camera, seed, environmental state, astronomy and **fixed exposure** for diagnosis.
2. Capture grey-lit ocean geometry, foam masks, cloud-density/silhouette, cloud-only radiance, water-body/reflection-only and full integrated images; also collect **continuous motion**.
3. Inspect reference, original 0.3 and new 0.4 side by side under bounded conditions. Ask what is physically wrong, what looks synthetic, what changes in motion and what went missing.
4. Immediately run golden-hour, fully overcast and convective storm **control views**, so a hero-slice improvement does not overfit a single look.
5. The **user** must inspect the relevant original resolution imagery and representative motion and approve phase-level visual quality. Astra's self-rating or test pass cannot substitute.
6. Expand at milestones to weather × time-of-day × sea-state combinations, low/high/underwater views and multiple weather-transition sequences.
7. Track per-view FAIL/UNVERIFIED/PASS, suspected cause, proof, owner comments, and iteration decision.

**User-owned asset policy:** Store licensed/user-provided media only after permissions are verified. Do not bulk-scrape copyrighted visuals or invent the availability of a reference package.

## Selected media and inspection limits

### A. Regional marine cloud organization

[NASA Open- and Closed-Cells over the Pacific](https://science.nasa.gov/earth/earth-observatory/open-and-closed-cells-over-the-pacific-87456/), Terra MODIS, captured 1 February 2016, published 6 February. Image credit Jeff Schmaltz, LANCE/EOSDIS Rapid Response. [Inspected detail image](https://assets.science.nasa.gov/content/dam/science/esd/eo/images/imagerecords/87000/87456/pacificoceandetail_tmo_2016032.jpg).

Observed: connected irregular cell boundaries, open interiors, wide regional changes in coverage and much smaller structures within banks. The published image includes labels and a 25 km scale bar. Satellite perspective is unsuitable for sea-level radiance, foam or camera-FOV matching. Exact wind, condensate, optical depth, sea Hs/Tp and exposure are unknown here. NASA-attributed imagery is linked, not redistributed; third-party rights/endorsement conditions remain applicable. No use as a rendered texture.

### B. Cumulus silhouette and warm/cool separation

[NOAA Historic NWS wea00081 / Cumulus7](https://commons.wikimedia.org/wiki/File:Cumulus7_-_NOAA.jpg), Ralph F. Kresge #1126-c, near Deerfield Beach, Florida, September 1980. Commons identifies the NOAA employee-work image as US public domain. [Original 1804x1200](https://upload.wikimedia.org/wikipedia/commons/5/58/Cumulus7_-_NOAA.jpg).

Inspected original in Chrome. Observed: irregular turrets and cavities, different angular sizes/distances, warm illuminated portions against cool dark bases. The scanned image has visible age/scan artifacts. It contains a beach, palms and shallow breaking waves; use only its sky organization/lighting contrast for this open-ocean project. Camera height, focal length, exposure, colour processing, exact time, wind and sea spectrum are unknown. It is not a calibrated colour target.

### C. Rough-sea motion context

[NOAA Ocean Exploration: Rough Seas](https://oceanexplorer.noaa.gov/multimedia/okeanos-explorations-seascape-alaska-ex2304-gallery-media-dive03-rough-seas/), Seascape Alaska 3 / EX2304, dive 3. Page credits NOAA Ocean Exploration, Seascape Alaska. [HD 1280x720 video](https://oceanexplorer.noaa.gov/wp-content/uploads/2023/07/dive03-rough-seas-1280x720-1.mp4).

The embedded 640x360 video played through approximately 17.82 seconds; screenshots sampled its opening ship/sea view and end. The HD link was opened, but detailed HD motion inspection was not completed. Thus no close-breaker or full-clip perceptual validation is claimed. Ship motion/occlusion makes a fixed-camera comparison inappropriate. The page explains recovery of vehicles due to deteriorating seas; no numerical wind/Hs/Tp/FOV/exposure is given. Link only; NOAA attribution retained. This is provenance-backed discovery with limited observation, not acceptance proof.

## Controlled comparison plan

Match invariant structure first: cloud-base versus turret scale, silhouette irregularity, spatial coverage transitions, crest/foam relationships. When camera/meteorology are unknown, keep numeric calibration UNVERIFIED. Acquire documented open-water daylight, swell, night, rain-shaft and half-submerged references before closing those slots. No invented photos or metadata fill the gaps. The owner can approve or replace this provisional set at the Phase 0 review gate.


## Targeted R&D reference expansion (21 October 2026)
Section L of `docs/research/PELAGIC_V04_TARGETED_RD_2026-10-21.md` lists **18 candidate real-world records**, with source links, known/unknown EXIF, rights caveats and scientific purpose. These are NOT all newly inspected, licensed for redistribution, scene-calibrated or owner-approved.

Priority Phase 1 source candidates: [Open ocean with clouds (Commons)](https://commons.wikimedia.org/wiki/File:Open_ocean_with_clouds.jpg), [NASA Cloudscape at Dawn](https://earthobservatory.nasa.gov/images/149490/cloudscape-at-dawn-northwest-atlantic), [NASA marine cloud-cell evolution](https://earthobservatory.nasa.gov/images/150926/ex-cell-ent-clouds-off-chiles-coast), [Rain over ocean (Commons)](https://commons.wikimedia.org/wiki/File:Rain_over_the_ocean_from_Mt_Herbert,_Banks_Peninsula,_Canterbury,_New_Zealand_06.jpg). Satellite images show mesoscale pattern, not eye-level calibrated water colour; coastal images do not prove offshore Hs/Tp. Verify each asset's current licence and details before downloading/redistributing.
