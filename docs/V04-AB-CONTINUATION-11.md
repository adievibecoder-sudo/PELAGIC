# A+B continuation 11 - master kickoff continuation

Entry: 28 October 2026, development/pelagic-0.4, HEAD 76fb3d0,
renderer e4d5f3c. Nine inherited evidence edits and package-lock.json preserved;
entry SHA256 manifest is in ignored evidence/v04-ma-ab11-work.
Read the full owner kickoff, active six-stage specification and Resume09.
Chrome DevTools MCP controls the native NVIDIA/Ampere browser. Reuse prior
private reference findings; no new full reference study is claimed.

## Pre-change targets

Baseline: normal defaults, seed1307, High1920x1080, fixed1/24s steps,
t20 plus240 warmup frames, exposure from the scene, camera free.
Near day/gold camera0,2,0,4,-5.5; elevated0,50,0,4,-12.
Storm0,8,0,4,-5.5 and0,18,0,4,-12; calm and lunar controls.
Original captures: evidence/v04-ma-ab11-baseline. Existing Resume09 contribution
diagnostics and rejected angular/slab/skin/shell results are reused.

Optical hypothesis under investigation: source/geometry allocation, rather than
another diffuse gain or colour tint, hides broad wave faces beneath fine
reflections. Require moving deep body/illuminated face separation, selective
glitter and less broad sunset bronze. Fail if simply darker, flatter, noisier,
uniform cyan, or damaged sky. Preserve actual slope energy and finite Sun.
Choose a source intervention only after establishing its causal defect.

Bounded optical/B1 intervention selected: current submerged aeration is an
instantaneous function of surface-active foam g, with additive radiance and no
independent transport or depth. It cannot leave a submerged plume after a front
passes. Add separate gas-column/depth moments in two extra layers of the existing
material clipmaps, driven only by verified phase-resident activity, with material
advection, diffusion, buoyant loss and dissolution. Replace the additive bubble
term with a finite, absorbing scattering layer using the existing shared light.
No new roller geometry or claim of persistent event identity. Crest attachment
is supported by Resume08 three-second crossing/six-second near evidence; fresh
storm/crossing sequences must verify this population, not infer it from tests.
Pass: coloured, fading subsurface aeration below and behind selected fronts,
underlying liquid visible, no calm foam/glow. Fail: cyan blanket, detached patch,
new contour seam, or unchanged surface-paint appearance. Baseline storm72 at24Hz,
day/gold/calm control; this does not solve clear-water bronze by itself.

Cloud hypothesis: identical grid scale, restricted centre jitter and seed-free
thermal placement produce rows and narrow size hierarchy. Test seeded wider
placement/size variation with correlated regional occupancy, preserving existing
noise, lighting and density integration. Pass: varied banks, gaps and silhouettes;
fail: empty ordinary skies, repeated islands, lost storm cover, temporal jumps.
Inspect day/gold and storm, two seeds/positions, plus shared sea reflections.
Support bounds must be updated or retained exactly; no lower-quality raymarch.

Performance: no matched current presented-frame p95. Historical AB8 GPU43.093ms,
rAF p9548.7ms are references only, not compositor presentation measurements.
No performance claim follows from capture throughput.

| Workstream | Status | Exact next action |
|---|---|---|
| 1 References | Internally sufficient; reused | Revisit original private frames only for a specific optical/crest question. |
| 2 Waves/crest | Experimental; no source progress yet | Inspect multiscale deformation/roughness and crossing support before changing fronts. |
| 3 Whitewater | Experimental; preserved phase residency | Keep attached active/residual transport; improve supported aeration after upstream check. |
| 4 Water optics | Active diagnosis | Establish and correct a source defect; evaluate matched normal-renderer views. |
| 5 Atmosphere/weather | Active | Implement seeded thermal organization; retain daylight/storm illumination and shared fields. |
| 6 Integration | Active | Focused native captures, meaningful checks, source publication; U1/G1 and presented pacing open. |

W1/W2/L1/L2/B1/C1/A1/E1/E2/E3/E4/E5/E6/U1/G1 remain open.
I1/T1/R1 remain tracked. B1/B2/A+B are not owner accepted; no Milestone C,
release promotion, ships, engine migration or public private-reference staging.

## 29 October recovery and next interventions

Recovered at unchanged HEAD76fb3d0; both experiments and original captures
preserved. Chrome DevTools connected; pending plume144 finished. All144 paired
storm-profile frames inspected in consecutive cropped sheets at24Hz,
30.000-35.958s: advancing narrow white strips, dark faces and fading speckles.
Plume difference is subtle; convincing moving submerged volume/depth ABSENT.
Strongest objection: still painted foam, without energetic breaking. Do not
promote plumes. Sheets are reduced crops, not full-resolution motion playback.

Cloud support correction: arbitrary lobe rotation plus wider jitter invalidates
the old radius-only support argument at the largest allowed cumulus depth.
Bound radius by the full rotated-lobe radius plus maximum shear, keeping the
same3x3 search and exact density. Validate against an expanded5x5 GPU reference.
The initial captured candidate remains separately preserved.

Regional sea hypothesis: advancing identical weather at different camera
positions currently drives different shared FFT spectra (sampleEnvironment at
the camera feeds state.sea). Shared sea history must be camera-independent.
Use background forcing for shared gravity-wave history; test a bounded local
short-wave energy response to the same moving front, with consistent amplitude,
derivatives, temporal previous state and origin handling. Baseline is current
front-enabled path with fixed seed/time. Pass: spatial roughness follows the
weather continuously without changing remote swell or camera-dependent energy.
Falsifier: camera movement changes shared spectrum, a visible front seam, phase
reset, or mismatch between geometry and shading. Natural-speed long history
remains a separate motion requirement; no invented spectral-direction closure.

Regional implementation now uses the shared background spectrum plus opt-in
`abSea=regional` amplitude/gradient modulation of cascades3-5. The energy ratio
comes from the existing short-wave spectrum, bounded[.25,4]; eight-second
relaxation is a declared model assumption. History is evaluated along the
configured constant-velocity ellipse, not a general wind-history map. Arbitrary
front edits, local directional rotation and regional gravity-wave growth remain
unsupported. Previous-frame fields extend the TAA contract; shared fields also
reach foam, particles, lens and height probes. No FFT phase/swell changes.

Native corrections: initial eight-node integration over the whole64s history
missed fast1km fronts (energy-ratio error.400706). Clipping to actual front
support reduced this to.0118264; differentiating the moving quadrature nodes
restored amplitude/gradient agreement (max5.76e-7) and exact tested rebasing.
Dilute plume depth initially failed binary16 lifecycle checks. Power-of-two1024
storage with gas/depth compensation passes24/60/120Hz (max gas error.001653 of
initial; depth error.000209m). Full production64px clipmap passes material
advection, paused exact copy, reset and zero-source; old failure records retained.
Refracted view parallax now samples the submerged moment at a separate material
position; still a column model, not resolved turbulent3D volume.

Cloud3x3 support equals unoptimized5x5 for65536 native samples spanning17 seeds,
rotated wind, mixed families and0.3/5km depth. Seed affects9326 samples. This
does not establish natural morphology. Regional4096 samples pass independent
dense integration/derivative/rebase checks.25 focused CPU checks pass.

Display inspection: scene-linear half-float radiance, storage-unit decoding and
AgX remain. Actual canvas configuration is bgra8unorm/srgb/standard. Native
clear(.5,.25,.125) to2D sRGB returns[127,64,32], consistent with unorm code values
to one code and inconsistent with a second gamma encoding. Probe artifact says
FAIL only because its initial midpoint test demanded128 exactly; the127 tie
rounding does not establish an encoding bug. Current AgX uses approximate
gamma2.2 output directly. Earlier opt-in abDisplay=linear applies the inverse
matrix after linearization; it is not the same order as Filament's minimal AgX
implementation (outset then2.2 EOTF). Neither variant establishes an optical
appearance solution; no AgX replacement or default display change made.
Primary order reference: https://raw.githubusercontent.com/google/filament/main/filament/src/ToneMapper.cpp

Next controlled comparisons: day/gold near, storm profile; second seed9127 at
(8000,50,-5000), yaw79/pitch-12; front-enabled elevated view at(0,50,0), yaw79/
pitch-12, frontX900/Z0, full width2km, heading0/speed12, seed1307, High1080p,
t20+240/24Hz warmup. Compare regional on/off at identical scene/time. Reuse
existing matching baselines. Calm plume control and no-option day regression.
Captures alone will not close long history, spray/event identity, U1/G1 or T1.

Focused optical finding before further edits: the five-point slope quadrature
has a visibility-boundary bias even for a constant environment. Independent
256x256 Gaussian integration gives reflected fractions.322913 versus.378775
at view cosine.1/slope sigma.1, and.480759 versus.367572 at.01/.1. This is
an angular integration defect, not evidence that all bronze comes from it.
Prior9-point partition retained the unconditioned distribution and failed the
visual target. New candidate: condition quadrature on projected visible slope
probability, maintaining the same covariance, Fresnel, masking, atmosphere and
surface geometry. Bound sample count/cost; compare near/high gold/day and storm.
Pass: more coherent moving reflection with fewer dark/bright facet boundaries,
preserved detailed glitter and no broad brightening/blur. Falsifier: no improved
reflection separation, damaged horizon, bands from the quantile table, or
unacceptable cost. Do not promote on the constant-environment diagnostic alone.

### Resume 12 - recovered optical comparison

Same HEAD76fb3d0 and all interrupted source changes recovered; DevTools connected.
No restart/reconstruction. Gold near visible-facet24 versus baseline24 at
30.000-30.958 inspected consecutively as cropped pairs. Moving broad warm faces,
dark foreground trough and fine ripples remain; the candidate slightly changes
facet contrast but does not separate the bronze reflection materially. L1/L2
appearance target ABSENT; retain optional. Mean display difference1.732 codes
is diagnostic only. Original candidate in v04-ma-ab11-visible-02; no performance
claim from captures. Day elevated regression is being evaluated.

Cloud saved day24/gold24/storm24 inspected consecutively; seed9127 elevated
original pair inspected. Wider openings and variable crown sizes are PRESENT;
block-like bases, compact isolated forms and horizon repetition remain PARTIAL.
Storm retains the dark connected deck. Strongest objection: varied placement
alone still falls short of natural cloud families. Before normal integration,
compare foreground1080p High cost/pacing and verify a longer advected sequence.
Do not equate the short saved sequence with cloud evolution over meteorological
time. Regional sea camera-independence is a source correction, local energy
response remains optional pending matched motion and edit-history limitations.

All six stages retain the previous ledger: references reused; waves active
(regional response); whitewater experimental (plume volume target failed);
optics experimental/unmet; atmosphere active; integration active. No defect or
owner acceptance gate closes. Next: focused regional/front capture, cloud cost
and advection, then commit coherent validated source and preserve original media.

Regional particle hypothesis: PARTICLE_UPDATE still gates emission, launch and
drag with F.windP[0] (shared sea wind), despite the existing spatial air field.
Use the same front weight, shortest wind rotation and gust phase as
sampleEnvironment at each particle, reducing the phase in JS before f32 upload.
No new particle population, lifetime, brightness or emission rate. Pre-change
front spray view: midday, seed1307, camera0,8,0,79,-5.5, frontX-360/Z0,
width2km, heading0/speed12, t20+240/24,72 consecutive frames. Calm/no-front
control; CPU/GPU field agreement including opposite headings and rebases.
Pass: local wind drives the existing spray/rain consistently and continuously;
fail: wind direction flips at front boundaries, camera-dependent gust phase,
unsupported calm emission or changed no-front fixed weather. Natural long-lived
weather/swell history and persistent crest-event identity remain unverified.

Shutdown recovery: same source preserved; server/browser sessions restarted.
Particle baseline files26-41 are unreadable after the power loss (retained);
frames0-25 and all48 front-off frames decode. The completed after72 is valid.
Midday front view has too little visible spray for a useful motion judgement;
inspect storm instead at the same8m camera/front/timing,72 frames. An explicit
abWind=legacy comparison retains shared-spectrum particle wind. This is a new
failure-revealing condition, not a repeat of the uninformative mild-sea view.
20480 native wind-field comparisons pass including nonempty1000km/opposed-heading
fronts (max1.018e-5m/s); first far-world probe accidentally sanitized its front
away and is not used for that claim. Final record: regional-wind-03.json.

Cloud condensate predeclaration: the thermal base support transitions to full
density over only5.5% of the local depth; then clamped billows give opaque slabs
immediately above condensation. Preserve seeded support/lighting and evaluate
a condensate profile rising with normalized height, shared across cumulus
families, with a unit-integral column normalization. This is a bounded adiabatic
profile approximation, not a calibrated liquid-water-content simulation.
Baseline regional day/gold/seed9127 captures; pass: softer varied bases with
readable crowns and retained sky gaps/storm cover. Fail: transparent ghosts,
loss of volume, new support seams or a generic uniform brightening. Keep the
regional candidate and this profile separately selectable until judged.

### Resume 13 - verification and integration in progress

Recovered the exact Resume12 checkout at HEAD76fb3d0 after the shutdown. Full
master TXT and both continuation requests remain active. All interrupted source,
the nine inherited evidence edits, lockfile and damaged capture files preserved.
No new publication yet. Chrome DevTools is connected to native WebGPU page1.

Inspected the remaining regional48 and storm-wind72 paired crops consecutively:
30.000-31.958 and30.000-32.958 respectively. Fine wave reflections vary smoothly;
no visible front boundary in this view. Storm crests retain attachment and motion;
rain positions change but spray is too faint for a convincing transport judgement.
Regional continuity PRESENT in this short view; long history VISUAL UNVERIFIED.
Wind-field correctness PRESENT, energetic spray/whitewater ABSENT. Strongest
objection remains flat white strips and insufficient visible spray. These are
reduced cropped sequences, not continuous full-resolution playback.

Condensate day/gold24 and matched storm24 inspected consecutively30-30.958;
seed9127 elevated original pair also inspected. Day/second seed: hard lower
shelves soften, crowns/openings remain; isolated compact forms and repetitive
horizon remain. Sunset: softer undersides, still bright rims. Storm: continuous
dark deck and horizon openings retained, with small lower-edge differences.
Base improvement PRESENT; natural cloud families PARTIAL. Strongest objection:
still sculpted isolated clouds, not fully convincing meteorological variety.
65536 native support comparisons against5x5 pass with exact equality for both
shape and condensate. Profile normalization is not a claim of preserved final
eroded optical mass. Foreground High1080p cost/presentation tracing in progress.

Fixed phase-residency diagnostic's stale224-byte buffer to the shared272-byte
FOAM_BYTES contract. Four native paused/rejected-phase checks PASS, no validation
error. Regional/local-air numerical evidence is reused, not repeatedly rerun.

Rain integration target: reuse storm-wind-after72 as baseline (8m camera yaw79,
frontX-360/width2km/speed12, seed1307, t30-32.958 at24Hz). Evaluate existing
velocity-projected streaks with identical rain/wind/emission/light. Pass: streaks
follow simulated projected trajectories without distant oversized needles; fail:
unreadable precipitation, new flashes, or changed spray energy. Calm remains a
no-rain control. This tests appearance, not calibrated drop-size distribution.

All six statuses:1 references reused/internally sufficient;2 waves experimental
(regional response, grouping unresolved);3 whitewater experimental (plume volume
absent, persistent event identity unresolved);4 optics experimental/unmet (bronze
persists);5 atmosphere active (cloud and local-wind integration);6 integration
active (native checks, pacing, publication). W1/W2/L1/L2/B1/C1/A1/E1-E6/U1/G1 and
I1/T1/R1 remain open. B1/B2/A+B owner acceptance remains pending. Next: finish
cloud cost/advection and rain comparison, integrate only supported improvements,
publish coherent source and original review media, then continue optical causes.

Cloud cost falsifier triggered: first matched foreground High1080p sequential
runs show mean GPU55.45ms legacy versus71.74ms condensate, with almost all added
cost in atmosphere37.73->54.15ms. Do not promote this version. Exact-work target:
reject empty cells/height/radial support before computing all seeded attributes
and rotations. Preserve every contributing lobe and density; compare native5x5
support, matched original pixels and actual presentation events. No ray/sample
reduction. If savings are insufficient, retain optional rather than degrade High.

Regional integration source finding: the earlier note calling F.windP[0] shared
spectrum wind was inaccurate. writeFrame actually filled it from camera-local
weather. Consequently camera travel through a front rotated all residual foam
patterns and cloud shear, even after shared spectrum forcing was corrected.
Restore sea-state wind for wave/foam consumers, background advected weather wind
for cloud shear, and keep particle air wind sampled at the source/particle.
Regional cloud shear is not introduced by this correction; cloud advection and
shear retain the same evolving background wind. Test shared uniforms under camera
travel and native cloud support; no-front steady-weather originals must match.
Also remove camera-local rain as the particle dispatch gate: a rainy source in
the particle domain must run even when the camera's own point is dry. Existing
particles must finish their lifetimes after the last source turns off. Falsifiers:
camera-dependent shared fields, frozen airborne drops, spontaneous calm spray.

Exact early rejection preserves daylight RGB and native support, but does not
recover the seeded candidate's measured cost (GPU72.67ms, presentation p9590.33ms).
Keep seeded organization optional. Isolate the already useful vertical profile
on the existing population (`abClouds=profile`) to test whether the hard-base
improvement can reach normal localhost within the existing cost. This preserves
placement, erosion and march quality; it cannot close regional arrangement C1/E2.
Use the same day/gold/storm/seed controls, with legibility and volume falsifiers
unchanged. Do not equate its unit-height normalization with optical mass closure.

### Resume 14 - complete interrupted integration

Recovered unchanged HEAD76fb3d0 and all Resume13 source/evidence. Read the full
master TXT, supplemental technical requirements and current execution method.
DevTools page1 is connected; day-profile24 finished during the interruption.
Initial original comparison: softer undersides, retained crowns and gaps;
this does not establish full cloud naturalism or performance acceptability.
Finish profile gold/storm/second-position comparisons and matched High pacing.
Retain seeded organization, plume and visible-facet options without promotion.

Finish local-wind integration using the already verified regional-wind-03 and
camera-independence results. Source correction: construct foam pattern origin
after uploading current shared wind, not from the preceding frame. Fixed-wind
control must remain unchanged; changing wind must use one frame's orientation.
Review saved rain velocity sequences; do not infer good spray from wind tests.
All six stages and unresolved W1-G1/I1/T1/R1 retain Resume13 statuses. Next source
priority after this integration is the unresolved water reflection/body budget.

Profile day/gold24 pairs inspected consecutively at30.000-30.958 in reduced
sky crops, plus original day/seed9127 frames. Softer undersides and retained
crowns/gaps PRESENT; meteorological size/placement diversity PARTIAL. Matched
storm-side24 at yaw79 retains the dark connected deck. The first storm pair
used yaw4 versus yaw79 and is explicitly INVALID as a regression comparison;
its originals are retained, replaced by storm-side-pairs0/1 for judgment.
Rain native detail shows smaller velocity-aligned streaks, but insufficient
rain/spray readability; keep abRain=velocity experimental.

Profile optimization skips zero-weight cells and squares the blend weight
directly. Native65536 support/profile comparisons versus the unoptimized5x5
reference are exactly equal.19 focused CPU checks pass. Initial profile GPU
mean61.50ms versus historical55.52ms is not a fully matched performance result
(starting wave time differs). The subsequent fast-profile run falls into the
known approximately1Hz rAF scheduling failure; one GPU sample cannot judge cost.
DevTools screenshots work using its default output; explicit screenshot/trace
export paths are rejected by plugin workspace-root configuration. Do not repeat
those failed exports or treat rAF intervals as actual presentation. Matched
focused cost check is running; current compositor-p95 remains unavailable.

Focused profile run at the baseline t30/camera/High1080p:696 frames,96 GPU
samples, mean57.635ms (atmosphere39.703ms), rAF p9562.6ms. Retained legacy
mean55.515ms (atmosphere37.656ms), rAF p9562.6ms. Modest extra GPU work; no
speedup or compositor presentation claim. The first optimization run's1Hz
failure is retained, not silently discarded.128 production PARTICLE_UPDATE
trajectories pass CPU analytic drag/position checks at camera510/514 and origin
0/1024: velocity error6.26e-7m/s, position error3.06e-5m. Sources are zero in this
manufactured test; it does not prove visible spray or emission naturalism.

Integrate only the profile-only cloud-base improvement with the world-anchored
wind corrections. Keep seeded regional clouds, regional energy modulation,
plumes, visible-facet optics and rain-streak appearance optional. Original
day/gold/storm comparisons and second-position pair are in clouds05; final
no-option day72 and storm24 must verify the normal path before publication of
the default change. All15 defects remain PARTIAL/ABSENT/VISUAL UNVERIFIED as
their original acceptance rows describe; none is completed by these checks.
