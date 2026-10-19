# Pelagic: implementation plan

Local desktop-browser application. Native WebGPU only. No runtime packages, remote fonts, external textures, or WebGL fallback.

## Research decisions

Start from inspected MIT-licensed Noniv/web-ocean kernels (commit a07c7fd522ef0a897601c114f927a49d93d95520), retaining its attribution. This is an explicitly derived renderer, not a claim of independent invention. Its efficient workgroup FFT, band-partitioned cascades, CDLOD and LUT atmosphere are useful foundations. Its tinted water, diagonal normal transform, arbitrary distance roughness, flat clouds and camera-only cloud shadow need replacement or qualification.

1. Foundation: run the audited starting renderer, capture a reproducible baseline. Add GPU readback tests against independent double-precision DFT/FFT calculations; inspect energy, reality, moments and seams.
2. Ocean: correct normalization and normal transformation; absorption/backscatter optics, conservative variance filtering, full dielectric Fresnel, breaking-memory advection. Capture identical conditions before/after.
3. Environment: volumetric cloud transport and spatial shadowing, astronomical lighting, weather relaxation, spray, underwater surface transmission. Each approximation is labelled in the report.
4. Experience: restrained controls, camera modes, presets, diagnostics, capture/export, reproducible configuration. Run the requested 48-view scenario matrix and additional motion/underwater tests on the actual adapter.

## Frame graph

Spectrum initialization on changed sea state; analytic spectral evolution; shared-memory row/column IFFTs; slope moment mips; advected foam; atmosphere LUTs; volumetric environment; camera-relative CDLOD water and sky into 16-bit HDR/4x MSAA; spray; bloom; AgX-family display transform. No conventional TAA: time-averaging the specular output would erase glints. Filter slope distributions before shading instead. Temporal cloud reconstruction is deferred unless a measured improvement justifies it.

## Contracts

- SI units: metres, seconds, radians internally; atmosphere distances in kilometres only inside atmospheric shaders.
- Coordinates: +Y up, north -Z, east +X. Wind and swell direction describe travel, not meteorological origin.
- Each spectral band owns its energy once; unresolved variance comes from lost moments plus a measured/declared spectral-tail budget.
- CPU reference uses independent numerical integration and transforms. GPU half-float output tolerances include quantization; observational fits are references, not universal laws.
- Settings validated before GPU upload; seeded phases; finite simulation time; device failure visible.
- Raw evidence retains adapter, viewport, conditions, seed, simulation time, timing method and known failures.

## Quality goals

RTX 3050 Laptop 4 GB at 1920x1080: Balanced target 60 FPS, High target 30 FPS. Goals are not results. Ultra/Cinematic preserve the maximum target and may be slow. Profile timestamp-query passes separately; track allocation estimates separately from actual driver memory. Hardware validation must identify the browser adapter, not just the installed GPU.
