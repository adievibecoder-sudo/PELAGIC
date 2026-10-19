# Noniv/web-ocean engineering audit

Inspected 2026-10-18. Repository commit: `a07c7fd522ef0a897601c114f927a49d93d95520`.
Source: https://github.com/Noniv/web-ocean
Local source: `work/reference-web-ocean/`.

Scope: README, LICENSE, package metadata, complete source modules `js/main.js`, `js/wgsl/{common,sim,ocean,sky,post}.js`; repository screenshots `docs/{front,side,high}.jpg` visually inspected. This was a source audit and inspection of supplied still images, not a local runtime benchmark, video inspection, or physical validation. Equations below were read from source or algebraically derived from it. No scientific paper was independently consulted for this bounded audit; paper attribution in the repository is not proof of fidelity to that paper.

## Decision

Strong engineering reference for a compact direct-WebGPU renderer: carefully packed FFT outputs, six scale bands, moment mipmaps, persistent foam clipmaps, CDLOD geometry, analytic specular filtering, atmosphere LUTs, asynchronous readback, and reproducible screenshot hooks. Its visual quality comes from these systems cooperating, not from one shader. It remains a tuned sunset renderer with substantial heuristic optics and no volumetric cloud, spray, or underwater system. Do not inherit its constants as measured ocean properties.

## Licence

`LICENSE` is MIT, copyright (c) 2026 Maksymilian Dendura. Reused code or substantial portions must retain that copyright and full MIT permission/disclaimer notice. Attribution in the bibliography is still appropriate when independently implementing algorithms informed by this repository. A new project should clearly separate independently written code from adapted reference code in its third-party notices. The audit does not establish licences of scientific papers or assets outside this repository.

## 1. Spectrum, units, normalization, FFT

`js/wgsl/common.js:2` sets N=256, log2(N)=8, six cascades. Comments claiming four/five cascades in other files are stale. `js/main.js:39` uses patch sides L = [1103, 211.3, 39.7, 7.43, 1.393, 0.2617] metres. Spatial frequencies are radians/metre, dk=2*pi/L. Direction is the direction waves travel, not meteorological wind-from direction.

`js/wgsl/sim.js:29` uses deep-water capillary-gravity dispersion:

```text
omega(k) = sqrt(g*k + (sigma/rho)*k^3)
g = 9.81 m/s^2
sigma/rho = 7.4e-5 m^3/s^2
domega/dk = (g + 3*(sigma/rho)*k^2)/(2*omega)
```

There is no finite-depth tanh(kh) term. Appropriate for an open deep ocean; should be documented, not sold as general shallow-water physics.

`sim.js:51` is JONSWAP in angular-frequency density form:

```text
S_omega = alpha*g^2*omega^-5 * exp(-1.25*(omega_p/omega)^4)
          * gamma^exp(-0.5*((omega-omega_p)/(sigmaJ*omega_p))^2)
sigmaJ = 0.07 below peak, 0.09 above peak
alpha = 0.076*(U10^2/(fetch*g))^0.22
omega_p = 22*(g^2/(U10*fetch))^(1/3)
gamma = 3.3 for wind sea
```

S_omega has units m^2 s per angular-frequency interval; the spreading function integrates over angle. `sim.js:104` converts to Cartesian wavevector density by `S_2D = S_omega * D(theta) * (domega/dk)/k`. This Jacobian is essential because d(kx)d(kz)=k dk dtheta. S_2D consequently has units m^4 when radians are treated as dimensionless.

Directional spreading in `sim.js:60` is proportional to sech^2(beta*theta), divided by `2*tanh(beta*pi)/beta`. That normalization is algebraically exact on [-pi,pi]. Important formula-verification question: its high-frequency beta branch uses `exp(-0.567*log(ratio*ratio))`, i.e. ratio^-1.134. Some commonly cited Donelan-Banner expressions use the square of log(ratio) instead. This audit did not consult the primary paper, so this is a formula requiring verification, not a confirmed literature error.

Swell is a second narrow JONSWAP with gamma=6, independently oriented, with peak wavelength converted using gravity-only omega=sqrt(g*2*pi/lambda). At swell scales the capillary contribution is negligible. Its amplitude parameter is derived from Hs using a logarithmic gamma correction, not a numerical integration of the realized grid spectrum. `sim.js:75` labels cos^(2s)(theta/2) spreading as normalized but uses an asymptotic normalizer `sqrt(s+0.25)/(2*sqrt(pi))`; the exact normalizer is `Gamma(s+1)/(2*sqrt(pi)*Gamma(s+0.5))`. At default s=48 the approximation is close, but the distinction belongs in a numerical audit.

`main.js:427` sets hard non-overlapping radial frequency bands. For c>0, kmin(c)=kmax(c-1). The next patch's sixth mode sets the preceding cutoff. Final kmax=0.98*pi*N/L. The final minimum retained wavelength is approximately 2.09 mm, but strong short-wave damping makes the practical energetic limit longer. `sim.js:102` multiplies energy by exp(-k^2*0.0012^2), and `sim.js:112` further scales amplitudes in cascades 4 and 5 by 0.85 and 0.6, reducing their energy by 0.7225 and 0.36. These are visual adjustments, not measured capillary spectra. Adding the capillary dispersion term to a gravity-wave JONSWAP tail does not establish measured capillary-wave energy.

Gaussian samples use a deterministic PCG hash and Box-Muller. The default seed is fixed to 1 in `main.js:438`. Each initial complex amplitude is `0.5 * (xi_r+i*xi_i) * sqrt(S_2D) * dk` with unit-variance xi values. Time evolution (`sim.js:147`) is:

```text
H(k,t) = h0(k)*exp(-i*omega*t) + conj(h0(-k))*exp(i*omega*t)
```

The 0.5 amplitude factor is compatible with this paired formulation and an unnormalized Fourier sum: E|h0(k)|^2=0.5*S_2D(k)*dk^2; summing the paired evolution over the full lattice recovers sum S_2D*dk^2 in expectation. Do not replace 0.5 with 1/sqrt(2) without re-deriving the spectrum convention.

The GPU inverse transform uses positive-sign radix-2 butterflies in workgroup memory, bit-reversed loads, 128 threads per 256-sample row/column, and barriers between stages (`sim.js:177`). It deliberately has no 1/N^2 normalization because amplitudes already correspond to the continuous Fourier sum discretization. Compare against an unnormalized inverse DFT, or multiply a conventional library IFFT by N^2. Four complex transforms pack eight real fields through the identity IFFT(A+iB)=a+ib for Hermitian A/B:

```text
specA.xy = Dx + i*Dz
specA.zw = height + i*Jxz
specB.xy = slopeX + i*slopeZ
specB.zw = Jxx + i*Jzz
```

Displacement and derivative fields are assembled into rgba16float texture arrays. The largest retained frequency is below per-axis Nyquist; the chosen radial bands avoid populated Nyquist rows/columns. Verify Hermitian symmetry and Nyquist handling again if changing band boundaries or resolution.

Frequency is floored to multiples of 2*pi/600 and simulation time loops every 600 seconds (`main.js:424`, `sim.js:147`). This prevents unbounded phase precision loss and guarantees an exact loop, but perturbs phase/group velocity and makes long-run evolution repetitive. Wind/swell changes regenerate the spectrum immediately at the same simulation time; there is no wave-action evolution, sea-state growth lag, or transition crossfade.

The nonlinear content is horizontal choppiness, not nonlinear wave dynamics. The code has no bound-wave interaction solver, overturning crest topology, dissipation feedback, wave-energy transfer, or breaking hydrodynamics.

## 2. Slopes, covariance, glitter, reflection

`sim.js:233` stores base-level moments (sx^2, sz^2, sx*sz), then box mipmaps the moments and first derivatives separately. `ocean.js:135` reconstructs per-cascade covariance `E[ss^T]-E[s]E[s]^T` at the fragment footprint. Summing independent cascade covariances is useful and efficient. It assumes their unresolved components are independent; deterministic bands at one footprint can still have local cross-correlations. This is LEAN-style moment filtering, not a demonstrated full LEADR implementation.

The choppy-normal transform is a notable approximation. `ocean.js:148` divides each slope by its own diagonal deformation term, ignoring Jxz. For surface P(u,v)=(u+Dx,h,v+Dz), the full upward area normal is:

```text
n_unnormalized = ( -sx*(1+Jzz)+sz*Jxz,
                   (1+Jxx)*(1+Jzz)-Jxz^2,
                  -sz*(1+Jxx)+sx*Jxz )
```

Away from folds, world-space slopes are the inverse transpose of the horizontal deformation matrix applied to (sx,sz). The covariance should use the corresponding transform consistently. The reference instead clamps diagonal terms to 0.15 and leaves covariance in the original slope coordinates. Strong intersecting/choppy waves can therefore have shading inconsistent with actual geometry. The full cross-product normal is inexpensive and should be preferred in a new implementation; folded surfaces still require a separate treatment.

Gust patches come from the foam procedural texture. They scale derivatives and moments in finer cascades, but not the vertex displacement. This creates visible ripple modulation without an evolved spatially varying wave spectrum. It changes local wave energy and geometry/shading consistency.

The unresolved variance added per axis is `0.0024 + 0.0035*smoothstep(30,500,distance)` (`ocean.js:143`, `main.js:591`). A derivative-derived AA covariance is added with a clamp. The comment calls the far result Cox-Munk-like, but no measured directional dataset or numerical fit is present. The distance-dependent floor is not derived from omitted spectral energy and may double-count variance already present in moment mipmaps. A new system should integrate missing variance above the simulation cutoff, then only transfer resolved variance into filtered covariance as footprint increases.

Sun glitter (`ocean.js:169`) evaluates an anisotropic Gaussian slope PDF at the half-vector slope, converts it to a microfacet normal distribution using division by half-vector y^4, adds Smith masking, and uses Schlick Fresnel (F0=0.02 for n~1.333). The solar direct radiance term follows a microfacet reflection form. Although a comment mentions solar-disc size, this water BRDF does not explicitly integrate the finite solar disc or add its projected angular covariance; it uses the unresolved floor and derivative smoothing. The sky has an explicit solar disc, but that is a different path. For tiny-wave glitter, implement finite-light integration or a justified footprint-aware disc convolution and validate the integrated energy, peak clipping, and temporal behavior.

Sky reflections use a 256^2 cubemap and mips. Actual code refreshes one cube face per frame, all six for two frames after settings change (`main.js:767`); the README says rebuilt every frame, an overstatement. Cube mips use a clamped 4x4 tent filter per face (`sky.js:446`), not a true anisotropic BRDF convolution or seam-aware spherical filter. Rapid lighting changes can reveal face-age differences; face-edge roughness filtering merits a seam test.

Grazing reflections contain explicit appearance heuristics: tilt the effective normal by 0.32*sigma, remap negative reflection y upward, and use a 45% flattened normal for Fresnel (`ocean.js:187`). These address bright-horizon integration aesthetically but are not a derived visible-normal sampling solution. Neither ocean self-reflections nor inter-wave occlusion/reflection are traced.

## 3. Water optics and foam

The strongest optical limitation is explicit in `main.js:591`: body colour is `(0.016,0.080,0.096)*turbidity`. `ocean.js:204` multiplies this by a weighted sky/sun term. Backlit crest glow uses height threshold, view-to-light power, normal heuristic, and distance decay. There is no spectral absorption table, Beer-Lambert refracted path, depth estimate, volumetric multiple scattering, polarization, or transmission through actual crest thickness. README acknowledges coastal/turbid tuning. Lower turbidity scales brightness, not a validated suspended-particle optical model.

Foam is more than an instantaneous fragment threshold. `main.js:181` allocates two ping-pong 1024^2, two-layer rgba16float world maps. Extents are 128 m and 1024 m, hence 0.125 m and 1 m texels. Toroidal addressing follows camera movement; newly exposed map regions reset. Total horizontal Jacobian is evaluated after summing appropriately filtered cascade derivatives. Injection is `clamp((threshold-J)*gain,0,1)`, persistent density decays at 0.22/s (approximately 4.55 s e-folding), freshness at 1.6/s, and sources can raise density to 1.6 (`sim.js:389`).

Advection is semi-Lagrangian using a uniform downwind velocity of 0.03*U10 (`main.js:703`). It is not spatial surface flow, orbital velocity, Stokes drift calculated from the spectrum, divergence-aware concentration, or a breaking-front tracker. The history-validity test checks current world texel against the old window; it does not separately check the backtraced sample footprint. New-window boundaries therefore deserve an advection leakage test. Injection is evaluated in undeformed parameter coordinates while texture lookup is labelled world-space, an additional consistency question for large choppiness.

Procedural foam detail is generated once: periodic warped noise plus multi-scale bubble/Worley holes, separate density/fine/streak channels. Shading varies lace threshold, translucent edge margin, freshness, density, and wind-aligned streaks; body colour is brightened below foam. These visually motivated details are effective in supplied images, but bubble sizes, lifetimes, coverage, and optical depth are not calibrated. There is no crest propagation condition, dissipation criterion, or validation of observed whitecap coverage. At foam=0 the source threshold is still positive (0.52); the control does not eliminate foam sources.

No spray particle or sea-mist code exists. No foam mass conservation claim should be made.

## 4. Geometry, camera, horizon

CDLOD uses 32x32 quads per patch, 2 m smallest patch, 6.25 cm minimum vertex spacing, 17 levels, 160 km range, and up to 8192 nodes (`main.js:311`). Quadtree selection and frustum culling reuse typed arrays. Vertex positions morph into coarser even-grid positions over the outer 20% of each LOD range; displacement mips follow effective vertex spacing (`ocean.js:59`). This is an appropriate scalable foundation and should be preserved as an idea rather than copied without stress testing.

Frustum bounds are fixed at +/-4 m vertically and 4 m horizontal displacement (`main.js:493`). Strong sea states may exceed them and cause premature culling. Bounds should derive from realized spectrum or conservative displacement maxima.

The view matrix is camera-relative, reverse-Z, infinite-far projection with 0.05 m near plane. However geometry computes absolute f32 world positions and subtracts f32 camera position afterwards. This does not preserve centimetre or millimetre detail at arbitrarily large world coordinates. Fine UV phase similarly suffers when absolute coordinates become large. Use snapped origins plus phase offsets or split high/low precision positions for long flights.

Ocean geometry is a flat plane; no Earth curvature term is applied. Atmosphere uses a spherical Earth, but sky/background directions are clamped slightly above horizontal. At high camera altitudes these disagree with the physical depressed horizon. Fog is a homogeneous sea-level exponential approaching sky horizon colour, not a common integrated aerial-perspective field. The default marine floor 1.1e-4/m has a roughly 9.1 km e-folding length regardless of channel. This helps merge the surfaces but cannot establish correct horizon radiance in all weather conditions.

Camera height probing uses four fixed-point iterations to invert horizontal displacement, async GPU readback at most every eight frames, then a soft correction above the water. Height is clamped to [1,3000] m with nominal 0.9 m water clearance (`main.js:482`). Rapid crests and stale probe data can still clip; the code does not support deliberate underwater or half-submerged views. Near folds, fixed-point iteration need not converge. No velocity smoothing or inertia is implemented.

## 5. Atmosphere and clouds

`common.js:37` uses radii 6360 km and 6460 km, Rayleigh scale height 8 km, Mie scale height 1.2 km, triangular ozone profile centered 25 km with 15 km half width. Extinction/scattering coefficients are per km. There is only one aerosol exponential despite a comment mentioning an additional dense marine boundary layer. Multiple scattering is a Hillaire-style isotropic closure, `L2/(1-fms)` computed from 64 angular directions and 20 steps (`sky.js:95`). Transmittance uses 64 steps; sky-view uses 48 quadratically spaced steps. These are genuine transport approximations, although not validated here against a spectral reference.

Clouds are two 2D procedural densities on spherical shells, not volumetric fields. Actual low altitude is 1.5 km; upper shell is 4.5 km. Comments mentioning 2/7 km are stale. Pseudo self-shadowing samples density 80/250/600 m toward horizontal solar direction. Optical thickness is density divided by view cosine; single scattering, rim light, phase mixtures, and multiple-scattering terms are tuned functions. Footprint-filtered noise and fwidth silhouette smoothing are valuable anti-aliasing techniques.

Low clouds fade out between 18 and 36 km along the view ray, high clouds between 30 and 70 km (`sky.js:335`, `sky.js:358`), leaving an artist-directed clear horizon band. This is a key reason their horizon integrates cleanly in the sunset view, but cannot represent a dense cloud deck reaching the horizon in a storm.

Cloud sunlight attenuation is averaged over seven rays across the Sun disc at the camera location and stored as one scalar (`sky.js:498`). Every ocean point shares it. This is global dimming, not spatial cloud shadows moving across the sea. Cloud reflection is present through the cubemap, with the update latency above. There is no Sun/Moon ephemeris, lunar phase, star field, rain, storm transport, or weather evolution.

## 6. Rendering, diagnostics, performance, screenshot evidence

HDR rgba16float scene, 4x MSAA, eight-level bloom, Karis-style first downsample suppression of bright glints, AgX-style tone mapping, white-balance/look adjustments, vignette, highlight desaturation, triangular dither. There is no TAA, temporal reprojection, motion vectors, velocity blur, dynamic resolution, or adaptive quality. Avoiding TAA avoids its history ghosting, but stability must still be demonstrated in motion. Karis suppression and artificial highlight desaturation alter energy; validate their photographic result separately from linear-HDR radiometry.

The renderer checks navigator.gpu/adapter, requests high-performance and optional timestamp-query, compiles WGSL with diagnostic messages, logs device loss and uncaptured errors. A robust new app should avoid accessing WebGPU constants before the support check: this source accesses GPUBufferUsage at module scope (`main.js:15`), which can throw before its intended friendly unsupported-browser failure path on browsers lacking those globals.

Timestamp-query measures beginning of first compute pass through final composite, excluding presentation. It is an aggregate GPU interval, not per-pass profiling. CPU HUD frame rate uses a dt capped at 0.1 s and averages half-second windows; long stalls can distort it. README's 6-8 ms at 2560x1440 on RTX 5070 Ti is the author's reported result, not a verified measurement in this audit and not evidence for RTX 3050 Laptop performance.

Deterministic screenshot parameters include resolution, camera, time, fixed timestep, screenshot frame, and sequence. Useful debug views expose foam/Jacobian, reflection, Fresnel, body, foam lighting, and sky sample. Settings are applied from the URL after UI slider creation, so displayed slider values may initially disagree with URL-derived state. Values are not validated against UI ranges. There is no automated numerical suite or acceptance table in the inspected repository.

Visually inspected supplied JPEGs, each displayed at 1600x900 by the image tool:

- `docs/front.jpg`: convincing coherent broad swell, fine sparkle distribution, warm illumination across water/sky; cloud shapes visibly thin, stretched shell-like layers. Direct glitter forms a strong narrow vertical band. Still image alone cannot determine motion aliasing or excessive temporal coherence.
- `docs/side.jpg`: good multi-scale normal/reflection detail and irregular intersecting slopes; water has a consistently saturated cyan-green subsurface bias and middle-distance surface reads more uniform than near geometry. Horizon water remains distinct/darker than sky. This observation is restricted to this supplied sunset still.
- `docs/high.jpg`: broad swell silhouettes and foam patches retain readable scale; haze unifies distance. Mid-distance detail compresses rapidly into a relatively uniform reflective plane; cloud thickness remains visually limited. No inferred GPU or frame-rate result.

README explicitly acknowledges darker far water than bright horizon, coastal/turbid colour tuning, no shore/objects, and non-volumetric clouds. Mid-distance wave weakness, energy/filtering consistency, precision risks, and camera latency above are audit observations/inferences, not claimed upstream acknowledgments.

## 7. Recommendations for the original implementation

1. Keep direct WebGPU compute FFT, deterministic seeds, spectral field packing, persistent foam maps, and footprint-aware slope moments. Write independent, tested modules; retain MIT notices for any copied portions.
2. Define one Fourier convention and units contract. Numerically integrate spectrum on the actual discrete bands. Test GPU fields against a CPU double-precision DFT/FFT with both random and analytic modes, including pure x/z, oblique, zero, and Nyquist cases. Separate floating point tolerance from finite-grid sampling uncertainty.
3. Preserve a slope-energy ledger: simulated spectrum variance, subpixel variance, omitted high-frequency variance. Integrate omitted micro-wave energy from a validated model; do not add an arbitrary distance floor on top of mip-resolved variance. Test both covariance trace and directional anisotropy. Use full deformation normal/covariance transforms.
4. Calibrate discrete Hs=4*sqrt(m0) and peak period. Explain JONSWAP's finite-fetch assumptions, swell normalization approximation, limited low-frequency sampling, and capillary spectrum limitations. Never imply capillary dispersion alone provides measured capillary roughness.
5. Track breaking activity separately from foam optical coverage. Combine compression with crest steepness/front propagation and a bounded dissipation proxy; advect persistent foam using a documented surface-current/Stokes approximation. Validate lifetime and transport before increasing visual complexity. State that true overturning breakers need separate geometry/volume treatment.
6. Build water colour from absorption/scattering coefficients and a documented underwater radiance approximation. Preserve linear HDR debug outputs before exposure/tone mapping. Test backlit crests and grazing horizon radiance separately.
7. Use finite Sun/Moon extent in glitter and conserve integrated reflected energy across resolution/roughness changes. Prefer spatial filtering plus short/limited histories for specular components over broad TAA until motion tests prove stability.
8. Use a common curved geometry/atmosphere reference at high altitude, derived horizon position, and shared aerial perspective. Derive geometric bounds from the spectrum. Test origin rebasing and camera continuity for long flights.
9. Volumetric clouds require 3D density, actual ray segments, light transmittance, and per-world-position sea shadowing; a thin layer should remain explicitly labelled as a lower quality approximation. Refresh environment maps according to measurable sky change and test cubemap seams.
10. Make capture and test hooks first-class: fixed conditions, explicit actual adapter info, shader errors, per-pass timestamp queries, invalid-value counters, GPU/readback Fourier checks, visual suites, and recordings. Performance target is unverified until measured on the requested GPU. Source presence is not an acceptance pass.

## Status

PASS: source audit completed; exact commit recorded; licence verified; supplied stills inspected; implementation-versus-README distinctions documented.

UNVERIFIED: local runtime, GPU FFT correctness, spectrum/whitecap agreement with observations, motion stability, memory usage, physical radiometric correctness, and all hardware performance claims.

FAIL relative to requested full target: reference lacks volumetric clouds, spatial cloud shadows, underwater rendering, spray, astronomical lighting, weather evolution, measured roughness energy accounting, and the requested systematic validation suite. This is a scope comparison, not a claim that the reference fails its own narrower goals.
