# PELAGIC 0.4 — Persistent Verified State

**Implementation update:** 22 October 2026 - Phase 1 remains INCOMPLETE. Rendering source b6349d3 integrates regional weather, versioned lighting and ice-veil shadows. All 32 CPU tests passed again at that source. Final GPU regression tests, continuous-motion inspection, sustained profiling, UI validation and remote publication remain pending. Desktop Computer Use stopped because its safety check could not determine Chrome's current URL; no browser automation continued afterward. See `V04-PHASE1-ACCEPTANCE.md`; Phase 0 FAILs remain.
**Working branch:** `development/pelagic-0.4`
**Current authorized phase:** **Phase 1 ONLY**
**Next phase gate:** STOP after Phase 1; future Phase 2+3 requires separate approval and internal owner cloud checkpoint. User retains independent visual sign-off.

## Preserved baseline

- Preserved `main`/0.2 SHA: `151aadaa6d2402c46f4e02454f2fc33ab7744661`.
- Preserved completed 0.3 branch SHA: `87ce051ce43dd03b2967034ae2ca4d560a17f222`.
- Published v0.3.0-dev.1 rendering SHA: `be3f5c47d923e90303dece20ed19dbfc4bb17636`.
- Verified 821 original 0.3 evidence files, zero mismatches; fresh midday capture pixel-identical to preserved evidence.
- 0.3 acceptance W1/W2/L1/L2/B1/C1/U1/G1/A1/T1/R1: numerical progress, but visual quality broadly FAIL; numerical/physical gaps remain UNVERIFIED.
- Reported RTX 3050 at 1080p: 22.83 FPS Golden Balanced, 32.24 Storm Balanced, 9.85 Golden High, 18.59 Storm High. These are **0.3 evidence**, not new 0.4 measurements.

## Phase 1 resume checkpoint - 22 October

- Renderer commits: 237c1a3 environment/cache integration; 942362f full-width front correction and experiment harness; b6349d3 shared ice-veil extinction. No Phase 1 commits pushed yet.
- Original local evidence: baseline de7b32b 12 still pairs + five 10 s clips; preliminary Phase 1 237c1a3 12 still pairs and 942362f five 20 s clips. Final b6349d3 directory contains only `clear.png/json`; do not mix initial and final revision evidence.
- `tests/phase1-inventory.mjs`: 138 retained Phase 0 evidence hashes match; frozen main/0.2/0.3 refs match; 70 Phase 1 original files inventoried. Check is local, not GitHub publication verification.
- CPU test command `node --test tests/*.test.mjs`: 32 PASS, zero failures. Previous regional GPU result predates the width correction; final GPU FFT/optics/regional runs are outstanding.
- `tests/phase1-evidence.py` now defaults to final capture/output directories, reports missing pairs explicitly and reads the correct `simulation` timing field. Executed: 1/12 final pairs available; clear control mean RGB difference 0.00198045 display codes. Original preliminary analysis preserved.
- Browser runtime: local servers restarted on 8081 (unchanged baseline) and 8082 (current). Computer Use stopped at Chrome URL policy verification. Do not claim new GPU captures or performance from this session.
- Next: resume `/phase1.html?stage=v04-p1-final-stills&revision=b6349d3&start=1` on port 8082; run final GPU test pages and five final motion cases. Inspect playback; test settings save/load/share. Run `phase1-benchmark.html` on baseline and current servers with foreground/visibility controls; collect readback ablations and trace evidence.
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
