# Phase 1 laboratory decisions

Baseline source: de7b32b1c88e025f1d9f815039ee004cd6eb44a0. Separate source archive on port 8081; the added laboratory HTML drives unchanged renderer/shaders. New captures use a new directory. Frozen Phase 0 evidence is untouched.

## Falsifiable changes

1. SRC: volumeWater uses clear zenith radiance and unshadowed direct light. Replace only its inputs with existing cloud-aware irradiance and shadow textures. L1/L3 underwater pairs must darken under covered sun at identical exposure, without a new optical model.
2. SRC: ENV_CUBE reads previous irradiance made from ENV_CUBE. Remove that feedback. Use a first reflected sky bounce below the horizon; omit the small water-body contribution there rather than feed it recursively. L4 null and repeated frames test bounded, stationary output. Relative RGB radiance only, no absolute calibration.
3. SRC: presets reset foam; advection uses instantaneous wind times elapsed wave time. Introduce a deterministic environment owner with independent clocks, integrated drift, persistent remote swell and explicit natural/instant commands. Test timestep partition, snapshot restore, front coordinates and source phase/reset paths.
4. Candidate: one analytic 20 km regional event, sampled in CPU/WGSL. It needs no map allocation/update; compare to bilinear grid evaluation and record error/cost. This is a bounded scenario model, not NWP. Regional coverage/type/precipitation share one support field. Electrical eligibility requires an independent flag.
5. Cache experiment: freeze state during angular-cache construction, publish complete radiance/irradiance versions together. Preserve spatial reflection and baseline resolution. Measure latency and GPU overhead; do not claim instantaneous global illumination.

Existing cloud morphology, radiative integrator, spectra, breaking and waterline remain Phase 0 quality. Mixed cloud-type parameters are a transition approximation, not a new cloud family or meteorological validation.

Evidence: phase1.html drives matched 1920x1080 captures. CPU tests precede GPU compilation; actual renderer adapter must remain NVIDIA/Ampere. Performance samples include rAF, submit/readback delay, split passes and visibility; software correctness is not hardware validation. Final user visual acceptance remains required.
