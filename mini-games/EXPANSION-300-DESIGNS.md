# Small Hours: proposed 100-game addition

Design-only selection for 200 → 300. These are conditionally accepted written designs, not implemented or empirically validated games. Baseline inspected: `fb1aabe76e6e2420ac68dce1941ffe8d940c924c`. Recheck against the parent’s verified remediation handoff before implementation.

Each linked family record supplies persistent state/actions, consequential decisions, depth/replay, win/failure, keyboard/mobile controls, accessibility, ordinary-input QA and strongest existing/proposed comparisons. Independent uniqueness and depth reports record per-ID gates.

| Design family | Selected | Full specification |
| --- | ---: | --- |
| Spatial and constructive puzzles | 14 | [a.json](design300/a.json) |
| Adversarial and tabletop games | 35 | [b.json](design300/b.json) |
| Physical and temporal games | 24 | [c.json](design300/c.json) |
| Computational and systems games | 27 | [d.json](design300/d.json) |
| **Total** | **100** | |

## Selected inventory

| ID | Proposed name | Defining mechanic |
| --- | --- | --- |
| A01 | Falling Orchard | Remove an orthogonally connected same-symbol group; unsupported cells fall and empty columns close, changing which future groups exist. |
| A02 | Corner Cabinet | Solve a 2×2 twist cube by quarter-turning faces; each move simultaneously permutes and reorients several shared corner cubies. |
| A03 | Gentle Unknot | Simplify an unknot diagram through legal Reidemeister loop, bigon and strand-slide moves while preserving over/under topology. |
| A04 | Compass House | Construct exact geometric objects from given points using an unmarked straightedge, fixed-radius transfer and circle intersections. |
| A06 | Fair Portions | Use a limited number of straight guillotine cuts on connected pieces of an irregular, nonuniform sheet to produce specified equal-mass portions with protected emblems. |
| A07 | Words That Move | Push physical noun/property words into readable rules that dynamically change which objects move, block, transform and satisfy the goal. |
| A08 | Turn the Stack | Sort distinct signed discs with a spatula that reverses and flips the entire top prefix of a stack. |
| A09 | One Last Marble | Fling a marble along a row or column into a distant marble; impacts transfer motion along the line and eject the last marble, leaving the striker near contact. |
| A10 | Rooms in Motion | Insert a spare corridor tile at an outer lane to shift an entire maze row or column, ejecting the next spare, then traverse the newly connected passages. |
| A11 | Bonding Room | Move atoms that automatically form persistent bonds on contact, turning separate movable objects into rigid molecules whose expanding footprint must navigate the room. |
| A12 | Unfolding House | Cut selected seams of a polyhedral surface, then unfold retained hinges into the plane without face overlap to create a usable single connected net. |
| A13 | An Unfair Circle | Allocate a shared set of numbered faces among three dice so A beats B, B beats C and C beats A, despite equal mean values. |
| A14 | Letter Conservatory | Partition a visible letter field into bent neighboring-letter word paths under a small word budget, collecting required marked cells without reusing a tile. |
| A16 | Pocket Photograph | Capture an actual subregion of the current mutable board, then paste a rotated snapshot elsewhere to overwrite terrain and objects, changing where the avatar can travel and what remains copyable. |
| B01 | Breathing Room | Adversarial group-liberty capture and living territory. |
| B02 | Returned Banner | Captured units become deployable reserves in royal tactics. |
| B03 | Four-Step Menagerie | Four-action turns manipulate weaker enemies while support determines freezing and trap survival. |
| B04 | Living Perimeter | Move different crawling pieces around one connected hive to surround an opposing queen. |
| B05 | Homeward Pips | Allocate two dice between blocking, hitting, escape and bearing off in an opposed race. |
| B06 | Veiled Standard | Concealed-rank combat turns movement history and sacrificial scouting into persistent tactical information. |
| B07 | Second Shuffle | Build the future probability distribution of your hand through acquisition, thinning and shuffle timing. |
| B08 | Corner Garden | Adversarial polyomino placement grows a frontier through corners while forbidding own edge contact. |
| B09 | Gifted Traits | Choose the piece your opponent must place; align one shared binary trait. |
| B10 | Orders at Dusk | Simultaneous movement and support orders produce contested borders and cuttable alliances. |
| B11 | Almost a Word | Adversarial prefix extension tries to force the opponent to complete a word. |
| B12 | Crossgrain | Spend a shared letter rack to extend a scored crossing-word board against an opponent. |
| B13 | Patient Columns | Uncover hidden tableau cards by reversible descending-color packing while promoting suit foundations carefully. |
| B14 | Twin Roofs | Remove equal exposed tiles while managing three-dimensional blockers and duplicate-pair ambiguity. |
| B15 | Ascending Expeditions | Commit cards irreversibly to increasing suit routes while investment multipliers magnify unfinished projects. |
| B16 | Letters We Cannot See | Cooperate through scarce truthful hints while each player cannot see their own cards. |
| B17 | Ordered Harvest | Trade away awkward future cards because hand order forces imminent planting and field replacement. |
| B18 | Shared Seasons | Select a phase secretly so every player acts in chosen phases, but only selectors receive its privilege. |
| B19 | Pass the Burden | Pay to refuse a penalty card, or take its accumulating coins and alter the cost of future consecutive cards. |
| B20 | Market of Five | Exchange with a shared replenishing market, then time unordered set sales against diminishing rewards. |
| B21 | Roads We Share | Extend edge-matched landscape features while limited claimants stay locked until feature closure. |
| B22 | Factory Mosaic | A shared color draft creates unwanted leftovers that opponents can force into costly overflow. |
| B23 | Anchor Stacks | Stack ownership moves exactly its height while vacated bridges can erase every disconnected component. |
| B24 | The Other Half | Cut a connected estate into two connected parcels, then opponent chooses first under asymmetric public utilities. |
| B25 | Four Houses | Grow kingdoms but score the weakest of four cultures, using different rules for internal leadership disputes and external wars. |
| B26 | Carried Road | A controlled stack can be carried and split along its path, changing road ownership and wall access. |
| B27 | Masks and Coins | Make role claims to take actions; opponents can challenge evidence or counterclaim a block before effects resolve. |
| B28 | Merging Estates | Spatial building growth triggers company mergers that revalue contested stock portfolios. |
| B29 | Last Known Address | Coordinate a detective team to intercept a moving hidden fugitive whose transport traces constrain possible routes. |
| B30 | Crossed Programs | Commit movement programs simultaneously, then resolve physical interference one register at a time. |
| B31 | One Last Card | Draw one, retain one hidden identity, and use the discarded card to gather information or eliminate rivals. |
| B32 | Passing Courses | Simultaneously draft from circulating hands; what you refuse becomes an opponent opportunity. |
| B33 | A Stitch in Time | Buy spatial patches whose time cost determines opponent turn count and whose income pays only when crossing shared milestones. |
| B34 | River Stakes | Reassess hidden-hand strength across shared card reveals and respond to opponent bets with fold, call or raise. |
| B35 | Rings Leave Ripples | Move a ring to leave a marker and flip crossed marker runs; scoring removes one of your own future movement bases. |
| C01 | Falling Foundry | Rotate and translate falling tetrominoes into a persistent well; full rows disappear and overhang holes survive. |
| C02 | Cascade Orchard | Swap adjacent symbols to create horizontal/vertical triples; simultaneous matches clear and gravity refills, with objectives embedded below layered blockers. |
| C03 | Bubble Canopy | Shoot a colored bubble to attach to a hex canopy; groups of3+ pop and any cluster disconnected from ceiling drops. |
| C04 | Step and Spring | Direct variable-height jumps with coyote-time and air steering over moving and one-way platforms; landing resets jump permission. |
| C05 | Lantern Lanes | Clear pellets in a maze while distinct pursuers chase; scarce power pellets reverse contact danger for a short interval. |
| C06 | Threaded Return | Navigate with a finite tether that wraps around posts; winding history changes reachable space even at the same avatar position. |
| C07 | Magnetic Quartet | Manipulate two movable field sources to guide positive and negative charged pucks concurrently into separate traps. |
| C08 | Span Workshop | Build a load-bearing truss from pinned joints and tension/compression members; a moving test cart changes stresses across the span. |
| C09 | Corner Carry | Translate and rotate a rigid asymmetric object through narrow corridors where its full swept shape must fit. |
| C10 | Borrowed Seconds | Rewind one selected moving object along its actual history while player and all other objects continue forward. |
| C11 | Many as One | Split conserved body mass into controllable cells, move through size restrictions, then merge to exert required weight. |
| C12 | Crater Courtesy | Alternate ballistic shots with an opponent on destructible terrain; excavation changes cover, support and future firing position. |
| C13 | Elbow Room | Drive a3-joint arm through obstacles while retaining a grasped payload; elbow configuration and swept link collisions matter. |
| C14 | Common Meadow | Move one shepherd whose repulsion steers a self-propelled cohesive flock through gates without splitting stragglers off. |
| C15 | Folded Cuttings | Cut one polygonal path through a folded sheet; unfolding duplicates each cut through the layer-transform history. |
| C17 | Domino Relay | Position hinged rods so gravity, falling contact and angular impulse carry a falling chain across gaps and raised hinges. |
| C18 | Siding Stories | Shunt coupled wagons through a track graph with sidings, switch points and directional locomotive access. |
| C19 | Across the Current | Cross alternating roads and rivers by discrete hops; moving logs carry the player in their reference frame between hops. |
| C20 | Watchtower Bend | Build autonomous defenses along a branching route; tower positions reshape route length while mixed enemies have different targeting and armor vulnerabilities. |
| C21 | Through and Through | Place two linked oriented portals on surfaces; crossing transports position and rotates conserved velocity into the other portal normal. |
| C22 | Orchard Acrobat | Move the head of a connected segmented creature; whole body falls rigidly under gravity unless any segment has support; fruit adds a segment. |
| C23 | Borrowed Shade | Move a lamp so object shadows project onto a wall as solid traversable platforms; occluder depth and lamp position change shadow reach and connectivity. |
| C24 | After the Levee | Excavate channels and build finite levees on a heightfield, then let a visible water front spread downhill and overflow low sills. |
| C25 | Crossfire Courtyard | Command a3-member squad with action points, directional cover, suppression and reaction overwatch to extract a civilian across intersecting enemy fire lanes. |
| D01 | Pebble Engine | DAG pebbling with recomputation under a live-register cap |
| D02 | Cache Hotel | Offline cache replacement with dirty writeback and unequal page sizes |
| D03 | Heap Garden | Contiguous storage allocation and compaction around pinned blocks |
| D04 | Ledger Race | Concurrent execution counterexample construction |
| D05 | Receipt Route | Reliable ordered delivery over duplicate/loss channels |
| D06 | Stack Kitchen | Reusable stack-program synthesis across input families |
| D07 | Pattern Tailor | Bounded regular-expression composition from complete language specification |
| D08 | Bracket Workshop | Shift-reduce parsing with semantic attachment ambiguity |
| D09 | Type Loom | Shared-variable structural unification with an occurs check |
| D10 | Proof Lantern | Natural deduction with nested assumptions and discharge |
| D11 | Table Confluence | Relational query composition under bag semantics |
| D12 | Branch Librarian | Binary-search-tree rotations under weighted access costs |
| D13 | Row Orchestra | Elementary row operations with bounded coefficient growth |
| D14 | State Courier | Finite-state transducer construction for history-dependent output |
| D15 | Compare Parade | Oblivious comparison-network wiring with depth and fanout constraints |
| D16 | Token Crucible | Petri-net reachability with reversible catalysts and irreversible token consumption |
| D17 | Copy Ribbon | Sliding-window LZ compression using literal and overlapping back-references |
| D18 | Parallel Manuscripts | Sequence alignment with affine gap runs and anchor constraints |
| D19 | Private Census | Cohort privacy through hierarchical generalization and limited suppression |
| D20 | Tiny Soundbook | Rate-distortion quantizer construction with contiguous decision regions |
| D21 | Agenda Garden | Pairwise majority agenda construction under cyclic preferences |
| D22 | Causal Camera | Consistent distributed snapshot reconstruction with in-transit messages |
| D23 | Linked Orchard | Selective breeding with linked chromosome crossover |
| D24 | Clearing Circle | Debt clearing with endogenous default cascades and limited bridge liquidity |
| D25 | Night Collector | Incremental tracing garbage collection during visible pointer mutation |
| D26 | Gathering Grounds | Finite-horizon bandit exploration versus productive exploitation |
| D27 | Loop Transit | Passenger service topology design with autonomous transfers and finite fleet |

## Exclusions and reserves

- A05 Hinge Atlas: rejected; duplicated C13 articulated configuration decisions.
- C16 Call and Return: rejected; pure sequence recall lacked consequential decisions.
- A15 Rooms Inside Rooms: withheld; portable-bridge introductory fixture did not establish necessary coupled nesting.
- A17: uncounted reserve; simultaneous manufacturing needs further timing/content review.
- Superseded early proposals: duplicate Mahjong and rail shunting removed; B29 noncapturing race replaced with mobile hidden-fugitive pursuit. Weak D04 transaction scheduling and D22 escrow recipe replaced with counterexample construction and consistent snapshots.

## Main risks and hold

1. Distinction depends on faithfully implementing the specified state transitions. Shared button layouts and cosmetic domain changes cannot replace those transitions.
2. The 27 computational designs need unusually careful teaching and readable intermediate state. Synthesis/parsing/type/query games must not become interchangeable guess-and-check editors.
3. Physical designs with tether topology, structural load, selective rewind, projected shadows or conservative fluids need credible models and readable previews. Feature count alone is not quality.
4. Adversarial games require ordinary public-input wins against legal, nonomniscient opponents as well as natural losses. Terminal losses or solver-guided paths alone do not establish quality.
5. Concrete QA here is a future requirement, not a claim of completed testing. Use both full keyboard-only and touch-only runs; isolate native Enter/Space actions, preserve focus/selected-state semantics, and disclose screen-reader/physical-device limits.
6. Implementation was subsequently authorized on verified remediation commit `e78396ddd2c64c1b779bfaf2633dfd111637b1fb`. The [baseline recheck](EXPANSION-300-BASELINE-RECHECK.md) reopens affected comparisons; written acceptance still does not substitute for implementation review or ordinary-input evidence.

See [original design contract](design300/CONTRACT.md), [remediated baseline recheck](EXPANSION-300-BASELINE-RECHECK.md), [written uniqueness review](design300/review-uniqueness.md) and [written depth review](design300/review-depth.md).

Implementation corrections from ordinary play review:

- C17 uses hinged-rod contact dynamics, replacing the rejected abstract arrow network; it does not claim branching bell synchronization.
- C21: Final chamber now requires horizontal flight into a catch wall, reanchoring the pair during paused time and converting built horizontal speed into upward velocity to reach the high shelf. First two chambers teach falling-speed redirection.
- C22: Final island has four fruit on branches behind and above the initial head, separated support islands and an elevated exit. Ordered body shape and retaining support while turning are necessary; the former eight-Right final was rejected.
- C23: Final projection removes the middle permanent refuge. A single lamp placement must support near-shadow, far-shadow and exit transfers, coupling both depth-dependent projections.
- C24: Village foundations and boundary rock are immutable. Twelve successful earthworks share excavated spoil; final interior bedrock blocks the earlier central saddle and requires another channel. Conservative local water flow must fill both basins without village flooding.
- C25: Suppression now consumes a finite visible shared cartridge supply (8,8,7). Permanent suppression lock is unavailable; reaction management and firing-lane positioning matter. Dead units cannot escort or extract.

Final acceptance is recorded in source-bound independent play reports; author fixture wins alone are not acceptance evidence.
