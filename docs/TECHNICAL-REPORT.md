# Pelagic 0.1: technical report

2026-10-18. This is a functioning, instrumented native-WebGPU research renderer. **The complete requested AAA/VFX photorealism target is NOT met.** The strongest result is the multi-scale ocean foundation and its numerical verification. Breaking hydrodynamics, calibrated optics, sophisticated cloud structure, seamless partial immersion and comprehensive temporal validation remain incomplete. These are substantive gaps, not merely polish.

All evidence is local. Open `gallery.html` through the server for separately reviewable images, comparisons and videos. `evidence/manifest.json` records SHA-256 hashes; `evidence/results.json` summarizes capture and timing records. PASS means the stated check passed, never that an entire system is physically exact.

## Implementation and ownership

Buildless JavaScript ES modules and WGSL. No dependency installation. Native WebGPU compute and rendering; no Three.js, WebGL fallback, external textures or remote runtime services. Loopback-only Node server. Current Chrome/Edge and Node 20+ required. The app requests a high-performance GPU, checks software-adapter indicators, reports compilation/runtime errors visibly, stops on GPU errors and destroys its device on page teardown. Render targets are destroyed/rebuilt on resize. Quality changes deliberately reload the device/resources while preserving validated configuration.

This is a substantially modified MIT derivative of **Noniv/web-ocean**, commit `a07c7fd522ef0a897601c114f927a49d93d95520`, Copyright 2026 Maksymilian Dendura. Its workgroup FFT, spectral field packing, CDLOD, moment filtering, foam and atmospheric/postprocessing foundations are retained. Full license is included. The audit identifies exactly what the original implements and where this build differs. No claim of an independently invented renderer is made.

## Delivered systems and limits

| System | Implemented behavior | Important limitation |
|---|---|---|
| Waves | Six 256-square GPU FFT cascades, JONSWAP wind sea, separately oriented normalized swell, capillary-gravity dispersion, choppy displacement | Linear dispersive waves plus geometric chop; no overturning, nonlinear wave interaction or energy-dissipating breaker solver |
| Scale coverage | 1103, 211.3, 39.7, 7.43, 1.393, 0.2617 m patch sides; CDLOD and derivative/moment mipmaps | Each cascade remains periodic; long-flight absolute f32 coordinates still lose fine precision |
| Phase | Unit complex oscillators, CPU double-precision refresh every 120 simulated seconds | Sparse-mode epoch tests passed; no continuous 24-hour runtime test |
| Water normals | Full cross-Jacobian inverse-transpose and covariance transform | Near-fold determinant regularization is heuristic; gust modulation changes fine slope energy |
| Glitter | Anisotropic Gaussian slope PDF, moment filtering, finite-disc variance approximation, exact dielectric Fresnel | No converged solar-disc integral, glint radiometry or measured slope calibration; grazing/horizon approximations remain |
| Water color | Pope-Fry absorption at 650/550/450 nm, particulate/CDOM proxies, optically-deep backscatter and attenuation | Three channels are not color-matched spectral transport; turbidity is not calibrated to NTU; crest thickness/light transport approximate |
| Foam | Persistent clipmaps, compression + slope + crest-growth source, current/orbital advection, bubble texture, decay | Source is heuristic; drift is not integrated spectral Stokes drift; no observed optical coverage calibration |
| Foam precision | Binary16 density plus residual in alpha channel | Freshness still binary16; fractional transport remains dissipative; no full convergence study |
| Spray/rain | GPU particles, wind drag, gravity, source tied to fresh foam; rain haze | Billboards, approximate scattering; no rain-impact ripple solver or volumetric rain shafts |
| Atmosphere | Rayleigh/Mie/ozone LUT transport, approximate multiple scattering, aerial perspective | RGB and homogeneous marine haze; no calibrated spectral horizon-radiance comparison |
| Clouds | 3D density raymarch, Beer integration, sampled self-shadowing, Earth shadow, multiple-scattering approximation; spatial sea shadow map | Coarse value-noise morphology, sampling artifacts and missing multiscale cloud erosion remain; high ice veil is a thin layer |
| Astronomy | Approximate Sun/Moon positions, date/UTC/latitude/longitude, geometric lunar phase, synthetic stars | Dominant-light switch near solar elevation -7 degrees; no phase-shaped Moon disc, star catalog or precision ephemeris validation |
| Weather | Six developed presets; separate wind/swell exponential development times; rain/cloud/wind controls | Not a coupled wave-action/meteorological model; presets jump immediately, other controls do not all transition smoothly |
| Underwater | Two-sided interface, Snell refraction, Fresnel/TIR and wavelength-dependent attenuation | Uniform deep-water asymptote; no underwater volume integration/bubbles/caustics; near-surface medium switch visibly abrupt |
| Camera | Inertial free flight, mouse/pointer lock, altitude controls, surface guard and dive | Guard uses delayed height readback, cannot guarantee zero clipping; 5 cm near plane; no floating origin |
| Rendering | rgba16float HDR, reverse-Z, 4x MSAA, slope filtering, restrained bloom, AgX-family tone mapping, dither | No temporal reconstruction; intentionally no generic TAA, but absence of TAA is not proof of temporal stability |
| Quality | Balanced/High/Ultra/Cinematic, adaptive scale | Maximum presets are uncapped fidelity modes; only Balanced/High have hardware timing records |

## Measured numerical acceptance

| Check | Result | Evidence and exact scope |
|---|---|---|
| Independent CPU inverse FFT vs direct DFT | PASS | N=8/16/32, both complex components, Parseval; relative arithmetic near 1e-12 |
| GPU FFT vs independent double reference | PASS | Nine comparisons: DC, crossing harmonics, seeded broadband times displacement/derivatives/moments, actual N=256 GPU kernels |
| GPU FFT tolerances | PASS | Relative L2 <0.001; max absolute <0.0012 times max reference +2e-5. Includes rgba16float storage, not an unjustified f32-only threshold. Zero invalid values |
| GPU Parseval and conjugate coefficients | PASS in captured reports | All six cascades. Height variance error <0.0015; conjugate initial coefficients <1e-7. Raw per-cascade statistics retained |
| Final storm height and linear-slope Parseval | PASS | Six cascades, maximum relative height/slope error 0.000714; zero invalid sampled height, slope or foam values. `stage-03/after-ice-horizon.json` |
| Swell normalization | PASS | Multiple heights and periods integrated independently; directional spreading integrates to one |
| 64-seed GPU spectrum ensemble | PASS | Mean m0=0.3394762600 m^2, standard error=0.0029477955; Student 95% interval [0.3335865645,0.3453659555]. Continuous target 0.3375492166 lies inside |
| Ensemble significant height | PASS for stated compatibility test | 4 sqrt(mean m0)=2.3305836524 m; target 2.3239594372 m. Discretization/cutoff bias is not silently normalized away |
| Linear slope statistics | UNVERIFIED against observed seas | Ensemble linear MSS=0.0397306260. Cox-Munk uses historical U12.5 and has sea-state scatter. Chopped slopes and unresolved tail require a separate measured comparison |
| Peak period | UNVERIFIED as a measured output | Analytic golden wind peak period 5.342666 s; no independent spatiotemporal peak estimator was run |
| Phase epoch drift | PASS | 1,530 sparse modes across six bands, 7,200 GPU steps over 120 s, initialized at t=0/6h/24h; max phase error 0.003343 rad, max norm error <1.3e-7 |
| Actual continuous long run | UNVERIFIED | Epoch initialization tests do not simulate every preceding hour or stress resource leaks for a day |
| Foam integer transport | PASS | Production update kernel with RES=64, source=decay=0, eight one-texel steps. Exact expected centroid and zero relative L1 error |
| Foam pause | PASS | No density change across 20 paused updates in manufactured case; particles explicitly return for dt=0 |
| Foam exponential decay | PASS after correction | Four seconds at 30/60/120 Hz; relative errors 0.00103%, 0.00197%, 0.00360%, below 0.2% target |
| Original uncompensated decay | FAIL, retained | 4.10%, 7.94%, 16.58% excess loss at respective rates. `gpu-dynamics-before-fix.json` records failure |
| Fractional foam transport convergence | UNVERIFIED | Integer translation does not establish low diffusion or conservation under arbitrary advection |
| Whitecap observational coverage | UNVERIFIED | No twenty-minute optical-area dataset or block confidence interval. Readback density is not photographed whitecap coverage |
| Fresnel/TIR arithmetic | PASS CPU | Normal/grazing limits; transition between 48 and 49 degrees underwater for n=1.333 |
| Glitter energy, slope budget and horizon radiance | UNVERIFIED | No converged linear-HDR reference integration, resolution-invariance proof or measured radiance comparison |
| Configuration and malformed inputs | PASS CPU | All settings URL round-trip; bounded camera/time/targets; nine Node test cases pass |

Tests use independent double-precision recursive FFT and direct DFT, not a renamed copy of the GPU butterfly. Ensemble samples are independent seeds, not correlated pixels. The 95% interval is conditional on that seed sampling and does not establish correct real-ocean short-wave statistics. The original research note proposes additional checks; those proposals are not completed tests.

The final storm readback at 20 m/s wind gives independent-cascade Hs=7.7586 m versus a continuous-spectrum target of 7.4110 m, and linear MSS=0.058224. This single realization has no storm ensemble confidence interval; the height difference is not declared a calibration pass. Inner foam memory has mean density 0.002346 and 0.5474% of parameter-space texels above density 0.05, after ten simulated seconds of warmup. These values reinforce the need to investigate weak whitewater. They are neither equilibrium statistics nor optical whitecap coverage and cannot validate a wind-dependent observational relation.

## Visual acceptance and evidence

The required **48 views plus four special views** were captured on native NVIDIA WebGPU at 1920x1080, seed 1307, t=20 followed by 100 steps at 1/60 s. Each final PNG has a separate JSON. Conditions: calm, midday, golden, storm, twilight, moonlit; heights 0.5/2/50/500 m; azimuth at primary light and 75 degrees away. Camera pitch is -5.5 degrees at low height and -12 degrees at high height. Heights are absolute mean-sea-level coordinates, not guaranteed instantaneous crest clearance. Special views: upward underwater, underwater horizon, nominal half-submerged, close storm wave.

All 52 views were reviewed in scenario contact sheets, with selected full-resolution captures examined for optics, clouds, underwater horizon and medium-selection artifacts. This is not a claim that every pixel of every frame was independently inspected. Low-camera imagery has readable irregular swells, crossing fine waves and coherent warm/cool reflections. Storm wave scale is convincing relative to calmer states, but insufficient mature whitewater and volumetric spray still weaken realism. High-altitude fields become too uniform and grazing reflections remain conspicuous. Clouds retain soft, coarse shapes and some distant sampling texture. Night is legible but stylized, not exposure-calibrated. No stage is certified photorealistic.

| Observed issue | Status | Before / after evidence |
|---|---|---|
| Sunset clouds stayed brightly lit below Earth's shadow | Corrected in tested view | `stage-03/before-twilight-fix.png`, `after-twilight-fix.png` |
| Bright underwater horizon stripe | Corrected in tested view | `stage-03/before-underwater-fix.png`, `after-underwater-fix.png` |
| Dark mid-distance flecks from wrong medium classification | Corrected in tested view | `stage-03/before-medium-classification.png`, `after-medium-classification.png` |
| Bright straight band above the storm horizon | Corrected in tested view | `stage-03/before-ice-horizon.png`, `after-ice-horizon.png`; spherical high-cloud shell, grazing path and distance attenuation |
| Coarse cloud shapes / horizon noise | FAIL maximum-quality target | Final matrix; footprint filtering helps aliasing but does not create missing cloud structure |
| Half-submerged transition | FAIL | `waterline-motion.webm`: whole-view medium change remains abrupt; nominal y=0 still alone was not a sufficient test |
| Wave repetition / LOD popping / glitter temporal stability | UNVERIFIED comprehensively | Motion recordings and sampled frames exist; no exhaustive continuous-motion, long-flight or temporal metric validation |
| Genuine overturning and physically calibrated breakers | FAIL | Not implemented |

Three approximately ten-second 1080p WebM recordings are provided: golden moving camera, storm moving camera, deliberate waterline crossing. All were refreshed after the final medium and ice-horizon fixes, decoded, and representative frames extracted/inspected. The containers were remuxed without re-encoding to add duration and seek metadata (9.952, 9.950 and 9.979 seconds respectively). Full continuous playback was not systematically judged frame-by-frame. They are review evidence, not proof of ghosting-free motion. Their capture paths use queue completion and requested 30 FPS encoding; encoded FPS is not a claim about unique real-time rendered frames.

Authentic comparison was limited to the NOAA Okeanos Explorer photograph documented in the bibliography. It informed dark restrained water, irregular swell and interrupted reflections. No synchronized real-footage comparison, calibrated photographic match or third-party AAA benchmark was performed. No such claim is made.

## Development stages

| Stage | Working result / retained evidence | Verification | Remaining dependency |
|---|---|---|---|
| 01 Foundation | `stage-01/reference-baseline.png`; original audited MIT renderer | Reference source/license audit; actual GPU FFT | Calibrated spectra, full slope transform, optics |
| 02 Ocean optics | `stage-01/ocean-optics.png`; separate swell normalization, cross Jacobian, optical proxies, persistent foam | CPU integration/Fresnel, GPU readback; old screenshot timings contended | Finite-source radiometry, nonlinear breaking, foam transport validation |
| 03 Atmosphere/integration | `stage-02/volumetric-first.png`; `stage-03/isolated-balanced.png`; matched correction pairs | Visual defects found and corrected; isolated hardware capture; phase/foam tests added | Cloud morphology, coupled transport, robust waterline |
| 04 Interactive first version | Final matrix, gallery, three WebMs, settings and camera workflows | 52 captures, 64-seed ensemble, actual-adapter timings, save/import/URL tests | Listed FAIL and UNVERIFIED requirements |

Historical stages do **not** each have their own motion capture or complete numerical suite at that exact historical source revision. The baseline and final beauty images also use different default conditions; they are not presented as a controlled algorithm comparison. The explicit fix pairs use matched conditions. These evidence gaps are retained honestly.

## Hardware and performance

OS `nvidia-smi`: **NVIDIA GeForce RTX 3050 Laptop GPU, 4096 MiB, driver 617.14**. Browser adapter: vendor `nvidia`, architecture `ampere`; exact device/description strings are redacted by the browser, fallback field unavailable. Native WebGPU is positively established; installed model and adapter vendor/architecture are separate evidence.

| Run, 1920x1080 golden scene | Samples | GPU mean | Frame interval / throughput | Interpretation |
|---|---:|---:|---:|---|
| Final Balanced, display-paced | 72 GPU / 570 frames | 15.033 ms | 14.864 ms, 67.28 FPS mean; p95 20.9 ms, p99 27.8 ms | Short-run 60 FPS average goal PASS; frame-time consistency needs work |
| Final High, display-paced | 72 GPU / 570 frames | 20.221 ms | 19.712 ms, 50.73 FPS mean; p95 21.0 ms, p99 34.8 ms | Short-run 30 FPS average goal PASS; earlier scheduling failures not explained |
| Balanced, display-paced | 109 GPU / 870 frames | 13.589 ms | 13.578 ms, 73.65 FPS mean; p95 14.0 ms, p99 20.9 ms | Short-run 60 FPS average goal PASS in this environment; not every frame <=16.67 ms |
| High, isolated queue-completion capture | 42 GPU | 17.194 ms | 21.055 ms, 47.50 frames/s throughput | GPU/capture goal promising; not display-paced performance |
| High, paced IAB | 109 GPU / 870 frames | 28.048 ms | 121.616 ms, 8.22 FPS; p95 1006.5 ms | FAIL observed pacing; one-second scheduling stalls. Cause not definitively established |
| High, paced Chrome | 54 GPU / 570 frames | 39.132 ms | 296.747 ms, 3.37 FPS; p95 1006.9 ms | FAIL observed pacing; visible document flag did not prevent stalls |

Do not discard or rename stalled runs as successes. The two final runs use the delivered shaders and pass their short-run average goals; the remaining table rows are retained earlier runs. High's 30 FPS sustained foreground goal remains **UNVERIFIED**: successful final pacing does not explain the earlier one-second stalls. Browser scheduling/power/thermal effects need controlled foreground benchmarking. These successes cover a short golden scene, not the six-scenario minimum or a thermal-soak guarantee. Earlier stage-02/golden-optimized GPU times were contaminated by a second rendering preview and are explicitly excluded as standalone benchmarks.

Final Balanced per-pass means: simulation 1.497 ms, atmosphere 2.894 ms, surface 9.801 ms, post 0.491 ms. Final High: 1.485 / 6.127 / 11.777 / 0.468 ms. CPU submission means: Balanced 0.457 ms, High 0.428 ms. GPU intervals omit presentation and are sampled asynchronously; frame timing records cover every post-warmup frame in the paced tests. CPU submission is not total browser CPU cost. Final runs have zero reported shader errors and zero recorded hidden-document frames.

Main render-target allocation lower bound: Balanced 117.77 MiB, High 119.97 MiB at 1080p (4x color/depth, HDR, bloom, cloud texture). This excludes FFT/foam/environment buffers, driver alignment and compositor resources. One OS snapshot after captures reported 803 MiB total GPU usage, 47 C, 1500 MHz, 8.66 W. Earlier contention reached 1165 MiB, 86 C. Neither total is project-exclusive VRAM usage. Per-process residency and peak allocation remain UNVERIFIED.

Optimization already present: banded workgroup FFT; moment mipmaps; footprint branch for far tiny cascades; reusable frame descriptors/typed arrays; camera-centered LOD; cloud downsampling and footprint filtering; rotating environment updates; bounded histories/readbacks; optional adaptive resolution. Remaining bottleneck is primarily water surface shading and then cloud/environment work. Reducing essential spectrum scales was not used as the first optimization.

## Interactive verification

PASS observed: six presets render; native NVIDIA backend shown; pause state; editing wind to 11 m/s then Apply developed sea; altitude 50 m; Save, change preset, Restore; JSON export contents; Import after changing to calm; generated URL opened and restored wind/camera/pause; High quality resource rebuild preserved settings; Dive selected and negative camera altitude reported. Caption restore bug was fixed. Mouse-wheel flight speed now updates the serialized setting and control; that specific wheel workflow remains untested through browser input. Share always displays a copyable URL even if clipboard access is unavailable; actual clipboard contents could not be verified in IAB.

The 52-view suite covers preset behavior and geometry views, not every individual slider. All exposed settings are connected to implementation; exhaustive control-by-control visual effects, mobile browser WebGPU, keyboard/pointer-lock behavior under every focus state, screenshot download UI, adaptive-resolution convergence and unsupported-device UI on a genuinely unsupported browser remain UNVERIFIED. PNG capture itself is exercised extensively through the same GPU readback path. Desktop browser is the primary target; responsive CSS is supplied.

Final gallery QA: scenario switching, eight loaded 1920x1080 storm images, three decoded 1920x1080 videos with finite duration, static local link existence, desktop layout and hide/show-interface behavior PASS. Desktop screenshots are retained in `evidence/gallery-desktop.jpg` and `evidence/interface-desktop.jpg`. Responsive CSS remains untested at mobile dimensions.

Saved settings serialize camera, wave phase time and controls. They **do not** preserve foam, spray or cloud reflection history, pending wind-development targets or exact GPU temporal state. Reopening a URL reconstructs a reproducible spectrum, not bit-identical history-dependent imagery. Fixed-step capture with a fixed warmup is the reproducible visual protocol.

## Next dependencies, in priority order

1. Treat waterline as a geometry/volume visibility problem: near-plane water mask, camera-medium determination without delayed global toggles, refracted ray paths and correct partial pixel coverage. Add fast camera/crest crossing tests.
2. Replace heuristic crest injection with tracked crest energy/kinematics and a local nonlinear breaker representation. Couple dissipation, aeration, foam and spray; compare area-weighted optical coverage over long stationary records with uncertainty.
3. Fit an explicit short-wave directional spectrum and residual slope ledger to documented measured conditions. Validate transformed slope covariance, finite-disc glitter power, resolution changes and radiometric horizon matching before tuning appearance further.
4. Improve clouds through multiscale density erosion, better phase/multiple scattering and spatially coherent sampling. Preserve cloud/sea illumination consistency; validate with authenticated footage and calibrated exposures.
5. Add floating-origin phase offsets, long-run/motion stress tests, separate specular/volume temporal strategies only after objective comparisons, and controlled foreground thermal-soak profiling for all scenarios and quality levels.

The delivered source, tests and evidence make these failures reviewable and reproducible. They do not convert unfinished systems into completed claims.
