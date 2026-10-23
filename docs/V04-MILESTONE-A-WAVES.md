# Milestone A continuation: wave geometry, normals and roughness

23 October 2026. Owner-authorized continuation; A incomplete, B/C not authorized.

## Recovered state

Local and remote `development/pelagic-0.4` begin at `d4f7d806ffc5cb6ffc88e9aa9637edbfe3b5d574`. Main, 0.3 and release refs match the recorded frozen SHAs. Nine old final-stills modifications remain untouched; 24 current files match the preserved copies. Existing cloud trials remain opt-in and rejected as default replacements. W1-R1, E1-E6 and MA-C1/C2/W1/O1/P1/P2/R1 remain open within their recorded scopes.

Source/state/acceptance/phase-gate/master brief and relevant targeted R&D F/H read. Prior density-only failures, the correct Gaussian-group finding, existing moment filtering and finite-disc glitter are retained. No repeat of those experiments is proposed.

## First falsifiable visual hypothesis

- Observation (VIS): the preserved 1920x1080 elevated daylight image has weak broad-wave relief beneath dense, bright, wrinkled reflected detail; near-surface and low-Sun cases remain required controls.
- Suspected layers (HYP): mesh displacement filtering, shader-normal bandwidth and unresolved slope covariance may allocate wave structure inconsistently. Environmental radiance and sparse long modes may remain independent contributors.
- Smallest experiment: retain identical displaced vertices and simulation; compare neutral lighting from the actual rasterized facet normal against the production filtered normal, then inspect their angular difference, slope covariance and existing body/reflection/glitter outputs. Keep all four established scene settings and record exact source hashes. Angular difference includes intentional sub-mesh detail; it is NOT by itself a derivative-error test.
- Expected discrimination: coherent large forms in neutral geometry but wrinkles in neutral shader normals implicate detail allocation; weak forms in both implicate spectral/geometry structure. Brightness differences appearing only in the full material implicate optics/environment. No claim that stronger smoothing is physically correct without conserving slope energy.
- Risks: triangle facets in geometry diagnostics, tone-map contrast and uncalibrated neutral illumination can bias judgment. Diagnostics are observation tools, not candidate production materials or proof of naturalism.

## Baseline and constraints

Fresh unchanged-source captures use exclusive `v04-ma-wave-base-*` directories. Daylight/low-Sun, 2/50 m, seed1307, t20 plus100 fixed1/60 s steps, 1920x1080 Balanced, fixed exposures0.95/1.3, moderate wind/swell, weather/sea rates1, adaptive off. Baseline CPU35 PASS; fresh application adapter NVIDIA/Ampere. Exact RTX3050 renderer-process corroboration, new motion and display-paced profiles still pending.

Sandbox worker creation failed before CPU tests ran; approved host run passed. Source server also exited when sandbox blocked its Git child process; approved host server restored source attestation. These are execution-environment failures, not GPU correctness failures. Existing iframe batch capture stalls after its first navigation; use direct navigation to uncaptured cases, preserve originals.

This is a live experiment log. It does not certify A or replace the immutable first-cloud checkpoint report.
