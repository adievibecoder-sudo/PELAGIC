# PELAGIC 0.4 — Performance and VRAM Budget Contract (Initial, Unverified)

**Purpose:** Make increased visual fidelity and efficient real-time execution an engineering design problem rather than an end-of-project conflict. These numerical ceilings are **provisional planning allocations**, NOT demonstrated 0.4 performance, device promises, or permission to omit important phenomena.

## Hardware and evidence

Primary user validation target: desktop Chrome native WebGPU on user's RTX 3050 Laptop GPU (4 GB dedicated VRAM). Phase 0 corroborates this local adapter through application NVIDIA/Ampere records, OS device diagnostics, owner same-session chrome://gpu text and executed compute/renderer tests. No original internal-page screenshot/export is available. Headless Chrome, VM timings or `adapter.info.isFallbackAdapter === false` alone cannot close that gate. See `V04-PHASE0-REPORT.md` for evidence and limitations.

Published 0.3 1080p evidence: Golden Balanced 22.83 FPS, Golden High 9.85 FPS; Storm Balanced 32.24 FPS and Storm High 18.59 FPS. Golden Balanced reported median GPU sim / atmosphere / surface / post ≈ 1.77 / 20.64 / 19.99 / 0.39 ms. These are not all pass costs and do not sum to reciprocal mean FPS.

## Provisional 1080p target envelopes

| Category | Balanced *planning* | High *planning* | Measurement |
|---|---:|---:|---|
| FFT, wave/foam state and shared compute | ≤2.0 ms | ≤2.5 ms | GPU timestamp passes |
| Atmospheric/cloud density and lighting | ≤4.5 ms | ≤11.0 ms | Individual GPU subpasses |
| Ocean geometry/surface optics/reflections | ≤5.5 ms | ≤12.0 ms | GPU timestamps + fragment counts |
| Transparent phenomena: foam overlays, rain, spray, lightning | ≤1.0 ms | ≤2.0 ms | GPU timestamps |
| Final compositing / colour / post | ≤0.8 ms | ≤1.0 ms | GPU timestamps |
| Amortized env updates, common visibility, miscellaneous GPU | ≤0.2 ms | ≤1.5 ms | Dispatchs and GPU timestamps |
| **Indicative GPU total** | **≤14.0 ms** | **≤30.0 ms** | Do not sum per-pass medians for FPS |
| Indicative CPU/browser/presentation headroom | ~2.67 ms | ~3.33 ms | Wall-clock frame intervals |
| **Frame-period goal** | **≤16.67 ms (~60 FPS)** | **≤33.33 ms (~30 FPS)** | Display-paced measurements |

**Important:** These are initial constraint envelopes for investigating representations; 0.3 is far outside several allocations. Renegotiate only using actual measured quality/cost and user-authorized trade-offs. No intentional realism reductions, no benchmark-only scene, and no false promises.

**Cinematic:** Quality-first still/video rendering. No fixed interactive FPS requirement. Preserve extraordinary detail where feasible and report per-frame GPU time, memory peak, capture duration, rendering accuracy and actual output quality. Ultra/High may be separate tiers where measured; document the exact visual differences.

## Memory accounting

- Enumerate formats, dimensions, layers, mips, MSAA and copies for all textures; wave FFT buffers, cloud weather/noise volumes, radiance caches, particles/events, staging, transient attachments and browser overhead.
- Record app-controlled allocated bytes and memory peaks with explicit distinction from *physical resident VRAM*; WebGPU may not expose a trustworthy physical VRAM-usage API.
- Initial **planning envelope ~3 GiB of app-managed GPU resources** on a 4 GB device to leave potential headroom; this is not verified physical VRAM or an arbitrary limit on quality-first Cinematic. The accurate safe envelope must be calibrated from device behaviour and allocation/error evidence.
- Track resource lifetimes; avoid unbounded allocation growth or quality-switch leaks; test resize, dynamic presets and device loss.

## Protocol and acceptance

1. Record commit SHA, exact browser/OS/driver, `navigator.gpu` adapter/limits, power mode, display Hz, page visibility, GPU flags, resolution, quality, scene seed, weather/time, camera.
2. Warm up; record sustained forward-frame intervals, p50/p95/p99/max, 1% low, GPU pass timings and CPU scheduling. Note thermals/power changes where visible; don't guess.
3. Compare current implementation with saved baseline **at matched visual output** and 0.3 settings; report separately speed and visual difference.
4. Test representative daylight broken clouds, low-sun, clear sea, fully overcast, storm/rain, lightning, waterline and distant views, including transitions.
5. Count fragment invocations / overdraw before prescribing projected-grid/CDLOD changes. Probe cloud cost/ghosting before committing temporal reuse. Profile env-cube work, reflection traversal and post.
6. If hardware cannot be run by Astra, supply user with copy-ready commands and evidence-upload requirements. Keep hardware result UNVERIFIED.
7. Never claim a gate PASSED merely because the image is low-resolution, effects are disabled, quality-tier settings are silently reduced, or captured offline at slow speed.

## Decision gate

At Phase 0 exit, publish measured bottlenecks and a revised, justified per-subsystem budget. If a target conflicts with required visual quality, present quantified options and solicit the owner's decision rather than silently compromising.

## Phase 0 measurement and allocation revision

Fresh 1080p/adaptive-off desktop runs: golden Balanced 22.90 FPS, historical storm view Balanced 32.28, alternate storm view 17.17, golden High with split instrumentation 8.22. First 30 frames excluded. Golden High reaches the 120-second cap; other runs reach 1800 frames. Visible-document records contain approximately one-second stalls. Other owner GPU applications were not closed, so no isolated-machine or endurance claim is made.

Current timestamps group effects differently from planning rows. Revised ownership for comparisons: atmosphere includes environment/irradiance updates; surface includes transparent particles. Compare their combined envelopes, not a falsely narrow category:

| Measured scope | Golden Balanced median | Comparable provisional envelope | Interpretation |
|---|---:|---:|---|
| Simulation/shared compute | 1.507 ms | 2.0 ms | Inside this one-view median allocation; storm/endurance still separate |
| Atmosphere + common environment | 20.775 ms | 4.7 ms | About 4.4 times envelope; prioritize representation and environment update work |
| Surface + transparent effects | 19.726 ms | 6.5 ms | About 3.0 times envelope; measure grazing overdraw and reflection traversal before choosing geometry changes |
| Post/compositing | 0.393 ms | 0.8 ms | Not the primary observed bottleneck |

High cloud-screen/environment medians alone are 42.697/17.170 ms, exceeding the combined 12.5 ms atmosphere/environment target before remaining work. These timings use split passes; overhead is not calibrated. Midday cloud prototypes cost 4.915/3.670 ms versus 15.335 ms baseline, but fail morphology and alter optical depth. **Their speed does not validate those budgets at acceptable quality.** No evidence supports a new quality-equivalent numerical ceiling; retain the target envelopes and mark feasibility UNVERIFIED instead of relaxing them without evidence.

Board CSV: 2872 complete samples, one truncated final row discarded, 20:35:43-21:23:56 local. Range 42-87 C, 433-1151 MiB, 3.13-75.62 W, graphics 210-1972 MHz. Includes idle/other work; neither app residency nor proof of thermal throttling. Main render-target lower bounds: 117.77 MiB Balanced / 119.97 MiB High. Full resource ledger, measured overdraw, sustained isolation and stall attribution remain UNVERIFIED. Machine-readable summary: `evidence/v04-p0-review/metrics.json`.
