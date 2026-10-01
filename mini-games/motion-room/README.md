# Motion Room

Twenty-four games, C01–C25 excluding rejected C16. Each game has three studies, native named controls, touch controls, visible state descriptions, a current-study retry and a full restart. Physics advances only through deliberate input. Keyboard shortcuts apply when the board has focus; native buttons retain normal Tab/Enter/Space behavior.

The host is `index.html`, `room.js`, `room.css` and `shared.js`; `games.json` contains player-facing metadata. Engines are grouped in `packing.js`, `navigation.js`, `physics.js` and `tactics.js`. The original 200 games are not modified by this room.

## Corrections driven by independent play

- C02 has a meaningful swap budget and layered targets; C03 later canopies require setup, held-color choices and bank shots.
- C08 uses axial structural equilibrium with tension-only cables. A final uplift load defeats the earlier all-purpose layout; slack cables carry zero force.
- C10's final unequal buffers require selective history use; empty rewind charge rejects without advancing time. C11's final scales require merging after narrow passages, and split/merge actions respect drains and passage capacity.
- C13 uses coupled joint angles and swept link/payload collisions. C14 exposes flock velocity and counts each escaping sheep once. C15's two-cut final requires noncommuting fold history.
- C17 was replaced entirely after the first direction-propagation version failed review. The current engine integrates hinged rods with gravity, rotational inertia, detents and contact impulses. Position and length affect actual contact geometry; raised hinges change the transfer. There is no abstract branching/synchronization claim.
- C20's slow upgrade increases range and duration; fixed obstacles and the current route are available in text.
- C21's final chamber requires a second momentum conversion and portal reanchoring during flight. C22's final body-support puzzle has branched fruit locations and an elevated exit. C23 removes the final middle refuge, requiring a jointly useful projection for both shadows.
- C24 conserves local water volume while terrain elevations alter free surfaces and spill paths. Occupied village foundations and bedrock are immutable; twelve earthworks share excavated spoil. Final interior rock blocks the former central channel.
- C25 has finite suppression cartridges. A unit killed by an entry reaction cannot escort or count as extracted; moving enemies respect occupied cells.

## Verification and evidence

Run `node mini-games/tests/motion-invariants.cjs` for source-level regression assertions. These inject model states and explicitly do **not** count as ordinary gameplay or winning evidence.

Run `NODE_PATH=/opt/codex/cua_node/lib/node_modules CHROMIUM_PATH=/usr/bin/chromium BASE_URL=http://127.0.0.1:8781 node mini-games/tests/motion-room.cjs` against the local site for full public-input desktop and touch campaigns, failure/blocked attempts, retry, restart, terminal behavior and layout checks. Winning fixtures in `motion-plans.json` are author source-informed routes unless individually attributed to a reviewer. Replaying them verifies public-input reachability, not unaided discoverability.

Independent reviewers first play using only public information, then inspect source and replay their own routes. Source-bound records and raw observations live in `mini-games/coverage/independent300/`. The room's author coverage is `mini-games/coverage/motion-room.json`; a report is current only when its recorded hashes match the final runtime. Final acceptance belongs to those reports, not this README.

The studies are hand-authored, deterministic scenarios. The simulations model the stated game rules at a small fixed numerical scale; they are not general engineering tools. Current-study retry supports exploration without replaying earlier studies.
