# Small Hours

A small, expandable browser arcade. The catalog is `index.html`; its first finished game is `signal-run/index.html`.

## Play locally

From the repository root:

```sh
python -m http.server 8765
```

Open `http://localhost:8765/mini-games/`. No build, package install, external fonts, assets, analytics, or services are required. All artwork is CSS or canvas. Opening `index.html` directly also works in browsers that resolve directory links; a local server is recommended for consistent navigation.

## Signal Run

A 60-second lane-switching sprint: collect star signals, avoid orange X obstacles, and survive with three shields. Every wave has a safe lane. The pace increases throughout the run. Stars earn 100 points times the current multiplier; every three consecutive catches raises it, to a maximum of 5×. Misses and hits reset the streak. Collisions resolve once as a wave crosses the courier's center line so immediate lane changes after a catch cannot hit that same wave.

- Left/right arrows or A/D move one lane; canvas clicks/taps and the three buttons select lanes directly.
- P, Escape, or Pause toggle pause. Changing tabs or losing window focus pauses automatically.
- Restart is available during play and pause; Play again starts a fresh run after either ending.
- Personal bests use `small-hours-signal-best` in localStorage. Read/write failures fall back to an in-memory best for the current game-page visit, with an explicit message.
- Reduced motion disables catalog bobbing, decorative track scrolling, and particles. Essential moving game objects remain visible and animated.
- Keyboard focus, labeled controls, non-color shape cues, and live status announcements are included. The real-time canvas game still requires visual perception; it is not a fully nonvisual game.

## Add another game

Give each finished game its own folder and relative entry point. Add another `article.feature` to the collection in `index.html`, with its real link, instructions, session length, and artwork. Update the catalog count. Use a separate localStorage key for each game's best score. Keep unfinished concepts out of the playable collection. Shared catalog styling is in `styles.css`; game-specific styling and logic stay in the game's folder.

## Verification — 2026-09-30

Verified in real headless Chromium with Playwright, served over local HTTP:

- Visually reviewed full-page catalog and game screenshots at desktop 1440×1100 and touch-emulated mobile 390×844; checked 320×740 layout and start-button containment. No horizontal overflow on checked mobile widths.
- Completed a 60-second run using actual keyboard input driven by a read-only observation probe. Survived with three shields and earned a five-digit score. The probe is injected only by the test and is absent from shipped gameplay.
- Completed a three-hit loss using lane-button input; confirmed appropriate win/loss text and Play again behavior.
- Exercised five consecutive restarts, keyboard lane changes, desktop canvas clicks, mobile taps and lane buttons, pause/resume, pause-time freezing, and the window-blur handler.
- Confirmed record persistence across return-to-catalog and game navigation, disabled localStorage reads, and a scored game ending with quota-style write failure.
- Emulated reduced-motion preference and confirmed decorative CSS animation is disabled; reviewed mobile rendering in this mode.
- No page JavaScript errors in the primary desktop/mobile test contexts. `node --check signal-run/game.js` and `git diff --check` passed.

Optional reproducible browser checks (Playwright and Chromium must already be installed): from the repository root, start the server above, then run `node mini-games/tests/browser.cjs`. The script defaults to `/usr/bin/chromium`; override `CHROMIUM_PATH`, `BASE_URL`, or `SCREENSHOT_DIR` as needed. Screenshots default to `/tmp/small-hours-check`. Browser clock advancement accelerates complete-game checks; this verifies game logic and rendering, not human difficulty tuning.

Limitations: no physical-device, Safari, Firefox, or screen-reader testing was performed. Touch input was browser-emulated. The visibility-change handler is implemented; the automated lifecycle check directly exercises the blur handler. No audio or online leaderboard. No website was deployed or GitHub Pages enabled. `motion-showcase/` is unchanged.
