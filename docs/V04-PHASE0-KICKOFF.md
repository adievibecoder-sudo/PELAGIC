# PELAGIC 0.4 — Phase 0 ONLY: Evidence, Feasibility and Visual Proof

**Authorization:** This is the sole currently authorized 0.4 phase. **Do not start Phase 1 or implement its production architecture.** Investigative, reversible prototypes required to make decisions are allowed *within Phase 0* on the 0.4 branch; do not merge a speculative prototype as a finished feature or rebrand old defects as fixed.

## Purpose

Convert the published 0.3 implementation, Hark research, GPT-5.5 corrections and the user's first-hand visual observations into a verifiable **0.4 implementation decision set**. Do not write another huge generic literature review. The immediate output must expose the structural defects, decide the most consequential unknowns efficiently and define what "actually looks real" means.

## Inputs (read in this order)

1. Root `AGENTS.md` and `docs/V04-STATE.md`; the full 0.4 master execution brief.
2. `docs/V03-ACCEPTANCE.md`, `docs/V03-EVALUATION.md`, `docs/V03-STAGES.md`, `docs/V03-BRIEF.md`.
3. `docs/V04-RESEARCH-INDEX.md` and available research extracts and correction ledger. Distinguish previous 0.2 compendium material from the later 0.3-grounded Hark report. If the actual original PDF, figure or source cannot be examined, mark **SOURCE UNAVAILABLE** and request it rather than guessing.
4. Relevant WGSL, JS, tests, device diagnostics, published photo/video comparisons and profiler traces.

## Concrete objectives and experiments

### 0A — reproduce and inventory

- Confirm branch/SHAs, exact 0.3 source and 0.3 video/image evidence integrity.
- Make a traceable defect matrix for W1 W2 L1 L2 B1 C1 U1 G1 A1 T1 R1 **plus** user-observed: fixed-looking clouds under weather changes, poor cloud silhouettes/location/size, weak rain, no appropriate storm lightning, artificial storm darkness, failed sunsets, missing day/night/weather cross-coupling, water that remains plasticky and monotonous, unusable controls or interface defects.
- Record visual evidence available and unavailable, condition/camera/source/frame, severity and confidence. User observations are valid defect reports; causal explanations remain hypotheses until tested.

### 0B — cloud/weather flagship proof

- In isolation views identify: lattice/repetition, cloud size and organization, integrated optical thickness, daylight/overcast/low-sun lighting, wind/cloud advection, rain-origin coherence, weather-transition continuity, GPU cost.
- Compare current cloud against at least two relevant reduced models using a representative daylight/broken-cloud/moderate-sea shot; evaluate morphology + shading separately. A weather-map-based prototype is a **candidate**, not mandatory adoption.
- Document credible storm families: overcast/rain squall vs convective lightning thunderstorm. Define necessary clouds → rain → Sun occlusion → sea reflection/visibility links.
- Demonstrate or specify reproducible 10–30 s native clips for transition continuity and morphological change. Use sunset, overcast and storm as immediate anti-overfit controls.

### 0C — wave structure and breaking

- Verify wind-speed measurement-height and fully developed sea validity, keeping wind sea distinct from remote swell.
- Repeat independent spectral-mode census with conjugate treatment and seeded realizations; quantify wave group statistics, periodicity and crest/skewness properties.
- Compare (small, controlled) enhanced-mode, group and short-wave modulation candidates before assigning production architecture.
- Probe whether a physically consistent crest-event and local roller geometry could generate foam/spray from actual events rather than a compression threshold. Test events statistically and visually; do not treat u/c≈0.85 as universal.

### 0D — optical, colour and waterline confounds

- Fixed-exposure A/B of highlight desaturation enabled/disabled and separated surface reflection/body/foam/sky terms.
- Evaluate 3-band coefficient refit before proposing a spectral LUT; check gamut and AgX transforms in the **actual** display pipeline.
- Diagnose waterline readback timing vs classifier limitations; maintain physically correct optical switching.
- Evaluate direct/diffuse cloud-aware environment lighting, angular radiance and any delayed-feedback stability.

### 0E — performance and browser reliability

- Re-run published 0.3 profiling protocol where possible, separating median individual GPU pass times from true display-paced FPS; record stalls, overdraw, cloud/visibility expense, VRAM and device state.
- Reconcile per-pass allocation with the preliminary envelope in `docs/V04-PERFORMANCE-BUDGETS.md`. These are negotiating budgets; refine from measurement, not speculation.
- Cinematic is **quality-first** and is not required to hit real-time budgets. Balanced/High must target genuine interactivity, with no false improvement from deleting phenomena.
- For any experiments only executable on the owner's local RTX 3050, provide **exact copy-ready commands**, URL/flags, duration, test seeds, expected JSON/PNG/WebM outputs, upload instructions and known PASS/FAIL checks. Mark GPU untested here as UNVERIFIED, never PASS.

### 0F — reference and acceptance design

- Build `docs/V04-REFERENCE-BOARD.md` into a real reference manifest, grounded in documented source photos/video. The initial slots are **not** purportedly verified photographs; fill provenance/camera/weather/exposure/licence explicitly.
- Match a **representative slice** (daylight, broken clouds, moderate wind sea) using geometry/sky/optics lookdev, with matching seed/camera and fixed exposure. This slice is a diagnostic vehicle, **not** a substitute for high-wind storm, sunset, cloudy night and immersion coverage.
- Define independent scientific, numerical, natural-motion, visual craftsmanship, real hardware, application and stability acceptance criteria. **User is final judge of perceptual/visual success.** Numerical tests and Astra's own aesthetic rating cannot substitute.

## Phase 0 deliverables — produce separately accessible artifacts

1. A concise but technically complete Phase 0 assessment and complete defect/traceability matrix.
2. Reviewed reference board: owner-visible real-world images/footage, accurate metadata where available, missing-source warnings and a controlled comparison plan.
3. Decision log: retain / correct / extend / reconstruct / defer, with evidence, competing approaches, integration/performance costs and smallest decisive experiment.
4. Experiment package: source changes/prototypes (if needed), reproducible commands, raw CPU/GPU results, numerical errors, full-resolution comparison images, representative original motion clips, manifest, hardware-unverified labels.
5. Proposed Phase 1 scope and acceptance criteria with dependency justification, updated budgets, and explicit engineering/visual risks. **Proposal only** — no Phase 1 production work.
6. Updated `docs/V04-STATE.md`; a prioritized list of exact commands the user can run locally on the RTX 3050.

## Exit contract

At the end of Phase 0, state separately: scientific/numerical status; observable improvement; physical/visual gaps; which experiments were not executable; and what remains undecided. **STOP. Request explicit user approval to enter Phase 1.** Never self-authorize the next phase; an owner's approval to continue does not transform FAIL/UNVERIFIED evidence.
