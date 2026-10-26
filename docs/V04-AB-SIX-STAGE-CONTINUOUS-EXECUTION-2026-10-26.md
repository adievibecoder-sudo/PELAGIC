# PELAGIC 0.4 — Combined A+B Development Programme

**26 October 2026 · Active execution specification · `development/pelagic-0.4`**

## Objective and working priorities

Develop a visually extraordinary, naturalistic and physically coherent open ocean with integrated atmosphere and weather. **Sea of Thieves** is the primary reference for visual craft—readable wave forms, expressive breaking foam, convincing water colour and coherent lighting—not a calibrated fluid or optical model. Physical evidence and documented rendering constraints govern simulation correctness.

All six workstreams below belong to the already authorized combined **Milestones A+B**. They form one continuing programme, not six release milestones or a six-item checklist to touch superficially within a single agent session. Put the deepest implementation effort into **B1 crest-connected whitewater and A water material, together with the upstream wave geometry and event support they require**. Complete wave organization and atmosphere/weather work substantively as the programme advances. Performance and evidence belong alongside development. An unworked stage stays visible in the checkpoint ledger.

B1, B2 and integrated A+B require **owner visual acceptance**. No Milestone C, engine/framework migration, release promotion or claim of completed AAA parity is authorized.

## Starting point and project continuity

Resume the **same local checkout**, not a fresh project. Inspect the active branch, `git status`, unpublished edits, local versus remote commits, and recent **renderer-changing** source before deciding what to implement. Read `AGENTS.md`, the latest entries in `docs/V04-STATE.md`, `docs/V04-AB-CONTINUATION-06.md` or any newer continuation, `docs/V04-ACCEPTANCE.md`, and the Rare reference handoff. Older research records are consulted for specific uncertainties or rejected experiments, not replayed as a new audit.

As of the publication snapshot informing this specification, AB6's most recent published **renderer** change is `24a88e3`: optional crest-attached porous whitewater parcels, not coherent rollers. Its documented visuals remain inadequate; B1 is not accepted. The reported 64 CPU tests and five GPU checks passed, while High storm GPU mean changed from 41.70 to 42.38 ms and presentation pacing was uneven. Later documentation SHAs do **not** indicate new renderer work. **Treat all SHAs and measurements here as historical snapshots; actual local Git/source and newer verified evidence take precedence.**

Protect source, nine inherited evidence edits, existing lockfile, original captures and untracked work. Never use destructive reset/clean, overwrite unexplained work, rewrite history or force-push. Keep main, 0.2/0.3 and frozen releases untouched. The private `_local_references/` directory (or its actual verified equivalent) contains owner-provided media; reference videos, paper originals and talk screenshots remain untracked and must not be published to public GitHub.

## Workstreams and deliverables

### 1. Establish a reliable reference interpretation

Inspect **all six original Sea of Thieves videos**, the **eight selected Rare talk slides**, the timestamped developer-talk synopsis and the three full papers:

- Jerry Tessendorf, *Simulating Ocean Water* (26-page 1999–2004 notes): spectral dispersion, choppiness/Jacobian, geometric waves, optics and caveats. Rare's citation of Tessendorf 2001 does not establish that the supplied course notes are an identical 2001 publication.
- Rare, *The Technical Art of Sea of Thieves* (SIGGRAPH 2018): physically informed wave dynamics paired with deliberate foam and crest-light art direction.
- Fournier et al., *Dynamic Wave Trains* (2026): spatially varying wave behaviour and phase-linked effects; not a demonstrated solution for full volumetric overturning.

**Inspection must reflect the actual tools available.** If direct video playback and observation are genuinely possible, report the original intervals viewed. Otherwise scan the full source timeline at a stated discovery interval, then inspect sufficiently dense **consecutive, timecoded frames** around wave crossings, crest progression, whitewater onset/decay and sun-glitter events. Use source-frame-rate sampling where needed to examine short-lived effects. State the discovery sampling interval, the dense windows examined and any intervals left unexamined. The phrase *watched end to end* is reserved for actual continuous playback. A few isolated frames do not establish temporal naturalism. If neither actual viewing nor meaningful frame inspection was possible, mark **VISUAL UNVERIFIED**. Do not substitute numerical motion metrics for visual observation.

Record only a short, source-grounded set of timecoded findings linked to source decisions. Video footage is an artistic reference, not a measurement of hidden oceanographic parameters. Once the relevant sources have been examined, return to implementation; additional research should answer a specific unresolved technical question.

### 2. Wave field, scale and crest support (A)

Preserve validated native-WebGPU, six-cascade FFT, spectral-energy and horizontal-chop foundations. Improve the actual deficiencies in coherent gravity-wave groups, long-wave recurrence, wave-height hierarchy, spectral directionality, steepness evolution, and wind/swell transitions. Wave propagation must remain wavelength-, gravity- and (where relevant) depth-dependent; no arbitrary independent speed tuning. Crossing waves interfere; nonlinear energy exchange, overturning and entrainment do not automatically follow from linear FFT displacement.

**Provide a coherent crest geometry/phase/tangent and breaking-event support signal for Stage 3.** Test the signal against moving calm, crossing-swell, choppy and storm cases, and preserve wave energy/slope and geometry LOD consistency. A spatial wave-train supplement is optional only when a measured defect warrants it; do not replace the renderer or FFT merely because another technique exists.

### 3. Breaking, whitewater and spray (B1)

**Before changing the whitewater representation, verify—and record in the pre-change target—whether Stage 2 supplies sufficient crest geometry, wave propagation, steepness evolution and temporally coherent breaking-event support.** Specify the evidence and its limits. Correct an inadequate upstream signal first rather than disguising the problem with extra white particles.

The current AB6 parcels may be refined, reorganized or replaced with a bounded crest-relative representation when evidence warrants it. Target continuous, moving breaking structure along the crest; visible aeration and active foam; natural transition to aged streaks/lace, bubbles, spray and dissipation. Do not confuse a Jacobian compression mask, 2.5D parcel volume or linear wave fold with a complete nonlinear breaker. Avoid isolated rounded blobs, grey flat blankets and storm foam that persists unchanged in calm conditions.

Demonstrate moving crest attachment and evolving decay against AB6, with both close and elevated storm views and a calm control. A functioning prototype that still fails the declared visual target remains **experimental**, not B1-complete.

### 4. Water material, illumination and visual craftsmanship (A)

Address dark/watery-body versus reflective-surface imbalance, low-Sun metallic silver/bronze appearance, missing or incoherent sun glitter, weak illuminated wave shoulders, excessive fine wrinkles and environment/sea light coupling. Preserve credible Fresnel behaviour, filtered slope statistics, physically bounded volumetric absorption/scattering and coherent direct/diffuse light contributions; balance these with deliberate, restrained visual readability.

Test near-water and elevated cameras in daylight and low-Sun conditions, plus an overcast or storm regression view. An attractive still with incorrect glint motion or artificial bright paint is not acceptable. Avoid repeating AB6's already rejected entry-flank refraction or unsuccessful blanket-filtering experiments without a new causal reason.

### 5. Clouds, atmosphere and integrated weather (A+B2)

Develop varied, natural cloud morphology and interior lighting rather than repeated domes, rims and cell patterns. Couple sky/sea radiance and wind-driven sea-state development with believable rain fields, visibility, wind-advection, aerosol effects and weather transitions. Lightning and its illumination belong to appropriate convective storms, not every windy scene. Retain useful AB5 cloud-work reductions at matched fidelity; address twilight/night radiance where within A+B scope.

This is a substantive required workstream, not a cosmetic retint. If it receives no source work during a given session because water takes priority, state that explicitly with the next intended implementation in the checkpoint ledger.

### 6. Performance, integration and review evidence

Optimize based on confirmed bottlenecks while developing the systems above. Preserve visible quality, simulation consistency and effects; lower resolution or missing clouds are not equivalent-performance improvements. Separate GPU pass/queue times from actually presented frames. Before attributing performance changes, establish or reuse a **matched baseline with p95 presented-frame pacing** on a visible, foreground RTX 3050 Chrome run; AB6's mean GPU timing did not capture its uneven presentation. Reuse a valid baseline when scene, hardware and settings are unchanged, rather than rebenchmarking every small shader edit.

Produce short original high-resolution matched before/after footage, selected stills, focused correctness/regression results and truthful costs at **substantial integrated checkpoints**. B1, B2 and A+B acceptance belong to the owner.

## Method for each significant visual change

Use the project's existing deterministic capture, shader/GPU test and acceptance infrastructure; do not establish an additional mandatory document or full capture framework. Keep each experiment's record short.

**Before editing:** identify the observed defect and available physical or artistic reference. Save or reuse a verified **baseline** with fixed scene/seed, camera path, weather, time, duration, exposure and resolution. Write a qualitative pass target **and specific visible failure condition** before the result is known. Select two or three failure-revealing views and one regression condition. State the hypothesis, likely upstream dependencies, one falsifying observation, relevant physical checks and the current performance reference (including pacing when measured). For B1 explicitly record the upstream crest-support verification described above. Unknown reference-video physical settings remain unknown. Do not invent objective numerical scores for beauty or relax criteria after seeing the candidate.

**Implement:** make the smallest sufficient source change that tests the hypothesis; isolate relevant variables when practical. Use focused research only if a real technical uncertainty remains. If repeated targeted changes demonstrate that the current representation cannot express the desired behaviour, justify a **bounded subsystem reconstruction** with causal evidence, proposed alternative, compatibility and cost. Preserve existing correct work and reversible candidates.

**Evaluate:** render under the identical baseline conditions and inspect actual motion or sufficiently dense frame sequences. For each selected view:
1. Describe the **observed** shapes, timing, direction, lighting and artifacts *before looking back at the target*.
2. Compare against the predeclared pass/fail description, marking **PRESENT / ABSENT / PARTIAL / NOT INSPECTED**. For PARTIAL, name precisely what remains missing; for unobserved motion say **VISUAL UNVERIFIED**.
3. Name the strongest likely owner objection for that view.
4. Record regressions, relevant physics/temporal checks and cost, citing capture paths and timecodes.

Tests, source compilation, changed pixels and difference images establish technical properties, **not** aesthetic success. If the result remains poor, revisit the causal model and attempt a *materially different* improvement rather than endless tuning or another identical QA campaign. If a hypothesis is falsified, revert the unsuccessful experiment or retain it clearly as opt-in evidence, without promoting it to a default result.

## Checkpoints, status and completion

Maintain one concise durable checkpoint in existing project records. Save it **before lengthy research, renders, high-risk refactors, context compaction when anticipated, and session end**; include a copy-pastable resume instruction. Record the local renderer SHA, actual changes, baseline/visual observations with capture timecodes, performance where checked, and the next source action. Publishing substantial verified commits should not silently stage inherited edits or private references.

Track **every one of the six workstreams**, not only the one most recently touched, with an explicit status: **not started/deprioritized, active, experimental, blocked, internally satisfactory, or owner accepted**. A stage with **no source progress in this session** must still appear as *deprioritized (not started this session)*, or *blocked* if a real dependency prevents it, with **why** and its **next intended action**. The reference-inspection stage may legitimately complete by evidence rather than code. Each high-priority unresolved defect remains visible with its last attempt, evidence and next action. No issue is silently closed because effort shifted elsewhere.

A **single hypothesis** ends when the predeclared observations and relevant regression checks support it, the hypothesis is falsified, or a specified real constraint prevents further work. A **stage** is not finished because tests passed or code exists; an unsatisfactory feature remains experimental or blocked. The **combined A+B milestone** is complete only after the owner reviews its integrated moving visuals and explicitly accepts it. When a session or tool budget ends, checkpoint honestly and resume the programme subsequently; do not promise unperformed background work.

**Working principle:** serious diagnosis, visible source improvements, proportionate validation and preserved continuity. The standard is the resulting ocean, not the amount of process surrounding it.
