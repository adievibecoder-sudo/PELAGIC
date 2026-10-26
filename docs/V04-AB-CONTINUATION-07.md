# A+B continuation 07 - active development checkpoint

26 October 2026. Session in progress. Entry HEAD `716d63c`, renderer `24a88e3`; owner instructions fast-forwarded to `6d3eeb2`. No unpublished renderer source at entry. Nine inherited evidence edits and untracked lockfile preserved; entry hashes in `evidence/v04-ma-ab7-recovery-01/preserved.json`. B1, B2 and A+B remain unaccepted.

## Current work

Complete the bounded private reference review, then verify gravity crest geometry, direction, propagation and event support before changing AB6 whitewater. Existing parcels use random material anchors, gravity strain magnitude and foam activity; they do not explicitly track a crest tangent or moving phase. No new visual-success claim yet. Preserve FFT dispersion/energy, existing optical foundations and AB5 cloud optimizations.

## 26 October resumed investigation

Verified HEAD `6d3eeb2`, latest renderer `24a88e3`, no unpublished renderer edits. Four fresh High 1920x1080 daylight/low-Sun near/elevated controls completed in `evidence/v04-ma-ab4-ab7-water-base-01`. Initial browser source-manifest failure recovered on reload; no source change was required. Near low Sun still has a broad bronze reflection blanket, fine wrinkles, little foreground glitter and repeated bright cloud rims.

Private references verified in `_local_references/inspection-20261026/verification.json`: six MOVs, three papers, eight slides. Existing extracted text and page renders were reused. Video discovery: 0.5 s bins for IMG_2511/2513, 2 s bins for IMG_2518/2519/2522/2523 across their timelines. All nine discovery sheets inspected. Dense source-frame sequences (60 frames each, approximately 60 Hz) inspected at 2-3 s, 6-7 s, 24-25 s, 2-3 s, 9.5-10.5 s and 43-44 s respectively. Labels approximate source timestamps; sheets show reduced frames. This is frame inspection, not continuous playback; intervening motion outside those windows remains unsampled. Originals and derived references stay private.

Observations: IMG_2511 2-3 s concentrates intermittent glitter over broad green shoulders. IMG_2513 6-7 s has connected moving white crests and quieter trailing lace. IMG_2518 24-25 s and IMG_2519 2-3 s retain coherent intersecting ridges while local foam stretches/decays. IMG_2522 9.5-10.5 s shows a continuous waterline crossing and bright subsurface foam; exposure is stylized, not a coefficient measurement. IMG_2523 43-44 s retains a long oblique crest with trailing streaks. Eight Rare slides distinguish noisy raw Jacobian foam from connected feedback/textured foam. Tessendorf section 4.6 supplies the compression eigenvector; section 6 separates Fresnel surface and volume radiance. Its critical-angle label as Brewster angle is a terminology error, not adopted. Fournier sections 9-11 distinguish phase-following active froth from material-following foam, and explicitly limit height fields, spectrum fitting and long-crest continuity. No paper establishes solved overturning from a compression mask.

### Pre-change target: gravity crest support and connected froth

Defect: AB6 rounds random independently placed material parcels; they follow orbital displacement/current rather than the moving crest phase. Source verification: production FFT uses wavelength-dependent gravity/capillary dispersion and consistent height/slope/horizontal derivatives. Gravity compression magnitude is available, but the consumer discards its eigenvector; it has no ridge-location, curvature or phase-continuation test. Thus upstream support is insufficient for a coherent active crest representation, even though wave propagation itself exists. No nonlinear breaking-energy budget exists.

Hypothesis: a bounded ridge projection using gravity slopes, compression eigenvectors and directional curvature can supply crest position/tangent without changing spectral energy. Continuation from the previous anchor follows the moving ridge; reject flat/ambiguous/concave-up locations. First validate this upstream support on manufactured traveling/crossing/calm fields and actual storm motion before reorganizing parcel shape. No independent speed dial or foam brightness boost.

Target: elongated, connected froth tracks a visibly moving ridge; aged foam remains behind it. Failure: circular detached islands, jumps between crossing ridges, bridging troughs, unstable orientation, or new calm emission. Views: storm at 5 m/yaw79/pitch-9, storm at 50 m/yaw79/pitch-15; calm control and daylight/low-Sun material regression. Seed1307, High1920x1080, fixed 1/24 s capture step, warmup240 steps, matched exposure/settings. CPU/GPU finite/phase/attachment checks supplement visual inspection. Historical AB6 storm GPU41.70/42.38 ms and p95 rAF118.10/118.46 ms are context only; new cost requires foreground matched profiling.

## Six-workstream ledger

| Workstream | Status this session | Next action |
|---|---|---|
| Reference interpretation | Active | Verify originals; inspect all paper text/figures, eight slides, full video timelines plus dense event windows. |
| Wave field and crest support | Active | Verify upstream direction/phase continuity in calm, crossing, choppy and storm controls. |
| Breaking/whitewater/spray | Experimental, source not started | Use verified crest support for connected moving whitewater; reject detached blobs. |
| Water optics | Deprioritized, source not started | Next bounded directional-light/glitter/body-radiance correction after crest support; do not repeat rejected entry-refraction trial. |
| Clouds/weather | Deprioritized, source not started | Water has priority; next address coherent regional morphology and precipitation support, preserving equal-output AB5 optimization. |
| Performance/integration | Active | Matched deterministic native captures and focused checks; foreground RTX 3050 pacing at substantial checkpoint. |

## Resume

Read this checkpoint and the active six-stage specification. Inspect Git status and source changes since `6d3eeb2`; preserve inherited files and private references. Continue the recorded experiment from its actual evidence; do not restart prior AB1-AB6 investigations. No Milestone C or release promotion.

### Crest trial 1

Eight analytic native GPU checks pass, including 24 consecutive phase-continuation steps (maximum 2.9e-7 m error). Actual storm FFT samples: 1099/4096 ridge projections, only 101 above the old .22 onset after metre-scale filtering; zero nonfinite samples. Twelve phase-only frames and 48 elongated-parcel frames captured. Near crops inspected at elapsed warmup 10.000-10.458 and 11.000-11.958 s (simulation clock starts at 20 s). Froth follows the ridge but remains sparse; elevated view has isolated white strips. Continuous rollers ABSENT. Geometry filtering also filtered the onset magnitude, unintentionally changing the AB6 emission contract. Next: retain filtered ridge geometry but evaluate the existing full gravity-band onset at that ridge. Preserve thresholds and calm suppression. Trial 1 source copied under its evidence directory; no default promotion.

### Pre-change target: frame admission

Historical foreground rAF intervals alternate approximately 7 ms and 118 ms despite roughly 42 ms GPU work. Hypothesis: unrestricted display callbacks enqueue bursts faster than the GPU completes. Trial abPacing=bounded admits the next requestAnimationFrame only after GPU completion; queue-driven deterministic capture stays unchanged. Success: narrower foreground interval distribution and lower p95 without altering resolution, effects or fixed-step pixels. Failure: persistent bursts, excessive cadence loss, new stalls or incorrect simulation time. Compare 60-second High 1920x1080 storm profiles, exclude initial five retained seconds, preserve focus/visibility and actual RTX 3050 evidence. rAF records remain a presentation proxy, not OS scanout measurements.

## Interrupted checkpoint - renderer 07c0e1d

Implemented opt-in `abCrest=phase&abCrestShape=elongated`, requiring `abWhitewater=parcels&maBreaking=gravity`. Existing default and AB6 paths remain intact. Compression eigenvectors, filtered directional curvature and bounded Newton continuation supply crest position/tangent. A separate 16-byte-per-parcel frame buffer stores displaced tangents (192 KiB High / 96 KiB Balanced allocation, not residency). Active froth follows phase; existing surface foam retains material transport. This is an appearance prototype, not nonlinear overturning or a breaking-energy solution.

The first trial accidentally applied old onset thresholds to filtered strain. Corrected by evaluating full gravity-band onset at the projected ridge. Latest near candidate `v04-ma-ab7-near-work-02`: all 48 consecutive cropped frames inspected, simulation 30.000-31.958 s at 24 Hz. Main ridge carries a longer pale strip, retains shoulder streaks, advances smoothly in these frames. Attachment PARTIAL; continuous rollers ABSENT; local disconnected patches remain. Strongest owner objection: elongated patches still look added onto the wave, without an overturning front or convincing aeration. Latest elevated correction NOT INSPECTED; prior elevated candidate (`high-work-01`, all 48 cropped frames inspected) shows isolated elongated islands. Calm, crossing-sea rendered controls and latest daylight/low-Sun regression remain unperformed. No visual acceptance or default promotion.

Validation: CPU 66/66 PASS. Native analytic GPU crest checks 8/8 PASS, including 24 phase continuation steps; actual production storm texture probe has zero nonfinite values. All 204 new storm sequence reports contain no GPU errors. Analytic checks do not validate production interpolation, event physics or unrestricted sea states. Twelve phase-only frames and two 48-frame near trials plus 48-frame elevated baseline/candidate preserved locally. Original AB6 near motion remains the matching comparison. Existing water controls remain unchanged source baselines; no optics implementation this session. Reference inspection used extracted frames, not playback.

Performance: RTX 3050 Laptop, driver 617.14, 4096 MiB corroborated. New 60 s baseline run reproduced ~1 s intervals despite reported visible/focused top-level document; retained p95 1007 ms, 51/102 intervals over 500 ms. No valid paired cost comparison. A proposed bounded requestAnimationFrame queue trial was preserved in `evidence/v04-ma-ab7-checkpoint-01/source/renderer-with-unverified-pacing.js`, then removed from live source because it could not be tested. Window-state inspection was stopped by Computer Use because it could not verify the allowed browser URL; no bypass attempted. Browser visual work ended at that restriction. This is a tool limitation, not an owner acceptance decision.

| Workstream | Checkpoint status | Precise next action |
|---|---|---|
| Reference interpretation | Internally sufficient for this intervention | Reuse recorded paper/video findings; target new review only at a specific uncertainty. |
| Wave field / crest support | Experimental | Exercise production texture interpolation, flat/crossing fields, origin rebasing and 24/60 Hz tracking; inspect tangent flips and rejection fades. |
| Breaking / whitewater / spray | Experimental | Capture corrected elevated/calm views; replace straight elongated islands with curvature-limited crest segments and explicit active-to-residual transfer if evidence supports it. |
| Water optics | Deprioritized, no source change | Diagnose direct solar versus sky-reflection contributions in matched four views; preserve energy and avoid rejected entry-refraction/blanket filtering repeats. |
| Clouds / weather | Deprioritized, no source change | After water checkpoint, implement coherent regional morphology/precipitation support; retain AB5 equal-output optimization. |
| Performance / integration | Blocked for browser validation | Restore supported browser access; repeat foreground matched RTX profiles and test bounded admission before claiming improvement. |

Nine inherited evidence changes and lockfile match all ten entry preservation hashes. Private originals remain ignored. Renderer source is committed; capture media remains local pending completed validation/publication packaging. No B1/B2/A+B acceptance; no Milestone C or release.

Resume: inspect branch/status and this latest section; start from renderer `07c0e1d`. Finish the corrected elevated/calm controls, inspect motion and measured cost, then proceed to the recorded water-material intervention. Do not redo reference discovery or promote the whitewater prototype from numerical results.
