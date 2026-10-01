# Independent expansion review

Final source-review disposition: **all 100 additions accepted for distinct, implemented core mechanics after revisions**. No unresolved mechanic/uniqueness blocker remains from these independent reviews. This is not a claim of 100 unaided human playthroughs, equal difficulty, or uniformly deep polish. Source-planned UI replay, ordinary samples, viewport checks, and real-device testing are different evidence categories.

| Family | Independent source reviewer | Scope and supporting evidence |
| --- | --- | --- |
| Kinetic | Dedicated reviewer, separate from implementer | All 20 engines read; required phase gates, staggered holds, bond-cut puzzles, two rescues, two gardens and heading normalization rechecked. Final 40-case Chromium report inspected with all recorded source hashes matching. |
| Tabletop | Dedicated reviewer, separate from implementer | All 20 engines read; dominant damage policy rejected and retuned. Final 48-case owner report inspected; includes competitive losses, not a claim of 20 independent victories. |
| Systems | Tabletop worker; additional early dedicated review | All 20 source-reviewed with file hashes in [source review](coverage/source-systems-cross-review.json); three independent ordinary wins in [ordinary review](coverage/ordinary-systems-cross-review.json). |
| Puzzle | Integration agent, separate from implementer | All 20 source-reviewed; Ice Station redesigned after four-corner shortcut, generators checked in [model evidence](coverage/puzzle-generators-review.json); full ordinary Mutual Match sample in [ordinary evidence](coverage/ordinary-expansion-integration.json). |
| Discovery | Puzzle worker; additional dedicated ordinary samples | All 20 source-reviewed; nine follow-up issues resolved at source hash `6da7141b9c1641fe7cf7755a48f5be05526b8e5d6c1ed4975b91a381a5c1a025`. Final disposition and follow-up ordinary checks in [cross-review](coverage/ordinary-discovery-cross-review.json). |

Full source-matched suites and exact-commit/live release evidence are maintained by the integration owner. They remain required for release; this review document does not replace their fail-closed gate. No physical-phone or actual screen-reader session was performed. The chronological challenge history below is retained; later resolutions supersede earlier pending entries.

## Review basis

Read the existing 100-game inventory, original ten HTML rules, strategy and arcade mechanics, and proposed inventories from all five owners. Original games cannot be compared using inventory metadata alone: their records omit mechanics. Shared utilities are acceptable; distinct names, graphics, level sets, or controls are not sufficient evidence of distinct gameplay.

## Rejections and required revisions

| Proposal | Finding | Disposition |
| --- | --- | --- |
| Color Tide | Same connected-region recoloring/flood-fill loop as original Tide Pool. | Rejected; replaced by Safety Ferry (safety-graph transport), pending implementation. |
| Push Parcel | Same avatar pushing crates onto goals, without pulling, as original Pebble Post. | Rejected; replaced by Mutual Match (stable preference matching), pending implementation. |
| Night Watch (discovery) | Same predictable patrol/visibility stealth as kinetic Lantern Heist. | Discovery removed; replacement pending inventory update. |
| Echo Vault (discovery) | Same record/replay self cooperation as kinetic Echo Steps. | Discovery removed; replacement pending inventory update. |
| Signal Rescue (discovery) | Same parity packet repair as puzzle Parity Repair. | Discovery removed; replacement pending inventory update. |
| Trail Court | Risk of fixed prose culprit quiz; overlap with Honest Company truth/lie consistency. | Requires replacement or substantive evidence manipulation. |
| Invisible Ink | Cycling three channels then clicking revealed answer is not substantial play. | Requires budgeted information choices and deduction or replacement. |

## Conditional design approvals: implementation gates

Tabletop's twenty proposals use recognizably different rule systems. Domino must include adversarial blocking and hand management; poker needs meaningful risk/resource decisions; liar dice must use a nonomniscient opponent; suit-effect combat needs stateful deck/resource decisions. Compact boards must still permit substantive games and winnable opponents.

Systems' twenty proposals are conditionally distinct, with significant risk from abstract resource-button implementations. Conveyor must physically transform/reroute work; workshop must enforce exclusive workers; cold chain must model spoilage/temperature; supply network must expose production bottlenecks. Priority scheduling must use preemption/setup costs, while project scheduling must use genuinely concurrent prerequisites. Couriers need multiagent collision constraints; elevator needs single-carrier queue/load decisions. Reservoir, kiln, and power desk require visibly different storage, coupled heat, and discrete startup/ramping dynamics.

Kinetic's proposals are conditionally distinct. Ricochet Duel must depend on opposing turns/shields beyond Afterglow's aiming. Shatter Belt's split threats must dominate generic craft steering. Soft Sculpt needs support/gravity cascades, rather than deleting visibly unwanted blocks. Phase Walk, Gravity Boots, and Portal Parcel each need levels demanding their different traversal mechanics. Four Holds must make support and removal/regrip consequential.

Puzzle proposals require multi-step solving across at least three substantive studies or generated challenges. Single-bit parity intersection alone is too slight; Honest Company cannot become a fixed pick-the-liar question. Discovery's Question Orchard and Specimen Rule are distinct only as known-property search versus constructing experiments to discover an unknown relationship. Lens Library cannot be another mask-toggling Stamp Studio. False Weight needs more depth than identical two-weighing nine-coin rounds.

## Verification accounting

The design-stage plan was to use ordinary visible rules and UI inputs before reading solutions/probe state. The performed representative samples and their exact limits are recorded below; they do not certify all 100 as independently completed. Viewport emulation, touch dispatch, Chromium, WebKit, physical devices, and screen readers will be reported separately. Parent-owned source-matched evidence must fail closed and record exact tested content.

## Design revisions received

Puzzle owner replaced Grammar Grove with Twin Steps (simultaneous opposite movement across separate mazes). This is provisionally distinct from switch-controlled explorer cooperation; each input must transform both agents. Parity Repair now uses multiple corruptions and row/column/diagonal checks. Any equally valid minimum correction must be accepted instead of matching a hidden original. Mutual Match will use generated preference matrices and blocking-pair counterexamples across increasing sizes. Safety Ferry must vary safety graphs and capacity, not repeat one memorized classic crossing.

## Early source review (first four systems modules)

Assembly Belt, Junction Nine, Marsh Balance, and Reorder Point contain separate multi-step transition models: a moving manufacturing pipeline, conflicting signal phases and queue spillback, a food web with delayed births, and a two-slot stock delivery pipeline. Exhausting constant-action policies against their legal choices produced no wins. Thirty thousand random legal runs per module found at least one win in each; these are **source-model reachability observations, not browser completion or human usability evidence**. Reorder Point was substantially more forgiving than the other three.

Assembly Belt's initial oven toggle was a dominated choice: no cost, burn, or other consequence made cooling worthwhile. The owner was asked to remove it or introduce a meaningful constraint; a decorative decision does not count as depth. Its processing-before-transfer tick order also needed explicit UI explanation.

## Source quality blockers found in second systems batch

- **Signal Cabinet:** always selecting the first legal job completes all eight jobs by minute 23. The advertised setup/batching tradeoff is not necessary. Requested timing changes that make order matter. This is a design-depth blocker, not an input correctness failure.
- **Cold Chain:** repeatedly making parfait whenever available, otherwise choosing the first available recipe, finishes with 5 jam, 4 yogurt, and 7 parfait (target 3/2/3), zero waste, and no refrigerator use. A steady delivery of two ingredients per tick removes the need to manage temperature or spoilage. Requested irregular delivery or batch-deadline constraints that make the defining mechanic consequential.
- Workshop Shift, Reservoir, and Power Desk have different state constraints; all tested constant-action/fallback policies failed and random legal runs found wins. This remains source-model evidence only.

## Review-driven revisions and third systems batch

Signal Cabinet now includes earlier urgent ink jobs; the previously winning first-legal policy fails, while legal source-model solutions remain reachable. Cold Chain now has irregular deliveries and requires two chilled ticks for parfait milk; previous recipe-only policies fail and legal source-model solutions remain reachable. These two depth blockers are resolved at the model level, pending UI verification. Assembly Belt now has finite heat, making oven control consequential; its new winning route still needs explicit verification.

Additional requested revisions: Carry On's accept-every-fitting-offer policy wins without refusals or exchanges; Quiet Majority repeatedly choosing the same policy wins all three bills; Firebreak allowed almost every tested first-choice fallback and about 94% of random legal runs to win. These findings undermine the proposed decision loops and require tuning. Safe Return's overlapping exposure and runoff reserves survived this basic-policy challenge.

## Full implementation review coverage (independent reviewer)

All twenty Kinetic implementations have now been read: Vector Rally's acceleration/swept path, Border Bloom's exposed enclosure trail, Lantern Heist's forecast sightlines, Boulder Burrow's excavation/gravity, Fuse Garden's timed blast/shelter, Quiet Foil's range/stamina/intent, Four Holds' limb reach/support, Trailer Yard's articulated reversing, Gravity Boots' inversion/inertia, Portal Parcel's thrown-beacon exchange, Echo Steps' recorded cooperation, Phase Walk's material-state navigation, Wind Sail's tacking/trim, Scissor Lift's height/sway clearance, Ricochet Duel's shields and counterfire, Soft Sculpt's irreversible bond cuts/retained torque, Spring Courier's pendulum release/catch, Shatter Belt's splitting moving threats, Lantern Defense's growing interception chains, and Little Walkers' autonomous worker assignment. The first implementation had serious level-depth defects listed below; reading a unique engine is not enough to approve its level.

All twenty Tabletop implementations have now been read: suit-following tricks, blackjack, meld/discard, draw poker, climbing-card shedding, sum capture, two-ended domino blocking, Pig banking, category-locking dice, hidden-dice bids/challenges, one-use sealed bids, cribbage pegging, three-card formation contests, tafl, draughts, exchanged movement cards, numerical marble pushing, count-dependent line movement, move/build/climb, and suit-effect combat. Nineteen implement substantive distinct established rule systems. The combat game's balance needed revision, described below. An additional audit suggestion concerns cribbage's Go/next-leader ordering; the owner should test and state the chosen simplified rules precisely.

Parent owns full Puzzle implementation review; the Puzzle worker independently reviews Discovery; the Tabletop worker independently reviews Systems. This reviewer additionally read the first thirteen Systems models and supplied the earlier findings. Those cross-reviews must be linked to actual results before closing the expansion review.

## New implementation findings and unresolved gates

| Game | Concrete evidence | Requested resolution / current state |
| --- | --- | --- |
| Four Holds | Ordinary touch-input win at turn 24: repeat LH up, RH up, LF up, RF up, rest five times. Neither missing hold intersects the starting columns. | Owner replaced the hold layout with staggered supports. Source now demands lateral movement; winning route and ordinary recheck pending. |
| Phase Walk | Ordinary visible-map keyboard win in 28 turns, all three seals, **zero phase changes**. | Owner partitioned the map into mandatory A and B cuts, plus a C-only seal alcove. Source topology now supports the defining mechanic; ordinary recheck pending. |
| Little Walkers | Legal source run wins at turn 22 with only two assignments to the default first walker: wait twice, build, wait five times, dig, then wait. No other walker selection; spare tools and blocker irrelevant. | Requires additional substantive coordination/challenge; pending. |
| Court of Suits | Across 1,000 seeds, always choosing the highest immediate damage wins 980 times; random choices win about 267. Advertised defensive/resource tradeoffs are mostly unnecessary. | Requested telegraphed pressure or other meaningful suit timing; pending. |
| Trailer Yard | Tractor heading accumulates without normalization, but bay success compares absolute heading against zero. An equivalent full rotation can wrongly fail alignment. | Normalize angle for success/description; pending owner fix. |
| Soft Sculpt | Original obvious support deletion rejected by owner; new graph-edge cuts irreversibly detach mass, must preserve a protected weight and meet exact mass plus zero torque. | Distinct coupled constraint model provisionally accepted; all three studies need verified reachability. |

Constant-single-action simulations over the current twenty Kinetic models found no victories. These simulations are source-model probes, not ordinary browser evidence, and do not establish depth by themselves: the Four Holds cycle and Phase Walk bypass above both evaded that simple test.

## Independent ordinary-input browser sample

All following checks used Chromium at a 390×844 touch-capable emulated viewport. This is not physical-device or screen-reader testing. No solution hooks, hidden state, or source-derived routes were used in these ordinary samples.

- Clockmaker's Cabinet: completed the item collection/combination/fixture chain through touch input, then restarted to empty inventory and six patience. Encountered unintended combination from a sticky selected tool; owner cleared selection after fixture use and added selected-item/state labels. Completion screenshot: `/tmp/independent-clockmaker-win.png`.
- Prefix Press: completed all three dispatches with touch controls, selecting trees from visible weights and encoding using the displayed code table; restarted to new weights. Later stages used an ordinary visible-rule automation, not hidden answers. Requested a true tree diagram and removal of artificial “Close study unsuccessfully” as a purported failure path; owner reports both changes applied. Screenshot: `/tmp/independent-prefix-win.png`.
- Specimen Rule: completed both hidden-rule studies using experiments selected from visible possible relations, touch actions and native number-input fills. Restarted and exhausted experiment charges to a terminal loss. Flagged correct-claim handling at zero charges; owner reports a correction. Input fills are not claimed as touch keyboard testing.
- Four Holds and Phase Walk: completed the original layouts through ordinary inputs, exposing the failures above. These victories are rejection evidence, **not quality approval**.
- Portal Parcel: exercised throw, flight advancement, swap and renewed throw; no completion claim. Gravity Boots: exercised spike loss, restart and gravity reversal; no completion claim. Their observed movement loops and source models differ materially.
- Domino Parlour: played a complete match through touch actions, including choosing between chain ends, forced boneyard draws, opponent blocking and a terminal loss. Restart restored the same original seven-tile hand. The game presents consequential hand management; no independent victory claim.

## Follow-up review resolutions

- Phase Walk: independently completed the revised map through ordinary keyboard UI inputs in 34 turns, changing A→B at the middle anchor and B→C at the right anchor. All three seals and exit reached. The mandatory material cuts resolve the original bypass.
- Trailer Yard: inspected the explicit `atan2(sin(angle), cos(angle))` normalization now applied after steering. Equivalent-heading rejection is resolved at source level.
- Soft Sculpt: independent source-model enumeration found all three studies require four cuts and have valid, different solutions (bonds 2/3/7/9, 1/4/7/9, and 1/4/6/10 respectively). This is solver reachability only, not ordinary UI evidence.
- Little Walkers: source now includes a second rescue with opposing entrances, two gaps, two walls, and a central exit. Both lead walkers need distinct preparation while the shared clock advances. Builders stop at walls. This resolves the two-assignment whole-game depth blocker at source level; owner must finish browser validation.
- Four Holds: the revised staggered hold set removes both uninterrupted vertical tracks. Lateral regrips and support order now matter. Owner reports a viable route; final browser validation remains required.
- Parent reports all twenty Puzzle implementations source-reviewed. Independent generator checks cover 150 revised Ice Station layouts (minimum reachable-stop counts 10/12/14 and solution depths at least 6/8/10) and 450 Twin Steps/Knight Exchange/Voxel Post starts, all unsolved. See `coverage/puzzle-generators-review.json`; these are model checks. Parent's ordinary full Mutual Match sample is recorded separately in `coverage/ordinary-expansion-integration.json`.

The earlier blocker table is retained as the review history; this section supersedes resolved entries. At this point the outstanding independent design blocker is Court of Suits' dominant highest-damage policy, plus final source-stable browser verification and remaining cross-review reports.

Court of Suits follow-up: inspected the new Brace/Heavy/Quick intent cycle, armor, escalating boss health, visible upcoming threat, and actual-damage card labels. Independent rerun over 1,000 seeds reduced highest-immediate-damage wins from 980 to 19; first-card and random policies did not win in that sample. This resolves the dominant-policy depth concern. It does not prove every deal winnable or the new difficulty ideal. The owner reports correct cribbage Go/next-leader normalization both before and after the house action; the earlier audit suggestion is closed.

Kinetic owner raised an additional self-review issue: Border Bloom's original target admitted a ten-step single-capture win. Reviewer requested a meaningful tighter/repeated enclosure challenge rather than retaining a one-cut tutorial as the whole entry. This remains the current design-depth gate until revised.

## Source snapshots accepted by this reviewer

Tabletop final source review covers `cards.mjs` SHA-256 `c8a24e3281cd1e4ddaaafd3f86a2152548046f1f512e818d4cfb3f7f059c7a7c`, `boards.mjs` `cd93247480aef2d999751d461cc4aaf72fcfcb5db94560d7e546147ac0b7d0cc`, and `core.mjs` `c63dbe8baa569216c36037b78e342e2c65055eb9105ebcf027cefcbd7f146838`. Inspected final owner report `coverage/tabletop-room.json`: all 48 cases passed, 627 transitions; classification is source-planned public-UI replay, with competitive losses explicitly included. This is separate from the independent ordinary Domino sample.

Systems cross-review is complete: `coverage/source-systems-cross-review.json` records all twenty accepted implementations with file hashes. `coverage/ordinary-systems-cross-review.json` records independent Workshop Shift, Cold Chain, and Quiet Majority ordinary wins and restarts. Growing Block’s row-order bug was found and fixed during that review.

Border Bloom now has two gardens; the second reverses the entry, adds a central refuge, and raises the natural area goal to ninety tiles. The source review accepts this enclosure progression; final owner browser rerun remains pending.


## Final independent review closure

Kinetic's final `engines.js` source hash is `14eb7264b2b6d3bfa4438ff76b92f3a425302a57e6f1ff61c0068269a4407078`; `room.js` is `af16e64f43a586c92206cde1a6616589d05d3cdb6daba8bfe72c354a0b36fc77`. Independently inspected `coverage/kinetic-room.json`: 40/40 cases passed and every source hash matched current bytes. The plans are simulation-derived and replayed through public UI controls. All twenty have desktop and tap-only emulated mobile wins, targeted losses, restart checks, and specific invalid-action assertions; this is not twenty unaided reviews.

Discovery's nine cross-review findings are resolved in the follow-up report: ambiguous lens reconstruction, invariant parallax pairing, literal archive conflicts, dominant excavation/scanning routines, unenforced character abilities, always-visible route guidance, zero-target guard, and stale question metadata. This reviewer additionally ordinary-played revised Archive Edit's first release: selected Survey, Materials and dependent Seal within three picks, resolved the conflicting region, and published all five required fields. The second release visibly changes the dependency/coverage graph. This is a partial ordinary sample, not a full three-release completion.

The independent source acceptance covers mechanics and identified defects. It does not establish optimal AI, every random deal's winnability, balanced difficulty for every player, physical iPhone usability, or fully nonvisual access. Short curated challenges and deeper simulations coexist. Final integration, regressions, CI and live deployment remain the parent's release responsibilities.
