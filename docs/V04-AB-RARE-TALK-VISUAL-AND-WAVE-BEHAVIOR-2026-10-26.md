# PELAGIC 0.4 — Rare talk, six-video visual study and physically grounded wave behaviour
**Owner reference supplement · 26 October 2026 · existing combined A+B milestone; not a new gate or implementation result**

## Direct owner decision
Aim for **naturalistic, physically coherent ocean movement AND exceptional deliberate AAA visual art direction**. Sea of Thieves is a benchmark of beauty, wave readability, differentiated water colour, connected whitewater and dramatic sky/sea lighting; it is **not a demand to copy its deliberate stylization, spectrum, its material coefficients or its undisclosed simulation internals**. Preserve the current native WebGPU / WGSL custom rendering system and six-cascade FFT. Make material *visibly* more beautiful and convincing in real moving views rather than merely increasing feature count, foam brightness or test count.

**New mandatory reference task:** A+B AB6 `docs/V04-AB-CONTINUATION-06.md` explicitly records **only two time-distributed frames per video** and one Tessendorf optics page inspected. That was a useful preliminary sample, **not a complete review**. The owner requests a fuller, deliberate temporal and paper review now. Make this a **bounded one-time preparation step**, then resume meaningful implementation immediately. Do not convert it into weeks of review and QA.

## Reference files and location
The six original user-supplied videos and the three original papers belong in the locally ignored `_local_references/` directory (or the actual user-supplied `local references/` if used). The eight slide PNGs and this companion index belong in the local `rare_talk_selected_slides/` add-on. **These images/media must remain untracked in the public GitHub repository.** There is no claim that publishing this Markdown has uploaded them. GitHub contains the source research link and original written conclusions, not a license to redistribute copyrighted slide captures.

Videos: `IMG_2511.MOV` (5.45s), `IMG_2513.MOV` (13.14s), `IMG_2518.MOV` (35.38s), `IMG_2519.MOV` (16.34s), `IMG_2522.MOV` (61.43s), `IMG_2523.MOV` (55.88s). The first two are short talk visual examples, the last four are gameplay recordings, about 3m08s total. **Play all six start-to-finish** once at ordinary speed, and inspect storm crests/waterline/crest light at a suitable reduced speed and higher resolution. Examine moving wave groups, directional travel, foam formation/dissipation, visibility of larger waves beneath small shimmer, reflection, body transmittance, sky/sea radiance, not just selected pretty stills. Log a few precise time-coded findings and limitations. Camera/game effects may be stylized; don't infer unknown physical numbers from video.

PDFs in the original local package:
1. `Tessendorf_2004_Simulating_Ocean_Water.pdf` (26 pages), Jerry Tessendorf *Simulating Ocean Water* (copyright 1999–2004). **Priority scientific foundation**: section 3 physical approximations and dispersion; section 4 Gerstner/FFT and spectral synthesis; section 4.6 horizontal choppiness/Jacobian; section 5 separate local interactive wave methods; section 6 Fresnel reflection/refraction; section 7 absorbing/scattering water volume, caustics and sunbeams. Read the full document once, with focus on diagrams and mathematical caveats. **Rare cites Tessendorf 2001 as its FFT basis; the supplied 2004 course notes are related but not automatically the exact original 2001 publication.**
2. `Rare_2018_The_Technical_Art_of_Sea_of_Thieves.pdf` (2 pages), Rare SIGGRAPH 2018 technical art account. Read full, especially water rendering, foam and crest colour. Explicitly distinguishes physically-based dynamics from art-directed shading.
3. `Fournier_2026_Dynamic_Wave_Trains.pdf` (17 pages), *Dynamic Wave Trains: A Procedural Approach to Spatially Varying Ocean Synthesis* (CGF, DOI 10.1111/cgf.70495). Read sections on four control fields, local propagation/refraction/diffraction/reflection, phase-linked foam/spray, filtering and spectrum validation, **including stated limitations**. Its height field cannot resolve actual overturning and splashes; broad accurate spectrum matching and continuous very long waves remain challenges. Test any local procedural wave train as a **bounded supplement**, not an FFT rewrite.

## Eight selected Rare talk screenshot PNGs — user-supplied, locally only
Keep exact originals and original file names. Number below follows the user's 11-slide sequence:
| Original slide | Filename | Why selected |
|---|---|---|
| **2** | `Screenshot 2026-10-25 201014.png` | **Art-direction thesis**: realistic wave motion and deliberate stylized foam/boosted SSS; beautiful yet coherent |
| **3** | `Screenshot 2026-10-25 201056.png` | Choppiness offsets provide an approximate lit wave-side/SSS mask; a visual cue, not true transport |
| **4** | `Screenshot 2026-10-25 203141.png` | Tessendorf deformation **Jacobian** threshold and artist-biased foam emission; detection != solved breaker |
| **7** | `Screenshot 2026-10-25 203230.png` | **Too noisy**: raw foam appears dense, sharp and uniformly mottled |
| **8** | `Screenshot 2026-10-25 203258.png` | **Progressive blur/feedback**: connects and softens foam structures over time |
| **9** | `Screenshot 2026-10-25 203323.png` | **Artist texture layering**: close/fine active foam and broader/aged forms |
| **10** | `Screenshot 2026-10-25 203347.png` | **Final colour/material integration**: foam merged with blue water, not white pasted over it |
| **11** | `Screenshot 2026-10-25 203720.png` | **Storm result**: scale-aware, energized crests, stronger foam and atmospheric integration |

Not selected as top eight: slide 1 restates FFT/Tessendorf and non-PBR shading already in text/paper; slides 5 & 6 are the optional **Jacobian unbiased/biased graph pair**. Inspect both if tuning threshold/coverage, but do not treat an arbitrary more-negative bias as physically calibrated wave breaking. The local add-on need not contain redundant slides; it includes eight originals and an index.

## Transcript-derived Rare workflow (source: user-provided 4:50–9:17 excerpt)
- **4:50–5:20**: Mark Lucas/rendering team FFT ocean based on Tessendorf 2001; develop a water-surface shader from simulation data; they say final shading is **not physically based**.
- **5:25–6:23**: Challenge of combining complex detailed waves with a strongly stylized game. They tried simplifying geometry/specular high-frequency detail, but preferred the richer appearance. Stylized foam and intentionally enhanced SSS created cohesion. **Lesson: detail allocation, not globally blurring/suppressing physical microgeometry.**
- **6:29–6:47**: FFT choppiness vertex offsets estimate wave-side mask; light/view angular product contributes to their approximate scattering look. This is art direction, not calibrated subsurface radiative transfer.
- **6:49–7:25**: Use deformation Jacobian to trigger foam where displacement maps locally fold/overlap; bias the criterion to increase coverage. This **signals compressed/folding crests**, but is not a physical entrainment solution.
- **7:26–7:48**: The unprocessed foam is far too noisy. Progressive temporal render-target blur/feedback yields coherent crest concentration and soft trailing residue. Do not assume indiscriminate blur would help PELAGIC's already-flat grey whitewater.
- **7:51–8:08**: Blend authored high-frequency crest-foam patterns into lower-frequency aged foam and then into the water's colour/light.
- **8:09–8:24**: Spawn crest-related spray particles; increase ocean wave amplitude and foam coverage in storm scenarios. Appearance choice, not proof of physically nonlinear crashing fluid.
- **8:32–9:06**: Sea surface pixel shading dominates an all-water image, quoted about 8 ms surface/20 ms frame on their setup; these are historical game-specific timings, NOT transferable to PELAGIC's WebGPU RTX 3050 workload.
- **9:11+**: Talk transitions into a separate deck shallow-water simulation; not proof FFT automatically handles local splashes.

## Wave size, speed, steepness and interactions — precise implementation distinction
Owner wants dynamic wave scale, speed, **steepness** (rather than material 'stiffness'), and convincing wave crossing, collisions, crashing and energy decay.
- **Existing**: Six FFT cascades and dynamic wind/swell settings give evolving spectral amplitude, wavelength-dependent propagation and Gerstner-like horizontal chop; linear wave crossing produces natural interference patterns. Do not mark these features missing or replace with an unphysical independent speed dial. Deep-water phase velocity follows `c=sqrt(g/k)` with `k=2π/λ`; gravity/capillary and depth effects extend this law.
- **Unverified/weak**: Long coherent groups, local directional/speed variation, realistic redistribution of energy as weather changes, and credible breaking-onset/crest evolution. A visual 'collision' of two ridges mostly means interference; *actual nonlinear wave–wave energy exchange and breaking* are separate phenomena. A height field with fold artifacts or porous parcels is **not** overturning, hydraulic impact or turbulent entrainment.
- **Practical A+B goal**: Build coherent wind/swell multi-scale behavior first; test crossing seas and oblique groups under fixed seeds, reference constraints and conservation of spectral slope statistics. Enhance compression/onset using spatial/temporal crest tracking and causal event strength, and improve B1 through **connected crest-relative roller/aerated-body continuity**, evolving fresh-to-aged foam, dissipating trail and spray/spindrift. Full-volume fluid everywhere is not justified or required by current A+B; clearly state limitations instead.
- **Art direction**: Naturalistic wave *physics* with heightened readability of broad forms, selective glitter, differentiated deep body vs backlit wave shoulders, fresh crisp foam vs soft aged lace, storm-specific intensity, clouds/horizon/colour harmony. No universal cyan glow, flat white stencil, arbitrary Jacobian offset, overboosted SSS or exaggerated height/speed at every weather state.
- **Comparison controls**: calm, swell, intersecting wind waves, choppy open ocean, storm/whitecaps, low-Sun and overcast, near-water and elevated. Use same scene and motion and test meaningful optical and performance regressions.

## AB6 checkpoint: don't restart
Verified A+B latest published remote renderer `24a88e3`, evidence `57ad49f`, publication documentation HEAD `716d63c` as of this note; **always re-check actual local status/HEAD** before work. New opt-in `abWhitewater=parcels&maBreaking=gravity` attaches porous 2.5D whitewater volumes to gravity crest events. CPU 64, native GPU 5 pass; calm byte-identical; storm GPU mean ~41.70→42.38ms (+0.68ms) under the reported scene. But isolated rounded blobs, incomplete contiguous breaking rollers, low-Sun metallic water, cloud morphology, B2 integration and stutter remain. B1/B2/A+B require owner acceptance.

**Next source change**: After one short, thorough reference-reading pass, implement a genuine *crest-relative continuity/temporal evolution* improvement rather than adding more unconnected particle blobs. Use crest tangent/phase or coherent support along a moving ridge; couple onset to directional roller and foam/spray memory and dissipative age in a bounded, reversible experiment. Evaluate moving near and elevated storm vs calm before promoting. If trial doesn't work, record succinctly and move to the next source-backed candidate. Then address water directional-light/glitter/body radiance and broad-wave grouping.

**Implementation-first rule**: One credible code intervention → short matched motion/visual inspection → focused tests → keep/reject → next intervention. No repetitive whole-project audits, multi-day rebenchmark loops, broad architecture rewrites, self-awarded 100% or claims of AAA parity. Save full suite/report/high-res evidence for meaningful owner-ready integrated checkpoints. Do not change user-preserved data or authorize Milestone C/release. User expects decisive improvement, not performative QA.

## Original technical source references
- Rare talk written summary: `https://history.siggraph.org/wp-content/uploads/2022/09/2018-Talks-Ang_The-Technical-Art-of-Sea-of-Thieves.pdf`
- Jerry Tessendorf: *Simulating Ocean Water*, user-provided course notes (1999–2004); do not conflate document date and the 2001 citation.
- Fournier et al. (2026): `https://doi.org/10.1111/cgf.70495`
- Project's own current source records: `docs/V04-AB-CONTINUATION-06.md`, `docs/V04-AB-OWNER-REFERENCE-INTEGRATION-2026-10-25.md`, `docs/V04-ACCEPTANCE.md`.
