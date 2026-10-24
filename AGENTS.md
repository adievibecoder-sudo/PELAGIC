# PELAGIC 0.4 — Astra operating rules (proposed 24 Oct 2026 A+B handoff)

**Status:** This file is staged on a docs-only handoff branch. It does not itself authorize starting rendering work. The owner previously approved *combined Milestones A+B* as the intended development scope; await the owner's next explicit kickoff before resuming it. **Milestone C, release, and architecture migration remain separately gated.**

## Session start — protect local work
1. Inspect the actual **local** branch, status, HEAD, untracked files and evidence before changing anything. The public development branch was at `d4f7d80` when this handoff was prepared; Astra separately reported **local, unpublished `c4185ea`**, CPU 44/44, GPU FFT 9/9, optics 5/5, and interrupted evidence packaging. This local state was **not independently inspected**. Never assume the remote is more current.
2. Do not reset, clean, overwrite, amend, rebase, checkout over, delete, or replace unexplained local work/evidence. Do not silently cherry-pick this docs branch into an occupied workspace. Compare, preserve and reconcile it deliberately; resolve conflicts with the owner if necessary.
3. Read `docs/V04-AB-RESEARCH-AND-WORKFLOW-HANDOFF-2026-10-24.md`, the Part II synthesis and local integration guide; consult historical Phase 0/1/A reports only for relevant evidence. Older Phase 1-only / Milestone A-only instructions are historical, not the latest owner's intended A+B scope.

## Mission and boundaries
- Deliver a **demonstrably more naturalistic, visually extraordinary, scientifically defensible, stable native-WebGPU ocean**; primary craft/motion reference *Sea of Thieves*, additional *Crimson Desert*, *Horizon Forbidden West*, *Skull and Bones*, supplied demonstration and real-ocean footage. Real footage is the physics reference. No guaranteed AAA parity.
- Preserve the working custom **JavaScript ES Modules + raw WGSL + native WebGPU** stack. **No WebGL fallback, Three.js migration, unrelated engine rewrite, or full open-ocean fluid solver** without a new owner decision.
- Maintain validated FFT, derivative/slope-covariance filtering, Fresnel, atmosphere LUTs, environment state, original evidence, and frozen refs; reconstruction of *visually inadequate representations* is allowed when grounded and reversible. Do not confuse a passing test with visual acceptance.
- Combined A+B means **physically coupled, reviewable visual goals**, not doing all systems at once. A: waves, normals/BRDF, water lighting, clouds, image formation, performance. B: localized breaking, aeration, evolving foam, spray, wind/rain/storm coherence. **C stays traceable:** waterline/underwater, final endurance, integration, acceptance.

## Implementation-led loop
1. Pick a specific dominant visible defect and a credible cause from *verified local code* and prior research.
2. Make a **substantive but bounded, feature-flagged renderer improvement**. Multiple physically coupled components may change together for one visual goal.
3. Inspect a locked baseline/candidate scene and continuous motion immediately. Refine/revert and choose a materially different candidate after failure; do **not** stop to write another full failed-experiment report after every attempt.
4. Use fast physical/finite/energy and relevant regression checks as guards; record GPU time and frame pacing when relevant. Capture a compact set of original high-resolution stills, one motion clip, an actual RTX 3050 profile and a short decision note **at meaningful checkpoints**. Extra evidence only for concrete risks, not by habit.
5. Never claim unseen visual reviews, measured fps, observational calibration, or source access. Keep [SRC]/[TEST]/[VIS]/[LIT]/[HYP]/[UNVERIFIED] distinctions. User is final visual reviewer. No autonomous release/next-milestone promotion.

## Execution priorities
- First owner-approved work: resolve metallic/glossy wrinkled sea through **actual code** (wave form vs slope filtering, reflection/glint statistics, height/path/normal-dependent body light) using narrow E1/E2/E3 only if needed.
- Next: couple realistic cloud morphology + extinction + scattering + ambient occlusion; spatial wind/roughness variation + slicks; breaking-event → foam/bubbles/spray; coherent weather. Selectively add TAA/reprojection and practical visual-comparison tooling where they unlock a measured gain; **do not turn S0 into another infrastructure-only delay**.
- No mandatory one-hour limits, fixed 70/20/10 quotas, compulsory full QA after every tweak, invented FPS targets or blind shader coefficient copying. Prefer efficiency through meaningful implementation rather than skipping correctness.
