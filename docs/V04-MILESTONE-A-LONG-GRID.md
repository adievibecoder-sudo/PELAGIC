# Long-wave domain probe

23 October 2026. Milestone A only. Opt-in `maLongGrid=2207`; default1103 m unchanged. Optional4093 m diagnostic. No cloud, optical, exposure or breaking change.

Observation: broad geometry exists, but elevated wave organization remains weak and Phase0 found1103 m recurrence. Hypothesis: sparse long-wave sampling constrains variation. Smallest test: extend only the first FFT domain while reevaluating density, dispersion and derivatives at the new wavevectors. Same256 square FFT and same band boundary; no wavelength stretching of existing amplitudes. All consumers use the shared domain list, including local origin, coupling and readback.

CPU prediction for the established midday settings: expected Hs2.73214 m becomes2.73175 m; directional slope tensor nearly unchanged. Effective independent long-wave pairs107.66 become433.05. Long-band correlation at1103 m changes from1 to-0.0000101. Recurrence still exists at2207 m; no aperiodicity claim. Analytical continuous target Hs2.72487 m; the remaining approximately0.5% variance excess belongs to discrete quadrature.

Risk: texel spacing doubles, increasing interpolation loss near the unchanged35.2 m short edge of this band. Exact spectral ledger is insufficient; inspect reconstructed geometry, filtered moments, full images, motion and cost.4093 m uses even coarser spatial reconstruction and is only a tradeoff diagnostic. Reject if variation merely rearranges defects or suppresses real wave energy/detail.

Result: rejected for default adoption. The exact uniform-cell bilinear mean-square transfer per axis is `(2+cos(k*dx))/3`. Long-band reconstructed height variance retains97.594% at1103 m,90.983% at2207 m and74.751% at4093 m. Slope variance retains95.652%,84.036%,58.213%. This is a base-level interpolation estimate, before vertex LOD and choppy deformation. More long modes at fixed texture resolution do not preserve the rendered wave field. A later sparse-long-mode or redistributed-band candidate must pass reconstruction, not just Parseval.

Four original views in `v04-ma-long-grid-01` retain the foil/wrinkle character. All GPU spectral checks PASS; elevated-day slope mip checks PASS. Measured independent-cascade Hs2.72077 m and linear slope variance0.0443994 are one realization, not improved naturalism. Settings/camera/time are matched; longer-domain phase realization necessarily differs. Source stable, no GPU errors.

Elevated-day24 s motion in `v04-ma-long-grid-motion-01`;60 s display-paced profile in `v04-ma-long-grid-perf-01`:31.07 FPS,32.10 ms mean GPU,12.01 ms surface,1.45 ms simulation,12.98 ms cloud screen. No fresh matched performance control or speedup claim. No added persistent GPU allocation. Natural-motion acceptance remains UNVERIFIED; this failed reconstruction/appearance gate stops promotion.

CPU outputs in `v04-ma-long-grid-science-01`. Reproduce with `node tests/long-grid-study.mjs evidence/v04-ma-wave-base-01/day-high.json <new-output.json>`. Both grid variants remain diagnostic only.
