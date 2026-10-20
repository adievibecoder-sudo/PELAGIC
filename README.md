# PELAGIC 0.3 development

**0.4 Phase 0 branch:** investigation package only; production reconstruction awaits owner approval. Read the [Phase 0 assessment](docs/V04-PHASE0-REPORT.md), [current state](docs/V04-STATE.md), [acceptance register](docs/V04-ACCEPTANCE.md) and [reproduction guide](docs/V04-PHASE0-REPRODUCE.md). Run `git lfs pull`, then `npm start`; open `/phase0-review.html` for 22 original 1080p comparison stills and nine original motion recordings. Native RTX 3050 execution is corroborated; visual quality and performance remain FAIL. The preserved 0.3 description follows.

An open-ocean observatory built directly on native WebGPU. This branch develops 0.3 from the preserved 0.2 foundation: coherent short-wave modulation, integrated sky irradiance, wave visibility, fragmented whitewater, revised clouds, separate celestial lighting and camera-local coordinates. **Overall visual acceptance: FAIL.** Breaking geometry, cloud naturalism, immersion transitions, distant detail and performance remain substantial open work. Implemented mechanisms are not a claim of AAA photorealism.

Read [the integrated evaluation](docs/V03-EVALUATION.md), [acceptance register](docs/V03-ACCEPTANCE.md), and [stage/source-access record](docs/V03-STAGES.md). Open `/review-03.html` for paired original captures and continuous recordings after restoring evidence. The 48 primary comparison inputs match exactly; algorithms differ.

The complete immutable [0.2 baseline](https://github.com/adievibecoder-sudo/PELAGIC/releases/tag/v0.2.0) is on `main` and `v0.2.0`. It was publicly downloaded, hashed, restored, GPU-tested and pixel-compared before 0.3 changes. `development/pelagic-0.3` is separate. Historical 0.1/0.2 reports, licenses and evidence remain intact.

## Start

Requirements: Node.js 20+, current desktop Chrome or Edge, hardware acceleration, WebGPU-capable GPU. No package installation or build step. Open a terminal in this project folder, then run:

```powershell
npm start
```

Open http://127.0.0.1:8080/ . Use `node server.mjs 8090` to choose another port. Serve through HTTPS when hosting remotely. Opening index.html directly is unsupported because ES modules need HTTP. There is no WebGL fallback. Device/compilation failures appear on-screen.

## Explore

- Drag the canvas to look. Double-click captures the mouse; Escape releases it.
- W/A/S/D fly, E/Space ascend, Q/C descend, Shift accelerates, mouse wheel changes speed.
- H hides the entire interface; F opens controls; P pauses wave playback.
- Surface guard avoids casual immersion. Free flight allows waterline exploration; Dive positions the camera underwater.
- Six scenario buttons set developed conditions immediately. Wind and swell sliders change the target, approached with separate sea-development time constants. Apply developed sea skips this delay.
- Quality changes rebuild GPU resources through a configuration-preserving reload. Balanced/High target real time; Ultra/Cinematic increase detail and cloud sampling. Adaptive resolution is optional.
- Capture saves a canvas PNG at the actual render resolution. Record saves WebM. Save/Restore uses browser-local storage; JSON export/import is portable. Share copies a URL containing validated settings, camera and phase time. Foam and particle history are not serialized.

## Reproduce verification

```powershell
npm test
```

Open `/tests.html` for actual GPU FFT tests. Open `/matrix.html`, then Capture, for 48 prescribed environment/altitude/azimuth views plus underwater, waterline and close-wave captures. The local server writes evidence beneath `evidence/`. The matrix consumes significant GPU time and writes high-resolution PNGs.

Open `/dynamics.html` for production-kernel phase drift, manufactured foam transport, pause and decay tests. Open `/gallery.html` for retained screenshots, matched corrections and motion captures. `Start-Pelagic.cmd` is a Windows shortcut for starting the local server.

Open `/optics.html` for native-GPU irradiance, coherent modulation, wave visibility, near-plane classification and distant-coordinate contracts. `/review-03.html` is the current development gallery; `/gallery.html` preserves the historical 0.2 comparison. `python scripts/review-v03.py`, `python tests/inspect-motion.py evidence/v03-integrated`, and `python scripts/dense-motion-review.py` reproduce paired sheets, cadence checks and dense transition samples. These tools require Python/Pillow and FFmpeg, not runtime dependencies.

Open `/ensemble.html` for 64 independent initial spectra and a significant-height confidence interval. Run `node scripts/evidence-index.mjs` after new captures to refresh hashes and measured-result summaries.

Open `/motion.html` to record seven continuous 1080p scenarios. `/gallery.html` compares every final 0.2 view against its preserved 0.1 counterpart. `evidence/review/matched-inputs.json` checks identical inputs across all 48 pairs; changing the spectrum changes the realized waves despite identical seeds. The original Noniv reference comparison is separate and has explicitly different optical semantics.

Review-image generation optionally uses Python/Pillow and FFmpeg. These are evidence tools, never runtime dependencies. `scripts/review-evidence.py` expects the preserved sibling `pelagic` directory. Run `python scripts/motion-audit.py`, then `python scripts/motion-sheets.py` to reproduce decoded cadence/change measurements and labelled motion sheets. Raw PNGs and WebM recordings remain unmodified.

`RELEASE-MANIFEST.json` is the preserved **0.2** manifest; it intentionally does not validate changed development source. Verify it only in a 0.2 checkout. Development evidence is stored in a versioned release asset, outside ordinary Git. `python publication/restore-development-evidence.py` downloads and hash-checks it without overwriting different local bytes. Source history remains in Git. See `publication/pelagic-0.3-dev.1-assets.json` for the exact asset inventory.

Example deterministic still and numerical readback:

```text
http://127.0.0.1:8080/?preset=midday&seed=1307&cam=0,2,0,4,-5.5&cameraMode=free&w=1920&h=1080&t=20&frames=120&shot=midday-test.png&stage=v03-local&validate=1&ui=0
```

`shot` runs fixed 1/60 s simulation steps, waits for GPU completion, captures the requested frame, then stops. It measures uncapped GPU throughput rather than display-paced FPS. `video=name&motion=fly` records ten seconds of rendered motion after warmup. Evidence JSON stores settings, camera, shader errors, native adapter identity and individual GPU pass timings when timestamp queries are supported.

`benchmark=name&frames=1800&benchmarkSeconds=120&w=1920&h=1080&adaptive=0` records display-paced requestAnimationFrame timings. It stops at the frame count or bounded wall-clock duration and records the stop reason. Keep every other GPU renderer stopped. Browser visibility alone does not guarantee presentation: a 1 Hz scheduling stall recurred while the page reported visible. Thermal state, driver, display refresh and power mode affect results. Evidence distinguishes these runs from serialized screenshot throughput; no 60 FPS claim is made for this checkpoint.

## Source

- `src/renderer.js`: WebGPU resources, frame graph, camera, profiling and capture.
- `src/wgsl/sim.js`: spectra, six 256-square FFT cascades, slope moments, persistent foam.
- `src/wgsl/ocean.js`: CDLOD surface, dielectric optics and underwater interface.
- `src/wgsl/sky.js`, `clouds.js`: scattering LUTs, volumetric clouds and spatial shadows.
- `src/wgsl/particles.js`: GPU spray/rain transport and billboards.
- `src/settings.js`, `astronomy.js`, `ui.js`: configuration, Sun/Moon geometry and interface.
- `tests/`: independent transforms, integration, configuration checks and GPU readback.
- `docs/`: architecture, consulted sources, reference audit, limitations and measured results.

## Attribution

This is a substantially modified derivative of [Noniv/web-ocean](https://github.com/Noniv/web-ocean), commit `a07c7fd522ef0a897601c114f927a49d93d95520`, Copyright 2026 Maksymilian Dendura, MIT. Its workgroup FFT, CDLOD, atmosphere LUT and postprocess foundations are retained. See `THIRD-PARTY-LICENSE.txt`. Added modules and modifications are provided under MIT in `LICENSE`.

No external rendering assets, remote fonts or network services are required at runtime. NOAA imagery was consulted as a reference, not incorporated as an asset. Scientific sources and access limits are recorded in `docs/PHYSICS-RESEARCH.md` and `docs/BIBLIOGRAPHY.md`.

The immutable 0.2 complete archive includes its original source, tests, reports, evidence and SHA-256 manifest. The separate history bundles preserve source checkpoints, excluding ignored evidence; inspect them with `git bundle verify`. The 0.3 evidence archive contains every retained new stage, including rejected cloud experiments, raw videos and diagnostics. Its restoration script also retrieves the immutable 0.2 evidence required by paired galleries. `docs/V02-STAGES.md` and `docs/V03-STAGES.md` map checkpoints to evidence. The original-reference comparison can be reproduced by applying `docs/REFERENCE-HARNESS.patch` to the cited Noniv commit; its precise capture URL and limitations are in the stage record.
