# PELAGIC 0.4 — Owner's Six-Video / Three-Paper Reference Integration
**25 October 2026 · Combined A+B only · owner reference handoff · NOT a new milestone or owner acceptance**

Repository: `adievibecoder-sudo/PELAGIC`, branch `development/pelagic-0.4`. Read active `AGENTS.md`, `docs/V04-STATE.md`, `docs/V04-AB-DEVELOPMENT.md`, `docs/V04-AB-CONTINUATION-05.md`, `docs/V04-ACCEPTANCE.md`, and `docs/V04-AB-2026-10-25-RESEARCH-RECONCILIATION-AND-EXECUTION.md` before acting. Published head at time of authoring `1368433`, most recent renderer `173c153`; local unpublished work may be newer. Preserve it.

## Owner intent
Achieve **physically grounded, visually extraordinary** ocean, sky, weather and motion. Study Sea of Thieves for *visual hierarchy and coherent art direction* (large readable wave shapes, lit blue-green wave sides, selective glints, dark troughs, crest-following fresh foam, aged trailing lace, cloud/sea colour harmony), not as proof of physically accurate material constants or nonlinear fluid simulation. Blend physical consistency with beautiful/convincing composition without copying stylized cyan values, unphysical crest SSS gain or arbitrary foam density into every condition.

## Original six videos (owner-supplied; currently LOCAL PACKAGE ONLY, not uploaded to GitHub)
All original 60-FPS H.264 MOVs. Keep byte-identical; original captures are gameplay/developer demos, not calibrated sea-state or fluid-velocity measurements.

| File | Duration | Reference utility |
|---|---:|---|
| `IMG_2511.MOV` | 5.448s | Talk sample: concentrated sunlight/glitter and green wave body |
| `IMG_2513.MOV` | 13.143s | Talk sample: storm/crest foam coverage, branching white ribbons |
| `IMG_2518.MOV` | 35.383s | Dark teal steep wave faces, atmospheric horizon and clouds, coherent scale hierarchy |
| `IMG_2519.MOV` | 16.338s | Ship-forward near-water wave ridges, dark troughs, directional breaking foam |
| `IMG_2522.MOV` | 61.433s | Repeated air/waterline crossings, luminous green/cyan wave faces and underwater optics |
| `IMG_2523.MOV` | 55.883s | Open-ocean foam, near/elevated scale changes, cloud/water colour composition |

Sample windows (approximate): 2518: 1–7, 8–22, 23–35s; 2519: 0–6, 7–16s; 2522: 5–9, 10–36, 40–48s; 2523: 0–21, 22–37, 39–56s. Prior review used time-distributed frames and selected larger views, not individual human inspection of all frames. No source-engine runtime or quantitative sea state can be recovered from them.

## Three source PDFs (LOCAL PACKAGE ONLY)
1. **Jerry Tessendorf**, *Simulating Ocean Water* (1999–2004), 26 pp, local `Tessendorf_2004_Simulating_Ocean_Water.pdf`: statistical FFT waves, horizontal displacement/chop, physical dispersion, Jacobian/minimum principal stretch, Fresnel and water volume; surface model alone omits actual 3D breaking/splash dynamics. Original at author's copyright.
2. **Rare / Nigel Ang et al.**, *The Technical Art of Sea of Thieves*, SIGGRAPH 2018, 2 pp, DOI 10.1145/3214745.3214820, local `Rare_2018_The_Technical_Art_of_Sea_of_Thieves.pdf`: Tessendorf FFT + wave-side/crest light approximation, foam onset, accumulated/blurred temporal foam + authored texture scale, brighter storm foam, spray and selective highlights. Source talk transcript ~4:50–9:17 and 11 slide screenshots were read, but owner asked not to upload screenshots to this package.
3. **Fournier et al.**, *Dynamic Wave Trains: A Procedural Approach to Spatially Varying Ocean Synthesis*, Computer Graphics Forum (2026), 17 pp, DOI 10.1111/cgf.70495, local `Fournier_2026_Dynamic_Wave_Trains.pdf`: spatial fields for wavelength, direction, sharpness and propagation; phase-linked foam and spray; possible nonperiodic local wave train. **Not** validated full breaker topology, exact spectral equivalence or an RTX 3050 cost claim. Note paper CC BY-NC.

## Compare with actual PELAGIC (source, not assumptions)
- **Already implemented**: six GPU FFT cascades, vertical/horizontal vertex displacement, choppiness, physical spectral phase, derivatives/moments, native WebGPU, Fresnel/body/sun/sky shaders, world foam clipmaps, Jacobian compression indicators, bubble pattern/foam variants, spray, cloud/weather rendering. Do not reimplement these as if absent.
- **Proven AB5**: full scene presets now replace scenes immediately; weather evolution explicit; redundant cloud work removed without output differences in tested scenes. Reported High example GPU 83.61→57.29ms; 17.42 rAF FPS, repeat 14.80: performance target still **FAIL**.
- **Opt-in, unaccepted**: gravity-crest onset (`maBreaking=gravity`); `abFoam=transport`; `abFoamPattern=bubbles`; `abRain=velocity`; hybrid MSAA+TAA (no proven relevant perceptual improvement and nontrivial cost).
- **Open A**: W1 macro/wrinkle imbalance and periodicity; W2 roughness/coupling; L1/L2 body/glitter/cloud attenuation, flat bronze/silver look, insufficient coherent crest illumination; C1 cloud morphology/rims/tiling; A1 twilight/moon/night radiometry; renderer performance and rare pacing fault.
- **Open B**: B1 whitewater still flat/unattached, no convincing event-connected roller/aeration/spindrift; B2 integrated spatial precipitation, lightning illumination, sea/weather history, haze and storms. Neither B1 nor B2 nor whole A+B has owner visual acceptance. No legitimate percentage can be derived from repository progress.

## Actual implementation path — do work, don't restart planning
**First** target either water optical/scale defect or B1 crest-connected whitewater, preferably one substantial coupled improvement that reads beautifully in moving ordinary scenes. Use tightly scoped source diagnostics only to choose a source intervention. Water: isolate direct Sun/cloud shadow, resolved slopes/spec/reflection and water body, then repair causality without global brightness/glow hacks. B1: extend existing onset, foam clipmaps and spray; create distinct active connected crest foam, local aerated body/roller representation where necessary, age/diffuse/advect whitewater and textured lace; prevent broad artificial sheets. Validate calm/rough/storm with controlled warmed motion. Do not equate a negative Jacobian with actual physical overturning.

**Next** strengthen A cloud morphology and B2 coupled rain/weather/lightning/sky–water lighting, retaining AB5 no-output-change performance optimization. Conditional local procedural wave trains can be tested opt-in only if W1 broad coherence/tiling persists and spectral energy/derivatives/LOD remain conserved. No FFT rewrite, framework migration, shoreline/ship, Milestone C or release authorization.

**QA cadence**: implementation-led. Run narrow shader/GPU numerical checks after actual changes; make matched high-res near/elevated day/gold/storm + short moving clips when change matters. Full QA, extensive benchmark, evidence publishing only at substantial integrated checkpoints, not repetitive audits or endless analysis. Preserve local changes/evidence and release boundaries. Owner reviews B1/B2/A+B; agents cannot self-accept. Do not spend another cycle optimizing hybrid TAA without demonstrated visible gain.

## Storage and copyright
The repo is **public**. The original six videos and three PDFs are **NOT uploaded by this Markdown commit**. Keep originals in the separately supplied package until a local Git LFS push and real-object hash verification; do not use broken LFS pointers or imply GitHub hosts binary assets. Respect copyrighted Rare/ACM papers, Tessendorf notes, Fournier CC BY-NC terms, and underlying game footage. Review public distribution rights before publishing these binaries. This handoff document may be hosted as text independently.

**Further detail:** local owner handoff package contains `docs/PELAGIC_AB_RESEARCH_REFERENCES_AND_EXECUTION.md`, `analysis/PELAGIC_AB_VISUAL_AND_TECHNICAL_RESEARCH_REPORT_2026-10-25.md` and PDF, byte-verified MOV/PDF originals and SHA-256 manifest. The agent should read them when locally available and begin implementation; not require waiting for media publication.
