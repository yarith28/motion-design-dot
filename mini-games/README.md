# Small Hours

A small, expandable browser arcade with four finished games. The catalog is `index.html`, with working All / Reflex / Memory / Puzzle filters. Every displayed game is playable.

## Play locally

From the repository root:

```sh
python -m http.server 8765
```

Open `http://localhost:8765/mini-games/`. No build, package install, external fonts, assets, analytics, or services are required. All artwork is CSS, inline SVG, or canvas. Opening `index.html` directly also works in browsers that resolve directory links; a local server is recommended for consistent navigation.

## Signal Run

A 60-second lane-switching sprint: collect star signals, avoid orange X obstacles, and survive with three shields. Every wave has a safe lane. The pace increases throughout the run. Stars earn 100 points times the current multiplier; every three consecutive catches raises it, to a maximum of 5×. Misses and hits reset the streak. Collisions resolve once as a wave crosses the courier's center line so immediate lane changes after a catch cannot hit that same wave.

- Left/right arrows or A/D move one lane; canvas clicks/taps and the three buttons select lanes directly.
- P, Escape, or Pause toggle pause. Changing tabs or losing window focus pauses automatically.
- Restart is available during play and pause; Play again starts a fresh run after either ending.
- Personal bests use `small-hours-signal-best` in localStorage. Read/write failures fall back to an in-memory best for the current game-page visit, with an explicit message.
- Reduced motion disables catalog bobbing, decorative track scrolling, and particles. Essential moving game objects remain visible and animated.
- Keyboard focus, labeled controls, non-color shape cues, and live status announcements are included. The real-time canvas game still requires visual perception; it is not a fully nonvisual game.

## Double Take

`double-take/index.html` is a relaxed 4×4 memory game with eight pairs of geometric symbols. Cards have distinct shapes and spoken names; use taps, clicks, or arrow-key focus plus Enter / Space. Pair attempts count as turns, with precision feedback and a fewest-turns record (`small-hours-double-take-best`). There is no timer. Duplicate-card input and input during mismatches are ignored. Restart clears the pending mismatch timeout and invalidates old callbacks before shuffling.

## Pocket Orbit

`pocket-orbit/index.html` is an eight-round timing challenge. Stop a courier dot inside the marked arc using the Lock orbit button or Space. Mouse and touch lock on pointer contact, avoiding release latency. A hit earns 40–100 points based on distance from the center notch. The arc gradually narrows and the dot speeds up; three misses end the run. P / Escape or the Pause button freezes both movement and between-round feedback. Blur and tab visibility changes pause automatically; resuming resets the animation timestamp so background time is never charged to the player. Restart resets all round state. The high score uses `small-hours-pocket-orbit-best`.

## Good Order

`good-order/index.html` is an untimed eight-tile sliding puzzle. Tap a neighboring tile, or use arrow keys to move the empty space. Arrange 1–8 in reading order, leaving the bottom-right space empty. The generator walks 32 legal moves from the solved position, never immediately reversing its previous move, and makes another move if it lands on the goal. Thus every starting position is solvable and unsolved. Show goal overlays a reference and prevents moves while open. The record (`small-hours-good-order-best`) is the fewest moves across completed random puzzles; puzzle difficulty varies, so this is a casual personal record, not a ranked comparison.

## Shared behavior

The three tabletop games share `play.css` and `common.js`, without changing Signal Run's files. They include completion feedback, restart / play again, catalog navigation, keyboard focus, live status messages, and optional local records with in-memory fallback on read or write failure. Reduced motion removes CSS animation and transitions; Pocket Orbit's essential timing motion remains. Memory and puzzle controls expose their state in labeled HTML buttons. Pocket Orbit, like Signal Run, requires visual perception.

## Add another game

Give each finished game its own folder and relative entry point. Add another `article.game-card` to the `.shelf` collection in `index.html`, with its real link, category (`data-category`), instructions, session length, and artwork. The original feature can stay prominent. Update the initial catalog total and filter badge counts; `catalog.js` computes the visible count on filtering. Use a separate localStorage key for each game's best score. Keep unfinished concepts out of the playable collection. Shared catalog styling is in `styles.css`; game-specific styling and logic stay in the game's folder.

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


## Expanded collection verification — 2026-09-30

The optional `tests/collection.cjs` suite runs in real headless Chromium with Playwright and a local HTTP server. It injects read-only game-state probes into test responses; the delivered game code contains no probes, solvers, or test shortcuts. All completions use actual keyboard, click, or touch input. Browser clock advancement makes timing tests reproducible and fast.

Checks performed:

- Catalog: four playable links, accurate category filtering (4 / 2 / 1 / 1), and desktop/mobile screenshots.
- Double Take: complete eight-turn round; duplicate-card input; a third tap during a pending mismatch; normal mismatch timeout recovery; restart before the mismatch timer fires; repeated restarts; keyboard focus navigation; Play again; persistent personal best.
- Good Order: 25 unsolved generated positions checked for even inversion parity; a breadth-first solver independently found a path for each played puzzle; real tile inputs completed puzzles. Arrow-key moves, goal-overlay input blocking, repeated shuffles, completion, Play again, and record persistence were exercised.
- Pocket Orbit: all eight rounds completed with zero misses, three-miss ending, Space input, repeated restarts, Play again, persisted high score, paused angle and between-round timer remaining frozen, and blur / visibility-change handlers.
- Touch-emulated mobile: completed all three games with reduced motion enabled, once with storage reads blocked and once with writes throwing quota-style errors. Restarted and returned to the catalog after completion. Checked horizontal overflow at 390px and 320px widths.
- Reviewed screenshots at desktop 1440×1100 and mobile 390×844. Reduced-motion catalog animations were confirmed disabled. No JavaScript page errors were recorded by the collection suite.
- Re-ran the original Signal Run browser suite: a 60-second win with 29,500 points and three shields, a loss, restarts, navigation, storage fallback, and mobile controls passed.

Run `node mini-games/tests/collection.cjs` after starting the local server. It supports the same `BASE_URL`, `CHROMIUM_PATH`, and `SCREENSHOT_DIR` overrides as the original suite; screenshots default to `/tmp/small-hours-collection`. No runtime dependencies or build step were added. Verification used Chromium with emulated touch, not physical devices, Safari, Firefox, or a screen reader. Automated ideal-input runs do not measure human difficulty. No website deployment or Pages changes were made.
