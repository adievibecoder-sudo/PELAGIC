# Ocean physics research and acceptance basis

Consulted 2026-10-18. Research notes, not evidence that a renderer passes these tests. Equations below use SI units. Numerical tolerances are proposed engineering acceptance criteria, not observational uncertainty unless explicitly identified.

## Spectrum and units

JONSWAP describes an empirical developing wind sea, not the complete ocean, capillary range, or arbitrary swell. Its standard mean parameters are gamma=3.3, sigma=0.07 below the peak and 0.09 above it. Independent swell needs its own directional spectral component. The original report's wave-energy balance includes wind input, nonlinear interactions, and dissipation; merely changing a spectrum is not a simulation of those processes. [1]

One-sided angular-frequency elevation variance spectrum:

```
S_w(w) = alpha*g^2*w^-5 * exp[-1.25*(wp/w)^4]
         * gamma^exp[-(w-wp)^2/(2*sigma^2*wp^2)]
wp = 2*pi/Tp
m0 = integral_0^infinity S_w(w) dw
Hm0 = 4*sqrt(m0)
```

S_w units are m^2 s/rad; radians are dimensionless in dimensional checks. If using Hz, `S_f(f)=2*pi*S_w(2*pi*f)`, units m^2/Hz. Do not put Hz into the angular-frequency formula. Hm0 is the spectral significant wave-height estimate; it need not exactly equal a finite sample's mean highest-third crest-to-trough height.

For a chosen target Hm0, numerically integrate the represented spectrum and multiply its energy by `(Hm0/4)^2/m0`. State whether this normalizes the full continuous spectrum or only retained FFT modes; the latter hides omitted low-frequency energy if not reported separately.

Derived change of variables, with `integral D(theta,w)dtheta=1`:

```
P(kx,kz) = S_w(w(k))*D(theta,w)*abs(dw/dk)/k
dA_k = dkx*dkz
dkx = 2*pi/Lx; dkz = 2*pi/Lz
sum P*dA_k approximates m0
```

P units are m^4. The division by k comes from the polar area Jacobian, not a tunable artistic factor. Apply cascade variance windows `Wc(k)>=0` with `sum Wc(k)=1` over the retained range; multiply amplitudes by `sqrt(Wc)`. Independent random phases in overlapping bands require this variance partition. Correlated phases require a separate covariance analysis.

For deep capillary-gravity waves:

```
w^2 = g*k + (surfaceTension/density)*k^3
dw/dk = [g + 3*(surfaceTension/density)*k^2]/(2*w)
```

Use g=9.81 m/s^2. Example seawater approximations density=1025 kg/m^3, surfaceTension=0.074 N/m give crossover k=368.6214 rad/m, wavelength=0.0170451 m, minimum phase speed=0.230706 m/s. Temperature, salinity, surfactants alter these constants. These are calculated checks, not measurements. JONSWAP's high-frequency extrapolation through this dispersion is not a measured capillary spectrum: use a documented short-wave model or explicitly label it heuristic.

## Fourier normalization and choppiness

Tessendorf gives Gaussian Fourier coefficients, conjugate evolution, spectral derivatives, and a horizontal displacement map. These produce a linear dispersive height field with a geometric nonlinear appearance; they do not produce overturning, air entrainment, dissipative breaking, or Navier-Stokes dynamics. The finite periodic patch also remains periodic. [2]

Use this explicit convention to avoid factor-of-two and FFT normalization bugs:

```
h(x,t) = sum_k H(k,t)*exp(i*k.x)
H(k,t) = a(k)*exp(-i*w*t) + conjugate(a(-k))*exp(i*w*t)
a(k) = 0.5*(N(0,1) + i*N(0,1))*sqrt(P(k)*dA_k)
```

Then `E|a(k)|^2=P(k)*dA_k/2`, and the sum of expected spatial coefficient energies equals `m0`. Independent a(k) and a(-k) are allowed. H(-k)=conjugate(H(k)) at every time. The opposite signs used in some references reverse the meaning of propagation direction; test one traveling wave. A normalized inverse FFT divides by Nx*Nz, so coefficients must be multiplied by Nx*Nz or the output must be compensated exactly once. DC=0. Zero Nyquist lines when spectral odd derivatives are needed; their self-aliasing otherwise breaks realness.

For a positive crest-sharpening parameter q with the convention above, choose `D_hat=i*k/kMag*H`. A cosine height then gives negative sine horizontal displacement, compressing the crest. Tessendorf's written negative-i convention uses an opposite-signed chop multiplier. Verify the crest compression, do not copy a sign blindly.

```
X(x) = x + q*D(x)
A = I + q*gradient(D)
J = det(A)
worldHeightGradient = inverse(transpose(A))*gradient(h)
```

Normals from only the undisplaced gradient are inconsistent with strong chop. `J<0` indicates mapping foldover, not a calibrated physical breaking event. Near-singular A needs controlled chop or a separately modeled breaker; simply clamping the normal is a visual approximation.

## Slopes and glitter

Cox-Munk measured reflected sunlight near Hawaii, including upwind/downwind anisotropy and non-Gaussian corrections. The common clean-surface fit is `MSS=0.003+0.00512*U`, with reported scatter approximately +/-0.004; the historical wind measurement was at 41 feet, approximately 12.5 m. Neutral log-law conversion, if needed, is `U12.5/U10=ln(12.5/z0)/ln(10/z0)`, requiring an explicit roughness-length assumption. Air-sea stability, slicks, wave age, and sampling affect the result. It is not a universal precise U10 calibration. [3][4]

For linear surfaces, slope covariance is derived directly from the spectrum: `Cij=sum ki*kj*P*dA`. Chopped geometry requires measurement of actual transformed slopes. Keep an energy ledger: resolved geometry, resolved shading normals, pixel-filtered slopes, and unresolved tail must contribute each scale once. Do not add full Cox-Munk roughness on top of explicit slopes. Residual covariance should be positive semidefinite; negative eigenvalues indicate a scale budget mismatch, not permission to hide it with a large clamp.

Glints are finite-area solar reflections, not additive random light. NOAA's research-derived explanation describes glints merging into a continuous distant path, dependence on source elevation, wave shadowing near the horizon, and roughness changes under slicks/gusts. Its laser observations also demonstrate the influence of air-sea temperature differences. [5] A finite solar disc plus pixel-footprint slope distribution is essential before temporal filtering. Sparkle history needs rejection distinct from stable diffuse/volume history. A Gaussian slope distribution is a first approximation; do not claim LEAN/LEADR unless moments and footprint integration are actually implemented.

## Breaking, foam, transport

The energetic breaking criterion B at the surface reduces to fluid velocity divided by tracked crest velocity. Barthelemy et al. find imminent breaking near B~0.85 for their fully nonlinear, focused wave packets in deep/intermediate depths. This cannot be honestly claimed by substituting phase speed and the derivative of a choppy FFT texture. Use compression plus crest steepness and positive growth as an acknowledged source heuristic until a local nonlinear breaker model is validated. [6]

Monahan/O Muircheartaigh's robust-biweight empirical fit uses whitecap area fraction (not percent): `W=3.84e-6*U10^3.41`. Values calculated here: U10=5,8,10,12,14 m/s yield 0.0009286,0.0046118,0.0098703,0.018380,0.031091 respectively. Never multiply these by 100 inside a fraction-based shader. The original abstract was available through indexed publisher text; direct publisher access returned 403. [7]

Southern Ocean observations demonstrate sensitivity to threshold and sampling. Twenty-minute records are customary; low coverage requires longer sampling. Observed whitecap reflectivity decay time scales cited there are about 3.5-4.5 s. Their 40-minute coverage estimates ranged 0-0.043; winds above 14 m/s were not sampled. These are conditions from one campaign, not universal limits or storm validation. [8]

Foam should live in a persistent field and solve a transport/source/decay equation. Phase speed is not water current. Surface Lagrangian drift contains Eulerian current plus Stokes drift; instantaneous orbital motion may be added without counting its mean twice. For a directional deep-water gravity variance spectrum:

```
uStokes(z) = integral 2*w*k*kHat*exp(2*k*z)*E(w,theta) dw dtheta
```

Here z<=0 and E is the variance density. The equivalent gravity-wave form is `(2/g)*integral w^3*kHat*exp(2*k*z)*E`. Capillary extension needs reconsideration. Broad frequency and directional distributions matter, and wave-group return flow complicates the mean current; wind-aligned streak noise is not a Langmuir circulation model. [9]

## Water optics

Pope-Fry absorption data were fetched and read at `work/pope97.dat`. Its units are **1/cm**, so multiply by 100 for **1/m**. Representative measured pure-water samples: 450 nm=0.00922 m^-1, 550 nm=0.0565 m^-1, 650 nm=0.340 m^-1. These can seed RGB approximations but are not color-matched spectral integrals. Pure water is not typical ocean water. [10]

NASA's optics protocol distinguishes absorption a, scattering b, beam attenuation c=a+b, and backscatter bb. CDOM/particle contributions are additive; do not equate turbidity with adding the same amount to every color. `T(lambda,d)=exp[-c(lambda)*d]` describes direct-beam transmittance; diffuse attenuation K is not c. Scattered radiance requires illumination and a phase function. A three-channel single-scattering implementation is an explicit approximation; large arbitrary blue emission is not water optics. [11]

## Proposed measurable checks

1. GPU inverse FFT against a double-precision direct DFT at N=8 and 16: impulse, constant, asymmetric complex random, single traveling mode. First target relative RMS <=2e-5 and max absolute error <=1e-4*max(1,RMS(reference)) for f32, no NaN/Inf. Tolerances allow accumulated f32 arithmetic while detecting order/sign/normalization errors. Increase N and report observed scaling. For physically real fields, imaginary RMS <=2e-5*max(real RMS,1e-6).
2. Parseval on the same discrete realization, not the ensemble target: relative variance error <=5e-5 f32. Compare CPU spectral sum with GPU spatial mean-square. Test derivatives analytically with a single known sinusoid; do not finite-difference near-Nyquist waves as truth.
3. JONSWAP integration: independent adaptive/oversampled integration until successive refinements change m0 <0.1%. Discrete retained energy agreement <=1%, or report truncation/quadrature error rather than silently rescale. Hm0 mismatch has half the relative variance error. Peak frequency tolerance must be one local spectral bin plus numerical peak fitting error, not an arbitrary percent.
4. Ensemble validation: >=64 independent seeds initially; report mean, standard error, confidence interval, and effective independent samples. Neighbouring pixels are correlated and cannot count as independent waves. Use seed/domain blocks for bootstrap confidence intervals. Test expectation against the integrated spectrum within its 95% interval; fixed tiny Hm0 error per random seed is unjustified.
5. Slope covariance: compare measured slopes with the discrete spectral covariance for linear chop=0; verify residual+resolved covariance against the target ledger at each LOD. For measured-sea comparison, report Cox-Munk residual alongside historical scatter and sampling uncertainty; never assign PASS from a single snapshot or a point-exact fit. Preserve covariance orientation when wind rotates.
6. Foam transport manufactured solution: periodic constant-current translation with source=decay=0; after one domain crossing require centroid error below one texel, report mass loss and L1 error at two resolutions. Bilinear semi-Lagrangian transport is diffusive; target convergence rather than pretending exact mass conservation. Pure decay must match exp(-t/tau) within 0.2% at 30/60/120 Hz using dt-correct updates. Reject negative density. Coverage comparison needs minutes of simulated stationary state, multiple seeds, area-aware mask, documented threshold, and block confidence intervals.
7. Glitter checks: move finite solar disc, turn direct irradiance off, rotate wind, change resolution and geometry cutoff. Integrated linear-HDR reflected power over an adequate footprint should remain consistent under resolution changes; propose <=5% after a high-sample reference converges <1%. Check crest masking near the horizon. Exposure/tone-map screenshots cannot establish energy conservation. Do not invent an observational tolerance from the Monahan or Cox-Munk fits.
8. Continuity and long run: test periodic boundaries at matching world locations; origin rebasing; 6-hour and 24-hour phase against double precision; camera heights 0.5/2/50/500 m; NaN/Inf scans of readback; min Jacobian; valid texture ranges. Absolute float time eventually loses fast capillary phase precision: maintain double-precision CPU phase epochs or angle-reduced phase, no forced short looping period.
9. Optics: n=1.333 representative interface gives normal-incidence Fresnel ~0.02037; verify grazing limit=1, total internal reflection above the critical angle ~48.61 degrees from underwater normal, and Beer-Lambert transmittance after 1/10/100 m against independent CPU evaluation. RGB wavelengths and n fixed across channels remain approximation.

All checks above are UNVERIFIED until executed against the delivered GPU program. The arithmetic examples in this note were calculated with Node.js, not measured on an RTX GPU.

## Authentic visual reference actually inspected

NOAA Ocean Exploration, **Sun Peeks Through the Clouds**, 2024 Beyond the Blue: Hawai'i Mapping expedition aboard NOAA Ship Okeanos Explorer. Page provenance inspected; full photograph viewed through a browser screenshot on 2026-10-18. [12]

Visible observations: golden sky and bulky shadowed clouds; restrained dark blue-gray sea; irregular medium swells with subordinate short ripples; interrupted warm highlights, no uniform bright stripe under the occluded sun; horizon sharply defined locally but low contrast against cloud shadow. Exact wind, Hm0, viewing height, exposure, spectral radiance, and capture time are unknown. This is a qualitative art-direction reference, not a numerical validation dataset. No simulation comparison was performed by this research subtask. No footage was viewed. No asset incorporated into the application.

## Bibliography and access record

1. Hasselmann et al., 1973, JONSWAP report. Repository abstract and report PDF sections on spectra/mean parameters read. Original report copyright JONSWAP group; no code/assets reused. https://repository.tudelft.nl/record/uuid:f204e188-13b9-49d8-a6dc-4fb7c20562fc ; PDF https://repository.tudelft.nl/file/File_db601bf5-107d-4468-a335-d0cb659853e2
2. Tessendorf, Simulating Ocean Water, course notes 1999-2001. Equations 31-45 and discussion read in ResearchGate's primary document text. Author-hosted PDF timed out. Mathematical implementation original; no source code copied. https://www.researchgate.net/publication/264839743_Simulating_Ocean_Water ; author host https://jtessen.people.clemson.edu/reports/papers_files/coursenotes2002.pdf
3. Cox and Munk, 1954, Statistics of the Sea Surface Derived from Sun Glitter. Original publication landing abstract read, full download not accessible. https://elischolar.library.yale.edu/journal_of_marine_research/814/
4. NASA technical report 19740006157, section 3.1.3 sea-slope statistics, pp.19-20 in PDF, consulted for wind measurement height and scatter. This is an official secondary account of the original Cox-Munk measurements. https://ntrs.nasa.gov/api/citations/19740006157/downloads/19740006157.pdf
5. Joseph A. Shaw, 1999, Glittering Light on Water, NOAA / Optics and Photonics News. Text read including field experiment description and limitations. https://psl.noaa.gov/outreach/education/science/glitter/
6. Barthelemy et al., On a Unified Breaking Onset Threshold for Gravity Waves in Deep and Intermediate Depth Water. Author preprint abstract and HTML read; published JFM 2018. https://arxiv.org/abs/1508.06002 ; https://arxiv.org/html/1508.06002v2
7. Monahan and O Muircheartaigh, 1980, Optimal Power-Law Description of Oceanic Whitecap Coverage Dependence on Wind Speed. Publisher indexed abstract read; direct URL 403, full paper not read. https://journals.ametsoc.org/abstract/journals/phoc/10/12/1520-0485_1980_010_2094_opldoo_2_0_co_2.xml
8. Randolph et al., 2017, Novel Methods for Optically Measuring Whitecaps under Natural Wave-Breaking Conditions in the Southern Ocean. NOAA-hosted original paper PDF, sampling/decay/coverage sections read. https://repository.library.noaa.gov/view/noaa/60518/noaa_60518_DS1.pdf
9. van den Bremer and Breivik, 2018, Stokes Drift. Royal Society review, theoretical spectrum and group-flow sections read through PMC. https://pmc.ncbi.nlm.nih.gov/articles/PMC5740299/
10. Pope and Fry, 1997, Absorption Spectrum (380-700 nm) of Pure Water. Abstract and digitized numerical measurements read from OMLC. Data downloaded for research; not a rendering texture. https://omlc.org/spectra/water/abs/pope97.html ; https://omlc.org/spectra/water/data/pope97.dat
11. NASA/TM-2003-211621/Rev4-Vol.IV, Ocean Optics Protocols, 2003. Chapter 1 and distinction of optical coefficients read. Table page OCR corrupted; no scattering constants transcribed from that broken OCR. https://ntrs.nasa.gov/api/citations/20030093642/downloads/20030093642.pdf
12. NOAA Ocean Exploration, Sun Peeks Through the Clouds, 2024. Page text and photograph inspected, attribution as supplied by NOAA; no image redistribution in application. https://oceanexplorer.noaa.gov/multimedia/sun-peeks-through-the-clouds/ ; full image https://oceanexplorer.noaa.gov/wp-content/uploads/2024/07/okeanos-sun-clouds-hires.jpg
