# Milestone A continuation checkpoint - 23 October 2026

**A INCOMPLETE. Substantial appearance transformation NOT achieved. No owner acceptance requested or implied. B/C not started.** A continuation remains authorized; this is an engineering progress checkpoint, not the milestone acceptance package.

Recovered branch `development/pelagic-0.4` from local/remote `d4f7d806ffc5cb6ffc88e9aa9637edbfe3b5d574`. Final rendering source `9ac1461`; all new commits remain local. Remote development still `d4f7d806` at the final read-only check. Frozen main/0.3/peeled tags retain their recorded SHAs. Nine old final-stills modifications remain untouched and unstaged; preservation and source/evidence inventory are sealed separately.

## Adopted change

Near-first opaque ocean patch ordering only. Four reordered1080p PNGs are byte-identical to fresh baselines and the published first-checkpoint originals. Final default/no-experiment capture also matches. No spectral, optical, cloud or exposure change is adopted. No additional GPU allocation;229376 bytes CPU sorting scratch.

| Fixed scene | FPS, old / new | Surface GPU ms, old / new | Total GPU ms, old / new |
|---|---|---|---|
|Daylight2 m|21.62 /24.88|20.52 /14.38|46.17 /40.14|
|Daylight50 m|29.72 /29.89|12.70 /12.42|33.56 /33.35|
|Low Sun2 m|18.40 /25.21|24.18 /14.20|54.10 /39.64|
|Low Sun50 m|29.81 /30.10|12.68 /12.32|33.50 /33.19|

Native RTX3050 Laptop,1920x1080 Balanced, adaptation off,60 s display-paced profiles. Daylight-near reverse repeats corroborate about30% less surface work and16% higher FPS. Low-Sun baseline variation limits attribution. Elevated savings are small. Main eight runs plus two repeats contain zero recorded intervals>500 ms. CPU mean work rises roughly0.42 to0.52 ms. Active desktop/thermal variation remains;60 FPS target FAIL. Whole-board memory is not application residency. Raw p50/p95/p99/pass results: `evidence/v04-ma-wave-review-01/analysis.json`.

## Appearance investigations

- Geometry/normal/glitter isolation: real broad displacement exists; production normals add much finer detail; Sun glitter dominates elevated daylight's foil texture. No complete physical closure or naturalism PASS.
- Wider moment footprint and unstrained-covariance ablation: soften/change detail, retain glossy/wrinkled appearance. Rejected; opt-in diagnostics only.
- Finite cloud-light path: analytic integration checks pass, but occupied-probe low-Sun transmission error worsens. Rims/shapes persist. Rejected; opt-in only. `V04-MILESTONE-A-LIGHT-PATH.md`.
- Longer FFT domain: preserves expected spectral energy and reduces1103 m recurrence, but loses more reconstructed long-wave variance through interpolation. Four views retain the visual defect. Rejected; opt-in only. `V04-MILESTONE-A-LONG-GRID.md`.
- Cloud opacity/neutral-light controls retain flattened repeated silhouettes and distant bands. Initial diagnostic failures are disclosed in the light-path log; corrected originals are separate. No new cloud-density model is adopted.

## Verification and evidence

Final CPU40/40, GPU FFT9/9, optical5 groups PASS within existing tolerances; native NVIDIA/Ampere, GPU errors empty. `v04-ma-continuation-qa-01` includes raw logs and final no-experiment still. Numerical PASS never grants visual acceptance.

Four new24 s ordering originals in `v04-ma-order-motion-01`; published baseline motion reused from `v04-ma-base-motion-02`. Matching settings and static pixels justify the baseline, but recordings are not phase-aligned. All decode without errors, timestamps increase. Three initial playbacks have full presentation callbacks; low-Sun-elevated required a restored-window repeat (`v04-ma-wave-playback-02`). Complete browser playback and sampled visual inspection do not constitute exhaustive perceptual validation.

Two additional24 s originals document rejected light-path and long-grid trials. They decode without errors; neither has full four-view temporal acceptance. Source-stability and capture settings are in each JSON. Reproduction URLs and switches are documented in the individual logs. All new media use original PNG/VP9 bytes and exclusive paths; LFS stores repository media.

## Open requirements

MA-W1/O1/C1/C2/P1/P2/R1 remain open. Glossy fine detail, weak elevated organization, cloud morphology/rims/horizon integration, calibrated radiance/roughness closure, historical stall cause,60 FPS, application residency/endurance and full reference-motion validation remain FAIL/UNVERIFIED.

Sea of Thieves remains the primary craft benchmark; Crimson Desert, Horizon Forbidden West, Skull and Bones and real footage retain their existing source records. The supplied29.269 s clip's existing10 s/20 s frames were inspected; no new complete perceptual playback, calibrated camera/light match or AAA parity is claimed. Prior reference-player access limitations remain disclosed. Breaking/whitewater/spray/storm reconstruction belongs to separately gated B, not this work.

Next A work: resolve cloud occupied-interval/view-integration errors against a converged opacity control, then select a morphology representation based on that result. For waves, separate rendered reconstruction from spectral energy before any sparse-long-mode or band redistribution. Continue the material investigation with measured resolved/unresolved slope closure and matched off-Sun reference controls. Do not repeat the rejected footprint, covariance, naive long-domain or density-only experiments as presumed fixes.

Owner visual review remains mandatory once a substantial integrated transformation exists. This checkpoint does not reach that point.
