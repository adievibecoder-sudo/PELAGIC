# PELAGIC 0.4 — Continuous Six-Stage Combined A+B Execution Contract (v2, tightened)
**26 October 2026 | owner-directed active execution workflow | source-of-truth operational priority for the next Codex chat**

## 1. Purpose and authority
Across the authorized A+B programme, Astra is responsible for **all six outcome areas** below. Substantive Tier 1 progress takes priority over touching all six superficially; each session should continue from actual source state and leave a clear checkpoint for work it cannot finish. This is a work programme **inside the authorized combined A+B milestone**. It is not six new release milestones, not a claim that anything is solved, and not permission to enter C.

Stages may overlap at real technical dependencies. None may be silently abandoned. If a change fails or awaits owner visual acceptance, keep it as an opt-in candidate or unresolved item and continue with other authorized A+B work.

**Standard of success:** a beautiful, naturalistic, physically coherent ocean and environment in actual moving footage. Not the number of QA runs, commits or reports.

**Priority order (what gets effort first).** The project's most important requirement is extraordinary water.
1. **Tier 1:** Stage 3 (connected whitewater) and Stage 4 (water material), with the Stage 2 crest-support signal they depend on.
2. **Tier 2:** the rest of Stage 2 (wave behaviour) and Stage 5 (clouds, atmosphere, weather). Stage 5 must still show real source progress; it may not be reduced to a retint.
3. **Throughout:** Stage 6 (performance and integrated evidence) alongside the others.

Do not substitute easy Tier 2 wins for substantial Tier 1 work. Surface hard unresolved work in the blocker ledger (section 6).

## 2. Handoff state (snapshot, not truth)
**Verify every item below against `git status`, branch and the last ten commits. The working tree wins over this section.** Local work may be newer than what is listed.

- Newest published renderer code: AB6 `24a88e37b18b`. Published evidence `57ad49f3e27c`. AB6 publication docs `716d63c17493`. Later Rare reference/kickoff commits are documentation only.
- AB6 `abWhitewater=parcels&maBreaking=gravity` makes rounded, disconnected, opt-in raised whitewater. **B1 is not accepted.** Calm control unchanged. CPU64 and native GPU5 within scope. Measured storm GPU mean 41.70→42.38 ms (+0.68 ms), with uneven presented-frame pacing.
- Still open: large metallic/silvery wave material, weak low-Sun glints and crest light, broad wave-scale organization, synthetic clouds, insufficient B2 integrated rain/lightning, night, and presentation/performance.
- These are documented observations, not your own visual inspection.

**Read order:** `AGENTS.md`; top/current `docs/V04-STATE.md`; `docs/V04-AB-CONTINUATION-06.md`; `docs/V04-ACCEPTANCE.md`; this file; `docs/V04-AB-RARE-TALK-VISUAL-AND-WAVE-BEHAVIOR-2026-10-26.md`; relevant shader modules. Consult AB3–5 and `docs/V04-AB-2026-10-25-RESEARCH-RECONCILIATION-AND-EXECUTION.md` only for specific questions and failed hypotheses. Historical S0–S6 research phases, optional TAA/temporal-cloud studies and old phase authorizations are not blockers. Current owner intent and active `AGENTS.md` take precedence.

## 3. New-chat recovery (quick, no new audit)
- Open a new Codex chat in the **same existing PELAGIC workspace**. Use the working tree `development/pelagic-0.4`, not a clone.
- Inspect `git status`, branch, the last ten commits and local-vs-remote changes. Separate rendering source from documentation/evidence. Preserve all local unpublished changes. Never reset, clean, force-push or overwrite unexplained data. Keep the nine inherited modified evidence files, the lockfile, original media and frozen refs.
- Write a factual 5–8 line resume ledger of what AB6 did, failed and left next. Then work. No invented percentages, no request to re-explain the task.
- Private references are in `_local_references/` (or `local references/` if that is what exists): six MOV originals, three PDFs, eight selected slide PNGs and indexes. Check actual paths and the manifest, not assumed filenames. These folders are ignored by the repository. **No third-party copyrighted media or slides in public GitHub.**

## 4. Inspection standard (applies to every stage)
Visual claims are only as good as what was actually seen. Before relying on any inspection, state **which of these you can do** in this environment:

- **Direct video playback.** Only claim "watched" if you genuinely viewed it.
- **Frame-sequence inspection.** Sample the full source timeline at a stated interval for event discovery, then inspect dense, timecoded consecutive-frame sequences around crest motion, foam formation/decay, glints and crossings. State the sampling coverage and any intervals not examined; source-frame-rate sampling is preferable for fast or subtle temporal behaviour.
- **Neither.** Mark the item **VISUAL UNVERIFIED**. Do not substitute metrics for visual judgment.

Rules for all inspection claims:
- Every claim cites the capture path and timecodes, and says which method above was used. "Watched start to finish" is valid only for method 1; otherwise say "inspected frames at N fps."
- Isolated stills cannot establish temporal behaviour. Motion claims (flicker, connectedness over time, trailing decay, pacing) require genuine playback or sufficiently dense timecoded consecutive frames. A sequence-based observation is not the same as watching the original video; report its limits.
- Difference images prove pixels changed. Temporal metrics can reveal flicker or instability. Neither shows the water looks better.
- Tests passing, code compiling, a commit, changed pixels, "looked good" and "inspected" are not visual evidence by themselves.

## 5. The six outcomes

### Stage 1. Reference grounding (do once, completely, move on)
Inspect **all six original videos** using the method from section 4, at meaningful crest, light, foam and waterline intervals, with selected close-ups. Log a concise timecoded visual-craft guide. State plainly the inspection method and sampling rate used for each video. The earlier AB6 two-frames-per-video scan is not sufficient.

Read **all three PDFs fully**:
- Tessendorf, *Simulating Ocean Water* (26 pages, 1999–2004 notes): dispersion, Gerstner vs statistical FFT, directional spectrum, chop/Jacobian fold, local interaction, Fresnel, water-volume scattering, and the figures and physical assumptions.
- Rare, SIGGRAPH 2018 (2 pages): art-directed peak-mask colour, Jacobian-based and progressively blurred/texture-shaped foam.
- Fournier et al. 2026, *Dynamic Wave Trains* (17 pages): spatial control and phase-linked foam; not 3D overturning, not proved spectrum matching.

Examine the eight selected slides and the timestamped developer-transcript synopsis. Separate source observations from inference. Do not equate attractive stylization with oceanographic truth. When done, **do not reopen reference study** absent a specific unresolved engineering question.

**Output:** short internal observations (key time or paper section → next source change). No separate mega-report.

### Stage 2. Milestone A: dynamic wave behaviour and geometry
Implement measurable improvements to wave height/size distribution, wavelength-dependent propagation speed, crest steepness/choppiness, coherent long-wave groups, crossings/interference, and dynamically evolving wind/swell. The existing six-cascade FFT, Gerstner-like horizontal chop, UI sea-state controls and dispersion work: **improve, don't rebuild, and add no arbitrary unphysical speed knob.**

- Deep-water gravity speed follows `c=√(g/k)`. Depth and capillary effects conditionally alter dispersion.
- Treat crossing crests as interference. Nonlinear exchange, energy dissipation and overturning are **not** solved by an FFT heightfield.
- Fix the source-verified W1 excessive repetition/small wrinkles if warranted, with energy/slope/LOD consistency.
- Local wave-train control is an opt-in candidate, not required migration.
- Provide a better coherent crest-support signal for breaking and foam (this is the Tier 1 dependency for Stage 3).

**Proof:** geometry/spectrum/physics code actually changed, or a precise explanation of why no safe replacement exists; controlled moving comparisons of calm, swell, crossing and severe seas; no unrealistic speed or steepness tuning.

### Stage 3. B1: continuous crest-connected whitewater, interaction and spray
Continue AB6's specific failed appearance. **First verify that the upstream gravity-wave field supplies coherent crest geometry, propagation, steepness evolution and event support; correct a deficient Stage 2 input before compensating with additional foam geometry or particles.** Then replace disconnected porous blobs with spatially and temporally connected **crest-relative active aerated/roller structures**. Build support along the evolving crest tangent and phase. Link actual event strength to onset, breaking duration, fresh foam, aged lace/streaks, bubble body, spray/spindrift and eventual dissipation.

Avoid uniform foam blankets, isolated round dots, random white noise, or boosted opacity disguised as a breaker. The 2.5D parcel method may be refined, reorganized or locally replaced on evidence. Full 3D fluid simulation is neither present nor automatically required. Classify each effect as physically approximate or actually simulated. Keep real GPU feasibility.

**Proof:** visible connected on-crest formation and trailing decay, better than AB6, supported by genuine playback or a sufficiently dense consecutive-frame sequence with explicitly stated observation limits, plus a physically plausible no-breaking calm case. B1 stays pending **owner** visual acceptance even if an improved candidate exists. Continue Stages 4–6 meanwhile.

### Stage 4. Milestone A: ocean water material and the "wow" factor
Resolve steel/silver/bronze-like reflected water, low-Sun glitter loss, weak refracted/scattered lit shoulders, overly uniform fine specular, body-reflectance vs sky-water coupling, and optical scale separation. Deep troughs, body colour, selectively lit shoulders, foam and glitter each need a plausible lighting reason. Sea of Thieves is a **craft reference**, not a calibrated teal LUT, scattering coefficient or energy law.

Preserve Fresnel, finite sun, slope covariance and physically bounded body attenuation. AB6's entry-flank refraction experiment was rejected for negligible visual improvement: **do not repeat it, do not blanket-blur normals, do not retune failed TAA.** Compare daylight, golden/low-Sun, overcast, storm, near/elevated and waterline views under matched controls.

**Proof:** visible moving radiance/hierarchy improvement without invented energy, flat glow, saturated overpainting, or a broken underwater/waterline.

### Stage 5. Combined A+B2: clouds, atmosphere and weather
Fix repetitive cloud morphology, smooth caps/rims, storm cloud-light transport and sea/sky palette consistency. Complete B2 coupling: wind/swell response over time, spatial rain curtains and visibility, wind-advected drops, cloud-associated lightning and its illumination in convective storms, storm aerosol/haze, coherent transitions. Preserve calm / clear / nonconvective gale / convective storm distinctions. Correct night/twilight/lunar exposure where in scope. Changing only cloud tint does not make clouds physically resolved. Keep proven AB5 equal-image cloud optimizations; do not replace volumetric clouds with unrelated meshes.

**Proof:** actual A+B environment code across relevant components; convincing sky-water motion in clear, cloudy, storm, twilight, night and rain where appropriate. B2 owner review remains outstanding but does not freeze parallel A work.

### Stage 6. Equal-quality performance and integrated evidence
Optimize discovered bottlenecks while implementing Stages 2–5. Then make **one substantive integrated A+B checkpoint**: representative before/after at native resolution; several matched short motion segments; targeted CPU/native GPU correctness; real foreground RTX 3050 GPU and presentation timing; truthful impact and memory.

- **Establish baseline p95 presented-frame pacing** for the representative foreground scene/hardware configuration before attributing a performance change, not only mean GPU time; AB6's uneven pacing makes this essential. Reuse the saved baseline while the configuration is genuinely unchanged rather than running a new long profile for every minor edit.
- Do not reduce render resolution, cloud detail, spectral fidelity or effects and call it optimization.
- Keep queue GPU time separate from rAF/display cadence.
- Test extra AA/cloud temporal reconstruction only if compelling visual and cost data justify it.

**Output:** owner-ready A+B review: changed source/commits, six-stage status (implemented / experimental / blocked with evidence), real before/after moving imagery, essential performance numbers, remaining acceptance defects.

## 6. Evidence contract (lightweight; reuse existing tools)
No `TARGET.md`/`LOG.md`, no new capture pipeline, no branch per shader hypothesis. Record a short pre-change target in the current checkpoint notes or the relevant existing acceptance row, using existing capture tools, deterministic scene settings and historical comparisons.

### Before editing rendering code (a few factual lines)
- **Defect and reference.** The observed failure; acceptance ID if one exists; the current code/capture baseline; the external evidence supporting the change (footage, physics, Sea of Thieves *art direction*, research). Unknown camera, illuminant and physical parameters in gameplay footage stay unknown.
- **Predeclared qualitative target AND failure.** What should be visible, and what would disprove success. Examples:
  - *B1:* connected moving crest-relative ribbons/rollers with fresh-to-aged foam and spray, not disconnected rounded patches or a flat grey mask; calm stays free of spurious breaking.
  - *L1/L2:* low-Sun glints stay directional and temporally coherent without blanket metallic glare; near/elevated day and golden views keep wave-body contrast.
  - *C1:* varied non-periodic cloud silhouettes with believable lit interiors, not repeated domes and rims.

  These are visual targets, not invented numeric beauty scores.
- **Reproducible controls.** Fixed seed, scene/weather/time, camera or camera path, frame interval, resolution/exposure, hardware timing basis. Keep a real before-capture or a verified prior matching artifact. Name **two or three failure-revealing views** for this change plus one non-target regression condition (for example, a water-lighting change must survive daylight and low-Sun; a whitewater change must survive close-up storm, elevated storm and calm). Record the measured baseline cost and any material physics/temporal check. No fabricated thresholds, no generic 1%/0.5 ms budget. If a trade-off needs owner judgment, flag it.
- **Hypothesis and falsifier.** The narrowest plausible root cause, key upstream inputs, the intervention, and the one observation or measurement that would show it inadequate. Prefer one isolated variable per comparison; account for coupled changes rather than treating them as causal proof.

### After rendering (view by view)
For each chosen view, using the inspection standard in section 4:
1. **Describe first, without reference to the target.** Camera/scene/time, and the concrete visible structures, timing, direction and artifacts.
2. **Then compare to the predeclared target.** Mark each success and failure feature **PRESENT / ABSENT / PARTIAL / NOT INSPECTED**. For every PARTIAL, say specifically what is missing.
3. **State the most likely owner objection** for that view.
4. **List regressions and relevant costs.**

Save the small matched evidence set and cite paths and timecodes so the owner can judge independently. A predeclared target may be revised only with an explicit evidence-based reason **before** interpreting the new result, never retroactively to pass a weak candidate.

### Blocker ledger and checkpoints
At every meaningful source/integration checkpoint, surface **every persistent high-priority blocker across all six stages** in a compact table: stage/defect ID; observed failure; attempted approach and evidence; why still open; exact next source action or dependency. Do not bury hard wave/whitewater/lighting/cloud/weather failures behind an easy completed task. A failed or uninspected feature is **experimental, failed, or blocked, never finished**. A blocker may free you to work on another authorized stage but stays visible until resolved or owner-accepted.

**Durable checkpoint ledger** (short; update at substantive changes): current renderer SHA; predeclared target and baseline capture; changed code; per-view observations with timecodes; which stages advanced; all high-priority unresolved defects with evidence and next action.

**When to update it:** before any long render, long research step or large refactor, and before ending a session. Context can compact mid-run, so state must be on disk first. Include a copy-pastable resume instruction. Never promise hidden background work.

## 7. Self-correcting implementation loop (all A+B work)
Feature presence, passing tests, a commit or an impressive report are not delivery. Every change must move the *experienced* ocean, sky and environment closer to credible naturalism **and** coherent AAA-grade craft, judged in moving footage at meaningful scales and sea states. The owner's visual approval is separate from internal engineering judgment.

1. **Define failure and target first.** Lock the baseline, state what should visibly improve and what would still fail, diagnose enough to make a physically reasoned change, and keep working foundations and reversible alternatives.
2. **Inspect honestly** per sections 4 and 6, side by side against an equivalent baseline and owner references, in the failure-revealing view, and check other conditions for regression.
3. **If still unsatisfactory, it is not finished.** Keep the partial experiment as opt-in or discard it. Convert artifacts into specific, testable causal questions about representation, temporal evolution, coupling, shading, optics, physics, scale, data and adjacent subsystems. Do not just list defects.
4. **Trace the root cause across layer boundaries.** Bad breaking water may come from the event criterion, gravity spectral group structure, missing crest tangent/phase/support, detached foam transport, aeration geometry, lighting/compositing, or a spatial/temporal scale mismatch, not necessarily the foam shader. Metallic water can come from slope/normal energy, reflection/body transport, Sun/cloud occlusion and tone mapping. Synthetic clouds can come from the spatial field, advection and light integration. Use small diagnostics and focused research only to resolve a specific uncertainty; do not re-audit modules to feel thorough.
5. **Correct the model, then reimplement.** Fix an established math/physics error; otherwise refine the representation or, where demonstrated inadequate, rebuild a **bounded** subsystem or its interface. Reconstruction is authorized inside A+B when backed by visible failure, a causal explanation, an evidence-based alternative and an integration/performance plan. Not authorized: speculative engine migration, project replacement, gratuitous modules, discarding verified work. Reserve dedicated branches for materially risky reconstruction; otherwise use reversible flags and focused commits.
6. **Re-render and compare** against the previous live baseline and reference. Keep a candidate only for demonstrated improvement without unacceptable regression or cost. If weak, name the assumption that failed and make a **materially different** next attempt. Do not endlessly tune a poor representation.
7. **Keep momentum.** After repeated evidence-backed trials, decide whether the root cause changed. If progress is truly blocked, record the concrete limitation and continue other authorized stages, returning when new evidence or dependencies make resolution credible. This is not permission to mark the failed feature complete.

**Escalation:** repeated poor results call for a deeper causal review that yields a changed hypothesis or implementation, not more of the same QA or a long research document. No fixed retry count; choose by information gained, visual impact, cost and risk.

## 8. Stop rules and status vocabulary
- **Individual hypothesis** is resolved when it meets its predeclared visual and physics/regression criteria on actual evidence, is falsified and reverted, or hits a specific demonstrated limitation with a next approach.
- **Whole A+B milestone** is not complete until the owner reviews the integrated result and authorizes acceptance. Internal judgment and numbers cannot substitute.
- Status terms: *implemented prototype, visual candidate, internally satisfactory, blocked, owner accepted.* Only the **owner** accepts B1, B2 or combined A+B. No automatic release or C promotion.

## 9. Execution rules (fixing "one thing then stop")
1. "One bounded intervention" limits scope and risk **per iteration**, not total work. Keep moving through all six stages until substantial implementations and integration are delivered or a real external/runtime blocker intervenes. Do not ask permission after each phase; the owner authorized A+B engineering, not self-acceptance.
2. **QA is proportional.** Shader compile and relevant math regression on a code change; short matched motion on a visual change; broader representative QA only after several real improvements or at a critical integration gate. Do not rerun unchanged full suites, publish near-identical screenshots/videos, re-audit the repository, or write documents instead of source code after insignificant changes. Fix real regressions promptly.
3. **Tell the truth.** No invented percentages, no guaranteed AAA parity, no unobserved reference playback, no made-up source performance, no claim of physical breaking from the Jacobian/parcel approximation. If the standard cannot be reached within the session, state exactly what remains and preserve the working result.

## 10. Verification and preservation
Native **desktop Chrome WebGPU only**; WGSL/custom renderer; no WebGL fallback; no migration. Preserve user work, local private media, source branch and evidence. Never destructively reset or clean. `docs/V04-ACCEPTANCE.md` holds historical failure IDs and valid owner gates: read active entries first, and do not let older stage scheduling override currently authorized A+B. Main, previous releases and milestone C stay untouched.

**Success for the authorized programme:** substantive progress in Tier 1 water and its dependencies, credible integrated progress across the remaining A+B areas, and a reviewable moving result. Session limits do not justify declaring all six complete: preserve unresolved work visibly and resume from a durable checkpoint.
