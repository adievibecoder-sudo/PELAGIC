# Combined A+B development - 24 October 2026

## Recovered working state

The previously unpublished checkpoint was found locally, not reconstructed from GitHub. Original checkout: `C:/Users/adity/Documents/Codex/2026-10-18/build-an-extraordinary-real-time-3d/outputs/pelagic-github`. HEAD `c4185ea0acdf6e57899da04098889dba9200302b`, branch `development/pelagic-0.4`, 20 commits ahead of published `d4f7d806ffc5cb6ffc88e9aa9637edbfe3b5d574`.

All 2,926 files (7,065,996,765 bytes), including Git objects, LFS objects, ignored evidence and nine historical modified files, were copied to `C:/Users/adity/Documents/PELAGIC` and individually SHA-256 verified: zero mismatches. `evidence/v04-ab-recovery-20261024/repository-copy.json` records the transfer before integration. Original checkout remains untouched. The prior continuation session's work/outputs (390 files, including both packages and analysis scripts) were additionally copied under `evidence/v04-ab-recovery-20261024/prior-session`; package completion is not implied by copying.

GitHub connection and development HEAD independently verified. Draft PR #1 head `71d8b025d1f47ceb277f1af1536f36e6fd4a8730` fetched without switching/resetting. Four new handoff documents imported exactly; active operating rules reconciled with the owner's explicit kickoff. Original local AGENTS preserved verbatim. Historical acceptance failures remain open.

RTX 3050 Laptop GPU, 4 GiB, driver 617.14 is visible through nvidia-smi. Fresh browser adapter/cost evidence remains required; historical test totals are not new tests.

## Active visual objective

Correct metallic, excessively wrinkled water through a bounded source-supported optical/scale intervention. Prior work already rejected wider filtering, covariance-strain removal and denser geometry as sufficient appearance fixes. Preserve those exclusions. Evaluate directional reflection and reflected/body radiance against actual source before changing physical coefficients.

Owner authorizes combined A+B implementation. Substantial integrated visual checkpoints, B1 and B2 require owner review. C and final release remain separately gated. No visual acceptance has occurred.

## First implementation sprint

Native shader candidates now exist for an advected, energy-neutral short-wave wind field (`maRoughness=wind`), refracted direct single scattering (`maWater=single-scatter`), finite-population solar glitter (`maGlints=finite`), Beer-weighted cloud scattering positions (`maCloudTransport=centroid`), and column-based diffuse cloud illumination (`maAmbient=column`). The existing `p0Desat=off` comparison removes redundant highlight desaturation before AgX. All are reversible; no release or owner acceptance is implied.

Finite glitter visibly replaces broad silver patches with discrete sunlight in elevated daylight. Its correlation area is a spectral-moment closure, not a measured microfacet population. Revision 01 biased near-water radiance by conditioning its rank on the filtered normal; revision 02 exposed interpolation bias and a bright resolved/unresolved transition. Revision 04 uses raw displaced-phase Gaussian texels and a one-cell lower bound. Rare events still create substantial frame-to-frame radiance variance; temporal/observational acceptance remains open. Original iterations are retained under `evidence/v04-ma-ab-*`.

The wind field preserves expected squared amplitude and propagates its product-rule gradient through geometry, normals, foam and surface queries. Direct water scattering did not solve metallic appearance; keep it experimental. The cloud collision correction avoids evaluating lighting at an empty midpoint of occupied subsegments. Column ambient did not fix morphology/rims and cost about 3.4 ms extra screen-cloud work in one short capture; rejected for adoption. Cloud reconstruction, integrated breaking/whitewater and weather remain unfinished.

Fresh CPU suite: 49 PASS. Original 1080p stills and a 24-second continuous pan exist. Sustained profiling and final GPU regressions are pending at this source checkpoint. These are development observations, not completed A+B acceptance.
