# PELAGIC 0.4 — Astra Development Kickoff
**Combined Milestones A+B | Existing project workspace | New Codex conversation**

Astra, resume development of **PELAGIC 0.4** in the existing project folder on `development/pelagic-0.4`. This is a continuation of your earlier engineering work, not a new project or a restart. The objective is a physically coherent, naturalistic open ocean with exceptional visual craftsmanship, integrated atmosphere and weather. **Sea of Thieves is our primary artistic and motion reference**; real ocean behaviour and credible rendering physics remain essential.

## Establish the actual starting point

Before making changes, inspect the local branch, `git status`, recent source commits and any unpublished modifications. Distinguish renderer implementation commits from documentation and evidence commits. Read the current `AGENTS.md`, `docs/V04-AB-SIX-STAGE-CONTINUOUS-EXECUTION-2026-10-26.md`, the latest entries in `docs/V04-STATE.md`, the newest A+B continuation, `docs/V04-ACCEPTANCE.md` and `docs/V04-AB-RARE-TALK-VISUAL-AND-WAVE-BEHAVIOR-2026-10-26.md`. These files define the active scope and preserve the history of attempted and rejected approaches.

For orientation, the latest renderer published before this kickoff is **AB6, `24a88e3`**; check the actual local tree before relying on it.

- The custom native-WebGPU/WGSL renderer already contains a six-cascade FFT ocean, horizontal chop, water optics, atmospheric rendering, weather controls, foam history and particle effects. Preserve these foundations where they are correct.
- **AB4** introduced experimental hybrid MSAA/TAA. It remains opt-in because its visual benefit is unresolved; do not reopen temporal reconstruction without a specific new reason.
- **AB5** corrected immediate scene preset switching and removed redundant cloud work without changing the validated comparison images. Cloud shape, ocean appearance, weather integration and performance still need substantial improvement.
- **AB6** added opt-in crest-attached porous whitewater parcels. Technical tests passed, but the improvement was modest: rounded, disconnected patches remain, and coherent breaking rollers and spray are unfinished. An experimental illuminated-entry refraction approach did not meaningfully resolve metallic water and was rejected.
- **B1 breaking/whitewater, B2 integrated weather and combined A+B have not been visually accepted.** Persistent issues include wave-group structure, metallic/low-Sun water, unnatural cloud morphology, night lighting and uneven presented-frame pacing. Later research and kickoff commits are instructions, not evidence of additional renderer development.

Confirm these findings against newer local changes, summarize the actual state briefly, and proceed directly to useful source work. Preserve existing modifications, original evidence, the inherited evidence edits, lockfile and private references. Do not destructively reset, clean, overwrite or force-push the project.

## Study the supplied references and apply the findings

The ignored local reference directory (`_local_references/`, or its verified equivalent) contains **six original Sea of Thieves MOVs, three research PDFs, eight selected Rare developer slides** and supporting notes. Confirm the files are present and examine them as part of this development continuation.

Read all three papers, including their figures and limitations: Tessendorf's *Simulating Ocean Water* (the principal wave/optics foundation), Rare's *The Technical Art of Sea of Thieves*, and Fournier's *Dynamic Wave Trains*. Study the Rare developer-talk notes alongside the selected slides.

Inspect all six video timelines. If you can genuinely observe full video playback, do so. Otherwise survey each complete timeline at a stated sampling interval, then inspect dense, consecutive timecoded frames around wave groups, crest motion, breaking/foam evolution, spray, sunlight and waterline behaviour. Record the inspection method, examined windows and unexamined intervals; never describe frame extraction as watching playback. Separate physical observations from deliberate artistic choices and unknown parameters.

Extract a concise set of findings that can inform actual rendering changes. Once the relevant reference study is complete, return to engineering; investigate sources further only when a specific technical question warrants it. Keep original videos, PDFs and slides private and untracked.

## Engineering priorities and A+B scope

Your continuing responsibility covers all six connected workstreams. Give the most substantial attention to the ocean itself—especially **crest-connected breaking/whitewater and water material**, including the wave dynamics on which both depend. Do not spread effort thinly just to show activity in every area.

**1. Reference understanding.** Establish a reliable scientific and visual interpretation of the supplied papers, gameplay footage and Rare's technical-art approach, then apply it to PELAGIC.

**2. Wave dynamics and structure (A).** Improve natural wave-height hierarchy, wavelength-dependent propagation, steepness, coherent swell groups, directional interactions and weather-driven sea-state evolution. Preserve validated spectral/FFT behaviour. Distinguish ordinary wave interference from nonlinear breaking. Develop and verify usable, temporally coherent crest geometry, phase and event signals.

**3. Breaking, whitewater and spray (B1).** Before substantially modifying AB6's whitewater, check the underlying gravity-wave crest support and record that verification. Correct deficient upstream behaviour rather than compensating with more particles or foam shading. Develop continuous crest-relative breaking structures with believable aeration, fresh-to-aged foam, lace, bubbles, spray and dissipation. Confirm that calm water does not produce inappropriate breaking.

**4. Water optics and visual quality (A).** Correct metallic or overly uniform reflections, weak low-Sun glitter, inadequate illuminated wave shoulders and poorly differentiated water-body colour. Develop coherent water/sky lighting and compelling, natural movement across near-water, elevated, daylight, low-Sun and storm views. Aim for deliberate AAA-grade craftsmanship without arbitrary colour boosts or physically unsupported light.

**5. Clouds, atmosphere and weather (A+B2).** Improve cloud scale and silhouette diversity, volumetric lighting, sky–sea radiance, storm structure, spatial rainfall, visibility, wind–sea response and believable weather transitions. Include lightning where appropriate to convective conditions and improve twilight/night integration. Preserve demonstrated equal-fidelity cloud optimizations.

**6. Performance and integrated review.** Profile confirmed bottlenecks while improving the renderer, without silently reducing resolution, simulation fidelity or visual detail. Use comparable real foreground RTX 3050 GPU measurements and presented-frame pacing—including p95—when assessing performance. Prepare original matched before/after motion, selective high-resolution stills and focused correctness evidence at substantive checkpoints.

## How to approach visual problems

Treat **a working implementation and a visually successful result as different things**. Before each meaningful change, establish or reuse a reproducible baseline, name the visual defect, define what a convincing result and an unsuccessful result would look like, choose failure-revealing camera views and state a falsifiable root-cause hypothesis. Record these briefly using existing project notes and capture tools.

Implement a focused change, render it under matched conditions, and genuinely inspect moving imagery or sufficiently dense frame sequences. Describe what is visible **before** grading it against the stated target. For each revealing view, identify what is PRESENT, ABSENT, PARTIAL or NOT INSPECTED, explain the remaining defects, and name the strongest likely objection from an owner reviewing the footage. If visual inspection is not possible, mark it **VISUAL UNVERIFIED**. Numerical tests, changed pixels and compiled shaders cannot establish aesthetic success.

If the result is unconvincing, investigate the underlying cause across wave data, geometry, timing, optics, shading, lighting and dependent systems. Use focused research to resolve real uncertainties. When evidence shows that a representation cannot meet the goal through incremental improvements, redesign the **bounded subsystem** with a clear technical rationale and integration plan. Then implement and inspect again. Avoid repeated cosmetic tweaks, speculative rewrites and unnecessary QA cycles.

Use targeted numerical and GPU checks during development. Save broader high-resolution capture sets and performance studies for meaningful integrated checkpoints. Maintain the existing custom renderer and native desktop-Chrome WebGPU architecture; there is no WebGL fallback or engine migration.

## Continuity and completion

Keep a concise, durable checkpoint containing source commit(s), verified visual changes, relevant capture paths/timecodes, important regressions, unresolved defects and exact next actions. Update it before lengthy operations and session completion, so development can resume without repeating earlier work.

Show the status of **all six workstreams** in each substantive checkpoint. If an area receives no source work in a session, identify it as **deprioritized (not started this session)** and explain the next intended action; reserve **blocked** for an actual demonstrated dependency or limitation. Unresolved high-priority issues remain visible even when work advances elsewhere.

Continue the authorized combined A+B programme through substantive, connected implementations rather than ending after one isolated experiment. An unsuccessful prototype remains experimental; a justified limitation remains documented, not falsely completed. **I retain final visual acceptance authority for B1, B2 and combined A+B.** Do not enter Milestone C or promote a release.

Start with the verified local renderer state, its highest-impact water defects and the reference evidence needed to solve them. Prioritize meaningful improvements to the **actual moving ocean and its environment**, preserving correctness, visual quality and development continuity.
