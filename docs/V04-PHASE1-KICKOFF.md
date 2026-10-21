# PELAGIC 0.4 — Phase 1 ONLY: Environment and Radiance Execution Brief

**Owner authorization:** 21 Oct 2026 • **Branch:** `development/pelagic-0.4` • **Published Phase 0:** `853b23f9527af8470c644e4b3b7d238784bbab9f`.
**No Phase 2+ approval.** Phase 0 is accepted as a research checkpoint, **not** as visual/numerical closure of remaining failures.

## Mission

Create the **minimum coherent environmental-state and astronomical/lighting contracts** and connect them to existing clouds, sky, ocean, rain-eligibility, foam/swell history and underwater rendering so weather/time changes produce **real correlated behaviour**. Prove this with visible original images/motion, numerical diagnostics and RTX 3050 profiling. Preserve six-cascade FFT, baseline cloud-density integrator, breaking, optics and waterline except small reversible Phase 1 integration/probe edits.

**Do not implement:** full 3D meteorology/NWP, cloud-morphology replacement (Phase 2), complete rain shafts/thunderbolts (Phase 3), off-grid FFT modes (Phase 4), crest rollers (Phase 5), entire water-colour overhaul (Phase 6), geometric waterline reconstruction (Phase 7), app engine migration/large render framework. No unauthorized next-phase work.

## Read once, then execute

`AGENTS.md` → `docs/V04-STATE.md` → full master brief → Phase 0 report and acceptance → this file → source code actually consuming weather/light → targeted R&D report **A–C, J, M–N** and the compact AAA decisions. The research report is at `docs/research/PELAGIC_V04_TARGETED_RD_2026-10-21.md`. Literature proposals remain HYP until tested; code/tests from Phase 0 take precedence.

## Deliverable A — authoritative world-anchored weather state

- Single owner for **current/target** and deterministic evolution; maintain seeds, histories and separate **astronomy, weather, wave and exposure times**.
- Represent minimal spatially varying regional **cloud coverage/type/precipitation eligibility, wind U10 vector/gust, aerosol/visibility, convection/front identifier**, plus correct cloud layer metadata and independently persistent **wind sea vs remote swell**.
- Validate units, finite values, coordinate transforms, valid ranges, interpolation, origin rebasing, ownership and consumers. Reuse existing code. Do not add fields that fail to change a required observable.
- Start with a cheap regional 2D map/sparse event representation **if** a small experiment justifies it. Research's 64 km / 256² / 0.5–2 Hz design is a **candidate**, not prescribed or calibrated truth.
- Support distinct **natural evolution** (consistent regional fronts; old swell/FFT phases and foam not arbitrarily reset) and **instant preview** (explicit coherent preset jump, not fake meteorology).
- Rain precipitation support must follow cloud state; lightning eligibility must follow **electrically active convection**, not every dark gale. Only the interfaces are required now.

## Deliverable B — unidirectional scene-linear lighting contract

Distinguish:
1. **Radiance:** directional sky/cloud source for ocean reflection.
2. **Irradiance:** integrated sky light for water body, foam and underwater approximation.
3. **Transmittance:** atmospheric/cloud/shadow attenuation, not an extra brightness source.
4. **Exposure:** display response only, not physical weather.

One direction: Sun/Moon/astronomy → clear atmosphere LUT → cloud attenuation/scattering and cloud-aware sky summaries → versioned environmental-light state → ocean surface/body, foam, rain/haze, underwater → post/exposure/output.

Implement actual **cloud-aware direct and diffuse sky** for existing water/underwater, plus an adequate **angular reflected sky** representation; version light cache by weather/astronomy/origin/timestamp. Avoid duplicated energy or “one frame delay is stable” assumptions. Retain relative radiometric scale if no absolute calibration, and state clearly what remains uncalibrated.

Start with the **smallest visually convincing integration**, not a full-resolution dynamic cubemap or costly volumetric framework. Demonstrate the ocean changes directionally as cloud positions and lighting change, not simply a preset gray tint.

## Mandatory Phase 1 experiments and evidence

| ID | Required scenario | Essential proof |
|---|---|---|
| S1 | Clear → broken cloud → overcast → squall → clearing (physical evolution) | Regional state and shadows change; precipitation eligibility coherent; old sea phases/foam do not reset |
| S2 | Same presets in instant-preview mode | Consistent state resets, explicitly not gradual meteorology |
| S3 | 10–30 km weather/rain front + camera moving/rebasing | World-space fields stable at same coordinates, rain/cloud support matches |
| L1 | Same sea/UTC/exposure, clear vs cloud-covered sun | Direct solar glint/cloud shade dims; diffuse response physically distinct |
| L2 | Localized dark cloud crosses reflected angular sky | Specular reflection moves **directionally**, not global scene tint |
| L3 | Clear / overcast / golden hour / storm / twilight or night | Coherent Sun/Moon, sky/water/underwater outputs, no light double-count |
| L4 | Zero cloud density → finite cloud density | Zero-cloud baseline near-identical; no self-brightening feedback, cache version consistent |
| N1 | Deterministic replay, time-step, phase/history and origin | CPU/GPU numerical tests, old 26 CPU + 9 FFT and optical groups still pass |
| V1 | Daylight broken clouds moderate sea + golden/overcast/storm controls | Matched full-resolution PNGs, original 10–30s moving WebMs, diagnostic layers and user assessment |
| P1 | Actual RTX 3050 GPU benchmark across baseline and altered weather | Pass-by-pass timings, p50/p95/p99, allocation byte ledger, visual-equivalent comparisons |
| P2 | Reproduced ~1 s stalls | Align rAF, JS, submit, GPU query, browser trace, visibility, yaw and readback toggles; cause remains UNVERIFIED without controlled proof |

Measure atmosphere, cloud screen, surface, transparent and shared-environment cache time separately. A faster but less realistic cloud screen is not an improvement; Phase 0 already rejected two such prototypes. Never convert tested CPU correctness into claims of completed photorealism.

## Workflow and reporting

1. Verify checkpoint/branch, map actual weather/light consumers and baseline captures; note unresolved W1–R1, E1–E6 from `V04-ACCEPTANCE.md`.
2. Write small observable hypotheses; implement only contracts/consumer corrections necessary for S1–L4. Reuse validated code, avoid duplicating global weather variables.
3. Test in focused loops: deterministic state → light units/energy → neutral/debug renders → integrated fixed-exposure video → genuine GPU profiling and 1s stall discrimination.
4. For each meaningful experiment report expected vs actual, units, source/commit, null/negative control, measured cost and remaining defect. Update STATE concisely, not a giant narrative on every minor iteration.
5. Before claiming a milestone, inspect **actual source images and motion** and compare suitable real-world references (provenance known/unknown); get owner visual review rather than grading yourself.
6. Deliver Phase 1 report, exact source/commands, original image/video pairs and evidence manifest, GPU/frame time/VRAM estimates, risk register, and **proposed** combined Phase 2+3 with a hold after cloud morphology.
7. **STOP after Phase 1 and wait for explicit user approval.** Fail/UNVERIFIED remain open even if owner approves continuation.

**Success means a visibly coupled and tested environmental foundation, not a fully rebuilt cloud/ocean.** No compromises to final 0.4 scope, but no premature implementation of later systems.
