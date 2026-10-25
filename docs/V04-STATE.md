# PELAGIC 0.4 — Persistent Verified State

**25 October AB6 whitewater prototype:** Rendering `24a88e3` adds opt-in crest-attached porous parcels on the existing particle system (`abWhitewater=parcels&maBreaking=gravity`), retaining spray/rain and residual foam. Localized raised froth improves crest breakup; rounded patches and continuous roller coherence remain unresolved. Matched 72-frame High storm originals, lossless RGB motion and byte-identical calm control retained. CPU64 / native parcel GPU5 PASS. Entry-refraction water trial rejected for negligible appearance gain. Owner ZIP verified/extracted locally; both reference-folder names ignored, no copyrighted reference media published. Nine inherited edits and lockfile preserved. See `V04-AB-CONTINUATION-06.md`, `ab6-review.html`. B1/B2/A+B remain unaccepted; publication proof follows separately.

**AB5 publication verified, 25 October:** Rendering `173c153` and evidence `6bc4cee` published; 20 unique LFS objects / 813,021,082 bytes freshly downloaded and hashed. Main/0.3/frozen refs unchanged. Nine inherited edits and lockfile match preserved hashes. Proof: `evidence/v04-ma-ab5-publication-01/publication.json`. The following documentation commit records this proof. A+B remains incomplete; no release promotion.

**25 October preset/performance checkpoint:** Owner update `cc3a222` reconciled without losing inherited work. Rendering source `173c153`: full scene buttons apply immediately; explicit gradual weather remains available. Exact cloud support rejection and mirrored environment-ray reuse reduce matched 60-second High GPU work from 83.61 to 57.29 ms, rAF cadence 11.96 to 17.42 FPS at unchanged 1920x1080 quality. Another optimized run reaches only 14.80 FPS; 20-30 target remains open. Four still pairs and 48 cloud-motion frames are byte-identical; 65,536 native density probes match exactly. CPU62 / final focused4 pass. Foam transport/cellular breakup and velocity rain remain opt-in, as does hybrid TAA. Water optics, cloud morphology, B1/B2 and night remain incomplete. Review `V04-AB-CONTINUATION-05.md`, `ab5-review.html`. Nine inherited edits and lockfile preserved; publication verification follows below.

**25 October hybrid checkpoint:** Initial opt-in 4x MSAA + short HDR TAA implemented; MSAA-only remains default. Final CPU58 / native temporal GPU9 PASS, matched four-view/storm controls and lossless fixed-step motion retained. Catmull-Rom/shorter history improves the first trial, but static gradients retain only 82-93%; reflection motion and flicker quality remain unresolved. Low-Sun cloud-shadow geometry/quadrature candidate converges but remains opt-in. Foreground near-low-Sun GPU 38.94 / 40.74 ms (MSAA/hybrid), rAF cadence 25.65 / 24.49; no speedup. No 1 Hz gaps reproduced; historical cause unresolved. See `V04-AB-CONTINUATION-04.md`, `ab4-review.html`. A+B/B1/B2 incomplete; owner visual review pending. Nine inherited evidence edits and lockfile preserved. Rendering checkpoint `487dcf3` is published; 41 unique changed LFS objects freshly downloaded and hashed. Main/0.3/frozen refs unchanged. Proof: `evidence/v04-ma-ab4-publication-01/publication.json`.

**Publication verified, 25 October:** `f8703f8` and recovered interrupted history are published on `development/pelagic-0.4`. All 57 new LFS objects (517,754,863 bytes) freshly downloaded and SHA-256 verified; main/0.3/frozen refs unchanged. Proof: `evidence/v04-ma-ab3-publication-01/publication.json`. The following handoff commit records the proof. B1 review remains pending; A+B incomplete.

**Recovered continuation, 25 October:** Interrupted local `97f68a1` history and uncommitted source preserved beyond remote `a3e2a46`. Gravity-wave onset reduces broad storm foam sheets in matched originals; B1 owner review remains pending. Solar-disc basis/ring, odd-period foam tiling, water-scattering conventions and cubemap mip boundaries corrected. Float32 slope reference removes measurable cancellation but barely changes appearance; it remains opt-in. Connected-cloud trial still fails morphology. CPU54 / FFT9 / optics5 / appearance24 / shader5 PASS within scope. Low-Sun metallic water, fine wrinkles, glitter, clouds and B2 weather remain open. See `V04-AB-CONTINUATION-03.md` and `ab3-review.html`. Nine inherited evidence modifications remain unstaged. A+B NOT accepted; no release promotion.

**A+B continuation, 24 October:** Reversible source trials preserved at `97f68a1`, followed by an optional path-conditioned cloud-scattering comparison. CPU52 and native GPU appearance24 PASS. Conditional shutter glitter removes a raw-texel rank discontinuity and restores more near-daylight glints; low-Sun water remains unresolved. New cloud silhouettes and stricter breaking triggers do not meet the visual target. Default appearance remains unchanged; A+B NOT accepted. Details and original comparisons: `V04-AB-CONTINUATION-02.md`, `ab2-review.html`. Historical entries below remain records, not renewed gates or acceptance.

**Owner review, 24 October, continuation authorized:** Four A+B stills reviewed. Elevated daylight improvement acknowledged; overall transformation modest. Near daylight reflections over-suppressed/grey-blue; individual glints lack physical/temporal coherence. Both low-Sun views and artificial cloud morphology remain failures. A+B visual milestone NOT approved; no default promotion. Continue source-led reflection/body-light work, then substantial cloud and breaking-connected foam/spray development. Preserve/publicize verified progress. Current bounded trials use `maGlints=footprint`, `maReflection=visible`, `maWater=facet|wave-path`, `maCloud=plumes`, `maBreaking=onset`; none accepted.

**Publication verified, 24 October:** `8d5bef7` and its recovered history are on `development/pelagic-0.4`. Fresh download/hash verification passed for all 82 changed LFS objects since `d4f7d80`; main/0.3/frozen refs unchanged. Proof: `evidence/v04-ma-ab-publication-01/publication.json`. Supplementary handoff records that proof; publication does not confer visual acceptance.

**24 October A+B checkpoint:** Rendering source `8ac767b`, version `0.4.0-dev.ab1`. Actual unpublished `c4185ea` history recovered and preserved. Default particle emission now accounts for timestep; finite glitter, coupled wind roughness, collision-position cloud lighting and compression-event foam remain opt-in. Elevated daylight wave readability improves; low-Sun metallic water, cloud rims, temporal glitter statistics and B1/B2 acceptance remain open. CPU49 / FFT9 / optics5 / appearance11 PASS. Four matched 1080p stills and original continuous motion are available through `ab-review.html`. RTX 3050 candidate GPU work: 38.58 ms near / 32.50 ms elevated in daylight; queue throughput is not displayed FPS. One-second display pacing remains unresolved. A+B incomplete; owner visual review pending. See `V04-AB-DEVELOPMENT.md` for evidence and limits. Older checkpoint entries below remain historical.

**Active owner decision, 24 October 2026:** Combined Milestones A+B are authorized by the current kickoff. Historical Phase 1-only / A-only scheduling below is superseded; failures and original evidence remain historical facts. Implementation-led water appearance first, then coupled clouds, Living Sea, breaking/whitewater, spray and weather. Owner review at substantial integrated checkpoints; B1/B2 remain review milestones. Milestone C, final release and independent acceptance remain separately gated. Recovery and current programme: `V04-AB-DEVELOPMENT.md`.


**24 October continuation evidence:** `V04-MILESTONE-A-CONTINUATION-02.md` supersedes the next-step proposals below. Rendering source `0e19fe9`, CPU44/GPU FFT9/optics5 PASS; fresh default still byte-identical. Deformed-slope amplification1.45% in measured realization; denser geometry fails appearance and costs more. View integration converges; condensate model rejected. Licensed independent volume improves crowns/bases but repeats and retains broad rims; dense self-shadow references converge without fixing appearance. All remain opt-in. Only near-first ordering adopted. A transformation NOT achieved; continuation authorized, owner acceptance pending, B/C unauthorized. New commits local only. Nine historical modifications preserved.

**Latest continuation checkpoint:** `V04-MILESTONE-A-CONTINUATION-CHECKPOINT.md`. Rendering source `9ac1461`, final CPU40/GPU FFT9/optics5 PASS; final default still byte-identical to baseline. Only near-first ordering adopted. Finite cloud-light path and larger long-wave grid rejected; opacity/neutral diagnostics confirm remaining cloud structure defects. A appearance transformation NOT achieved; continuation remains authorized, no owner acceptance or B/C authorization. New work is local, remote still `d4f7d806` at final check.

**23 October long-grid probe:** Same FFT spectrum resampled on2207 m domain gives more long modes and removes1103 m recurrence, but fixed256 texture reconstruction retains only90.98% of long-band height variance (baseline97.59%). Four views still fail appearance. Opt-in only, not adopted; `V04-MILESTONE-A-LONG-GRID.md`. Existing source/default remains unchanged apart from verified near-first ordering.

**23 October cloud-light probe:** Finite layer-exit quadrature tested without density/view-sample changes. Analytic GPU checks PASS; occupied-probe low-Sun transmission error worsens. Rims and artificial morphology persist. Candidate remains opt-in and rejected for adoption. Details: `V04-MILESTONE-A-LIGHT-PATH.md`. Wave source/evidence checkpoints are local `84c0ce9`/`59c2a58`; no publication claim. A still incomplete.

**23 October wave investigation:** Geometry/normal/glitter isolation completed. Wider footprint and covariance-strain ablation do not fix appearance; remain opt-in. Near-first opaque patch ordering is adopted after four byte-identical still pairs, four new24 s originals, four-view60 s profiles and reverse-order near-surface repeats. Daylight-near surface work20.52-20.60 ms becomes14.27-14.38 ms; frame rate21.56-21.62 becomes24.88-25.08 FPS. CPU37/GPU FFT9/optics5 PASS within scope. Core-appearance transformation NOT achieved; A remains incomplete and authorized to continue. B/C unauthorized. Full evidence and next bounded cloud-light-path hypothesis: `V04-MILESTONE-A-WAVES.md`. Nine old evidence modifications remain preserved.

**23 October continuation:** Owner explicitly authorizes further Milestone A work; the first-cloud-checkpoint HOLD below is historical. A is incomplete, no visual acceptance. B requires both A owner acceptance and explicit B authorization; B1 breaking/whitewater and B2 integrated weather remain future gates. C unauthorized. Local and GitHub development HEAD verified `d4f7d806ffc5cb6ffc88e9aa9637edbfe3b5d574`; frozen refs unchanged. Nine documented old evidence modifications preserved; all 24 files match their preservation copies. Baseline CPU35 PASS after approved host execution (sandbox worker creation failed). First bounded investigation and new evidence: `V04-MILESTONE-A-WAVES.md`.

**Current owner authorization, 22 October 2026: Milestone A only.** Supersedes the historical Phase 1-only scheduling below. One bounded intervention, four-view daylight/low-Sun benchmark, STOP at first substantial visual checkpoint. B/C remain unauthorized; all inherited failures remain open. See `V04-MILESTONE-A.md`.

**Current checkpoint: owner HOLD.** Rendering source `3541dc8`; cloud-density experiment remains opt-in, rejected as a default replacement. Less repeated placement, but inflated silhouettes/rims and distant bands persist. Core ocean realism FAIL. Four matched Balanced pairs, eight original ~24 s videos, two matched Cinematic pairs, eight Balanced and two Cinematic restored-window 60 s profiles completed. CPU35, GPU FFT9, optics5 and cloud11 checks PASS within stated scope. GPU cloud transport error corrected from0.0104235 to8.94e-7. See `V04-MILESTONE-A-CHECKPOINT.md` for acceptance, exact evidence, performance and reference limits. No further rendering reconstruction before owner review; B/C remain unauthorized.

Balanced baseline/candidate FPS: daylight2 m22.39/20.41; daylight50 m18.63/15.41; low-Sun2 m21.86/20.07; low-Sun50 m29.86/26.62. Cinematic daylight2 m1.89/1.75, mean GPU530.08/585.74 ms. No real-time target achieved. Fresh ~1 s cadence isolated to minimized Chrome; restoring it resolves that run. Historical intermittent stalls remain UNVERIFIED; Cinematic has >1 s outliers too. Allocation payload is195.10/271.93 MiB by preset, not residency; active desktop/thermal limits disclosed.

Nine unexplained old evidence differences remain untouched and unstaged;24 originals still match preservation copies. New evidence uses exclusive writes. Published evidence checkpoint `79505007b6804433fadea23276e082998b2daf83`:217 evidence hashes sealed;96 unique LFS objects/101 media paths freshly downloaded and SHA-256 verified. Remote main/0.3/release refs unchanged. Proof: `evidence/v04-ma-handoff-01/publication.json`. No visual acceptance or ruleset protection implied.

Hardware: current Chrome GPU PID18756 appears on the RTX 3050 in `v04-ma-hardware-20261022`; application identifies native WebGPU NVIDIA/Ampere. Allocation payload is not residency. Supplied reference clip reviewed as 2 fps frames, not full perceptual playback: extension file-selection permission blocked; native VLC app approval timed out. Do not bypass either gate or claim complete playback.

**Historical Phase 1 checkpoint, 22 October 2026 (scheduling superseded):** Phase 1 engineering handoff; STOP for owner approval before Phases 2+3. Chrome automation recovered through its supported extension runtime, without security changes or restarts. RTX 3050 use is corroborated with the Chrome GPU PID. Final rendering source `919dfb4`: 32 CPU tests, nine FFT checks, five optical groups and six regional batches PASS. Twelve controlled 1080p still pairs, seven final 20 s clips, isolated lighting controls, nine completed browser playbacks and UI restore/share tests are preserved. Corrected sustained FPS: Golden Balanced 21.72, Storm Balanced 31.02, Golden High 10.87. Targets FAIL; baseline one-second stalls reproduced, cause UNVERIFIED. See `V04-PHASE1-REPORT.md`, `V04-PHASE1-ACCEPTANCE.md`, `V04-PHASE1-REPRODUCE.md`. Publication proof is stored separately in the Phase 1 handoff evidence. No inherited realism failure is closed.
**Working branch:** `development/pelagic-0.4`
**Current authorized programme:** **Combined Milestones A+B, 24 October kickoff**
**Next gate:** Owner visual review of substantial integrated checkpoints, including B1/B2. Milestone C and final release remain separately gated.

## Preserved baseline

- Preserved `main`/0.2 SHA: `151aadaa6d2402c46f4e02454f2fc33ab7744661`.
- Preserved completed 0.3 branch SHA: `87ce051ce43dd03b2967034ae2ca4d560a17f222`.
- Published v0.3.0-dev.1 rendering SHA: `be3f5c47d923e90303dece20ed19dbfc4bb17636`.
- Verified 821 original 0.3 evidence files, zero mismatches; fresh midday capture pixel-identical to preserved evidence.
- 0.3 acceptance W1/W2/L1/L2/B1/C1/U1/G1/A1/T1/R1: numerical progress, but visual quality broadly FAIL; numerical/physical gaps remain UNVERIFIED.
- Reported RTX 3050 at 1080p: 22.83 FPS Golden Balanced, 32.24 Storm Balanced, 9.85 Golden High, 18.59 Storm High. These are **0.3 evidence**, not new 0.4 measurements.

## Historical Phase 1 resume checkpoint - superseded by current checkpoint above

The pending tasks and browser interruption statements in this section describe earlier checkpoints. Do not use them as current browser state; original artifacts remain preserved.

- Browser recovery: existing Chrome extension connection restored without a restart or security change. Exact localhost tab claimed and verified. Current bootstrap returns the Agent rather than assigning a global. Official host diagnostics pass; initial sandbox profile/registry errors were misleading. See `V04-BROWSER-RECOVERY.md`. Fresh regional (4 batches), FFT (9 checks) and optics (5 groups) GPU tests PASS in `v04-p1-recovered-tests`; final controlled motion collection is underway. Earlier interruption descriptions below remain historical.

- Renderer commits: 237c1a3 environment/cache integration; 942362f full-width front correction and experiment harness; b6349d3 shared ice-veil extinction. No Phase 1 commits pushed yet.
- Original local evidence: baseline de7b32b 12 still pairs + five 10 s clips; preliminary Phase 1 237c1a3 12 still pairs and 942362f five 20 s clips. The b6349d3-labelled directory now contains twelve still pairs generated between sessions; owner authorized provenance inspection without overwriting. All twelve were inspected at original resolution. Chrome156/NVIDIA-Ampere metadata is consistent, exact browser host unknown. Final videos remain absent.
- `tests/phase1-inventory.mjs`: 138 retained Phase 0 evidence hashes match; frozen main/0.2/0.3 refs match; 70 Phase 1 original files inventoried. Check is local, not GitHub publication verification.
- CPU test command `node --test tests/*.test.mjs`: 32 PASS, zero failures. Previous regional GPU result predates the width correction; final GPU FFT/optics/regional runs are outstanding.
- `tests/phase1-evidence.py` reports missing pairs explicitly, reads the correct `simulation` timing field and distinguishes static pose/FOV from whole-camera equality. Latest analysis is in `v04-p1-provenance-review`: 12/12 pairs available, same pose/FOV/time; `glitter-covered` camera speed differs. All pairs change weatherRate60 to1. Original preliminary and one-pair checkpoint analyses preserved.
- Browser runtime: local servers restarted on 8081 (unchanged baseline) and 8082 (current). Computer Use stopped at Chrome URL policy verification. Do not claim new GPU captures or performance from this session.
- Next: external desktop Chrome must already be visible on a local page so URL policy can identify it. Use `/environment-tests.html?stage=v04-p1-desktop-tests&auto=1` on port8082, adding `revision=<actual test-source commit>`; new query support preserves earlier GPU output. Continue FFT/optics and final motion. Any fresh stills must use a NEW directory (`v04-p1-desktop-stills`), never overwrite the owner-retained final-stills set. Inspect playback, test save/load/share, then baseline/current sustained benchmarks and trace evidence.
- Then produce final report, reproduce guide, acceptance decisions and source/media manifest; commit originals through LFS, publish only the 0.4 development checkpoint, independently verify remote objects. STOP before Phases 2+3.

## Retained Phase 0 findings

| Field | Verified current value |
|---|---|
| Active phase and scope | Phase 1 implementation under test: deterministic regional environment, independent clocks/history, nonrecursive angular radiance cache, cloud-aware underwater light and rain support. No later-phase reconstruction |
| Published experiment checkpoint | `62f0f752fea7e211c4aea1addf140ff3ee217679`; remote SHA verified. All 81 unique LFS objects freshly downloaded and SHA-256 checked; 82 media paths. Publication proof: `evidence/v04-p0-review/publication.json` |
| Last actual source/commit inspected | Entry `6672bfbe14732b120464862cd408f9f91dc3b563`, preflight `a1092a0`, final laboratory source hashes in `evidence/v04-p0-review/manifest.json`. Capture label a1092a0-lab is not a commit; per-capture source hashes were not retained |
| Tested CPU / GPU commands and results | `npm test`: 26/26 PASS; `/tests.html`: 9/9 FFT checks PASS; `/optics.html`: five groups PASS; compute marker 0x50454c41 PASS |
| Actual full-resolution media inspected | 22 captured 1080p PNGs; subset examined at full size listed in report. Nine original 1080p WebMs fully decoded, sampled playback/frames inspected; no exhaustive temporal certification |
| Local RTX 3050 evidence returned by user | Same-session chrome://gpu entries: WebGPU hardware accelerated, RTX 3050 ACTIVE, driver 32.0.16.1714 |
| Codex/Chrome local execution location | Local Windows HP Victus; Chrome executable in Program Files, desktop session 1, extension browser 3; host JSON saved. HypervisorPresent true is disclosed |
| WebGPU adapter vendor/device and software-fallback exclusion | Probe + active renderer + GPU tests: NVIDIA/Ampere; device string privacy-redacted. OS RTX 3050 and owner Chrome report corroborate identity; no software identity detected |
| `chrome://gpu` hardware acceleration evidence | Owner-supplied text saved; internal URL automation blocked. Original screenshot/export unavailable; Dawn backend not identified |
| Repo `main` branch protection / rulesets | **NOT ACTIVE as checked 2026-10-20**; owner setup needed |
| v0.2/v0.3 release tag rulesets | **NONE FOUND as checked 2026-10-20**; owner setup needed |

| Owner-approved reference set | **Pending**. NOAA cumulus photo, NASA cellular-cloud image, NOAA rough-sea video provenance documented; substantial slots unfilled |
| Fresh performance | Golden Balanced 22.90 FPS; matched storm Balanced 32.28; alternate storm view 17.17; split-profile Golden High 8.22. One-second stalls reproduced; cause unresolved |
| Provisional frame/VRAM budgets | 60/30 FPS goals remain FAIL; cloud/surface dominate. Whole-board peak 1151 MiB is not app residency. Complete allocations/overdraw/endurance UNVERIFIED |
| Open 0.3 inheritance items | W1 W2 L1 L2 B1 C1 U1 G1 A1 T1 R1 — retain all |
| Scientific decisions accepted/rejected | Retain FFT. Correct PM wind height; reject no-Gaussian-groups assertion, naive double sharpening, linear B=0.85 transplant and delay-only feedback stability. Reject both cloud candidates as final shapes; broader architectures remain open |
| Visual acceptance | **Pending owner review** |
| Phase 1 authorization | **Owner granted 21 Oct 2026; only Phase 1.** Does not close Phase 0 failures. |

## Decision and evidence log

| Date / phase | Decision or result | Evidence / commit | Status | User acceptance |
|---|---|---|---|---|
| 2026-10-20 / handoff | Owner sign-off required at every formal phase gate | `AGENTS.md` and master brief execution addendum | Rule established | N/A |
| 2026-10-20 / handoff | Preserve old code/releases; work on 0.4 | GitHub branch/commit verification | Rule established | N/A |
| 2026-10-20 / Phase 0 | Hark hypotheses checked with mode census, seeded groups, crest moments and CIE/absorption integration | `evidence/v04-p0-science`; consulted-source scope in `V04-PHASE0-SOURCES.md` | Narrow numerical findings PASS; full models UNVERIFIED | Pending |
| 2026-10-20 / Phase 0 | Two density-only cloud candidates tested against baseline across daylight/golden/overcast/storm | 22 PNG/JSON pairs, nine WebM/JSON pairs; `phase0-review.html` | Compilation PASS; visual FAIL; candidates rejected | Pending |
| 2026-10-20 / Phase 0 | Frozen-sea crossing retains straight slanted boundary at fixed height/time | `frozen-skim.webm`, sampled 6 s frame | Stale moving-wave readback is not sole cause; full topology UNVERIFIED | Pending |

## Next actions and limits

1. Review `V04-PHASE0-REPORT.md`, acceptance register and original media using `npm start` then `/phase0-review.html`. Reproduction commands: `V04-PHASE0-REPRODUCE.md`.
2. Verify materialized archive with `git lfs pull` then `node tests/phase0-manifest.mjs`. Original failure logs remain preserved.
3. Execute **Phase 1 only** per `V04-PHASE1-KICKOFF.md`; no inherited realism defect is closed.
4. Submit full Phase 1 evidence and **STOP**; possible combined Phase 2+3 cloud/weather work remains unauthorized.

Unfinished investigations: validated crest-event/roller, spatial action modulation, equal-occupancy cloud calibration, full colour pipeline, overdraw/resources, isolated endurance, wider real-reference coverage and owner review. Record these as UNVERIFIED; phase advancement never converts them into PASS.

**Updating this file never changes the master requirements or waives a failed acceptance gate.**


## Owner decision — 21 October 2026
- Research (Hark, AAA production, final targeted 21 Oct report) approved for evidence-graded use, not for blind implementation. Original targeted report: `docs/research/PELAGIC_V04_TARGETED_RD_2026-10-21.md`. AAA transfers: `docs/V04-AAA-TECHNIQUE-DECISIONS.md`.
- **Phase 1 only explicitly authorized**. Phase 0 failure history, source hashes and original media preserved unchanged.
- Proposed future planning: 2+3 and 6+7 conditional shared programmes, with owner visual hold points; phases 4/5/8/9 solo. See `docs/V04-PHASE-GATES.md`.
- Next action: Astra reads latest docs, implements Phase 1, updates state with actual evidence, then STOP for owner approval.
