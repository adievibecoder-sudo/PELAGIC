# PELAGIC 0.2

An open-ocean observatory built directly on native WebGPU. Version 0.2 preserves the verified FFT foundation, separates remote swell from short wind waves, rebuilds optical covariance and breaking memory, filters volumetric clouds, and corrects underwater classification. This is a working research release, not an accepted AAA photorealism result. See `docs/TECHNICAL-REPORT.md` and the comparison gallery for both improvements and failed gates.

## Start

Requirements: Node.js 20+, current desktop Chrome or Edge, hardware acceleration, WebGPU-capable GPU. No package installation or build step. Open a terminal in the extracted `pelagic-0.2` folder, then run:

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

Open `/ensemble.html` for 64 independent initial spectra and a significant-height confidence interval. Run `node scripts/evidence-index.mjs` after new captures to refresh hashes and measured-result summaries.

Open `/motion.html` to record seven continuous 1080p scenarios. `/gallery.html` compares every final 0.2 view against its preserved 0.1 counterpart. `evidence/review/matched-inputs.json` checks identical inputs across all 48 pairs; changing the spectrum changes the realized waves despite identical seeds. The original Noniv reference comparison is separate and has explicitly different optical semantics.

Review-image generation optionally uses Python/Pillow and FFmpeg. These are evidence tools, never runtime dependencies. `scripts/review-evidence.py` expects the preserved sibling `pelagic` directory. Run `python scripts/motion-audit.py`, then `python scripts/motion-sheets.py` to reproduce decoded cadence/change measurements and labelled motion sheets. Raw PNGs and WebM recordings remain unmodified.

`RELEASE-MANIFEST.json` identifies the delivered source, reports and evidence with SHA-256 checksums. `node scripts/release-manifest.mjs --verify` checks the complete extracted project against it; run without `--verify` only when deliberately creating a new manifest after changes.

Example deterministic still and numerical readback:

```text
http://127.0.0.1:8080/?preset=midday&seed=1307&cam=0,2,0,4,-5.5&cameraMode=free&w=1920&h=1080&t=20&frames=120&shot=midday-test.png&stage=stage-04&validate=1&ui=0
```

`shot` runs fixed 1/60 s simulation steps, waits for GPU completion, captures the requested frame, then stops. It measures uncapped GPU throughput rather than display-paced FPS. `video=name&motion=fly` records ten seconds of rendered motion after warmup. Evidence JSON stores settings, camera, shader errors, native adapter identity and individual GPU pass timings when timestamp queries are supported.

`benchmark=name&frames=600&w=1920&h=1080&adaptive=0` records display-paced requestAnimationFrame timings and stops. Keep every other GPU renderer stopped. Browser visibility, thermal state, driver, display refresh and power mode affect results. Evidence distinguishes these runs from serialized screenshot throughput.

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

The delivered archive includes source, tests, reports, every retained evidence file and a SHA-256 manifest. The separate `pelagic-0.2-history.bundle` preserves source checkpoints, excluding ignored evidence. Inspect it with `git bundle verify`, or clone it into a new directory to review source history. `docs/V02-STAGES.md` maps checkpoints to evidence. The original-reference comparison can be reproduced by applying `docs/REFERENCE-HARNESS.patch` to the cited Noniv commit; its precise capture URL and limitations are in the stage record.
