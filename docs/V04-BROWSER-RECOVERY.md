# Browser recovery - 22 October 2026

Scope: Phase 1 validation on the existing local Google Chrome. No security settings, extension permissions, native-host files or browser processes were changed.

## Verified findings

- Earlier automation used the Chrome extension connection (browser ID 3). Later attempts used Windows Computer Use, which stopped because it could not verify the active browser URL. That error does not establish a failure of PELAGIC navigation or WebGPU.
- The current session initially had no browser binding. The installed Chrome/browser skill directories were empty. A retained older bootstrap example expected a global `agent`; the current public `setupBrowserRuntime()` returns the Agent object. Capturing that return value restored discovery. No browser-service internals or alternate transport were used.
- Official read-only diagnostics initially ran inside the Windows sandbox. They examined a sandbox-local Chrome profile and could not read the real process list/registry. Repeating the same supported diagnostics with approved host access found Chrome running, extension enabled in Default, and a correct native-host manifest/registry/origin registration. The sandbox failures were not evidence of broken installation.
- Extension discovery returned Chrome ID 3 and a distinct in-app browser ID 2. Chrome had a real localhost environment-test tab, plus the retained final-capture laboratory tab. The most recently accessed tab was an unrelated chat. Claiming the exact localhost tab succeeded and returned its expected URL and test output.
- The containing Chrome window was minimized; the test tab was inactive. Restoring that window through the documented management API succeeded. `tabs.update({active:true})` was rejected as unsupported; it was not retried through another API. A new validation tab was subsequently created through the standard tabs API.
- Full-page `Page.captureScreenshot` timed out. The documented accessibility screenshot method succeeded; its JPEG is retained separately from renderer PNGs. This is a capture-method limitation, not a rendered-image comparison.

## Supported recovery

Reuse a healthy browser binding. For a genuinely fresh session, import the official plugin's absolute `scripts/browser-client.mjs` through the supported Node tool, assign the return from `setupBrowserRuntime()` to `agent`, then discover browsers. Select the returned Chrome entry and read its documentation. Claim the exact returned localhost tab or create a new validation tab. Verify URL and page state before proceeding. Do not substitute ambient in-app browser context for Chrome identity.

Official diagnostic commands, run in the Chrome plugin root against the real user profile:

```text
node scripts/chrome-is-running.js --browser chrome --check
node scripts/installed-browsers.js --json
node scripts/check-extension-installed.js --browser chrome --json
node scripts/check-native-host-manifest.js --browser chrome --json
```

The supported `open-chrome-window.js` dry-run selected Default correctly; no launch was needed. No Chrome or development-server restart occurred. No native-host repair, remote-debugging launch, security bypass, or direct CDP transport was introduced.

## Fresh verification

`evidence/v04-p1-recovered-tests` contains newly initiated checks through the verified Chrome connection. Regional CPU/WGSL agreement passed 4 x 1024 samples, maximum error 4.948281455474657e-6 against 2e-5 tolerance; all nine retained FFT checks and all five optical groups passed, zero reported GPU errors. Adapter: NVIDIA/Ampere; Chrome reports version 156. Device name is privacy-redacted. RTX model corroboration and renderer-specific measurements are recorded separately; generic adapter identity is not an exact device-name query.

The existing `v04-p1-desktop-tests` result predated this recovery and was already visible in the Chrome tab. It was inspected, not overwritten. The original `v04-p1-final-stills` captures remain untouched.

The exact internal reason Windows Computer Use failed its URL-confidence check remains UNVERIFIED. Wrong active target and minimized state were observed; they are not proof of the safety implementation's internal cause. The supported extension workflow now verifies the intended tab directly.
