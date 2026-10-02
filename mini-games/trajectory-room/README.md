# Trajectory Room

Twenty distinct games use turn-paced physical models and native keyboard/touch controls. Every game preserves a three-study finite campaign, current-study reset, whole-game restart and personal scores. Time advances through the named simulation controls; selectors and sliders prepare a decision without charging simulation time. Visible coordinates, state, targets and failure notes accompany the canvas. These visual games are not certified for nonvisual play.

The defining decisions include orbital phase and relative velocity; compressed-air ballast and trim; velocity-generated electrical braking; LC phase switching; sprung/unsprung suspension; loaded unilateral ratchets; moving support feet; distributed belt slip; contact compliance; static-to-kinetic friction; gear backlash; delayed pressure reflections; selective solvent flow; COM-dependent tipping; curvature-dependent contact; refractory wave propagation; inertial air classification; wet-history capillarity; and deforming-body clearance with stress relaxation. Stance Circle settles three authored opposed-contact matches. Each engine implements its own state transitions, coupling, safe completion and physical failure rules.

The five engine modules are `orbits.mjs`, `contact.mjs`, `handles.mjs`, `fluids.mjs` and `transport.mjs`. `core.mjs` supplies drawing and numeric/lifecycle helpers, and `engines.mjs` combines the independent engines. The room uses the existing shared `journey/` shell. There is no backend, shipped solver, writable state probe or wall-clock timer. The documented models simplify physics at game scale and are not engineering predictions.

Nineteen games offer seeded bounded challenge streams with cumulative scores and Bank and end run. Stance Circle remains finite: its three authored rival policies do not constitute fresh procedural matches. Finite campaigns remain available alongside every supported optional mode. The [per-game optional-mode review](ENDLESS-REVIEW.md) records the actual generators, failure constraints and the finite-only reason.

Verification separates model properties from native interaction. The author source-informed legal action paths in `tests/trajectory-room-plans.mjs` and `trajectory-room-paths.json` establish reachability and regression coverage; they do not establish unaided discovery or human difficulty. `tests/trajectory-room-rules.mjs` checks all 60 finite studies, 20 defining physical couplings, terminal win/loss rendering, 456 generated initializations and 152 legal late-stage wins: eight witnesses per supported game at stages 10,000 and 10,001 using replay seeds 0, 1, 20261002 and 4294967295. Explicitly perturbed model states are labeled and do not count as gameplay. Those sampled bounds and witnesses are not a proof of every unbounded future challenge.

`tests/trajectory-room.cjs` runs the rule checks and replays full campaigns through native desktop Enter/Space/range-key controls and mobile touchscreen buttons/ranges. It checks all three finite studies, terminal failures/recovery, exact reset, banked scores, persistence and unavailable-storage fallback, 320px containment, two generated challenges for each supported mode, player end-run and optional loss recovery. `tests/trajectory-room-opening.cjs` separately checks every manifest opening action at four replay seeds on desktop and touch: the action must be enabled and change rendered state. Current evidence is `coverage/trajectory-room.json` and `coverage/trajectory-room-opening.json`; inspect pass status and source hashes rather than treating this README as certification. The suite records source changes as failures.

Run from the repository root against the local static server:

```sh
node mini-games/tests/trajectory-room-rules.mjs
BASE_URL=http://127.0.0.1:8790 node mini-games/tests/trajectory-room.cjs
BASE_URL=http://127.0.0.1:8790 node mini-games/tests/trajectory-room-opening.cjs
# After all runtime, metadata, documentation and test fixtures are frozen:
node mini-games/tools/run-suite.cjs trajectory-room
```

Completion screenshots live in `coverage/trajectory-room-images/`. Desktop and emulated touch tests are source-informed automated evidence. No physical-device, screen-reader-user, Firefox, independent ordinary full-campaign or engineering-validation claim is made for this room.
