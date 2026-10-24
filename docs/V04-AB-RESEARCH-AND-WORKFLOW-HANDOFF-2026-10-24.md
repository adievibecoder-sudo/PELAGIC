# PELAGIC 0.4 — Research-to-Implementation Handoff (24 Oct 2026)

**Type:** Preparatory operating document. No rendering work authorized by this document itself.  
**Source branch at preparation:** `development/pelagic-0.4` @ `d4f7d806ffc5cb6ffc88e9aa9637edbfe3b5d574`.  
**Unpublished state:** Owner screenshot reports local `c4185ea`; its code, commits, worktree, packaging and media are **not remotely verified**. Do not describe the source audit as covering that checkpoint.

## 1. Why this exists
Owner's priority is meaningful visual transformation, not repeated "QA PASS / appearance FAIL" reports. The earlier Milestone A convective-cloud experiment reduced repeated placement but failed photographic quality; default image was unchanged and performance regressed. Later *reported local* work indicates converged dense self-shadowing but lingering luminous cloud rims and metallic water, CPU 44/44, GPU FFT 9/9, optics 5/5; publishing/package completion was interrupted. The latest public evidence remains authoritative **for public baseline only**, not for unpublished local work.

The owner has approved the **combined A+B concept** (A: integrated ocean/water/cloud appearance; B: event-linked breaking/foam/spray/weather) but said they will direct the **next execution step after preparation**. No code implementation in this GitHub handoff. Retain separate authorization for Milestone C and release.

## 2. Research decisions to transfer
Use:
- `docs/research/PELAGIC_V04_HARK_PART_II_ACTIONABLE_SYNTHESIS_2026-10-24.md` for the independently scrutinized 20-page Part II digest. Original PDF was supplied in conversation and is not bundled in this documentation-only branch.
- Historical `docs/V04-RESEARCH-INDEX.md`, `docs/V04-RESEARCH-CORRECTIONS.md`, `docs/V04-AAA-TECHNIQUE-DECISIONS.md`, actual source and original measurements.
- The first Hark audit, Argon Part II and prior studies as **competing research proposals**, not mandatory code.

**Preserve validated foundations:** six FFT cascades, phase/spectrum/derivative contracts, slope covariance + finite Sun-disc integration, Fresnel, Hillaire-style atmosphere LUTs, shared environment/clocks, Lagrangian foam labels, camera-relative precision, and real 3050 numerical/evidence work. Presence of these mechanisms does **not** prove visual quality.

**Highest-value current problems:** (i) flat silver glitter / metallic reflective appearance, (ii) wave-scale cues and statistically uniform sea, (iii) cloud morphology/contrast/illumination/optical depth, (iv) disconnected breaking/foam/spray, (v) absence of efficient screen-space cloud/reflection temporal reconstruction, (vi) performance budget and render-image coherence across conditions.

**No blind transfers:** do not add orbital advection to Lagrangian foam; the environment cube already updates one face/frame; AgX is already present; short-wave modulation gradient/product rule exists; multi-tap visible-facet reflections and slope variance already exist. Quantify their *quality*, don't recreate them from scratch.

## 3. Proposed coupled A+B objectives (conditional on owner kickoff)
These are visual goals, not a demand for six serial infrastructure phases:
1. **Water appearance:** visibly reduce foil/gloss while retaining correct mean radiance and meaningful glints, make wave structure readable at both 2 m and 50 m, correct water-body / crest-dependent lighting without arbitrary painted teal.
2. **Cloud and sky:** morphologically varied cumulus/stratus/convective decks, darker optically thick bases where physically appropriate, sunlit tops and thin edges, cloud-aware water environment and realistic atmosphere.
3. **Living sea:** spatially evolving gust/slick/roughness modulation, wave groups and non-obvious long-tile repetition; avoid energy and derivative inconsistencies.
4. **Breaking and foam:** localized justified crest events driving deformed geometry, whitewater, bubble/aeration, correctly transported and aging foam, wind-driven spray.
5. **Weather and time:** fronts, rain, squalls, physically appropriate lightning, low Sun, night, reflections, and coherent transitions; rain must arise from cloud/weather state.
6. **Performance and temporal stability:** selectively introduce jitter/reprojection and fast environment cache alternatives with wave/glint disocclusion guards; profile actual GPU and reject ghosting/latency artifacts.

## 4. Visual-development rules
- Lock the relevant 1080p reference views: daylight + 5-degree low Sun, camera near 2 m and elevated 50 m; share seed, FOV, wind, cloud coverage, simulation time, exposure, camera and shader revision. Include off-light and motion when a result depends on it.
- Change renderer code first after the smallest needed diagnosis. Fast lookdev loop: **edit → run → compare original baseline/reference → refine → preserve/revert**. Do not broaden to a full QA suite and 1.49 GB archive after each unsuccessful shader candidate.
- Reusable tool aids only when they pay off: a simple split-screen/shader flag and locked reference parameters. Avoid building a general-purpose UI or test framework instead of improving the ocean.
- Every substantial successful candidate: show actual modified renderer code, ≥1 substantial image/motion gain, relevant physics guard tests, actual GPU pass times and frame pacing, explicit remaining FAIL/UNVERIFIED. A bad candidate is not silently promoted.
- One visual sprint may touch several coupled shader/compute passes when necessary. Keep coherent boundaries and small, reversible commits. **Owner reviews meaningful integrations**, not every micro-change.
- Do not promise 60 FPS or 30–45 FPS from literature; evaluate actual GPU performance under matched visual quality. Do not assume cloud radiance needs to be expensive just because it was implemented expensively.

## 5. What is still open or uncertain
- Actual cause of large surface-pass cost (E2), excessive low-angle glitter vs body light (E1/E3), and whether discrete stochastic glints are stable (E6).
- Cloud in-body optical-depth distribution and scene-type controls; Part II corrects an area-average cloud-column mistake, but its coefficient proposals need local validation.
- Physical path-length relationship of "thin bright crest" in offshore deep water. An artistic crest mask is not independently established physical transport.
- Aperiodic long-wave proposals and wind/roughness fields must preserve proper statistics across spatial scales, ocean motion and camera changes.
- New TAA and cloud panorama proposals have GPU/motion risks; there are *hypotheses* for savings, not proven PELAGIC costs.
- Local unpublished `c4185ea`, nine historical evidence differences, packaging completion and current owner permissions need verification before integration.

## 6. What happens next
**Preparation only:** Handoff documents staged in a separate branch / draft PR. Do not automatically merge, fetch+reset, cherry-pick, alter user-local work, start tests, modify renderer, or start a new sprint. Await the owner's next instruction for Astra's actual local integration and kickoff.

## 7. Supplementary Argon research
Use `docs/research/PELAGIC_V04_ARGON_VERIFIED_CANDIDATES_2026-10-24.md` as the complementary Part I/II digest: geometry/BRDF energy handoff, per-cascade high-frequency slope balance, visible-facet reflection A/B, plausible water-body radiance, and a lightweight shader comparison loop. It also records duplicated features and unsupported performance predictions. These are **candidates**, not new mandatory phases or validated GPU improvements.
