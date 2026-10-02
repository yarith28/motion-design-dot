# Optional endless mode review

Historical 400-game milestone at commit `3239a0be3fce85b851d969327df507a873bd55f0`. The summary content is retained; relative links are adjusted for this archive directory.

All **400 games** have a source review: the preserved **300-game baseline** and **100 new games**. Every per-game row records the real win/loss condition, implemented mode or reason unavailable, a sensible optional design, scoring/failure/restart behavior, finite-mode preservation, exact function/line excerpts and source-file SHA-256 hashes.

The complete record is [review400/endless-all.json](endless-all.json). The original source snapshot remains in [review400/endless-baseline.json](endless-baseline.json); the expansion's generator and distinct-mechanic notes are in [review400/newgames-source-review.json](newgames-source-review.json).

## Current modes

The baseline has **0 implemented optional endless modes**. Among the 100 new games, **75 offer generated challenge streams**, **7 offer explicitly labelled match series**, and **18 keep the optional mode unavailable**. Finite campaigns remain available for every new game.

| New room | Games reviewed | Generated streams | Match series | Finite only |
|---|---:|---:|---:|---:|
| Constraint Room | 20 | 20 | 0 | 0 |
| Signal Lab | 20 | 15 | 0 | 5 |
| Commons Room | 20 | 13 | 6 | 1 |
| Field Room | 20 | 17 | 1 | 2 |
| Atelier Room | 20 | 10 | 0 | 10 |
| **Total** | **100** | **75** | **7** | **18** |

A generated stream finishes individual seeded studies while preserving one cumulative score; a failed study or voluntary banking ends the run. Sizes, physical limits, opponent searches and task horizons stay bounded as the study index continues. Undo/Reset are disabled in this mode, and finite/optional best scores are separate.

A match series settles its winner and resets the whole competitive match. Tide and Retreat, Spore Council, Shared Comet, Socket Skirmish, Cannon Council, Three Fronts and Velodrome Draft use this label. Their endings are preserved; these are not continuous endless gameplay.

## Baseline feasibility

The 300 existing games were inspected at commit `c96ec5e39669d330ac761d98a335afe44c34a977`: **20 suitable**, **221 conditional**, **59 inappropriate** for continuous endless. No baseline rules were rewritten or optional modes enabled by this review.

- **Suitable:** a renewable live mechanic can continue with bounded difficulty/resources and its existing failure rule. Examples include Signal Run retaining shields, Pinball Pocket ending at its third drain, and Falling Foundry ending at blocked spawn. Velvet Snake also needs a full-board policy.
- **Conditional:** fresh valid content, sustainable resources or a clearly separate variant is required. Fixed tapes in Junction Nine/Reservoir need feasible generated windows; Marsh Balance needs a sustained intervention economy; dictionary/perception games need reviewed content; physics puzzles need witnesses in their actual models. Twenty-One, Five Card Evening and River Stakes can continue a bankroll while retaining finite hand settlement.
- **Inappropriate:** overriding a finite winner, elimination, area/hand settlement or authored story ending would damage the rules. A separate match/scenario series may be useful. The records preserve specific endings such as king capture, queen enclosure, empty supplies and Clockmaker Cabinet's adventure exit.

Across all 400, the continuous-mode classifications are **75 existing**, **20 suitable**, **239 conditional** and **66 inappropriate**. The 7 implemented match series are included in the 66; their optional series support is recorded separately.

## Evidence and limits

This is a complete static review of actual registered engines, generators, terminal helpers and mode/progression/restart controls. The baseline binds 136 executable/UI files and 889 exact excerpts; the full 400-game review binds 184 files and 2,282 excerpts. [tests/endless-review.cjs](../tests/endless-review.cjs) passed exact inventory coverage, unique IDs, current source hashes and every quoted line anchor.

Independent [ordinary touch samples](newgames-browser-samples.json) cover all 100 new games with up to 3 native gameplay actions, exact-seed restart and optional-control gating. The final run on frozen sources completed at 2026-10-02 19:59 UTC: 291 actions, 9 natural losses and 1 study win, with 0 page errors and 0 horizontal overflow at 390px. These short samples are not full campaign/endless playthroughs. Both independent artifacts bind 49 runtime/metadata/UI files and confirm their bytes stayed unchanged during capture.

[Generator initialization samples](newgames-generator-samples.json) completed on the same frozen sources at 2026-10-02 19:58 UTC. They cover 100 distributed seeds at stages 0, 1 and 2 for every game, plus stages 7 and 1,000,000 for the 82 supported optional modes: 46,400 sampled options, each initialized twice to check determinism. The 18 finite-only games are tested only in their supported finite mode. Deterministic serialized starts, different state hashes and bounded dimensions do not alone establish solvability or meaningful content variety.

Deeper rule/model and desktop/touch campaign/optional-mode completion suites are separate source-bound evidence in [coverage/](../coverage/). Review fixes included broader real generators, honest finite-only gates for narrow templates, actual input/limit descriptions, a corrected impossible late-stage Pulley Bay setup, blocked-turn settlement in Socket Skirmish, and consistent recipe bonuses when Bloom Cauldron's bag empties safely. No source review findings remain open. Unavailable modes need the game-specific generation work recorded in their rows; the review does not claim those future modes are implemented or dynamically tested.
