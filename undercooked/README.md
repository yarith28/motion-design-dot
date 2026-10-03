# Undercooked

An original single-player 3D soup kitchen, built with Three.js. One chef, two pots, and a three minute lunch rush.

Play at **https://yarith28.github.io/motion-design-dot/undercooked/**.

## Play

- Move with **WASD / arrows**, or the phone thumbstick.
- Use **E / Space**, or the orange action button, at a highlighted station.
- Take a vegetable, chop it at the board, pick it up, and add it to a pot.
- Take a clean plate while the soup simmers. Fill it when the pot turns green, then serve a matching ticket.
- Garden soup needs one chopped tomato and one chopped mushroom in the same pot.
- The middle counters hold items. Compost unwanted items. Act at a burnt pot to clear it.
- **Escape** pauses. Switching away from the game also pauses and clears movement input.

Tickets expire after 80–95 seconds. Ready soup has a 17 second grace period before burning. Each correct order earns 100 points, a speed tip, and a chain bonus. Star targets are **200 / 500 / 800** points. Best scores and sound preferences stay in this browser.

## Build and run

Requires Node.js 20 or newer. All runtime dependencies are bundled locally; there are no external runtime requests or CDN scripts.

```sh
cd undercooked
npm ci
npm run build
python3 -m http.server 8790
```

Open `http://localhost:8790/`. The committed `assets/game.js` is the deployable build, so GitHub Pages can serve this directory directly.

## Verification

```sh
npm test
CHROMIUM_PATH=/path/to/chromium npm run test:browser
```

Browser tests require Playwright 1.55.0 or newer, installed separately. They drive the real keyboard and native Chromium touch input. A read-only game snapshot helps verify outcomes; it cannot change the game. Playwright’s browser clock advances animation frames and the same production physics loop, allowing complete 180 second shifts to be tested without waiting three minutes per case.

The browser suite covers repeated complete orders, both pots, garden soup, incorrect serving, collision, set down/pickup/compost, focus loss, results, replay, paused restart, native simultaneous touch and cancellation, four viewport sizes, reduced motion, and a WebGL recovery screen. Screenshots and reports go in ignored `test-results/`. CI rebuilds, checks bundle reproducibility, and runs the same gates.

The UI supports landscape phone sizes including 568×320, 667×375, and 844×390, with a playable portrait layout. Fullscreen appears where supported. A current browser with WebGL2 is required by Three.js r170.

Static original meshes are batched by material. Hardware rendering uses soft shadows and a capped pixel ratio; software rendering uses smaller shadow maps and a lower render resolution to keep the same 3D gameplay responsive. HTML controls stay at native resolution.

## Original assets and dependencies

Every chef, food, kitchen, utensil, plant, and decorative model is original procedural 3D geometry in `src/kitchen.js`. UI food icons and the app mark are original SVG drawings. There are no borrowed art assets, baked game sprites, stock models, or proprietary levels. The scene uses a live orthographic 3D camera, standard materials, lights, dynamic shadows, and animated meshes.

- Three.js **0.170.0**, MIT: [license](assets/THREE-LICENSE.txt)
- esbuild **0.24.2**, MIT: build tool only
- Playwright **1.55.0**, Apache-2.0: CI test tool only

The game is broadly inspired by cooperative cooking games, with original branding, assets, and a layout designed for one player. No multiplayer or paid infrastructure is used.
