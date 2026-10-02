# Constraint Room: twenty new mechanics

All twenty retain a three-study finite campaign. Their optional mode is a **generated challenge stream**: each completed study banks its score and opens a seed-varied new study. A failed Check or stranded route ends that stream; the player can also bank and end it. These modes do not change the underlying finite rules. Finite Undo and Reset remain available; stream Undo/Reset are disabled to prevent replaying earned points.

Every generator constructs a valid arrangement and discards that arrangement before returning the public model. Validators check the actual constraints and accept alternative solutions. There is no shipped solver, hidden answer field, writable browser test hook, or runtime dependency.

| Game | Distinct decision | Finite ending | Optional stream cap |
| --- | --- | --- | --- |
| Lamp Ward | Place mutually non-seeing lamps whose blocked orthogonal rays illuminate every open square. | Satisfy all published constraints | 6×6 |
| Star Charter | Choose one star in each row, column and irregular region while reserving a non-touching king neighborhood. | Satisfy all published constraints | 7×7 |
| Magnet Ledger | Orient bipolar domino magnets or leave their slots empty to meet signed marginal counts without equal-pole contact. | Satisfy all published constraints | 6×6, eighteen paired slots |
| Region Census | Assign size labels so connected equal-number components contain exactly that many cells. | Satisfy all published constraints | 5×5 or nine tiles, depending on the mechanic |
| Mosaic Ring | Read cyclic runs around clue cells to build a single connected dark mosaic. | Satisfy all published constraints | 5×5 or nine tiles, depending on the mechanic |
| Sight Garden | Shade blockers to make each numbered white cell see exactly its quota of white squares along straight rays. | Satisfy all published constraints | 5×5 or nine tiles, depending on the mechanic |
| Diagonal Grove | Choose one diagonal per square so numbered lattice vertices get their degree without forming any diagonal cycle. | Satisfy all published constraints | 4×4 |
| Thermometer Hall | Set each bent thermometer’s prefix length so row and column fill quotas agree. | Satisfy all published constraints | 5×5 or nine tiles, depending on the mechanic |
| Compass Estate | Extend four straight non-overlapping arms from numbered hubs until every square has an owner. | Satisfy all published constraints | 5×5 or nine tiles, depending on the mechanic |
| Fleet Blueprint | Deduce an entire separated fleet from public row/column totals, ship lengths and partial hull/water clues. | Satisfy all published constraints | 6×6, four ships |
| Shade Detour | Choose arrow-counted blocked cells while routing one loop through every remaining non-clue cell. | Satisfy all published constraints | 5×5 or nine tiles, depending on the mechanic |
| Quiet Rooms | Allocate shaded cells to room quotas without splitting white space or permitting a straight white view across more than two rooms. | Satisfy all published constraints | 5×5 or nine tiles, depending on the mechanic |
| Four Forms | Choose one four-cell tetromino subset inside each region so the selected pieces join without same-shape neighbors. | Satisfy all published constraints | 6×6, four regions |
| Domino Register | Partition a numbered grid into adjacent pairs, using each unordered number-pair exactly once. | Satisfy all published constraints | double-three set |
| Weighted Weft | Choose binary squares so row totals use column positions as weights and column totals use row positions as weights. | Satisfy all published constraints | 5×5, with position weights1–5 |
| Once Through | Traverse every undirected bridge exactly once, choosing when to cross fragile connector edges. | Use every edge and reach exit | eight stations |
| Cyclic Courtyard | Shift whole rows or columns with wraparound to restore a scrambled tile permutation. | Restore tiles within shift allowance | 3×3, at most ten scrambling shifts |
| Seam Quilt | Place and rotate edge-labeled tiles so neighboring seams agree and the required boundary labels face outward. | Satisfy all published constraints | 5×5 or nine tiles, depending on the mechanic |
| Exclusive Print | Select overlapping plates so each requested cell receives exactly one coat while blank cells receive none. | Satisfy all published constraints | 5×5 or nine tiles, depending on the mechanic |
| Window Tally | Reconstruct a shaded picture from overlapping 3×3 local counts, including the clue square itself. | Satisfy all published constraints | 5×5 or nine tiles, depending on the mechanic |

## Comparisons and scope

The [design proposals](../design400/logic-proposals.json) record the nearest existing mechanics and consequential differences for each game. Flood-It was rejected after inspecting Tide Pool and replaced with Weighted Weft. Inventory IDs `towers` and `fleet` refer to the displayed games Watchtower and Hidden Fleet.

Four Forms discovers tetromino subsets inside generated connected regions; it does not place a tray of fixed shapes. Shade Detour simultaneously deduces blocked cells and routes a loop through every remaining cell. Fleet Blueprint is public-count fleet deduction, with reversible whole-board edits. Exclusive Print requires exact coat multiplicities: overlaps overprint rather than behaving as a union or XOR.

## Verification

- [Native-input suite](../tests/constraint-room.cjs): all twenty games on desktop and emulated touch, each completing all three finite studies, two generated optional studies, a deliberately corrupted solution or stranded route, loss recovery, restart, accumulated score and explicit banking; 320px bounds and page errors are checked.
- [Public-clue solvers](../tests/constraint-room-solvers.mjs): independent test-only searches derive legal native inputs from public seed replay and public clue models. No browser state observation or mutation hook is used.
- [Rule-isolation regressions](../tests/constraint-room-regressions.mjs): twenty-seven focused assertions covering all twenty games, including lamp conflicts, diagonal cycles, magnet contacts, disconnected loops, same-shape tetromino contact, duplicate dominoes and exact overprinting. Two different Sight Garden arrangements with identical public clues are accepted.
- Generator testing samples forty replay seeds per game, repeats deterministic initialization, reaches late-stage generation, independently solves twelve samples per game, and rejects low fresh-board variety. Additional construction checks initialize two thousand models, including stage100000, and validate paired slots and rooted tube paths.

Completion evidence is written to [coverage/constraint-room.json](../coverage/constraint-room.json). The provenance wrapper must bind the final runtime and test bytes before that evidence can be used as a release claim. Interim runs invalidated by concurrent shared-shell edits are intentionally rejected.

Browser completion is solver-guided reachability, not unaided difficulty assessment. Touch means Chromium touchscreen emulation; physical devices and screen-reader users were not tested. Generator sampling is not exhaustive. Native labels and coordinate tables supplement the visual diagrams, but no blanket nonvisual accessibility claim is made.
