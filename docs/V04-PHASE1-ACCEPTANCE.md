# Phase 1 acceptance register - interim, 22 October 2026

Phase 1 is NOT complete. No approval of Phases 2+3 is requested or implied. SRC = inspected source; TEST = executed test; VIS = observed render; HYP = hypothesis. Owner visual acceptance remains pending. Retain all inherited W1-R1 and E1-E6 failures.

| Gate | Status | Evidence and remaining requirement |
|---|---|---|
| S1 natural weather evolution | UNVERIFIED overall; SRC/TEST partial | Deterministic fixed-location replay and preserved swell tests pass. Preliminary 20 s recording exists at 942362f. Final recording, continuous playback inspection and foam-history observation remain pending. Prescribed scenario, not a meteorological solver. |
| S2 instant preview | UNVERIFIED overall; TEST partial | Explicit immediate state command passes CPU test. Preliminary video exists. Browser controls and restore/share workflow remain untested this phase. |
| S3 regional front/rebasing | UNVERIFIED overall; TEST partial | CPU continuity/range/rebasing tests pass. Four GPU batches passed at 237c1a3; rerun required after full-width correction. Preliminary 25 km flight recording exists at 942362f. |
| L1 direct/diffuse lighting | UNVERIFIED overall; TEST/VIS partial | Clear direct transmittance 1; covered centre 0.00127983 in initial and later b6349d3-labelled captures. Underwater covered view darkens visibly. Later stills' browser host is unknown; no isolated veil-only A/B or final motion proof. |
| L2 directional reflection motion | UNVERIFIED | Angular cache/reflection diagnostic implemented. Preliminary moving-weather captures are not proof of localized directional cloud crossing. Requires dedicated motion review. |
| L3 day/night/underwater relationship | UNVERIFIED overall; VIS partial | Twelve initial and twelve later b6349d3-labelled 1080p pairs exist. Later originals inspected with provenance limits. Surface changes are very small; underwater light correction is visible. No overall photographic-quality claim. |
| L4 zero-cloud/nonrecursive cache | UNVERIFIED overall; SRC/TEST partial | Feedback path removed. Clear control mean absolute RGB difference 0.00198045/255 from baseline. Cache publication uses a frozen six-face snapshot. Time-series boundedness and latency assessment remain pending. |
| N1 numerical foundation | PASS CPU / UNVERIFIED final GPU | All 32 CPU tests passed at b6349d3 on 22 October. Nine retained FFT checks, five optical groups and regional GPU checks must run on final source. Prior Phase 0 GPU passes remain historical evidence. |
| V1 matched originals/motion | UNVERIFIED | 12 initial still pairs, five baseline and five initial upgraded movies. Ten originals decoded without errors; extracted frames reviewed selectively. Later set: 12/12 stills inspected, exact browser host unknown, static poses match but weatherRate differs and one camera speed differs. Final videos: 0/5. Continuous playback inspection pending. |
| P1 sustained performance | UNVERIFIED | No Phase 1 sustained benchmark suite yet. Allocation ledger is requested payload bytes, not measured VRAM residency. Historical FPS is not upgraded-renderer performance. |
| P2 one-second stalls | FAIL inherited / cause UNVERIFIED | Query/probe toggle and browser-task instrumentation prepared. Controlled ablations and browser trace not collected. Server-output blocking remains an untested hypothesis. |

## Runtime interruption

On 22 October, desktop Computer Use returned: "could not determine the current browser URL on Windows with enough confidence to enforce policy" and stopped for the turn. No further UI automation attempted. CPU tests, local archival checks and evidence-analysis preparation continued. This is not a GPU failure or evidence of absent RTX hardware.

## Preservation and traceability

`node tests/phase1-inventory.mjs` verified all 138 Phase 0 evidence entries against their existing manifest, zero mismatches. Four local frozen refs match recorded SHAs. Seventy Phase 1 original media/report files are inventoried; supplied revision labels resolve to real commits but are not independent contemporaneous source attestations. Remote publication remains pending.

Current review: `/phase1-review.html` is explicitly preliminary. Numerical agreement, successful decoding and archive integrity do not establish visual acceptance.

Later same-day owner instruction: inspect twelve newly appeared captures without overwriting. They were preserved and individually inspected; see `V04-PHASE1-VISUAL-REVIEW.md` and `v04-p1-provenance-review`. The earlier 70-file inventory and 1/12 completeness report are historical checkpoint records, not current completeness claims. Browser automation stopped again at URL verification. No new agent-initiated GPU regression or benchmark run occurred.
