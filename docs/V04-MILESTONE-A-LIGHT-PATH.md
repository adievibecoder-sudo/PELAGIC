# Bounded cloud shadow-path experiment

23 October 2026. A continues; B/C unauthorized. `maLightPath=finite` remains opt-in, rejected for adoption.

Observation: cloud rims and weak internal shading persist. The five legacy light taps span 2.173146 km regardless of cloud exit; subsequent samples do not lie at interval midpoints. Hypothesis: integrating to the actual density-layer exit improves self-shadow structure. Test changes only Sun/Moon optical-depth quadrature, preserving density, view rays, scattering, exposure and sea. Risk: five points can still miss obstructing density along a long grazing path.

`src/wgsl/cloud-light-path.js` solves the exit from the same parabolic altitude used by the density function, with stable roots near layer boundaries. Five exponential intervals cover that extent. The same density filter rule is retained. This is an integration experiment, not a morphology replacement or calibrated multiple scattering.

GPU analytical checks PASS: constant/linear relative errors <=2.39e-6; endpoint error <=2.39e-7 km. Actual-field probes compare legacy5/finite5/10/20 against 256/512/1024 unfiltered midpoint integration. 128 positions at each of48/5/0.5 degrees, 40 km region; only11 positions contain density. The sample is limited, not an ensemble or global convergence certificate.

| Sun elevation | Occupied-probe transmission MAE, legacy5 / finite5 | 512 vs1024 reference MAE |
|---|---|---|
|48 degrees|0.02693 /0.01058|0.00000417|
|5 degrees|0.02077 /0.03930|0.0003243|
|0.5 degrees|0.08874 /0.10558|0.006691|

Daylight improves; low-Sun occupied-probe accuracy worsens. Across all positions, finite5 lowers transmission error, but neither method resolves the grazing field. Even the dense0.5-degree reference retains uncertainty. Increasing tap count is a convergence diagnostic, not the proposed production solution.

Original daylight-elevated and low-Sun-near PNG/JSON pairs: `v04-ma-light-path-01`. Source stable, GPU errors empty. VIS: rims, repeated silhouettes, horizon structure and glossy sea persist. This fails the appearance target; no default change. The numerical counterexample stops promotion before a full four-view acceptance campaign.

Low-Sun-near24 s original: `v04-ma-light-path-motion-01`;60 s display-paced RTX3050 profile: `v04-ma-light-path-perf-01`. Mean GPU38.57 ms, cloud screen17.35 ms, environment4.30 ms, surface14.10 ms. No matched fresh control or speedup claim. No added persistent GPU allocation. Broader motion, lunar transport and four-view validation remain UNVERIFIED for this rejected experiment.

Reproduce with the established capture URL plus `maLightPath=finite`, optionally `maLightChecks=1`, using a new exclusive stage. The reported analytic PASS never grants actual-cloud accuracy or visual acceptance.

Wave playback clarification: the first low-Sun-elevated playback decoded657 frames but supplied49 presentation callbacks; the window was subsequently found minimized. `v04-ma-wave-playback-02` repeats it restored:657 callbacks,657 decoded frames, zero drops. The first record remains preserved. The other three first playbacks have one callback per decoded frame and zero drops. No claim of exhaustive perceptual motion review.
