# Combined A+B development - 24 October 2026

Current continuation: `V04-AB-CONTINUATION-04.md`, 25 October. Opt-in hybrid temporal foundation and cloud-shadow controls implemented; default MSAA preserved. Final CPU58/GPU temporal9 pass; fine-detail loss, reflection motion, low-Sun optics, clouds and B1/B2 remain open. Foreground GPU cost increases 38.94 to 40.74 ms in the matched near-low-Sun pair. `ab4-review.html` exposes original stills and lossless motion. Substantial checkpoint awaits owner visual review; no A+B acceptance. Rendering checkpoint `487dcf3` is published with 41 changed LFS objects freshly verified; proof: `evidence/v04-ma-ab4-publication-01/publication.json`.

Current continuation: `V04-AB-CONTINUATION-03.md`, recovered 25 October beyond the interrupted `97f68a1` checkpoint. Gravity-wave onset visibly reduces broad storm foam sheets; B1 owner review remains pending. Focused shader corrections and float32 precision measurements are complete; metallic low-Sun water and cloud morphology remain unresolved. `ab3-review.html` retains originals and motion. Appearance trials remain opt-in; no A+B acceptance or release promotion. Earlier entries below remain historical records.

## Recovered working state

The previously unpublished checkpoint was found locally, not reconstructed from GitHub. Original checkout: `C:/Users/adity/Documents/Codex/2026-10-18/build-an-extraordinary-real-time-3d/outputs/pelagic-github`. HEAD `c4185ea0acdf6e57899da04098889dba9200302b`, branch `development/pelagic-0.4`, 20 commits ahead of published `d4f7d806ffc5cb6ffc88e9aa9637edbfe3b5d574`.

All 2,926 files (7,065,996,765 bytes), including Git objects, LFS objects, ignored evidence and nine historical modified files, were copied to `C:/Users/adity/Documents/PELAGIC` and individually SHA-256 verified: zero mismatches. `evidence/v04-ab-recovery-20261024/repository-copy.json` records the transfer before integration. Original checkout remains untouched. The prior continuation session's work/outputs (390 files, including both packages and analysis scripts) were additionally copied under `evidence/v04-ab-recovery-20261024/prior-session`; package completion is not implied by copying.

GitHub connection and development HEAD independently verified. Draft PR #1 head `71d8b025d1f47ceb277f1af1536f36e6fd4a8730` fetched without switching/resetting. Four new handoff documents imported exactly; active operating rules reconciled with the owner's explicit kickoff. Original local AGENTS preserved verbatim. Historical acceptance failures remain open.

RTX 3050 Laptop GPU, 4 GiB, driver 617.14 is visible through nvidia-smi. Fresh browser adapter/cost evidence remains required; historical test totals are not new tests.

## Active visual objective

Correct metallic, excessively wrinkled water through a bounded source-supported optical/scale intervention. Prior work already rejected wider filtering, covariance-strain removal and denser geometry as sufficient appearance fixes. Preserve those exclusions. Evaluate directional reflection and reflected/body radiance against actual source before changing physical coefficients.

Owner authorizes combined A+B implementation. Substantial integrated visual checkpoints, B1 and B2 require owner review. C and final release remain separately gated. No visual acceptance has occurred.

## First implementation sprint

Native shader candidates now exist for an advected, energy-neutral short-wave wind field (`maRoughness=wind`), refracted direct single scattering (`maWater=single-scatter`), finite-population solar glitter (`maGlints=finite`), Beer-weighted cloud scattering positions (`maCloudTransport=centroid`), and column-based diffuse cloud illumination (`maAmbient=column`). The existing `p0Desat=off` comparison removes redundant highlight desaturation before AgX. All are reversible; no release or owner acceptance is implied.

Finite glitter visibly replaces broad silver patches with discrete sunlight in elevated daylight. Its correlation area is a spectral-moment closure, not a measured microfacet population. Revision 01 biased near-water radiance by conditioning its rank on the filtered normal; revision 02 exposed interpolation bias and a bright resolved/unresolved transition. Revision 04 uses raw displaced-phase Gaussian texels and a one-cell lower bound. Rare events still create substantial frame-to-frame radiance variance; temporal/observational acceptance remains open. Original iterations are retained under `evidence/v04-ma-ab-*`.

The wind field preserves expected squared amplitude and propagates its product-rule gradient through geometry, normals, foam and surface queries. Direct water scattering did not solve metallic appearance; keep it experimental. The cloud collision correction avoids evaluating lighting at an empty midpoint of occupied subsegments. Column ambient did not fix morphology/rims and cost about 3.4 ms extra screen-cloud work in one short capture; rejected for adoption. Cloud reconstruction, integrated breaking/whitewater and weather remain unfinished.

At the first source checkpoint, CPU49 passed and a 24-second continuous pan was captured. Subsequent GPU regressions and integrated evidence are recorded below. These are development observations, not completed A+B acceptance.

## Integrated checkpoint

Rendering source `8ac767b`. Default spray/rain emission now integrates the historical 60 Hz spawn probability as a time-based hazard. GPU survival over one second agrees at 20/30/60 Hz within 0.000001; this corrects an emission scheduling defect, not the droplets' aerodynamic model. The optional `maBreaking=events` path stores the preceding compression signal, starts activity on positive compression increments, decays that activity, and feeds residual foam/aeration and existing spray. It is a crest-onset proxy, not a validated nonlinear breaking criterion. Its foam quantity and event lifetimes need owner/observational review.

Four matched 1920x1080 candidate views are in `v04-ma-ab-final-stills-02`; baseline is `v04-ma-base-stills-02`. Every selected setting, camera and simulation time matches. No shader errors; all four spectrum/HDR checks PASS. Fresh standalone FFT9, optics5 and appearance11 PASS on NVIDIA/Ampere. CPU49 PASS. Integrated daylight lower-third linear radiance changes +1.95% near / +6.20% elevated; middle near band changes -12.59%. These are combined one-frame outputs and do not establish glitter energy closure. Low-Sun appearance remains silver and overly wrinkled. Broad cloud rims remain; neither centroid lighting nor column ambient solves morphology. Direct-scattering and column-ambient candidates remain excluded from the integrated preview.

The supplied demonstration's preserved 10-second frame was re-inspected: broader, smoother reflection structures and connected crest foam remain materially stronger than PELAGIC. Conditions are unmatched; this is a craft comparison, not optical calibration. No new complete reference-video playback or AAA parity is claimed.

Display-paced 60-second profiling reproduced ~1-second frame cadence, including a repeat after the owner restored Chrome. Both originals are retained under `v04-ma-ab-profile-base-01/02`; they are invalid performance comparisons. Desktop control timed out awaiting app permission. Explicit `benchmarkMode=queue` measures actual GPU work/queue-completion throughput independently; it does not fix or hide the display-pacing problem and must never be reported as displayed FPS. Analysis lives in `v04-ma-ab-checkpoint-01/analysis.json`.

Review `ab-review.html` for originals and live candidate/baseline links. Candidates remain opt-in pending substantial visual review. Combined A+B is still in development: cloud morphology, low-Sun water optics, glitter temporal statistics, integrated B1 breaking and B2 weather acceptance are open. No C or release promotion.

Browser playback reached the end of the final near-daylight, near-low-Sun and storm originals. Recorded playback totals: daylight 553 frames / zero dropped, low Sun 552 / two dropped, storm 697 / zero dropped, each about 23.94 seconds at 1920x1080. Inspected opening/intermediate/end frames show moving wave groups, persistent silver low-Sun reflection and a broad residual foam sheet in the storm endpoint. The foam sheet does not yet establish convincing crest-connected whitewater. Playback completion and sampled visual inspection do not certify every frame's temporal quality. These observations keep the appearance candidates experimental.

Measured 60-second queue-completion runs at 1080p Balanced (first 5 seconds of retained frames excluded): daylight near GPU 38.17 -> 38.58 ms, elevated 31.59 -> 32.50 ms. Throughput near 24.01 -> 23.82 frames/s, elevated 28.93 -> 28.21 frames/s. Candidate completion-interval p95/p99: near 45.3/46.9 ms, elevated 37.3/39.6 ms. Zero GPU errors. One sequential pair per view, no thermal-repeat confidence interval; low-Sun sustained timing remains unmeasured. These values are not displayed FPS and do not close the one-second rAF defect.

## Publication

Checkpoint `8d5bef7395785aa648b499b0884cca17db6f5193` published by fast-forward to `development/pelagic-0.4`, including the recovered unpublished history. Remote HEAD matched; GitHub independently returned the matching finite-glitter source blob. All 82 unique LFS objects (95 paths, 710,245,283 bytes) changed since the previous published `d4f7d80` were freshly downloaded into an isolated cache and SHA-256 verified. Main, completed 0.3 and frozen release refs match their preserved values. Proof: `evidence/v04-ma-ab-publication-01/publication.json`. The subsequent handoff commit records this proof and corrects the review screenshot's extension to JPEG without changing its bytes. Nine inherited evidence modifications remain unstaged and match their recovery hashes. Original recovery archives remain local; duplicate multi-GB packages were not republished.
