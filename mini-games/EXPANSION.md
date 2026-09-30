# A hundred little ways to play

Quality gate: a catalog entry is one distinct set of rules and decisions, not a renamed difficulty level. Shared controls, drawing code, physics and components are encouraged; a repeated engine needs a materially different objective and interaction to justify another entry. No incomplete entries are linked as playable.

The explicit 100-entry planning inventory is `inventory-plan.json`. Final playable metadata lives in each room's `games.json` and the generated `inventory.json`. The original ten remain intact. Six new rooms contribute fifteen games each: logic and deduction; words; numbers; strategy; spatial construction; arcade and sports.

## Implementation and release sequence

1. Preserve and publish the previously tested first ten games. Completed: deployment and live desktop/mobile verification succeeded at `ca0f41c4b7e0c41763c0430238a9e2488c495e93`.
2. Implement each room in isolation, with distinct rules and offline assets, plus a machine-readable game manifest. Inspect rule overlap before coding.
3. Complete every game through legal UI input. Test restart, meaningful progression and an ending; test illegal inputs and rule constraints. Use independent solvers or test-only read-only observations for deeper puzzles. Never add production test shortcuts.
4. Test desktop and touch-emulated mobile, 320px containment, keyboard controls, reduced motion, storage read/write failures, and fair background handling for real-time games. Inspect representative screenshots and actual interactions.
5. Integrate only passing rooms. Generate a searchable catalog with truthful counts, categories, preserved Grid/List preference, and clear empty results. Smoke every route and check local asset references.
6. Commit tested batches, verify remote SHA, wait for Pages publication and run real live-browser verification against matching source assets. Record the tested count and limitations; never equate a push with a live deployment.

## Evidence

`coverage/*.json` records per-game test coverage and limitations. `tests/*-room.cjs` are reproducible browser suites. The catalog-wide suite checks links, search, filters, both layouts, preference persistence, asset errors and responsive bounds. Automated ideal-input completions prove rules and completion paths, not human difficulty or enjoyment. Physical devices, non-Chromium engines and screen readers require separate verification.
