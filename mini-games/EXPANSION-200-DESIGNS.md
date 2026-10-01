# Small Hours: 100 additional mechanics

Baseline: `6f4469cc7491b2b6255e7479c20880adf99787df` (100 games). These five batches add 20 games each. All 100 defining mechanics received independent source review; this does not mean every game received a full ordinary-play review. See [review decisions and scope](EXPANSION-200-REVIEW.md) and [current source-matched coverage](coverage/index.json).

## systems — 20 games

| Game | Core decision loop | Closest existing/new comparison | Decisive difference |
| --- | --- | --- | --- |
| Junction Nine | Traffic phase coordination with incompatible movements, changing arrivals and queue spillback. | Signal Run / elevator-night | Control competing queues across time rather than navigate hazards. |
| Assembly Belt | Live conveyor processing with ordered transformations, limited machine energy and rejection handling. | Rover Script / supply-web | Operate a moving production pipeline rather than prewrite a robot route. |
| Marsh Balance | Delayed coupled predator–prey population control with habitat regeneration. | Orchard Keeper / growing-block | Population feedback and lag rather than individual plant maturity. |
| Reorder Point | Inventory lot sizing with shipping lead time, holding costs and lost demand. | Trading Day / cold-chain | Fulfill demand through a delayed pipeline rather than time resale prices. |
| Workshop Shift | Worker placement with exclusive stations, shift resets and multi-resource recipes. | Orchard Keeper / supply-web | Allocate a limited worker set across occupied stations each shift. |
| Signal Cabinet | Online priority scheduling with setup costs, released jobs and completion deadlines. | Borrowed Time / borrowed-time | Single processor with dynamic arrivals and setup classes, not a prerequisite graph. |
| Cold Chain | Perishable batch processing with parallel aging, cooling capacity and recipe orders. | Orchard Keeper / reorder-point | Batch composition and expiry across processing stages. |
| Reservoir | Forecast-driven release control under storage, flood and demand constraints. | Measured Pour / kiln-house | Time-varying external inflows and demand, not conservation in jugs. |
| Power Desk | Unit commitment with startup delays, ramping, fuel and battery dispatch. | Reservoir / reservoir | Discrete plant startup and dispatch constraints. |
| Carry On | Sequential multidimensional knapsack with irreversible decisions and a single exchange. | Decimal Market / convoy-ledger | Online acceptance and replacement, rather than a fixed shopping combination. |
| Quiet Majority | Coalition bargaining with irrevocable concessions, faction vetoes and public counteroffers. | Border Guild / workshop-shift | Choose binding policy concessions satisfying conflicting factions, no territory draft. |
| Safe Return | Correlated-risk underwriting across a forecast cycle with capital exposure constraints. | Trading Day / carry-on | Premium versus correlated contingent loss, not inventory arbitrage. |
| Firebreak | Dynamic fire-front containment using persistent trenches and limited water. | Tide Pool / marsh-balance | Defend valuable cells against an evolving frontier rather than grow a region. |
| Kiln House | Coupled thermal inertia control with temperature dwell and gradient stress. | Reservoir / power-desk | Two delayed thermal states and material stress, not a scalar stock. |
| Two Couriers | Two-agent pickup-and-delivery with shared-road occupancy and parcel destinations. | Coordinate Courier / elevator-night | Coordinate two independently loaded agents, not one waypoint walk. |
| Elevator Night | Capacity-constrained elevator dispatch with passenger queues and ride deadlines. | Two Couriers / two-couriers | A shared carrier, directional boarding and passenger queue discipline. |
| Supply Web | Production network investment with sequential material flow and throughput bottlenecks. | Gear Train / assembly-belt | Buy productive capacity and route inventories, not match mechanical ratios. |
| Growing Block | Urban zoning with spatial externalities, migration, upkeep and tax feedback. | Border Guild / marsh-balance | Buildings alter habitation over successive years rather than score drafted territory. |
| Borrowed Time | Precedence-constrained parallel project scheduling with resource-specific crew assignments. | Signal Cabinet / signal-cabinet | A dependency DAG with parallel crews and readiness constraints. |
| Convoy Ledger | Persistent escort allocation across simultaneous threatened shipping lanes. | Hidden Fleet / safe-return | Visible-threat defense allocation and fleet attrition, not spatial search. |

Detailed design record: [design-systems.json](design-systems.json).

## tabletop — 20 games

| Game | Core decision loop | Closest existing/new comparison | Decisive difference |
| --- | --- | --- | --- |
| Velvet Tricks | Follow-suit trump trick taking with a changing leader. | code-cabinet / last-hand | Individual trick ownership, forced suit obligations and control of who leads, rather than sum/bust decisions. |
| Twenty-One | Five-round blackjack with hit, stand, double and a finite chip stack. | trade / bank-the-roll | A shared finite deck, flexible ace valuation and dealer comparison replace a repeat-until-bust race. |
| Meld Atelier | Draw-discard rummy with selectable sets/runs and deadwood pressure. | chain-reaction / five-card-evening | Repeated information acquisition and incompatible meld commitments, rather than a single final five-card rank. |
| Five Card Evening | Draw poker with a scarce second-redraw budget and rank-dependent stakes. | trade / meld-atelier | A scarce shared redraw budget and stake allocation across hands; no runs/sets removal or discard market. |
| Last Hand | Climbing card shedding with matching group sizes, passes and lead resets. | nim / velvet-tricks | Combination sizes and pass-driven lead reset govern hand depletion, not suit-following trick accumulation. |
| Scopa Shelf | Scopa sum capture with explicit subset choice and sweep bonuses. | make-24 / thirty-one-lane | Adversarial exposed-card capture, forced exact-rank priority and control of the next table, not expression assembly. |
| Domino Parlour | Two-ended domino shedding with boneyard draws and blocked-hand resolution. | chain-reaction / last-hand | Opponent, two-ended orientation and finite draws create blockage and pip-management decisions beyond word endpoint matching. |
| Bank the Roll | Pig dice push-your-luck racing with unbanked turn value. | tide-pool / six-columns | The decision is when to stop accumulating exposed risk, not which dice/category combination to reserve. |
| Six Columns | Five-dice hold/reroll optimization with six irreversible scoring categories. | make-24 / bank-the-roll | Irreversible category allocation and selective rerolling replace a cumulative bust-or-bank choice. |
| Hidden Dice | Liar dice rising quantity/face bids with hidden opposing dice and challenge attrition. | code-cabinet / sealed-bids | Adversarial probabilistic claims and costly challenge timing, rather than deterministic feedback deduction. |
| Sealed Bids | Goofspiel simultaneous one-use ranked bids with tied-prize carryover. | trade / hidden-dice | Irrecoverable simultaneous bids and opponent denial, without money, inventory or buy/sell price arbitrage. |
| Thirty-One Lane | Cribbage pegging with ordered run/pair bonuses, go and 31 resets. | make-24 / twenty-one | Ordered communal sequence bonuses, exact totals and forced go replace private-hand bust/dealer comparison. |
| Formation Flags | Three-card formation contest over five lanes with refill drafting. | guild / five-card-evening | Each lane compares a committed poker formation, with hand/refill uncertainty rather than static numeric district/adjacency scoring. |
| Crown & Guard | Asymmetric tafl escape with rook movement and sandwich capture. | pawns / borrowed-steps | Asymmetric escort and sandwich capture, special squares and rook lines replace symmetric one-step pawn racing. |
| Draught Garden | Six-by-six draughts with mandatory multi-capture and king promotion. | peg / crown-and-guard | Compulsory adversarial capture chains and promotion produce tactical exchange decisions, unlike fixed solo peg elimination. |
| Borrowed Steps | Onitama-style exchanged movement cards with master/temple victory. | pawns / crown-and-guard | Transferable public movement patterns are a shared evolving resource; royal capture/temple goals replace uniform pawn rules. |
| Marble Council | Hex-board inline group pushing and edge ejection with numerical superiority. | reversi / draught-garden | Pieces move and push through local numerical strength to eject at edges; no bracket-conversion or placement. |
| Joining Lines | Lines of Action movement distances determined by occupancy, with army connectivity victory. | hex / marble-council | Mobile armies use population-dependent travel and captures, rather than irreversible stones linking fixed board edges. |
| Terrace Duel | Two-worker move/build tactics on a rising three-dimensional board. | siege / crown-and-guard | Local height construction changes future climb access and creates a positive level-three objective, not ray movement/irreversible flat obstruction. |
| Court of Suits | Read the armor/heavy/quick intent cycle and time finite cards for damage, guard, healing or draw. | orchard / meld-atelier | Tactical suit effects against escalating enemy damage and finite hand sequencing, not planting/production scheduling. |

Detailed design record: [design-tabletop.json](design-tabletop.json).

## puzzles — 20 games

| Game | Core decision loop | Closest existing/new comparison | Decisive difference |
| --- | --- | --- | --- |
| mutual-match | Ranked preference stability | seat-at-table / honest-company | Assignments are judged by reciprocal incentives and blocking pairs, rather than positional clues. |
| ice-station | Stop-to-stop momentum routing | coordinate-courier / twin-steps | A move travels until collision; the player plans stopping points and approach directions. |
| cube-seal | Coupled cube orientation and position | shadow-turn / ice-station | Rotation is coupled to grid travel, with six-face orientation persisting between goals. |
| knight-exchange | Occupancy constrained knight permutation | pawns / twin-steps | Single-player swapping through L-shaped jumps, no captures or opponent. |
| map-inks | Graph vertex coloring | towers / circuit-break | Adjacency inequality coloring, rather than ray coverage or set placement. |
| circuit-break | Budgeted vertex cut | bridgewater / copper-tree | Delete intermediary vertices to separate marked terminals under a strict cut budget. |
| copper-tree | Minimum spanning tree construction | bridgewater / river-capacity | Edge costs and global acyclic cost optimality replace per-vertex degree clues. |
| river-capacity | Conserved capacitated network flow | orbit-transfer / copper-tree | Allocate simultaneous integer flows with conservation and capacities rather than choose a route. |
| honest-company | Self-referential truth assignment | seat-at-table / gate-foundry | Simultaneous Boolean statements must agree with each speaker’s truth status. |
| gate-foundry | Truth table circuit synthesis | lantern-lines / seed-tomorrow | Choose Boolean functions inside a feed-forward circuit and satisfy all truth-table rows. |
| rewrite-press | Bounded substring rewriting | wordbreak / gate-foundry | Consume and produce substrings through stateful rules with order-sensitive application. |
| twin-steps | Mirrored simultaneous maze navigation | coordinate-courier / ice-station | A shared action drives two independently blocked agents in opposite directions. |
| seed-tomorrow | Inverse cellular evolution | lantern-lines / parity-repair | Choose an initial condition, then reason through multi-step cellular time evolution. |
| voxel-post | Orthogonal projection reconstruction | shadow-turn / parcel-survey | Infer 3D occupancy from axis line sums, rather than rotate visible silhouettes. |
| hitori-harbor | Duplicate elimination with connectivity | equal-measure / island-census | Remove duplicate row/column values while keeping a connected unshaded graph. |
| island-census | Island size and sea connectivity deduction | picross-post / hitori-harbor | Connected component sizes and sea topology replace line-run constraints. |
| parcel-survey | Anchored rectangle partition | tangram-dock / voxel-post | Derive rectangular regions from anchored area clues, rather than place supplied pieces. |
| arrow-audit | Minimum feedback arc reversal | orbit-transfer / copper-tree | Break all directed cycles with budgeted edge reversals, not route traversal. |
| parity-repair | Constrained multi-bit syndrome correction | bit-lanterns / seed-tomorrow | Infer multiple errors from overlapping parity constraints under an edit budget. |
| safety-ferry | Safety invariant river transport | measured-pour / circuit-break | Cargo transport preserves pairwise bank safety in the ferryman’s absence. |

Detailed design record: [design-puzzles.json](design-puzzles.json).

## kinetic — 20 games

| Game | Core decision loop | Closest existing/new comparison | Decisive difference |
| --- | --- | --- | --- |
| Vector Rally | Choose integer acceleration; your accumulated velocity traces a swept path around a race course. Brake before bends. | Star Tow / trailer-yard | Discrete acceleration planning and swept collision on a race track, not free-flight cargo collection. |
| Border Bloom | Leave a safe border to draw an exposed trail; reconnect to claim territory while a roaming hazard can cut the trail. | Velvet Snake / fuse-garden | Enclose area and return to safety; trail resets rather than growing a permanent body. |
| Lantern Heist | Steal seals while avoiding rotating patrol sightlines; lure guards with a noise decoy, then reach the exit. | Rover Script / echo-steps | Direct stealth movement against clocked enemy visibility and distraction, rather than queued single-agent commands. |
| Boulder Burrow | Excavate soil under falling and rolling boulders to uncover gems without being crushed or sealing the escape. | Crate Crane / soft-sculpt | Gravity updates terrain after every step; no stack sorting or crate push target. |
| Fuse Garden | Plant delayed cross-blast bombs, shelter behind masonry, and chain detonate barriers to reach the exit. | Minefield / lantern-defense | Create and schedule hazards yourself; timed escape and destructive topology rather than hidden-mine deduction. |
| Quiet Foil | Manage distance and stamina against telegraphed thrusts; parry to open a riposte or retreat to recover. | Rope Skip / ricochet-duel | Opponent state, spacing, resource and initiative decisions rather than periodic timing. |
| Four Holds | Move individual climbing limbs between reachable holds while maintaining support and controlling fatigue. | Balance Mobile / spring-courier | Moving contact topology and reach constraints, not static torque equation. |
| Trailer Yard | Steer and reverse an articulated tractor/trailer into a loading bay without jackknifing. | Star Tow / vector-rally | Coupled tractor/trailer headings, reversing and final alignment rather than inertial docking. |
| Gravity Boots | Flip gravity to traverse floors and ceilings, retaining horizontal velocity through spike-lined chambers. | Kite Flight / portal-parcel | Surface polarity and lateral momentum; no repeated hold-to-rise gates. |
| Portal Parcel | Throw a bouncing beacon, let it travel, then exchange positions to bypass solid barriers. | Orbit Transfer / gravity-boots | Ballistic remote-body placement followed by position exchange, not a fixed directed graph. |
| Echo Steps | Record a route, rewind, then cooperate with its replay to hold switches and open a timed exit. | Rover Script / lantern-heist | Two simultaneous time-offset bodies and pressure-plate cooperation rather than single-agent queued route. |
| Phase Walk | Change between three material phases to pass selective walls; phase anchors restrict where you may change. | Orbit Transfer / gravity-boots | State-dependent physical passability with restricted phase transitions, not graph-edge routing. |
| Wind Sail | Choose heading and sail trim to tack against wind through separated racing buoys without stalling or grounding. | Star Tow / vector-rally | Wind-relative propulsion and an upwind no-go cone require tacking rather than thrust/braking. |
| Scissor Lift | Drive a telescoping vehicle under ceilings, raise its deck to receive freight, then carry and unload at elevated docks. | Sky Stack / trailer-yard | Vehicle clearance, changing geometry, and loaded-height safety rather than dropping blocks. |
| Ricochet Duel | Aim reflecting rays past walls and an oriented rotating shield; alternate repositioning and shooting with limited ammunition. | Afterglow / shatter-belt | Moving shot origin, rotating directional shield and enemy column attacks govern alternating tactical turns rather than brick volley survival. |
| Soft Sculpt | Cut bonds in a weighted hanging network; disconnected components fall irreversibly. Reach target suspended mass and zero torque while retaining a protected weight. | Balance Mobile / four-holds | Inverse removal through graph connectivity, redundant supports and irreversible falling components; no free weight placement. |
| Spring Courier | Pump a suspended parcel, release its pendulum, then catch a new anchor or a landing platform. | Rope Skip / four-holds | Pendulum energy and anchor-to-anchor travel, not jumping over a timed sweep. |
| Shatter Belt | Rotate and fire at drifting rocks that split into smaller faster fragments; manage recoil and shield protection. | Star Tow / ricochet-duel | Threat subdivision and line-of-fire positioning rather than cargo collection; combat changes obstacle population. |
| Lantern Defense | Launch expanding interceptors ahead of descending projectiles; chain blast coverage protects three separated bases with finite ammunition. | Garden Guard / fuse-garden | Predictive interception and persistent expanding areas, not tapping targets at their current position. |
| Little Walkers | Assign limited builder, digger and blocker jobs to autonomous walkers; reshape terrain and rescue a quota. | Rover Script / echo-steps | Concurrent agents, scarce terrain-changing roles and emergent paths rather than a queued single-agent script. |

Detailed design record: [design-kinetic.json](design-kinetic.json).

## discovery — 20 games

| Game | Core decision loop | Closest existing/new comparison | Decisive difference |
| --- | --- | --- | --- |
| Ray Archive | Black Box perimeter ray inference | fleet / scent-trail | Probe perimeter ports to observe deflections and infer hidden atoms; firing a ray returns topology, not cell hit/miss. |
| False Weight | Adaptive balance-scale experimentation | balance-mobile / twenty-questions | Design equal-pan experiments to identify a heavy or light counterfeit across three assays. Nearest-neighbor distinction is implemented in the action/state rules, as recorded in reviewNotes. |
| Three of a Kind | Set-style relational triple selection | odd-company / none: distinct state/action model | Find triples satisfying all-same or all-different simultaneously across three visual dimensions in a changing tableau. |
| Second Look | Change blindness with deliberate scene toggling | double-take / none: distinct state/action model | Alternate two complete scenes, locate modifications while ignoring unchanged objects; no hidden pair identities. |
| Fog Journal | Limited-vision maze mapping with return trip | coordinate-courier / none: distinct state/action model | Procedural local-visibility maze exploration, persistent journal and artifact return under fuel; existing courier shows fixed coordinates and ordered targets. |
| Prefix Press | Weighted prefix-code tree construction | bit-lanterns / none: distinct state/action model | Merge least-weight messages into a prefix tree, then encode a dispatch. Optimize weighted path length, not number representation. |
| Transit Observatory | Active temporal sampling to resolve orbital aliases | sequence-detective / specimen-rule | Choose observation times, eliminate period/phase hypotheses, identify three transiting worlds within an observation budget. |
| Specimen Rule | Active hypothesis testing of a hidden grammar | sequence-detective / twenty-questions | Construct specimens to query membership, then correctly classify unseen specimens; experiments distinguish relational rules rather than predict a numeric continuation. |
| Causal Lab | Intervention-based causal circuit diagnosis | code-cabinet / none: distinct state/action model | Toggle interventions and observe propagated effects; isolate a broken directed link rather than guess a secret code. |
| Parallax Post | Active stereo correspondence with variable camera baseline and selective depth focus | sky-view / none: distinct state/action model | Reconstruct stereo correspondences, move the camera baseline, and isolate a depth plane. Nearest-neighbor distinction is implemented in the action/state rules, as recorded in reviewNotes. |
| Wave Desk | Discrete harmonic signal synthesis | pigment-lab / none: distinct state/action model | Adjust signed amplitudes of temporal basis waves to cancel noise and reconstruct sampled signal; interference permits subtraction. |
| Question Orchard | Adaptive binary decision-tree construction | code-cabinet / none: distinct state/action model | A changing correlated-trait catalog makes question order matter under a shared query budget; known-property decision-tree search differs from constructing experiments to discover an unknown rule in Specimen Rule. |
| Scent Trail | Gradient navigation with moving plume | fleet / none: distinct state/action model | Sample local concentration, move a tracked rover against a wind-shifted plume and sample at source; sensors return gradients, not occupancy. |
| Fossil Brush | Risk-aware excavation with tool footprints | minefield / none: distinct state/action model | Plan broad and precise cuts to expose varied buried fossils within a tight tool budget. Nearest-neighbor distinction is implemented in the action/state rules, as recorded in reviewNotes. |
| Archive Edit | Version-control branching and selective merge | sentence-studio / none: distinct state/action model | Choose a limited set of dependent patches, then resolve their conflicting edits into a publishable document. Nearest-neighbor distinction is implemented in the action/state rules, as recorded in reviewNotes. |
| Lens Library | Convolution model identification and deblurring | stamp-studio / wave-desk | Inspect blurred samples, infer the neighborhood blur kernel via calibration probes, then choose an inverse reconstruction to recover an image. |
| Invisible Ink | Multi-channel observation and evidence intersection | hidden-grove / none: distinct state/action model | Use limited spectral strip exposures and a manifest to eliminate counterfeit parcels. Nearest-neighbor distinction is implemented in the action/state rules, as recorded in reviewNotes. |
| Clockmaker’s Cabinet | Inventory-combination escape adventure | afterglow / none: distinct state/action model | Explore connected rooms, collect and combine objects, change machinery states and unlock the exit through causal item-use chains. |
| Track Exchange | Asymmetric two-character exploration and object transfer | coordinate-courier / none: distinct state/action model | Navigate complementary gate and water routes, then exchange the objects each explorer needs to escape. Nearest-neighbor distinction is implemented in the action/state rules, as recorded in reviewNotes. |
| Folded World | Non-Euclidean room exploration and orientation inference | orbit-transfer / none: distinct state/action model | Plan atlas routes through rooms that rotate and reflect your local compass. Nearest-neighbor distinction is implemented in the action/state rules, as recorded in reviewNotes. |

Detailed design record: [design-discovery.json](design-discovery.json).

