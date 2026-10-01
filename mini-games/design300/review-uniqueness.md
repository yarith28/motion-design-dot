# Independent uniqueness review — 300 expansion

Status: **100 conditionally accepted designs, 2 rejected proposals, 2 uncounted reserves requiring revision.** Every design acceptance remains provisional until published remediation baseline handoff and comparison against its final mechanics. No app/runtime/catalog edits or git publication authorized.

## Review standard

Compare each proposal against all 200 inventory rows, original ten source rules (which inventory omits), nearest implementation engines, and all 99 other proposals. A unique title, theme, word list, board layout, extra limit, or orthogonal parameter does not establish distinct gameplay. Require a different action/state transition structure with consequential choices that the player must use to win; articulate a counterexample where the nearest neighbor strategy cannot solve the proposal. Common buttons/renderers are irrelevant to uniqueness.

Reject shallow forms: select an independently correct value per widget, follow a revealed answer, execute a fixed prose chain, or repeatedly choose a dominant action. Known classic rules still need enough state space and adversarial/constraint depth to survive miniaturization. A new condition on an existing loop needs a different decision structure, not merely greater difficulty.

## Baseline exclusion map

- Original ten: lateral catch/dodge; memory pairs; orbit timing; 8-puzzle; ricochet brick volley; cross-neighbor XOR lights; flood-fill; clue anagrams; overlap-cut tower stacking; Sokoban.
- Spatial/logic/numeric: packing, reflection, drawing symmetry, independent rotation, graph untangling, adjacent gear swaps/ratio constraints, jugs, robot program, folding, stencil overlap, Hamiltonian route, torque placement, stack sorting, directed budget routes, set union; classic grid constraints; algebra/card expression, 2048, bit sums, fractional subset/interval assembly, matchstick edits, prime factors, modular routes, fixed-expression brackets, scalar estimation, ratio/capacity, recurrence recognition, integer purchase, digit order and divisibility, coordinate checkpoints.
- Words: search, ladder, hangman, crossword, segmentation, cryptogram, center-letter clue answers, category exception, alphabet walk, sentence order, compound/rhyme pairing, vowel restoration, endpoint chains, correction. Domain swaps do not renew these loops.
- Strategy/tabletop: Reversi, Connect4, Kalah, Nim, dots/boxes, peg solitaire, Breakthrough, Battleship, territory draft, timed farm production, Quoridor, Hex, queen coverage, Amazons, known-price trade; trick-taking, blackjack, rummy, draw poker, climbing/shedding, Scopa, dominoes, Pig, Yahtzee categories, liar dice, Goofspiel bids, cribbage pegging, lane formations, tafl, draughts, Onitama, Abalone, Lines of Action, Santorini, finite-card telegraphed combat.
- Systems: phase queues/spillback, ordered conveyor transforms, delayed ecosystem, stock lead-time orders, exclusive-worker recipes, priority/setup job scheduling, spoilage/cooling recipes, reservoir control, unit startup/ramping/storage, online knapsack, concession coalition, forecast risk underwriting, fire containment, thermal inertia/stress, colliding couriers, loaded elevator deadlines, production-flow bottlenecks, spatial zoning feedback, prerequisite parallel scheduling, shared escort threats. Last two risk systems are under remediation.
- Expansion puzzles: stable matching, slide-until-wall, cube rolling, knight permutation, coloring, vertex cut, MST, network flow, self-reference truth, circuit synthesis, substring rewriting, mirrored navigation, cellular inversion (remediation), projections, Hitori, Nurikabe, rectangle regions, directed-cycle repair, parity correction, safety ferry.
- Arcade/kinetic: snake, pong, golf, ballistic hoop, curling, rise/fall gates, lunar landing, inertial cargo, selective tapping, rhythm lanes, pinball, periodic jump, pool, wind-balance, depth hook; velocity racing, exposed-trail area claim, stealth decoy, falling boulders, bomb escape, spacing/parry duel (remediation), limb-support climb, articulated parking, gravity flip, remote beacon swap, time echo, phase gates, tacking, elevated freight/sway, shielded ricochet duel, weighted bond cutting, swing release/catch, splitting asteroids, expanding anti-missile blasts, worker terrain assignments.
- Discovery: perimeter-ray inference, balance weighing, Set triples, change blindness, fog maze, prefix-code construction, active temporal hypothesis queries, grammar testing, causal intervention, stereo correspondence, linear waveform amplitudes, binary trait questions, gradient sensing, footprint excavation, branch/cherry-pick conflicts, calibration/deblur, multi-channel evidence scan, item-use escape, separate explorers/item exchange, rotated-room orientation. Hypothesis-query/elimination engines form one high-risk overlap zone even when scientific domains differ.

## Evidence limitations

The prior expansion review claimed all 100 accepted but the parent supplied later critical failures. Its acceptance language is not reused as proof. Design review cannot certify UI reachability or implementation quality. Ordinary visible-input wins and meaningful failures, keyboard focus/Space isolation, touch, readable non-color state, and complete unique mechanics must be demonstrated during implementation.

## Strongest-neighbor implementation checks

- `puzzle-lab/engines.js`: Gate Foundry uses a fixed DAG and cycles gate functions to match all eight truth rows. Comparator networks must introduce compare-swap value routing and layer construction, not a fresh node-function puzzle. Rewrite Press chooses a rule and substring location, applies it irreversibly under a rewrite budget; parser games must use viable-prefix stack state rather than cosmetically renamed substitutions.
- `systems-room/supply-web.mjs`: capacity-expansion economy processes a fixed acyclic recipe pipeline automatically each tick. Cyclic token firing with locks/deadlock could differ, but reskinned recipes would not.
- `kinetic-room/engines.js`: Four Holds directly repositions selected limb endpoints with reach/order/fatigue gates. A robot arm must rotate coupled joints and sweep whole links; choosing independently correct endpoint positions is insufficient. Trailer Yard couples drive/reverse to tractor and trailer headings, making holonomic rigid-body motion potentially distinct only with necessary configuration-space bottlenecks.
- Guild alternates permanent district claims with immediate value/adjacency scoring; cut-and-choose must let one side design a partition and the other choose first, not simply draft polygons. Trade is buy/sell against a fully public calendar; market games need nonlinear exchanges and endogenous opponent market changes.

## Final disposition and limits

Primary selection: A01–A16 excluding A05 and A15 (14); B01–B35 (35); C01–C25 excluding C16 (24); D01–D27 (27): **100**. A05 is rejected as C13 duplicate; C16 is rejected for no meaningful decision beyond sequence recall. A15 and A17 are uncounted reserves, not fallback permission to implement.

This is an independent design judgment after reading complete records, not evidence that 100 implementations are unique or good. Every accepted game retains the shared ordinary-input and depth gate. In particular, mathematical reachability, exact source unit tests, losses alone, source-guided solutions and generator witnesses cannot replace independent visible-rule UI wins.

### Review-driven changes

- Removed duplicate Mahjong and train-shunting ownership. A IDs were subsequently renumbered; current IDs, not historical A07/A09 shortlist IDs, govern the final table.
- Rejected A05/C13 joint-motion duplicate rather than counting goal/theme differences.
- Rejected C16 shallow sequence reproduction from accepted count.
- D04 changed from serial-dominated transaction scheduling to constructing stale-read witnesses and lock repair. D22 replaced fixed atomic-exchange routine with causally consistent distributed cuts. D17 corrected a false sliding-window retention explanation with a concrete token-cost fixture.
- B29 replaced weak Halma race variant with reactive hidden-fugitive route denial.
- A15 ambiguity was repaired, but its intro still does not establish coupled nesting; left as reserve. A17 remains reserve until simultaneous physical interaction semantics are specified. B35 supplies a defensible independent primary mechanic.

### Closest contested survivors

B34 is accepted because responsive opponent betting/folding across reveals is the core: the existing `tabletop-room/cards.mjs` implementation of Five Card Evening has stake then hold/redraw then fixed rank payout, no opponent pot or response action. New deal format or common cards alone would not qualify. B32 must preserve remembered circulating hands and denied future supply; B22 concentrates public leftover colors and forces overflow. B33 must make time position allocate extra opponent/own turns and milestone income; geometry-only patch packing would fail. C21 requires momentum redirection, C22 requires whole-body support/gravity, C24 requires conserved free-surface overflow with both beneficial and harmful inundation; decorative versions are rejected.

### Pairwise coverage trace

The structured report records all 200 baseline IDs, all 104 candidate/rejected/reserve IDs, six comparison clusters and explicit cross-cluster challenges. The 100 selected designs imply 4,950 candidate pairs; the review screens mechanic signatures, then records strongest potentially equivalent pairs, rather than pretending 4,950 boilerplate sentences establish uniqueness. Complete candidate records were read; strongest source comparisons supplement inventory signatures. No acceptance relies on being assigned a different genre or batch.

### Final file hashes

- `a.json`: `c8c4e6fdd2a0cfa5dd0f7ee0a727f076a7b9e75acd683f0ff6f8f25fb9f354ae`
- `b.json`: `3490597e0990fbcc88f0e41c9bd5be90967bb148c9cfaec1c6ca73ce8731050f`
- `c.json`: `f0a08c1ce403c34a77a814c81a3d35e398f1fa23c1fc628ff4ea7e99c51d9f25`
- `d.json`: `5a081a0930d3e5ceebef8c5a28ca9c40082f4b6f6b4a84297cd92e3e4fe6d1ad`

## Per-candidate decisions

Detailed neighbor rationales and required changes are in `review-uniqueness.json`. Every accepted row means conditional design acceptance only.

| ID | Decision | Strongest existing / proposed neighbors |
| --- | --- | --- |
| A01 | conditional_accept | tide-pool, merge-garden / C02, C03 |
| A02 | conditional_accept | cube-seal, good-order / A08 |
| A03 | conditional_accept | loose-ends / C06 |
| A04 | conditional_accept | rover-script, gate-foundry / D10 |
| A05 | reject | paper-trail, four-holds / C13, C09 |
| A06 | conditional_accept | fraction-mosaic, tangram-dock / B24, C15 |
| A07 | conditional_accept | pebble-post, twin-steps, phase-walk / A11 |
| A08 | conditional_accept | crate-crane, good-order / A02 |
| A09 | conditional_accept | peg, marble-council / A01 |
| A10 | conditional_accept | tile-weave, good-order, folded-world / D27 |
| A11 | conditional_accept | pebble-post, tangram-dock / C11, C09 |
| A12 | conditional_accept | copper-tree, paper-trail, soft-sculpt / C15 |
| A13 | conditional_accept | fraction-balance, six-columns / D20, D21 |
| A14 | conditional_accept | hidden-grove, alphabet-trail, cable-loom / B12 |
| A15 | reserve_revise | folded-world, pebble-post, track-exchange / A10, C21 |
| A16 | conditional_accept | stamp-studio, pigment-lab, echo-steps / A10, C10 |
| A17 | reserve_revise | rover-script, assembly-belt, echo-steps, borrowed-time / B30, A11, D06, D14, D16 |
| B01 | conditional_accept | reversi, hex / B04 |
| B02 | conditional_accept | borrowed-steps, crown-and-guard, draught-garden / B03 |
| B03 | conditional_accept | marble-council, pawns / B02, C25 |
| B04 | conditional_accept | joining-lines, siege / B01 |
| B05 | conditional_accept | pawns, bank-the-roll / B03 |
| B06 | conditional_accept | fleet, lantern-heist / B02 |
| B07 | conditional_accept | court-of-suits, workshop-shift / B18 |
| B08 | conditional_accept | tangram-dock, guild / B21 |
| B09 | conditional_accept | four, three-of-a-kind / B06 |
| B10 | conditional_accept | two-couriers, crown-and-guard / C25 |
| B11 | conditional_accept | chain-reaction, last-letter / B12 |
| B12 | conditional_accept | crossings, word-weave / B11 |
| B13 | conditional_accept | crate-crane, meld-atelier / B14 |
| B14 | conditional_accept | double-take, peg / B13 |
| B15 | conditional_accept | formation-flags, last-hand / B20 |
| B16 | conditional_accept | twenty-questions, velvet-tricks / B31 |
| B17 | conditional_accept | orchard, meld-atelier / B20 |
| B18 | conditional_accept | workshop-shift, supply-web / B07 |
| B19 | conditional_accept | sealed-bids, bank-the-roll / B20 |
| B20 | conditional_accept | trade, reorder-point / B15, B17 |
| B21 | conditional_accept | tile-weave, guild / B08 |
| B22 | conditional_accept | guild, formation-flags / B32 |
| B23 | conditional_accept | joining-lines, soft-sculpt / B03 |
| B24 | conditional_accept | guild, fraction-mosaic / A06 |
| B25 | conditional_accept | guild, quiet-majority / B01, B21 |
| B26 | conditional_accept | hex, marble-council / B23, B08 |
| B27 | conditional_accept | hidden-dice, quiet-majority / B31, B34 |
| B28 | conditional_accept | trade, growing-block / B21, B20 |
| B29 | conditional_accept | fleet, twenty-questions, lantern-heist / B06, B10 |
| B30 | conditional_accept | rover-script, two-couriers / B10, D06 |
| B31 | conditional_accept | court-of-suits, five-card-evening / B27, B16 |
| B32 | conditional_accept | guild, formation-flags / B22, B15 |
| B33 | conditional_accept | tangram-dock, workshop-shift / B08, B18 |
| B34 | conditional_accept | five-card-evening, sealed-bids / B27 |
| B35 | conditional_accept | reversi, four, joining-lines / B09, B26 |
| C01 | conditional_accept | sky-stack, tangram-dock / C02 |
| C02 | conditional_accept | tide-pool, merge-garden / A01, C03 |
| C03 | conditional_accept | afterglow, soft-sculpt / C02, A01 |
| C04 | conditional_accept | gravity-boots, kite-flight, rope-skip / C19, C10 |
| C05 | conditional_accept | lantern-heist, velvet-snake / C14 |
| C06 | conditional_accept | cable-loom, orbit-transfer / C09, A03 |
| C07 | conditional_accept | twin-steps, balance-beam / C14 |
| C08 | conditional_accept | balance-mobile, soft-sculpt / C17 |
| C09 | conditional_accept | trailer-yard, safe-passage / C13, A05 |
| C10 | conditional_accept | echo-steps, portal-parcel / C04 |
| C11 | conditional_accept | track-exchange, measured-pour / C07 |
| C12 | conditional_accept | moon-basket, ricochet-duel, fuse-garden / C03 |
| C13 | conditional_accept | four-holds, trailer-yard / C09 |
| C14 | conditional_accept | marsh-balance, lantern-heist / C07, C05 |
| C15 | conditional_accept | paper-trail, pigment-lab / A12, A06 |
| C16 | reject | double-take, second-look /  |
| C17 | conditional_accept | tile-weave, mirror-mail / C08 |
| C18 | conditional_accept | crate-crane, safe-passage / A08, A11 |
| C19 | conditional_accept | signal-run, gravity-boots / C04 |
| C20 | conditional_accept | lantern-defense, towers, firebreak / C25 |
| C21 | conditional_accept | portal-parcel, gravity-boots / C04, C10 |
| C22 | conditional_accept | velvet-snake, boulder-burrow / C11 |
| C23 | conditional_accept | parallax-post, shadow-turn / C04, C07 |
| C24 | conditional_accept | firebreak, reservoir, river-capacity / D24 |
| C25 | conditional_accept | ricochet-duel, court-of-suits / B10, B03, C20 |
| D01 | conditional_accept | borrowed-time, rover-script / D02, D12, D16 |
| D02 | conditional_accept | carry-on, reorder-point / D01, D03, D17 |
| D03 | conditional_accept | tangram-dock, safe-passage / D02, D25 |
| D04 | conditional_accept | borrowed-time, archive-edit, signal-cabinet / D05, D22 |
| D05 | conditional_accept | assembly-belt, two-couriers / D04, D22 |
| D06 | conditional_accept | rover-script, rewrite-press, gate-foundry / D08, D11, D14 |
| D07 | conditional_accept | gate-foundry, specimen-rule / D06, D14 |
| D08 | conditional_accept | rewrite-press, sentence-studio / D06, D10 |
| D09 | conditional_accept | gate-foundry, honest-company / D10, D11 |
| D10 | conditional_accept | honest-company, gate-foundry / D08, D09 |
| D11 | conditional_accept | rover-script, gate-foundry / D06, D19 |
| D12 | conditional_accept | prefix-press, loose-ends / D01, D21 |
| D13 | conditional_accept | wave-desk, make-24 / D09 |
| D14 | conditional_accept | gate-foundry, rover-script / D07, D06 |
| D15 | conditional_accept | gate-foundry, good-order / D14, D06 |
| D16 | conditional_accept | supply-web, measured-pour, safety-ferry / D01, D24 |
| D17 | conditional_accept | prefix-press, rewrite-press / D02, D18 |
| D18 | conditional_accept | one-letter-away, rewrite-press / D17 |
| D19 | conditional_accept | equal-measure, mutual-match / D11, D20 |
| D20 | conditional_accept | prefix-press, wave-desk, estimation-studio / D19 |
| D21 | conditional_accept | quiet-majority, make-24 / B24, D12 |
| D22 | conditional_accept | safety-ferry, archive-edit, signal-cabinet / D04, D05 |
| D23 | conditional_accept | orchard, factor-loom / D17 |
| D24 | conditional_accept | river-capacity, safe-return, supply-web / D16 |
| D25 | conditional_accept | circuit-break, borrowed-time / D03, D01 |
| D26 | conditional_accept | orchard, specimen-rule, twenty-questions / D02 |
| D27 | conditional_accept | two-couriers, elevator-night, junction-nine, river-capacity / A10, D24 |
