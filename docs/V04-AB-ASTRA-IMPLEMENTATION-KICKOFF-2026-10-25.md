# PELAGIC 0.4 — Astra Development Kickoff
**Combined Milestones A+B · New Codex chat · Existing workspace**

Astra, resume PELAGIC 0.4 in the **same existing project folder**, on `development/pelagic-0.4`. Continue from the actual local source and unfinished implementation, not from a fresh project or assumptions about the latest published documentation commit.

Start by checking `git status`, the active branch, recent renderer commits and unpublished changes. Read `AGENTS.md`, `docs/V04-AB-SIX-STAGE-CONTINUOUS-EXECUTION-2026-10-26.md`, the active entries in `docs/V04-STATE.md`, the latest A+B continuation and `docs/V04-ACCEPTANCE.md`. Protect existing source, inherited evidence modifications, lockfile, original captures and private research files. The last verified published AB6 renderer is `24a88e3`, but local work may be newer. Give a concise factual resume ledger, then begin implementing.

## Objective and priorities

Build a physically coherent, naturalistic ocean that also achieves extraordinary visual craft: beautiful and readable wave forms, believable water-body colour, directionally appropriate sun glints, energetic crest-connected breaking, rich foam and spray, and an atmosphere that belongs to the same world. **Sea of Thieves is our primary visual benchmark**, not a substitute for physical reasoning or permission to copy arbitrary stylized constants.

All six A+B workstreams belong to your continuing assignment. **Focus the deepest engineering effort on connected B1 whitewater and A water lighting/material, beginning with any upstream wave geometry or event-support deficiencies that cause those failures.** Continue the broader wave, weather and atmosphere work meaningfully; do not merely touch each area to claim coverage. Performance and integration checks accompany development rather than displace it.

## Research and reference inspection

The existing private `_local_references/` folder contains six original Sea of Thieves MOVs, three research PDFs, eight selected Rare developer slides and related notes. Confirm their actual paths and examine them. Study all three papers, especially Tessendorf's *Simulating Ocean Water*, together with Rare's technical-art material and Fournier's wave-train research.

Be precise about what you have genuinely observed. If you cannot play videos directly, sample their **full timelines** for event discovery and examine **dense consecutive timecoded frames** around crest formation, breaking/foam decay, crossing waves and sunlight. Record the discovery sampling interval, examined windows and unexamined intervals. Do not claim playback when you only inspected frames. Use findings to guide implementation; do not turn research into a separate prolonged project.

## Development work

Improve wave scale, physically constrained dispersion, swell grouping, steepness and directional interactions while preserving the validated six-cascade FFT. Verify that the resulting moving field provides coherent crest shapes and event support; **record that evidence before redesigning the whitewater system**.

Develop B1 beyond AB6's rounded disconnected foam parcels. Aim for continuous crest-relative breaking structures, plausible aeration, fresh-to-aged foam, spray and dissipation. Do not mistake an FFT fold or Jacobian mask for complete nonlinear breaking.

Rework the water material so illuminated wave shoulders, deep bodies, reflection, glitter and sky-water radiance read convincingly across midday, low Sun, storms and varied camera heights. Address metallic or uniformly wrinkled surfaces at their actual cause, not through arbitrary tint or superficial filtering.

Advance cloud morphology, atmospheric scattering, weather transitions, spatial rainfall, appropriate convective lightning, twilight/night and the wind-to-sea relationship. Preserve previously demonstrated equal-quality optimizations.

At integrated checkpoints, measure real visible foreground GPU cost and **p95 presented-frame pacing**, compare representative matched motion and provide reviewable evidence. Preserve quality rather than reducing scene fidelity to inflate performance.

## Quality and verification

For each significant visual change, write down the **specific defect, matching baseline, qualitative pass and failure conditions, failure-revealing camera views and falsifiable root-cause hypothesis before editing**. Reuse existing PELAGIC capture and testing tools.

Implement a focused solution, inspect actual motion or sufficiently dense frame sequences, and describe **what you saw in each view before comparing it to the target**. Mark relevant features PRESENT, ABSENT, PARTIAL or NOT INSPECTED; explain partial results and identify the most likely owner objection. If media inspection is impossible, clearly state VISUAL UNVERIFIED. Passing tests, shaders compiling or pixels changing are not visual completion.

When a result remains unconvincing, investigate the responsible physics, spectrum, geometry, temporal behaviour, materials, lighting and connected systems. Use targeted research where needed. A bounded subsystem reconstruction is appropriate when evidence shows why incremental patching cannot work, but preserve working foundations and avoid speculative engine rewrites. Reimplement and compare; change the hypothesis when an approach fails rather than endlessly retuning it.

Use proportional validation and keep the effort centered on source quality. Do not finish a session by merely listing faults in a new prototype as though the feature were complete.

## Continuity and acceptance

At substantive checkpoints, keep **all six workstreams explicitly represented**, including any stage with no source progress this session. Mark such work *deprioritized (not started this session)* with the reason and next intended action, or *blocked* with its actual dependency. Keep every high-priority unresolved defect visible instead of burying difficult work behind completed easier tasks.

Update a short durable checkpoint before long rendering/research/refactoring operations and at session end: source SHA, source changes, visible results with capture references, costs where measured, outstanding defects and the precise next implementation. That allows continued work without repeating prior analysis.

Continue the authorized combined A+B programme through meaningful implementation and integration. **Only I can accept B1, B2 or A+B visually**. Do not enter Milestone C or promote a release. When a session ends before the standard is reached, preserve the work and honestly distinguish demonstrated improvements from remaining limitations.

Begin with the recovered renderer state and its highest-impact water problem. Produce genuine improvements in moving visuals, not simply more code, tests or reports.
