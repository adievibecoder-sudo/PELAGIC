# PELAGIC 0.4 — Persistent Verified State

**Last execution update:** 20 October 2026 — Phase 0 in progress; see `V04-PHASE0-LAB.md`.
**Working branch:** `development/pelagic-0.4`
**Current authorized phase:** **Phase 0 ONLY**
**Next phase gate:** STOP after Phase 0; await explicit owner approval for Phase 1. User retains independent visual sign-off.

## Known baseline (from published 0.3 documentation; reverify in Phase 0)

- Preserved `main`/0.2 SHA: `151aadaa6d2402c46f4e02454f2fc33ab7744661`.
- Preserved completed 0.3 branch SHA: `87ce051ce43dd03b2967034ae2ca4d560a17f222`.
- Published v0.3.0-dev.1 rendering SHA: `be3f5c47d923e90303dece20ed19dbfc4bb17636`.
- 0.3 acceptance W1/W2/L1/L2/B1/C1/U1/G1/A1/T1/R1: numerical progress, but visual quality broadly FAIL; numerical/physical gaps remain UNVERIFIED.
- Reported RTX 3050 at 1080p: 22.83 FPS Golden Balanced, 32.24 Storm Balanced, 9.85 Golden High, 18.59 Storm High. These are **0.3 evidence**, not new 0.4 measurements.

## Required persistent fields — Astra must update during authorized Phase 0

| Field | Verified current value |
|---|---|
| Active phase and scope | Phase 0 — baseline, research reconciliation, decisive experiments, reference & budget design |
| Last actual source/commit inspected | `6672bfbe14732b120464862cd408f9f91dc3b563`; production source identical to 0.3 |
| Tested CPU / GPU commands and results | `npm test`: 23/23 PASS; `/tests.html`: 9/9 FFT PASS; `/optics.html`: all groups PASS. Raw files in `evidence/v04-p0-preflight` |
| Actual full-resolution media inspected | Fresh 1080p midday renderer capture; pixel-identical to 0.3 midday-h2-a0 |
| Local RTX 3050 evidence returned by user | Same-session chrome://gpu entries: WebGPU hardware accelerated, RTX 3050 ACTIVE, driver 32.0.16.1714 |
| Codex/Chrome local execution location | Local Windows HP Victus; Chrome executable in Program Files, desktop session 1, extension browser 3; host JSON saved. HypervisorPresent true is disclosed |
| WebGPU adapter vendor/device and software-fallback exclusion | Probe + active renderer + GPU tests: NVIDIA/Ampere; device string privacy-redacted. OS RTX 3050 and owner Chrome report corroborate identity; no software identity detected |
| `chrome://gpu` hardware acceleration evidence | Owner-supplied text saved; internal URL automation blocked. Original screenshot/export unavailable; Dawn backend not identified |
| Repo `main` branch protection / rulesets | **NOT ACTIVE as checked 2026-10-20**; owner setup needed |
| v0.2/v0.3 release tag rulesets | **NONE FOUND as checked 2026-10-20**; owner setup needed |

| Owner-approved reference set | **Pending** |
| Provisional frame/VRAM budgets | See `docs/V04-PERFORMANCE-BUDGETS.md`; **not validated** |
| Open 0.3 inheritance items | W1 W2 L1 L2 B1 C1 U1 G1 A1 T1 R1 — retain all |
| Scientific decisions accepted/rejected | **None locked for 0.4 yet** |
| Visual acceptance | **Pending owner review** |
| Phase 0 exit authorization | **Not granted** |

## Decision and evidence log

| Date / phase | Decision or result | Evidence / commit | Status | User acceptance |
|---|---|---|---|---|
| 2026-10-20 / handoff | Owner sign-off required at every formal phase gate | `AGENTS.md` and master brief execution addendum | Rule established | N/A |
| 2026-10-20 / handoff | Preserve old code/releases; work on 0.4 | GitHub branch/commit verification | Rule established | N/A |
| 2026-10-20 / handoff | Hark research is hypothesis-bearing and earlier PDFs require reconciliation | `docs/V04-RESEARCH-INDEX.md` | Research work pending | N/A |

## Next actions (Phase 0 only)

1. Verify branch, runtime capability and exact source/evidence versions.
   - First prove local Chrome WebGPU adapter and real renderer path; if absent produce owner-run instructions instead of GPU PASS.
2. Rebuild the defect register and dependencies, including the user's cloud/weather/rain/lighting observations.
3. Inspect reference inputs, define complete metadata; request user-owned photos/clips only when necessary.
4. Conduct smallest decisive experiments; queue actual GPU runs on user's RTX 3050 as explicit commands.
5. Establish a realistic provisional per-system frame-time and resource budget, and record baseline.
6. Deliver Phase 0 report and proof artifacts; **STOP until owner approves Phase 1**.

**Updating this file never changes the master requirements or waives a failed acceptance gate.**
