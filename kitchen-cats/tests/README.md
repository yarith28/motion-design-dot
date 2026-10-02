# Kitchen Cats regression checks

Requires Node, Python, Playwright, and a supported browser. Install browser test dependencies outside the repository if they are not already available:

```sh
npm install --prefix /tmp/kitchen-tests playwright@1.55.0
export NODE_PATH=/tmp/kitchen-tests/node_modules
export CHROMIUM_PATH=/usr/bin/chromium
python3 -m http.server 8000 --bind 127.0.0.1
```

In another terminal, from the repository root:

```sh
cd kitchen-cats
npm test
cd ..
node kitchen-cats/tests/core.mjs
node kitchen-cats/tests/session-security.mjs
node kitchen-cats/tests/browser.cjs
node kitchen-cats/tests/qr-pairing.cjs
node kitchen-cats/tests/qr-camera.cjs
node kitchen-cats/tests/pwa.cjs
node kitchen-cats/tests/multiplayer-ui.cjs
node kitchen-cats/tests/rtc.cjs
```

Set `BROWSER_ENGINE=webkit` and `BROWSER_PATH` to the Playwright WebKit executable to run the iOS-like engine suites. The repository workflow runs the responsive, QR image-decoding, PWA, simulated-transport, and native-RTC checks there when the runner can install WebKit. If Playwright/WebKit itself reports an internal error during the offline service-worker cold reopen, that one gate is explicitly logged as `UNTESTED`, never as a product pass; Chromium remains the PWA gate.

Set `BASE_URL` to the Kitchen Cats URL (including its trailing slash) to test another server. The PWA suite always serves an isolated temporary copy so download failure/update tests never modify the product.

- `core.mjs`: cooking, timers, scoring, movement, reset, and session contracts. Its paired in-memory transport is not WebRTC evidence.
- `session-security.mjs`: identity binding, malformed/flood/reordered input and snapshot rejection, ticker cleanup, disconnect, and fresh-peer rejoin.
- `browser.cjs`: real UI actions through a complete solo recipe, results/replay, repeated leave/restart, timer cleanup, landscape bounds, and simultaneous touch contacts. Time is accelerated with Playwright's clock; snapshots are observed without changing gameplay state.
- `responsive.cjs`: real browser layout/accessibility checks at 667x375 and 812x375 landscape, portrait return, no overflow, visible touch targets, and orientation input reset.
- `qr-pairing.test.mjs` and `qr-pairing.cjs`: bounded versioned QR framing and CRC, actual browser QR image encode/decode roundtrips for realistic long offer/answer SDP, corrupted/unrelated rejection, repeated cancel/retry, and camera-track cleanup. The browser gate also feeds rendered QR pixels through `canvas.captureStream()` into the real live camera decoder; camera starts only from the explicit Scan button, requests video only with the rear-camera preference, and stops tracks on cleanup. Permission behavior and physical phone scanning remain device validation.
- `qr-camera.cjs`: real rendered pixels with hidden-preview startup, injected frame-callback stalls, off-center QR placement, rapid restart, late permission, rejected consumer callbacks, rejected/hung decoder operations, and temporarily unready video. A UI check holds a repeated partial QR, waits for recovery guidance, restarts, and verifies saved-frame progress. These are fault regressions, not physical camera or transport validation.
- `pwa.cjs`: interrupted first-install recovery, initial caching, warm/cold offline reopening, update during an active shift, failed update recovery, failed first download, and cache/scope isolation.
- `multiplayer-ui.cjs`: two pages using a simulated transport, including guest cooking, score, replay, leave, and re-pairing. This is integration coverage, not proof of native transport.
- `rtc.cjs`: native WebRTC pairing attempt with no ICE servers or media permissions. If the browser produces no candidates, it explicitly reports peer gameplay NOT RUN and checks cleanup/cancellation instead. It never disables network security or requests media access.

Physical iOS/Android installation, notch/safe-area behavior on real hardware, offline cold launch after OS termination, and two phones on a Wi-Fi network without internet remain required device validation. Keep the host foregrounded: backgrounding a playing host closes the session, and guests can return to solo or pair again.
- `cream-animation.test.mjs`: Cream atlas idle/walk/work/celebrate/reduced-motion routing, 200ms movement hold, and presentation reset.

The repository workflow `.github/workflows/kitchen-cats.yml` installs Chromium on a clean runner and runs the executable browser suites. A local run without a browser binary is an environment failure, not a passing browser result.

## r25 camera recovery evidence

Against remote r24 (`200036f`), eight new lifecycle/decoder cases failed: a hidden video was styled to zero size and opacity on startup; frame callbacks stopped after the first frame; off-center codes were excluded; a prior scanner's delayed cleanup stopped a restarted stream; late camera permission unhid a cancelled preview; consumer rejection was unhandled; decoder rejection and timeout prevented subsequent collection. All eight pass with r25 in local Chromium. The readiness case passed before and remains a guard. The duplicate-progress/retry UI test also fails r24 and passes r25.

The live wrapper now owns video-only camera acquisition and immediate, session-scoped cleanup, with a bounded asynchronous decoder and jsQR pixel fallback. Its timer-driven loop does not depend on video-frame callback delivery. It alternates the full video view and a center crop at up to 960 pixels, and the preview uses `contain`. Restart keeps the assembler; only fresh pairing resets collected frames. Six seconds without a new frame shows short recovery guidance.

These reproduced browser failure modes are plausible contributors, not a confirmed diagnosis of the user's unknown device. Physical-camera optics, autofocus, exposure, and two physical devices remain untested. Local native ICE gathering was unavailable and local WebKit download returned HTTP 403; use the exact commit's CI logs for native-pairing and WebKit evidence. WebKit offline cold reopen remains untested if the documented engine internal error occurs.
