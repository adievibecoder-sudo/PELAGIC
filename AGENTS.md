# PELAGIC 0.4 — Operating Rules for Astra

**Branch:** `development/pelagic-0.4`. **Current authorization:** Phase 0 ONLY.
**Read at the start of every session:** this file → `docs/V04-STATE.md` → current phase kickoff → only the relevant portions of `docs/PELAGIC_V04_MASTER_EXECUTION_BRIEF.md` and source/evidence.

## Controlling rules

1. **Safety:** Never modify `main`, `development/pelagic-0.3`, `v0.2.0`, `v0.3.0-dev.1`, or their evidence/release assets. Commit work exclusively to the 0.4 branch after verifying the checked-out branch. No WebGL fallback or engine migration; preserve native Chrome WebGPU.
2. **Phase boundary = mandatory human gate.** Work autonomously only inside the phase explicitly authorized by the user. Deliver the phase report, measured validation, stills, original videos, unresolved risks and a proposed next phase. **STOP and wait for explicit user approval** before any next phase. Astra cannot self-sign-off, and permission to proceed does not change FAIL/UNVERIFIED to PASS. User is the final visual reviewer; numerical tests do not override the user's critique.
3. **Evidence labels:** Each claim is PASS / FAIL / UNVERIFIED and SRC / TEST / VIS / LIT / HYP as relevant. Never invent GPU timings, images, citations, solved defects, or hardware access. For tests requiring the user's RTX 3050, provide copy-ready commands, exact conditions, expected files and interpretation, then wait for returned evidence. Absence of evidence remains UNVERIFIED.
4. **Realism first:** The full reference spec remains binding. Natural water, waves, cloud morphology and weather response, convincing breaking/foam/spray, atmosphere/light/colour, underwater, stability, performance and website quality are independent outcomes. A pretty hero image or passing unit test does not close an integrated defect.
5. **Before a major change:** Record the observed failure → root-cause hypothesis → smallest decisive experiment → expected change. Compare fixed-condition before/after **images AND motion** against credible references; include an unaffected control. Use grey-shaded structure/mask and radiance diagnostics before attempting post-process cosmetic fixes.
6. **Research caution:** Hark's report is a hypothesis source, not implementation authority. Recheck PM wind-height/development limits, true Gaussian wave grouping and independent modes, breaking B≈0.85 scope, cloud optical depth, three-band colour and choppiness. Do not lock algorithms until Phase 0 experiments justify them. Respect primary scientific sources and label uncertainty.
7. **Performance:** Keep Balanced real-time and High interactive **target budgets** separate from Cinematic quality-first profiling. Do not obtain FPS by removing required realism. Measure actual per-pass timings, frame pacing, peak resource usage and visual quality. `docs/V04-PERFORMANCE-BUDGETS.md` contains provisional allocations, not a certification.
8. **State and efficiency:** Keep `docs/V04-STATE.md` concise, accurate and updated as phases proceed; record source/commit, decisions, current risks, completed tests and exact next actions. Inspect only relevant files and dependencies for focused work; do not repetitively reread all research or generate huge reports for trivial edits. Single accountable agent, no mandatory subagent delegation.
9. **External materials:** Use `docs/V04-RESEARCH-INDEX.md` and `docs/V04-REFERENCE-BOARD.md`. Research text extracted from PDFs is an **access aid** and may misalign columns or omit images; seek originals before certifying figures. Do not fabricate photo metadata or licensing.
10. **Release:** Formal Phase 9 assessment and any 0.4 tag/release require explicit user approval. Unresolved high-severity defects cannot be marked PASS merely because someone approves continuing.

## Priority and method

A validated **representative visual slice** (daylight/broken cloud/moderate sea) is the first proof-of-quality target, *not* permission to optimize only one scene; protect sunset/overcast/storm/night as early regression controls. Cloud/weather reconstruction is an especially urgent user-reported defect, with sea naturalism, breaking and global lighting equally binding. The master brief owns the complete scope; the current phase kickoff owns the immediate work.

**Current instruction:** Phase 0 only. Stop on delivery. Do not start Phase 1 until user approval.
