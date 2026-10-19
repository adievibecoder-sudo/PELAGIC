# PELAGIC

An open-ocean research renderer built directly on native WebGPU. MIT licensed.

**PELAGIC 0.2 is the preserved research baseline, not an accepted AAA/VFX photorealism result.** The [technical report](../docs/TECHNICAL-REPORT.md) records numerical passes, measured hardware results and visual failures separately. Development continues on `development/pelagic-0.3` after publication verification.

## Run

Node.js 20+, current desktop Chrome or Edge, hardware acceleration and a WebGPU-capable GPU. No package installation or build step.

```sh
npm start
```

Open `http://127.0.0.1:8080/`. Run `npm test` for CPU checks; `/tests.html` and `/dynamics.html` exercise the actual GPU. See the [original 0.2 README](../README.md) for controls and reproduction details.

## Complete 0.2 baseline

[Release v0.2.0](https://github.com/adievibecoder-sudo/PELAGIC/releases/tag/v0.2.0) contains the original complete archive, source-history bundle and checksums. The archive includes all 376 manifest files: source, WGSL shader modules, tests, configuration, licenses, research, 148 PNGs, 16 continuous WebM recordings and JSON evidence. The evidence is approximately 787 MB uncompressed. Media live in release assets to keep source clones lightweight; no external runtime assets are required.

After checking out `v0.2.0`, restore evidence with Python 3.11+:

```sh
python publication/restore-evidence.py
python publication/restore-evidence.py --verify
```

The command downloads the pinned archive, verifies its SHA-256, verifies each evidence file and restores missing evidence only. Existing files with different bytes cause an error. `/gallery.html` then opens the local evidence gallery. Alternatively extract the complete release ZIP into a separate directory; it is the byte-for-byte original project and can use its strict `node scripts/release-manifest.mjs --verify` check.

The original source checkpoint is `33acb4bb2bc553d721a5a17fff7c5098c124e522`. Publication adds `.gitattributes`, this landing page, `publication/`, the original manifest and evidence metadata. It does not alter the original 0.2 manifest files. The publication verifier checks all original manifest entries while permitting these declared publication additions. The original strict verifier intentionally rejects additional publication files.

## Attribution

Substantially modified derivative of [Noniv/web-ocean](https://github.com/Noniv/web-ocean), commit `a07c7fd522ef0a897601c114f927a49d93d95520`, Copyright 2026 Maksymilian Dendura, MIT. See [LICENSE](../LICENSE), [THIRD-PARTY-LICENSE.txt](../THIRD-PARTY-LICENSE.txt), [bibliography](../docs/BIBLIOGRAPHY.md), and [research](../docs/PHYSICS-RESEARCH.md). No third-party ocean photographs or footage are redistributed.
