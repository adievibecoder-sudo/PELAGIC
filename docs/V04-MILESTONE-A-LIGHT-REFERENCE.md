# Cloud self-shadow convergence control

24 October 2026. Milestone A continuation; no owner acceptance or B/C authorization.

The independent authored volume retains broad luminous rims under PELAGIC illumination. Test whether those rims survive dense self-shadow integration before designing a replacement lighting method. Hold density, view integration, phase functions, empirical multiple scattering, ambient illumination, atmosphere, water and exposure fixed. This differs from the rejected five-tap finite-path trial: it is a numerical reference, not a proposed production setting or a remedy for incorrect morphology.

`maLightPath=reference128|reference256|reference512` integrates unfiltered density with uniform midpoints to the parabolic cloud-layer exit. Compare successive original full-scene images at the established fixed phase and camera. Numerical convergence is limited by finite steps, the authored grid, view integration and the retained approximate scattering model. No claim of physically exact radiative transfer follows. Default and rejected `finite` paths remain unchanged.

First control: authored volume, low Sun, near surface. Escalate reference resolution only if image differences justify it. Capture source provenance and actual GPU cost. A costly reference remains diagnostic even if it improves the image. No density or production sample-count change is authorized by this experiment alone.

Result (VIS/TEST): all three 1920x1080 references completed with stable source and no GPU errors. Whole-image mean absolute display-code difference128-to256=0.1241;256-to512=0.04090 out of255. Sky-only256-to512=0.08299, p99=1, max=9. Thus localized residual error remains. Legacy-to512 whole-image difference=2.8896, sky=3.6018. Cloud interior lighting changes, but repeated broad rims and the metallic sea persist. Dense self-shadow integration alone fails the appearance target. It is not adopted.

Fixed-phase timestamp means for128/256/512: total GPU122.45/167.90/308.02 ms; cloud screen84.44/114.42/218.16 ms; environment21.19/38.01/74.34 ms. Ten samples per capture, not sustained benchmarks or an equal-quality optimization. Reference paths allocate no new persistent GPU resources. Original pairs: `v04-ma-light-reference-128-01`, `v04-ma-light-reference-256-01`, `v04-ma-light-reference-512-01`; raw comparison `v04-ma-light-reference-review-01/analysis.json`.

This closes only the proposed sampling explanation in one authored-volume low-Sun view. Scattering, ambient transport, organization, view filtering and photographic quality remain open. No inference that physical multiple scattering is converged follows from this image comparison.
