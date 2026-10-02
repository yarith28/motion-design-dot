# Optional endless mode review

All **500 games** have an actual-source review: the preserved **300-game baseline** and **200 additions**. Each record includes real win/loss conditions, implemented support or its specific limitation, a sensible optional design, scoring/failure/restart behavior, finite-mode preservation, exact function/line evidence and SHA-256 source hashes.

At assembly, this is the 500-game release candidate and publication remains pending. All ten new rooms’ final native campaign suites, including Trajectory Room’s 40 profiles, have passed. This source audit and its independent samples are complete; final release checks are tracked in [EXPANSION-500-VERIFICATION.md](EXPANSION-500-VERIFICATION.md).

The complete record is [review500/endless-all.json](review500/endless-all.json). The [300-game baseline](review400/endless-baseline.json) and [published 400-game milestone](review400/endless-all.json) remain intact; its [archived summary](review400/ENDLESS-REVIEW.md) retains the earlier scope. Actual generator and distinct-mechanic notes are separate for the [first 100](review400/newgames-source-review.json) and [second 100](review500/newgames-source-review.json).

## Current modes

The baseline has **0 implemented optional modes**. The 200 additions offer **142 generated challenge streams**, **23 explicitly labelled settled match series**, and **35 finite-only games**. Every new finite campaign remains selectable.

| New room | Games reviewed | Generated streams | Match series | Finite only |
|---|---:|---:|---:|---:|
| Constraint Room | 20 | 20 | 0 | 0 |
| Signal Lab | 20 | 15 | 0 | 5 |
| Commons Room | 20 | 13 | 6 | 1 |
| Field Room | 20 | 17 | 1 | 2 |
| Atelier Room | 20 | 10 | 0 | 10 |
| Relation Room | 20 | 16 | 1 | 3 |
| Trajectory Room | 20 | 19 | 0 | 1 |
| Protocol Room | 20 | 17 | 0 | 3 |
| Civic Room | 20 | 5 | 15 | 0 |
| Form Room | 20 | 10 | 0 | 10 |
| **Total** | **200** | **142** | **23** | **35** |

A generated stream completes individual seeded tasks while retaining cumulative score. Next adds the completed task score and initializes the next seeded task; ordinary failure ends play, End Run banks the accumulated engine score, and Restart clears the run. Dimensions, task horizons and physical/resource limits remain bounded. Undo/Reset are unavailable in optional mode; finite and optional records remain separate.

A match series retains a winner, settles the board/hand, then resets all competitive material for a fresh seeded match. It is explicitly labelled as a series rather than continuous no-settlement play. The first seven are Tide and Retreat, Spore Council, Shared Comet, Socket Skirmish, Cannon Council, Three Fronts and Velodrome Draft. The next sixteen are Turning Council and the fifteen opposed Civic games; the individual records list their actual settlement rules. Finite-only Stance Circle could support a future series once meaningful varied policies are validated.

## Baseline and feasibility

The original 300 were inspected at commit `c96ec5e39669d330ac761d98a335afe44c34a977`: **20 suitable**, **221 conditional**, **59 inappropriate** for continuous endless. Their finite rules remain intact and no proposed baseline mode was enabled. One documented legacy repair changes only Arrow Audit’s initialization to prevent a possible infinite loop; its controls, check rules and three-study ending remain byte-identical.

- **Suitable:** renewable live mechanics can retain bounded difficulty/resources and existing failures, such as Signal Run shields, Pinball Pocket's third drain and Falling Foundry's blocked spawn. Velvet Snake also needs a full-board policy.
- **Conditional:** fresh valid content, sustainable resources or a separate variant is required. Examples include generated feasible Junction Nine/Reservoir tapes, a sustained Marsh Balance intervention economy, reviewed dictionary/perception content, and physical puzzle witnesses in the actual model. Bankroll games can retain finite hand settlement while extending the bankroll.
- **Inappropriate:** erasing a finite winner, elimination, hand/area settlement or authored story ending damages the rules. A separate match/scenario series can preserve those endings. Records specify such rules as king capture, queen enclosure, empty supplies and Clockmaker Cabinet's adventure exit.

Across all 500, continuous-mode classifications are **142 existing**, **20 suitable**, **255 conditional** and **83 inappropriate**. The 23 implemented match series are included in the 83 and counted separately as supported optional series. Each of the 35 unavailable new modes has a concrete generation prerequisite; narrow authored templates are not reported as implemented endless support.

## Evidence and limits

The static review covers every registered engine, terminal helper and relevant generator, plus mode/progression/score/banking/restart controls: **247 source files and 4,886 exact excerpts**. [tests/endless-review.cjs](tests/endless-review.cjs) validates exact inventory coverage, unique IDs, strict current hashes and every quoted anchor. Previous 300/400 source records remain immutable. Historical evidence for the one shared PuzzleLab file resolves to the [pinned original archive](preservation/historical/puzzle-lab-engines.js); the [preservation checker](preservation/verify.cjs) verifies both hashes and every byte outside Arrow Audit’s init before allowing that single exception. All other historical source bytes remain exact. The current 500 audit instead binds the repaired live file for 20 baseline rows and 14 nearest-mechanic comparison rows; it never substitutes archived source for current evidence.

The [independent Arrow Audit remediation review](review500/legacy-arrow-init-remediation-review.json) reproduces the archived path-only graph timeout and inspects the mandatory triangle, 128-candidate bound and constructive fallback. All **54 independent model starts** return cyclic tasks with independently certified minimum reversal budgets of 1–3; all legal witnesses pass the unchanged checker, including three forced fallbacks. The separate [owner regression](coverage/puzzle-arrow-audit-regression.json) records 774 model starts and four keyboard/touch diagnostic profiles with all three studies completed. These selected diagnostic inputs are test streams, not a public seed feature. Arrow Audit remains conditional for a future optional mode; current failed checks retain unlimited feedback.

Independent native touch samples cover all 200 additions: [first 100](review400/newgames-browser-samples.json), [second 100](review500/newgames-browser-samples.json). Together they record **586 gameplay actions, 14 natural losses and 1 study win**, with exact-seed restart, honest optional availability, zero page errors and zero horizontal overflow at 390px. The second capture records 295 actions, 5 losses and 95 still-playing samples. These are up to three ordinary actions per game, not full campaign or optional playthroughs. Both second-expansion reports bind 65 runtime/metadata/UI files and verify unchanged source during capture; every hash is rechecked before assembly. None of these 200-game captures loads PuzzleLab, so the Arrow initialization repair does not change their captured runtime.

[First](review400/newgames-generator-samples.json) and [second](review500/newgames-generator-samples.json) initialization samples cover 100 distributed seeds at finite stages 0–2 for every addition, plus optional stages 7 and 1,000,000 for supported modes. The second report contains **46,600 sampled options initialized twice: 93,200 calls**. Combined reports contain 93,000 options and 186,000 calls. Serialized deterministic starts, sampled state hashes and bounded dimensions do not prove solvability or meaningful content uniqueness.

After the Suspension Course terminal timing repair, both second-expansion reports were genuinely rerun for all 100 games: initialization at 2026-10-02 22:07 UTC and native samples at 22:08 UTC. The previous captures remain [explicitly superseded history](review500/history/pre-suspension-time-fix/README.md). A separate [legal model boundary replay](review500/suspension-timing-repair-review.json) and [81-action native touch regression](review500/suspension-timing-native-review.json) confirm playing after 79 beats, study victory on beat 80 at 8.00 seconds, and restart. This selected source-informed regression is separate from the ordinary sample totals.

Deeper legal-witness, coupled-rule and desktop/touch campaign/optional completion suites are separate source-bound artifacts in [coverage/](coverage/). The [six selected ordinary campaigns](coverage/ordinary500-review.json) record all 18 finite-study wins, natural failure/recovery/restart and 279 current native control activations; original blind exploration and learned current-source replays remain labelled separately. This does not claim unaided wins for all 100 new games or a new browser playthrough of all baseline 300.

Concrete review fixes include Arrow Audit’s unbounded path-only graph initialization, the reachable Capital Lines supply deadline reset, Pivot Network's winning action budget, generated Thread Portrait's empty targets, Solvent Ladder's limited packet order, misleading hidden-observation Undo, Footfall Foundry's unrepresentable initial slider command, and Suspension Course's floating-point eight-second terminal boundary. Per-game records retain resolved findings and actual scope. **No gameplay source review findings remain open.** Future modes in conditional/inappropriate records remain designs requiring the specified source-derived feasibility and legal-path evidence.
