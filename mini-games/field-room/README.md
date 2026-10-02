# Field Room

Twenty distinct turn-paced physical/sports games join the preserved 300-game catalog. Every game has a three-challenge finite campaign, restart/current-challenge reset, local scores and native keyboard/touch controls. Time advances only through the named simulation actions; sliders and role selections prepare a decision without charging time. The canvas is paired with visible coordinates, state and native controls. These visual games are not certified for nonvisual play.

Engines live in `sports.mjs`, `travel.mjs`, `balance.mjs` and `flow.mjs`; `core.mjs` supplies only drawing, numeric helpers and lifecycle primitives. `engines.mjs` combines independent engines. The room uses the shared `journey/` shell, with no changes to existing-game runtime. There is no backend, runtime dependency, shipped solver, writable state probe or wall-clock timer. The models deliberately simplify sports/physics at the documented game scale.

Seventeen games offer a seeded challenge stream; Velodrome Draft offers a match series with fresh race reserves and cumulative scores. Last Second Pass and Ice Rescue preserve authored finite routes: a repeating fixed formation/lake is not presented as endless generation. See the [per-game optional-mode review](ENDLESS-REVIEW.md). All finite campaigns stay available alongside supported optional modes.

Verification uses three separate scopes. `tests/field-room-plans.mjs` creates author source-informed legal control paths; they do not establish unaided difficulty. `tests/field-room-rules.mjs` asserts defining rule couplings, win/loss rendering, seed variety and bounded late-stage winning witnesses at stages 10,000 and 10,001; injected model-state regressions do not count as gameplay. `tests/field-room.cjs` executes those paths through native desktop Enter/Space/range-key controls and mobile touchscreen buttons/ranges, including all finite studies, natural failures, restart, score persistence/storage fallback, 320px containment, generated optional challenges, bank/end-run and loss recovery. Its current evidence is `coverage/field-room.json`; inspect its hashes and pass status rather than treating this README as certification.

Run from the repository root against the local static server:

```sh
BASE_URL=http://127.0.0.1:8790 node mini-games/tests/field-room.cjs
# Once all sources are frozen, use the repository provenance wrapper:
node mini-games/tools/run-suite.cjs field-room
```

Independent ordinary-input observations are maintained separately in `coverage/ordinary400-constraint-review.*`. They are attributed to the reviewer, sampled rather than blanket polish evidence, and may identify earlier source versions. Screenshots from automated completions live in `coverage/field-room-images/`. No physical-device, screen-reader-user, Firefox or general engineering validation is claimed.
