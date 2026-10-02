# Atelier room

Twenty construction, materials, mechanical, optical and language games run through the shared Journey shell. Each keeps a three-study finite campaign, score, explained failure, recovery and native keyboard/touch controls. The room has no external assets or backend.

The engines are grouped by the state they model:

- `mechanical.mjs`: Cam Workshop, Pressure Gallery, Pulley Bay, Clutch Dock, Seal Shop and Capstan Crossing.
- `materials.mjs`: Shrink Fit, Drawplate, Wet Paper, Spring Form and Vacuum Patch.
- `optics.mjs`: Lens Craft and Polarization Stage.
- `construction.mjs`: Common Cut, Interlock Cabinet, Vented Cast, Sand Table, Crack Compass, Mill Fixture and Sound Splice.

`games.json` supplies the instructions and optional-mode decisions. Ten engines support generated challenge streams. The other ten retain their authored finite campaigns; their manifest entries describe what a viable generator would require. All generated runs preserve the finite option, accumulate score, end on failure and allow explicit banking.

From the repository root, run `node mini-games/tests/atelier-room.cjs` with the local static server on port 8790, or supply `BASE_URL`. This command executes the coupled-rule regressions and 1,000 seeded model completions, then replays all three finite studies, natural losses, recovery and supported optional modes through native keyboard controls and Chromium emulated touchscreen taps for every game. Its source-bound report is `mini-games/coverage/atelier-room.json`.

QA win paths are derived from source and public requirements. They establish reachable, rule-valid play and do not claim unaided human difficulty, physical-device testing or screen-reader coverage. The source and generation review is in [atelier-review.md](../design400/atelier-review.md); source comparisons are in [atelier-neighbor-review.md](../design400/atelier-neighbor-review.md).
