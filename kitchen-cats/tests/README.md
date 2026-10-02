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
node kitchen-cats/tests/pwa.cjs
node kitchen-cats/tests/multiplayer-ui.cjs
node kitchen-cats/tests/rtc.cjs
```

Set `BROWSER_ENGINE=webkit` and `BROWSER_PATH` to the Playwright WebKit executable to run the iOS-like engine suites. The repository workflow runs the responsive, PWA, simulated-transport, and native-RTC checks there when the runner can install WebKit.

Set `BASE_URL` to the Kitchen Cats URL (including its trailing slash) to test another server. The PWA suite always serves an isolated temporary copy so download failure/update tests never modify the product.

- `core.mjs`: cooking, timers, scoring, movement, reset, and session contracts. Its paired in-memory transport is not WebRTC evidence.
- `session-security.mjs`: identity binding, malformed/flood/reordered input and snapshot rejection, ticker cleanup, disconnect, and fresh-peer rejoin.
- `browser.cjs`: real UI actions through a complete solo recipe, results/replay, repeated leave/restart, timer cleanup, landscape bounds, and simultaneous touch contacts. Time is accelerated with Playwright's clock; snapshots are observed without changing gameplay state.
- `responsive.cjs`: real browser layout/accessibility checks at 667x375 and 812x375 landscape, portrait return, no overflow, visible touch targets, and orientation input reset.
- `pwa.cjs`: interrupted first-install recovery, initial caching, warm/cold offline reopening, update during an active shift, failed update recovery, failed first download, and cache/scope isolation.
- `multiplayer-ui.cjs`: two pages using a simulated transport, including guest cooking, score, replay, leave, and re-pairing. This is integration coverage, not proof of native transport.
- `rtc.cjs`: native WebRTC pairing attempt with no ICE servers or media permissions. If the browser produces no candidates, it explicitly reports peer gameplay NOT RUN and checks cleanup/cancellation instead. It never disables network security or requests media access.

Physical iOS/Android installation, notch/safe-area behavior on real hardware, offline cold launch after OS termination, and two phones on a Wi-Fi network without internet remain required device validation. Keep the host foregrounded: backgrounding a playing host closes the session, and guests can return to solo or pair again.
- `cream-animation.test.mjs`: Cream atlas idle/walk/work/celebrate/reduced-motion routing, 200ms movement hold, and presentation reset.

The repository workflow `.github/workflows/kitchen-cats.yml` installs Chromium on a clean runner and runs the executable browser suites. A local run without a browser binary is an environment failure, not a passing browser result.
