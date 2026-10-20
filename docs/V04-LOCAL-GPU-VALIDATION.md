# PELAGIC 0.4 — Local Codex / Chrome / RTX 3050 Hardware Verification

**Requirement:** Phase 0 must prove the **actual browser rendering device**, not merely the presence of \`node\`, a Windows file path, a listed graphics card, a false fallback flag or a screenshot.

## 1. Determine where code and Chrome actually run

Record the execution host, OS, user session, Chrome executable/location, launch command, visible/headless mode, virtualized/remote status, and whether this is physically the user's Windows desktop machine. Codex may be local while browser automation chooses another Chrome instance; verify the actual renderer session. Never treat cloud/VM or SwiftShader captures as RTX 3050 evidence.

Use **desktop Chrome** in a visible, interactive Windows desktop session for primary acceptance unless a headless session independently demonstrates equivalent RTX 3050 GPU identity and output. No \`--use-gl=swiftshader\`, \`--use-angle=swiftshader\`, \`--enable-unsafe-swiftshader\`, GPU-disabling or artificial software backend flags. Avoid unnecessary experimental flags.

## 2. Run the standalone probe

From the repository root on the actual user PC:

\`\`\`powershell
git branch --show-current
git rev-parse HEAD
node --version
npm start
\`\`\`

In the local Chrome browser open:

\`\`\`text
http://127.0.0.1:8080/tests/webgpu-hardware-probe.html
\`\`\`

Read the JSON evidence displayed by the page and save or copy it. A successful compute readback verifies that **some WebGPU adapter works**; it does not prove a specific hardware device.

Also inspect **\`chrome://gpu\`** in the **same Chrome installation/profile/session**. Record/screenshot:
- **Graphics Feature Status** — WebGPU must report hardware acceleration, not software-only.
- **Driver Information / GPU0 and active device**, including vendor, description and renderer fields.
- Chrome version, ANGLE backend, driver and any blocklist/workaround warnings.

Check whether the actual adapter (vendor/device/description) is consistent with **NVIDIA GeForce RTX 3050 Laptop GPU**. Requesting \`powerPreference:"high-performance"\` does not guarantee selection of a discrete GPU on Windows. If an Intel/AMD integrated adapter appears, classify this as **a hardware adapter, but NOT the RTX 3050 validation target**. If GPUAdapter.info is privacy-redacted or ambiguous, do **not** invent identity: use \`chrome://gpu\` and OS/per-app graphics assignment to corroborate.

**Do not trust \`adapter.info.isFallbackAdapter===false\` as sufficient proof**. Some Chrome implementations have historically reported false regardless of whether fallback adapters were supported. Explicitly check for software identifiers: \`SwiftShader\`, \`llvmpipe\`, \`lavapipe\`, \`WARP\`, \`Microsoft Basic Render Driver\`, \`softpipe\`. A shader that runs successfully can still be on a software backend.

If Chrome selects the wrong GPU, check Windows Settings → System → Display → Graphics → Chrome → Options → High performance, then restart Chrome and probe again. This is configuration guidance, not an assertion that the setting was changed.

## 3. Verify the **PELAGIC renderer**, not only the probe

Launch \`http://127.0.0.1:8080/\` **in the same Chrome session** and inspect the actual PELAGIC adapter log/evidence JSON produced by source \`src/renderer.js\`. Capture an adapter identity matching the probe/Chrome diagnostics, shader errors, WebGPU status, browser version, scene state and quality setting.

A separate probe could select a different GPU from the real PELAGIC renderer. **The actual rendering session must pass**. If it doesn't expose enough adapter metadata, add a narrowly scoped, non-sensitive diagnostic on the 0.4 branch and document the modification. Do not touch the old branches.

## 4. Run a reproducible real-hardware Phase 0 benchmark

Only after the hardware identity is corroborated, and the browser uses native WebGPU:
- Close other substantial GPU applications, set desktop Chrome to a visible foreground tab, and document AC power, resolution, display refresh, adaptive resolution, graphics quality, browser flags and warming period.
- Use the project's existing deterministic captures, \`/tests.html\`, \`/optics.html\`, and display-paced \`benchmark=\` flow; reproduce the 0.3 benchmark conditions and compare a saved baseline.
- Example URL with benchmark query **adapt quality/preset according to the recorded 0.3 command, not guessing the old scene**:

\`\`\`text
http://127.0.0.1:8080/?preset=golden&benchmark=v04-p0-golden-balanced&frames=1800&benchmarkSeconds=120&w=1920&h=1080&adaptive=0&quality=Balanced
\`\`\`

Validate query semantics in current \`src/settings.js\` and \`src/renderer.js\` **before** treating this URL as the canonical matched 0.3 benchmark. Use exact recorded capture conditions for source-to-source performance comparison. Report the actual stop reason, rAF frame intervals, median/p95/p99 stalls and per-pass GPU timestamps; distinguish capture throughput from display-paced FPS. Collect shader/device errors and any 1Hz stall reproduction.

## 5. Verdicts and escalation

A **real RTX 3050 hardware gate** can be marked PASS only with a genuine matching adapter/rendering report, non-software \`chrome://gpu\` evidence and executed GPU tests whose results pass their own contracts. Failing shaders/device loss/performance goals remain FAIL independent of correct hardware identification. If hardware identity is unresolved, mark hardware **UNVERIFIED** and give the owner exact run commands/screenshots/log requirements; continue source/CPU/lookdev investigation without claiming native RTX 3050 PASS.

Avoid sensitive environment data, credential/token uploads or identity claims beyond GPU/OS diagnostics.

**API reference:** GPUAdapter.info (not deprecated requestAdapterInfo), Chrome \`chrome://gpu\`, Chrome WebGPU troubleshooting. Support alone is not proof of local configuration.
