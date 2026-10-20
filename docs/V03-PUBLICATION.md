# PELAGIC 0.3 development publication

Rendering/source checkpoint: `be3f5c47d923e90303dece20ed19dbfc4bb17636`, annotated tag `v0.3.0-dev.1`. This is an immutable prerelease, **not** a completed visual-quality release. Acceptance remains FAIL; see `V03-EVALUATION.md`.

Release: https://github.com/adievibecoder-sudo/PELAGIC/releases/tag/v0.3.0-dev.1

Published content:

- Git source: 297 tracked files, including shaders, tests, research, licenses, configuration, stage/evaluation reports and evidence tools.
- `pelagic-0.3-dev.1-evidence.zip`: 821 new evidence files, 1,486,565,931 bytes. SHA-256 `402a635b09fd9b3579972aebc269ca2bdbf7c7dfdc8e77a71b17d1226653be03`.
- Checksum sidecar, complete source-history bundle, fresh-clone verification JSON.
- Preserved historical evidence remains retrievable from immutable `v0.2.0`; the development restoration tool fetches and verifies both archives.

Checks performed:

- Fresh GitHub tag clone: all 297 tracked files byte-identical to the publication checkout.
- CPU 23/23 PASS; native NVIDIA/Ampere GPU FFT 9/9 PASS; optical/precision contract suite PASS.
- Fresh-clone golden 1920x1080 capture exactly matches the development checkpoint pixels, with passing HDR/spectral checks.
- Restoration verifies 320 baseline evidence files and 821 new files; it refuses changed local content. Gallery/report/image/video HTTP responses verified in the restored clone.
- All four draft release assets downloaded fully and checked against local byte counts and SHA-256 before publication.

The source tag is immutable. This publication record follows the tagged checkpoint; it changes no rendering code or recorded evidence. `main` and `v0.2.0` remain at `151aadaa6d2402c46f4e02454f2fc33ab7744661` (annotated baseline tag object `fa746ea52e6a98b07d863a61769f8ced58d02300`). Future development continues on `development/pelagic-0.3` without moving either release tag.

Anonymous public verification: **PASS**. All four published assets were downloaded in full without authentication; byte counts and SHA-256 match. GitHub reports `draft:false`, `immutable:true`, `prerelease:true`. This verifies availability/integrity, not visual acceptance.
