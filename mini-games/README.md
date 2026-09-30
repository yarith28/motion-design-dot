# Small Hours

A small, expandable browser arcade with 70 finished games. The catalog is `index.html`, with working All / Adventure / Reflex / Memory / Puzzle / Strategy filters. Every displayed game is playable.

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

## Afterglow

`afterglow/index.html` is a three-garden ricochet expedition, with its own dusk-purple and peach art direction. Aim a volley of fireflies, use the walls for bank shots, and clear all pods before they descend into the soil. Numbered pods need that many damage points; flower pods burst into their neighbors, while green seeds add a firefly to the next volley. Between gardens choose more fireflies, more damage, or extra rescues. Every garden uses one of six shifted/reflected arrangements. A rescue moves pods back two rows; the run ends when another pod reaches the soil with no rescues left. Clear all three gardens to win.

- Drag or tap the field, use the native angle slider, or press left/right arrows. Shift + arrows fine-tunes aim. Release fireflies, Enter/Space on its button, or Space on the field/slider launches.
- The first returning firefly sets the next launch point. Recall ends the volley early and advances the pods. Volleys automatically return after 12 active seconds to avoid indefinitely trapped trajectories.
- P / Escape and the pause button freeze both aiming and volleys. Blur and tab visibility changes pause automatically. Resume clears accumulated frame time. Restart discards every ball, particle, pending launch, score, and upgrade from the previous expedition.
- Local best uses `small-hours-afterglow-best`, with the shared storage fallback. Points: 10 per damaging collision, 75 per opened pod, 250 per cleared garden, and a completion bonus of 500 plus 150 per unused rescue.
- Optional oscillator-based Web Audio starts only after Sound on. Sound can be turned off at any time and is suspended while paused. Audio failure does not block gameplay. There are no external audio files.
- Reduced motion removes decorative animation, trails, flashes, and particles. The essential ball movement remains. Canvas pixels adapt to device pixel ratio up to 2×; particles are capped at 250; physics uses a fixed 120 Hz step with a capped frame accumulator.
- The visual physics field is not a fully nonvisual game. Controls and status are labeled, but bank-shot geometry requires sight.

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


## Afterglow verification — 2026-09-30

`tests/afterglow.cjs` uses real Chromium and Playwright over local HTTP. It injects a read-only observation probe into the test response, selects angles with the pure physics engine, and completes actual browser expeditions through the UI. No probe or auto-player is shipped in the game. The engine has a deterministic API so trajectories and edge cases can be inspected independently.

Verified full three-garden victories on desktop and touch-emulated mobile, both upgrade transitions, all three upgrade choices across runs, the rescue and loss paths, five mid-volley restarts, new runs from both ending and pause states, arrow-key aiming, native slider keys, pointer dragging, touch aiming, keyboard launch, recall, best-score persistence, and catalog navigation. Paused ball state remained unchanged after three simulated seconds. Blur and visibility-change handlers were exercised. Sound was confirmed off with no AudioContext before opt-in, then toggled on/off without JavaScript errors. The mobile suite completed runs with reduced motion, blocked storage reads, and quota-style write failures; it checked 390px and 320px layouts and panel containment.

Reviewed desktop, mobile, in-flight, upgrade, victory, and loss screenshots. A 90-frame real-time headless desktop sample averaged approximately 16.7 ms per frame (about 60 fps); this is a local smoke measurement, not a physical-device performance guarantee. The prior collection and Signal Run suites were rerun successfully; the catalog expectations now reflect five games and the Adventure filter. The standalone `node mini-games/tests/afterglow-engine.cjs` check also passed 162 trajectories across 18 garden arrangements, including near-horizontal and vertical launches, finite positions, bounded launches, and guaranteed volley return. The root redirect and Space-to-launch while the angle slider is focused were checked separately.

Run `node mini-games/tests/afterglow.cjs` with Playwright and Chromium installed. Its default local server URL is `http://127.0.0.1:8781`; override `BASE_URL`, `CHROMIUM_PATH`, and `SCREENSHOT_DIR` as needed. Screenshots default to `/tmp/small-hours-afterglow`. Touch was emulated; no Safari, Firefox, physical-device, screen-reader, or audible speaker-quality testing was performed. Automated angle selection verifies mechanics and completion, not human difficulty.

## GitHub Pages deployment

Pages was enabled from **main / (root)** on 2026-09-30. GitHub's initial Pages build and deployment completed successfully for `c96922fd4b2b1ec2c129f4bb74da8811f2a09fe0`. The root `index.html` redirects to `mini-games/`, and `.nojekyll` preserves the browser-native files without a build transformation.

- Catalog: https://yarith28.github.io/motion-design-dot/mini-games/
- Afterglow: https://yarith28.github.io/motion-design-dot/mini-games/afterglow/

`.github/workflows/verify-pages.yml` runs `tests/live-pages.cjs` against the actual published site from a GitHub-hosted runner. It waits for 23 published files to match source byte-for-byte, checks the root redirect and category filters, loads every game on desktop and touch-emulated mobile, exercises each game's controls and Afterglow's aim/launch/pause/recall/restart flow, and saves screenshots plus a JSON report as workflow artifacts. It uses no game-state probes or response rewriting. The execution workspace itself blocks `github.io` network access, so these live checks run in Actions. The workflow has read-only repository permissions and no deployment credentials; it only tests the public site. No custom domain, DNS, or paid hosting was configured.

## Catalog views — 2026-09-30

The catalog defaults to Grid. The labeled Grid / List buttons switch between poster cards and compact illustrated rows while preserving the active category filter. The selection is saved under `small-hours-catalog-view`; unavailable storage leaves the switch functional without persistence.

The live-page browser suite now checks both views on desktop and touch-emulated mobile, Enter/Space operation, pressed states, filtering, reload and return-navigation persistence, 390px and 320px containment, reduced motion, blocked storage reads, and failed storage writes. Local Chromium checks passed along with all five games' desktop/mobile smoke checks and source-asset comparisons. Screenshots of both list layouts were reviewed. Physical devices, other browser engines, and screen readers were not tested.


## Five more pocket worlds — local verification, 2026-09-30

These additions are implemented and verified locally. This verification does not establish a deployed version; no commit, push, or deployment was performed for this expansion while publication authorization was pending.

| Game | Play | Progression and record |
| --- | --- | --- |
| Lantern Lines | Tap a lantern to flip it and its orthogonal neighbors; put every light to sleep. Arrow keys move focus, Enter/Space toggles. Undo, chapter retry and constructive hints are included. | Three generated 3×3 / 4×4 / 5×5 chapters. Legal-toggle generation guarantees a solution. Fewest total moves. |
| Tide Pool | Choose a color/shape with buttons or keys 1–5 to absorb neighboring sea glass from the top-left region. | Three 6×6 / 7×7 / 8×8 pools. A computed greedy solution plus three spare moves certifies each budget. Same-pool retry on loss; highest expedition score. |
| Word Weave | Arrange shuffled letters to match a clue. Tap tiles or type letters; Backspace removes, Enter checks. Optional hints repair the next letter. | Five clues randomly chosen from twenty, including repeated-letter words. Each word starts at 100 points; hints cost 20, wrong answers cost 10, minimum 20. Highest five-word score. |
| Sky Stack | Drop moving slabs onto the tower with the button or Space. Overhangs are trimmed; close alignment restores a little width. | Twelve floors to win; zero overlap ends a build. Escalating speed, perfect-fit bonuses, highest score. P/Escape or Pause freezes play; blur/hidden-tab events also pause. |
| Pebble Post | Push parcels onto stamps with arrows/WASD or touch directions. Undo with Z; reset the stop or the whole route. | Five handcrafted stops, independently solved pars 1 / 2 / 10 / 14 / 20. Fewest total moves, route par 47. Undo remains available after completion. |

Each new game uses optional local records via the existing shared storage helper. Read/write failures preserve the current visit's record and display the fallback note. The four turn-based games have no countdown or delayed gameplay callbacks, so leaving the tab does not penalize the player. Sky Stack resets its frame timestamp on resume and cancels old animation frames on restart. Reduced-motion settings remove decorative motion while retaining essential moving slabs.

### Browser checks performed

- Each new game completed its entire progression through actual UI input on desktop and touch-emulated mobile Chromium. Tests cover repeated restart, replay, completion, navigation, keyboard operation, blocked storage reads and failed writes, saved-record reloads, and 320px containment. Screenshots were inspected.
- Lantern Lines: all three chapters, hints, undo, retry, roving arrow-key focus, and persisted fewest-moves record.
- Tide Pool: all three pools, deliberate budget exhaustion and same-board retry, certified greedy routes, and constant-RNG generation edge case. Shape labels accompany colors.
- Word Weave: all five clues, duplicate letters, wrong guesses, hint correction, physical typing/Backspace/Enter, focus retention after tile selection/removal, and mobile letter-bank targets of at least 44px.
- Sky Stack: twelve-floor wins on desktop and mobile, deliberate loss/trim, pause-time freeze, blur handling, repeated restart, and actual touch drops.
- Pebble Post: independent breadth-first search of rendered boards proved all five pars; actual inputs completed the route. Blocked moves/pushes, undo after wins, and next-action focus were verified.
- Catalog: ten working game links; truthful category counts (Adventure 1 / Reflex 3 / Memory 1 / Puzzle 3 / Strategy 2); Grid/List toggle, filter retention, view persistence, keyboard, reduced motion, storage failures, 390px and 320px overflow checks. All ten game pages passed desktop/mobile smoke checks with no page or asset errors. Thirty-eight HTML/CSS/JS responses matched local source.
- Existing Signal Run, collection, Afterglow browser suites and 162-trajectory Afterglow engine checks passed. The timing-test clock is explicitly paused during precise Orbit input to prevent real-time actionability delays from affecting simulated timing. Existing game source and `motion-showcase/` were not changed.

Reproduce against a local server using `BASE_URL=http://127.0.0.1:8790 node mini-games/tests/<slug>.cjs`, where `<slug>` is `lantern-lines`, `tide-pool`, `word-weave`, `sky-stack`, or `pebble-post`. Existing regression suites accept the same `BASE_URL`. For the complete catalog smoke/asset suite use `LIVE_BASE_URL=http://127.0.0.1:8790 CHROMIUM_PATH=/usr/bin/chromium node mini-games/tests/live-pages.cjs`. Playwright and Chromium are test-only dependencies; the games need no installation or build.

Limitations: Chromium only, with emulated touch; no physical devices, Safari, Firefox, or screen-reader verification. Solver/ideal-input runs validate rules and completions, not human difficulty. The spatial games still rely on visual board interpretation despite labeled controls/status. No new audio is included.


## Spatial Room release batch

Fifteen distinct spatial games join the original ten. The family manifest `spatial-room/games.json` documents each mechanic and route; `coverage/spatial-room.json` records all thirty full desktop/mobile completions. Tests include actual legal input, restart, invalid routes and transfers, keyboard focus, blocked storage, reduced motion, and 320px bounds. Shadow Turn, Pigment Lab, and Stamp Studio each contain three authored studies; the other spatial games are finite authored puzzles. An independent visual review corrected stamp label escaping and restored the shared brand header.

Catalog search supports titles, mechanics and controls, combines with category filters, and offers clear empty results. The Grid/List choice continues to persist. Catalog previews show actual game boards. `tools/build-catalog.cjs` generates static cards from explicitly selected verified room manifests; no build is required to play. `inventory.json` is the playable inventory, while `inventory-plan.json` is the larger work plan and does not make planned entries playable. `progress.json` retains the last verified deployment and current batch state.


## Logic Room release batch

Fifteen logic games passed thirty desktop/mobile completion cases and independent rule review. Validators reject disconnected bridge networks, separate closed loops, and tents incorrectly sharing a tree. Seating clues are indirect and independently checked across all 120 permutations for uniqueness. Keyboard grid navigation and accessible filled/empty states were checked. Evidence: `coverage/logic-room.json` and `tests/logic-room.cjs`.

This batch also fixes three spatial review findings: a rover program that reaches its destination then hits a wall must fail; exhausted orbital routes keep their stranded feedback and disable travel; completion retains keyboard focus on Play again. The precise counterexamples are in `tests/spatial-room-edges.cjs`. Signal Run additionally completed a full touch-mobile win with all shields and restart, recorded in `coverage/signal-mobile.json`.


## Number Room release batch

Fifteen different number mechanics include card-expression building, merge-once sliding tiles, binary switches, rational balance and packing, physical matchstick relocation, modular jumps, grouping precedence, logarithmic estimation, ratio pouring and constrained shopping. Every game completed all its chapters on desktop and mobile; the shortest formats contain five chapters. Arithmetic targets, merge rules, invalid operations and accessible focus/selection were checked independently. Evidence: `coverage/number-room.json`; test: `tests/number-room.cjs`. No test hook ships in the games.


## Word Room release batch

Fifteen word games use distinct deduction, transformation, ordering, decoding and language mechanics. All completed on desktop and touch-mobile, including multi-chapter rounds, keyboard input, repeated restart, blocked storage and reduced motion. Independent review removed ambiguous compound pairings and corrected an invalid spelling challenge. Evidence: `coverage/word-room.json`, `tests/word-room.cjs` and `tests/word-room-edges.cjs`. The live catalog suite also passed all 70 entries locally.
