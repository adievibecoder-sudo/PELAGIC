# PELAGIC 0.4 — Persistent Verified State

**Last execution update:** 20 October 2026 - Phase 0 assessment/evidence published for owner review. See `V04-PHASE0-REPORT.md` and `V04-ACCEPTANCE.md`.
**Working branch:** `development/pelagic-0.4`
**Current authorized phase:** **Phase 0 ONLY**
**Next phase gate:** STOP after Phase 0; await explicit owner approval for Phase 1. User retains independent visual sign-off.

## Preserved baseline

- Preserved `main`/0.2 SHA: `151aadaa6d2402c46f4e02454f2fc33ab7744661`.
- Preserved completed 0.3 branch SHA: `87ce051ce43dd03b2967034ae2ca4d560a17f222`.
- Published v0.3.0-dev.1 rendering SHA: `be3f5c47d923e90303dece20ed19dbfc4bb17636`.
- Verified 821 original 0.3 evidence files, zero mismatches; fresh midday capture pixel-identical to preserved evidence.
- 0.3 acceptance W1/W2/L1/L2/B1/C1/U1/G1/A1/T1/R1: numerical progress, but visual quality broadly FAIL; numerical/physical gaps remain UNVERIFIED.
- Reported RTX 3050 at 1080p: 22.83 FPS Golden Balanced, 32.24 Storm Balanced, 9.85 Golden High, 18.59 Storm High. These are **0.3 evidence**, not new 0.4 measurements.

## Verified current state

| Field | Verified current value |
|---|---|
| Active phase and scope | Phase 0 investigation package at review gate; no Phase 1 production implementation |
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
| Phase 1 authorization | **Not granted. STOP** |

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
3. Await owner decision: additional Phase 0 experiments or explicit Phase 1 approval. No inherited realism defect is closed.
4. Proposed Phase 1 only: shared environment/current-target state, astronomical/radiometric contracts, continuous cloud/rain/light/sea transitions. Cloud reconstruction belongs to Phase 2.

Unfinished investigations: validated crest-event/roller, spatial action modulation, equal-occupancy cloud calibration, full colour pipeline, overdraw/resources, isolated endurance, wider real-reference coverage and owner review. Record these as UNVERIFIED; phase advancement never converts them into PASS.

**Updating this file never changes the master requirements or waives a failed acceptance gate.**
