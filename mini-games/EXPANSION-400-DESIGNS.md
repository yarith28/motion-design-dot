# Expansion to400: inventory and distinct-game plan

Baseline: `c96ec5e39669d330ac761d98a335afe44c34a977` (2026-10-02). Inventory and catalog both contain exactly 300 unique playable entries across16 families. `tests/fixtures/baseline300.json` records their original metadata and227 runtime/unrelated-app files; `tests/preservation300.cjs` enforces exact preservation, including Kitchen Cats and the motion showcase. The catalog Grid/List code and styling are included in preservation, along with all 290 existing catalog PNG previews.

## Verified baseline inventory

| Family | Games |
|---|---:|
| original | 10 |
| spatial-room | 15 |
| logic-room | 15 |
| number-room | 15 |
| word-room | 15 |
| strategy-room | 15 |
| arcade-room | 15 |
| systems-room | 20 |
| tabletop-room | 20 |
| puzzle-lab | 20 |
| kinetic-room | 20 |
| discovery-room | 20 |
| construct-room | 14 |
| parlour-room | 35 |
| motion-room | 24 |
| workbench-room | 27 |
| **Total** | **300** |

##100 new games, five coherent batches

Each game gets precise instructions, visible controls/feedback, substantive finite progression, a valid completion, explicit failure or recoverable puzzle failure, restart, personal score, and keyboard/touch support. A manifest alone is insufficient for catalog admission. Every candidate must pass actual full-campaign desktop and emulated-touch play, rule regressions, restart and source-bound coverage. Ordinary-input reviews are recorded separately from authored/source-informed test paths.

Optional endless modes preserve finite campaigns. They use fresh seeded layouts/parameters with capped sizes/difficulty, cumulative scores and explicit failure/banking; unsupported generators are disclosed instead of recycling fixed boards. The per-game audit will cover every original and addition.

The two initial rejected concepts were `color-confluence` (same Flood-It decisions as Tide Pool) and `split-order` (too close to Question Orchard decision-tree construction). Their replacements are Weighted Weft and Divisor House. The 100 entries below are implementation plans, **not a claim of completion**.

## constraint-room —20 games

| Game | Defining decisions |
|---|---|
| Lamp Ward (`lamp-ward`) | Place mutually non-seeing lamps whose blocked orthogonal rays illuminate every open square. |
| Star Charter (`star-charter`) | Choose one star in each row, column and irregular region while reserving a non-touching king neighborhood. |
| Magnet Ledger (`magnet-ledger`) | Orient bipolar domino magnets or leave their slots empty to meet signed marginal counts without equal-pole contact. |
| Region Census (`region-census`) | Assign size labels so connected equal-number components contain exactly that many cells. |
| Mosaic Ring (`mosaic-ring`) | Read cyclic runs around clue cells to build a single connected dark mosaic. |
| Sight Garden (`sight-garden`) | Shade blockers to make each numbered white cell see exactly its quota of white squares along straight rays. |
| Diagonal Grove (`diagonal-grove`) | Choose one diagonal per square so numbered lattice vertices get their degree without forming any diagonal cycle. |
| Thermometer Hall (`thermometer-hall`) | Set each bent thermometer’s prefix length so row and column fill quotas agree. |
| Compass Estate (`compass-estate`) | Extend four straight non-overlapping arms from numbered hubs until every square has an owner. |
| Fleet Blueprint (`fleet-blueprint`) | Deduce an entire separated fleet from public row/column totals, ship lengths and partial hull/water clues. |
| Shade Detour (`shade-detour`) | Choose arrow-counted blocked cells while routing one loop through every remaining non-clue cell. |
| Quiet Rooms (`quiet-rooms`) | Allocate shaded cells to room quotas without splitting white space or permitting a straight white view across more than two rooms. |
| Four Forms (`four-forms`) | Choose one four-cell tetromino subset inside each region so the selected pieces join without same-shape neighbors. |
| Domino Register (`domino-register`) | Partition a numbered grid into adjacent pairs, using each unordered number-pair exactly once. |
| Weighted Weft (`weighted-weft`) | Choose binary squares so row totals use column positions as weights and column totals use row positions as weights. |
| Once Through (`once-through`) | Traverse every undirected bridge exactly once, choosing when to cross fragile connector edges. |
| Cyclic Courtyard (`cyclic-courtyard`) | Shift whole rows or columns with wraparound to restore a scrambled tile permutation. |
| Seam Quilt (`seam-quilt`) | Place and rotate edge-labeled tiles so neighboring seams agree and the required boundary labels face outward. |
| Exclusive Print (`exclusive-print`) | Select overlapping plates so each requested cell receives exactly one coat while blank cells receive none. |
| Window Tally (`window-tally`) | Reconstruct a shaded picture from overlapping 3×3 local counts, including the clue square itself. |

Detailed neighboring-mechanic comparisons, finite/endless designs, loss conditions and generation strategy: [proposal record](design400/logic-proposals.json).

## field-room —20 games

| Game | Defining decisions |
|---|---|
| Ninepin Line (`ninepin-line`) | Choose ball entry position and hook spin to trade direct pocket impact against useful pin-to-pin momentum; the second ball must convert the actual remaining rack. |
| Batter’s Window (`batters-window`) | Read the visible curved pitch, choose when it intersects bat reach, and set pull/center/push contact orientation to place the outgoing ball away from fielders. |
| Crease Keeper (`crease-keeper`) | Choose a starting position and stance, then commit a high or low dive at the right beat to cover a visibly curving shot within finite reach. |
| Last Second Pass (`last-second-pass`) | Move off-ball teammates before sending a physical pass so a receiver can arrive while a defender cannot intercept; possession, passing lanes and the offside line constrain the route to goal. |
| Court Rotation (`court-rotation`) | Allocate a three-contact airborne rally across player roles: receive to a setter, place a set, and choose a spike lane after observing blocker commitment. |
| Velodrome Draft (`velodrome-draft`) | Choose effort and lane while using an opponent’s slipstream to conserve energy, then spend that reserve to overtake; outer lanes reduce forward race progress. |
| Clutch Circuit (`clutch-circuit`) | Shift a manual gearbox to keep engine RPM in its useful band as gradients and corner caps change load; shifts interrupt drive while brakes trade speed for brake/engine heat. |
| Ribbon Relay (`ribbon-relay`) | Accelerate the outgoing runner while controlling the incoming runner so both occupy the exchange zone at similar speed before transferring the baton. |
| Two Oars (`two-oars`) | Time each oar’s independent pull/recovery to create forward impulse or yaw while managing current drift and asymmetric fatigue. |
| Cable Carrier (`cable-carrier`) | Accelerate an overhead trolley and change cable length to cancel actual suspended-load oscillation before fitting the load into a receiver. |
| Thermal Route (`thermal-route`) | Convert finite height into glide distance, then turn inside spatial thermal columns to recover height; airspeed and bank actions change sink and lift exposure. |
| Belay Line (`belay-line`) | Coordinate controlled descent with rope feed/take-up and friction braking, keeping enough slack for movement without creating a shock-loaded fall. |
| Vault Runway (`vault-runway`) | Build runway speed, choose the pole’s plant timing/grip, and release its stored bending energy at a useful rotation angle to clear a bar. |
| Tucked Landing (`tucked-landing`) | Tuck and extend during a dive to change rotational inertia while angular momentum is conserved, then align the body before water entry. |
| Wave Trim (`wave-trim`) | Steer relative to a moving curved wave face: descending the face builds board speed, while climbing/carving spends it to reach gates before the crest passes. |
| Ripple Skimmer (`ripple-skimmer`) | Choose a flat stone’s launch angle, plate tilt, speed and stabilizing spin so the specified final water skip lands inside a marked interval. |
| Spin Passage (`spin-passage`) | Apply torque to a spinning top whose tilt direction precesses, anticipating where its contact point will drift before friction drains the spin reserve. |
| Cascade Hands (`cascade-hands`) | Choose throw height and catch/throw order across independently flying balls so each hand becomes free before the next descending ball arrives. |
| Ice Rescue (`ice-rescue`) | Plan outbound and loaded return routes across ice whose support degrades with each pressure exposure; spreading weight reduces damage while costing actions in a moving current. |
| Breathing Lane (`breathing-lane`) | Coordinate stroke recovery, diving depth and surface breaths: submerged streamlining improves pace but expends oxygen, while breath posture adds drag and interrupts arm propulsion. |

Detailed neighboring-mechanic comparisons, finite/endless designs, loss conditions and generation strategy: [proposal record](design400/motion-proposals.json).

## signal-lab —20 games

| Game | Defining decisions |
|---|---|
| Reset Post (`reset-post`) | Choose one common input word that collapses every possible starting state into one state. |
| Quotient Quay (`quotient-quay`) | Merge exactly the states with identical future acceptance behavior. |
| Cutback Case (`cutback-case`) | Spend oracle tests to isolate a minimal failure-inducing subset of an input. |
| Clause Kiln (`clause-kiln`) | Choose opposing literals and resolve clauses to construct an empty-clause certificate. |
| Wraparound Witness (`wraparound-witness`) | Choose a small input that follows a required branch trace after fixed-width overflow. |
| Branch Weather (`branch-weather`) | Evaluate nested all-path/existential temporal obligations by constructing state sets from inside out. |
| Phase Paper (`phase-paper`) | Compose interference operations so amplitudes, including sign, meet a target two-state wave. |
| Rotation Index (`rotation-index`) | Rebuild a message by following stable occurrence ranks through a sorted cyclic transform. |
| Shared Secret (`shared-secret`) | Choose interpolation weights whose weighted shares recover a hidden finite-field constant. |
| Crossed Channel (`crossed-channel`) | Choose when a bottleneck should carry a linear combination so two receivers can undo it using side information. |
| Quorum Garden (`quorum-garden`) | Choose read/write quorum families that always intersect while surviving specified outages. |
| Bound Names (`bound-names`) | Reduce an expression while renaming binders to prevent free-variable capture. |
| Separating Line (`separating-line`) | Place a separating line with a required margin between two labeled point clouds. |
| Hall Window (`hall-window`) | Produce a subset of jobs with fewer eligible workers than jobs, proving full assignment impossible. |
| Empty Language (`empty-language`) | Prove which grammar symbols can disappear by selecting justified nullable productions until fixedpoint. |
| Credit Method (`credit-method`) | Assign conserved potential credits so a sequence of costly data-structure operations fits a fixed amortized charge. |
| Interval Post (`interval-post`) | Narrow a rational coding interval, then choose the shortest binary fraction strictly inside it. |
| Pruning Room (`pruning-room`) | Expose selected leaves of a minimax tree and certify root value only when explored bounds justify pruning. |
| Privacy Dials (`privacy-dials`) | Allocate response probabilities so neighboring inputs have bounded likelihood ratios while accuracy stays high. |
| Divisor House (`divisor-house`) | Allocate a fixed house of seats so every district is consistent with one common divisor. |

Detailed neighboring-mechanic comparisons, finite/endless designs, loss conditions and generation strategy: [proposal record](design400/computation-proposals.json).

## commons-room —20 games

| Game | Defining decisions |
|---|---|
| Tide and Retreat (`tide-and-retreat`) | Move along connected intersections and choose approach or withdrawal to capture the contiguous enemy line in front of or behind the mover; a capture chain cannot revisit an intersection or repeat its preceding direction. |
| Spore Council (`spore-council`) | Clone to an adjacent square or jump two squares leaving the source empty; every adjacent enemy around the landing becomes yours. Cloning grows material but may expose a conversion cluster. |
| Shared Comet (`shared-comet`) | First slide the shared neutral comet as far as possible along a clear ray, then slide one of your blockers; plan where the opponent will be forced to send that same comet. |
| Socket Skirmish (`socket-skirmish`) | Spend a turn fitting a directional movement pod to a piece or execute a straight jump using one of its installed directions; jumped opposing pieces and their pods become captured reserves. |
| Cannon Council (`cannon-council`) | Three aligned soldiers form a cannon. Reposition the formation by shifting its rear soldier to the front, or bombard beyond an empty muzzle gap; ordinary soldiers fight at short range. |
| Bloom Cauldron (`bloom-cauldron`) | Build a persistent bag of ingredients, then draw without replacement into a growing pot; colored ingredients multiply earlier colors, while too many white hazards spoil the batch. Stop drawing before buying improvements. |
| Three Fronts (`three-fronts`) | Allocate one finite force simultaneously across three independently valued battlefields; concentration wins locally but concedes others, and rival allocations adapt to your revealed previous pattern. |
| Package Yard (`package-yard`) | Submit mutually exclusive bids for complementary bundles of lots; the clearing auction selects a disjoint collection of bids maximizing revenue, so winning one desired lot can block a higher-value package. |
| Falling Hammer (`falling-hammer`) | Wait as a Dutch auction clock lowers its price, or stop it now before a rival with a behavioral reservation policy takes the lot; preserve liquidity for later complementary objects. |
| Orderbook Wharf (`orderbook-wharf`) | Post buy or sell limit orders at chosen prices, compete for time-priority fills, cancel scarce orders, and decide whether to cross the spread before future demand arrives. |
| Many Hands (`many-hands`) | Contribute part of a personal budget to a threshold public project, pledge conditional matching to change other contributors' incentives, or reserve funds; project benefits are shared even by noncontributors. |
| Congestion Crossing (`congestion-crossing`) | Split a fleet among routes whose traversal costs depend on the combined simultaneous load of your fleet and a self-routing rival; an individually shorter road may make every user's journey longer. |
| Price of Plenty (`price-of-plenty`) | Choose production quantity before a rival chooses its own; the combined output sets a downward-sloping market price, so individually expanding can destroy joint profit. Capacity investment competes with present production. |
| Bargain at Closing (`bargain-at-closing`) | Offer an allocation of a common pie, accept the rival's counteroffer or reject to retain bargaining rights while the pie shrinks; each party values immediate and delayed shares differently. |
| Last Applicant (`last-applicant`) | Inspect applicants in irreversible order and stop once to hire; previous candidates cannot be recalled, while inspection cost and a public quality distribution determine the value of waiting. |
| Seasonal Ledger (`seasonal-ledger`) | Assign crops to fields across seasons: legumes restore nitrogen, cereals consume it, consecutive species build pests, and a neighboring companion crop changes yield. Future soil and pest states depend on each field's actual rotation history. |
| Permit and Progress (`permit-and-progress`) | Bank scarce emission permits across compliance periods, sell surplus into a competitive price schedule or spend capital to retrofit production; selling a permit today can force expensive future abatement when allowance supply tightens. |
| School of Shoals (`school-of-shoals`) | Choose extraction and an enforceable shared quota for renewable fisheries while autonomous rivals react to their own last catch and your enforcement; taking more now can lower spawning and ruin everyone's later catch. |
| Promised Tomorrow (`promised-tomorrow`) | Choose cooperation or defection in repeated bilateral exchanges, offer a costly apology to repair trust, and decide whether to switch partners; rivals maintain different observable retaliation and forgiveness memories. |
| Maturity Garden (`maturity-garden`) | Build a ladder of zero-coupon claims whose maturity dates match mandatory cash outflows; selling early exposes duration-sensitive prices, while buying a higher long-term return can leave an earlier liability unfunded. |

Detailed neighboring-mechanic comparisons, finite/endless designs, loss conditions and generation strategy: [proposal record](design400/strategy-proposals.json).

## atelier-room —20 games

| Game | Defining decisions |
|---|---|
| Cam Workshop (`cam-workshop`) | Shape a cyclic radial cam profile whose neighboring samples must satisfy slope/contact limits while two phase-offset followers deliver different required motions. |
| Common Cut (`common-cut`) | Nest two or three irregular parts in sheet stock, plan shared cutting edges, and retain a connected path to the fixed clamp until each part is safely released. |
| Interlock Cabinet (`interlock-cabinet`) | Translate whole interlocked voxel pieces along their permitted axes, making clearance for others before withdrawing each through its matching aperture. |
| Pressure Gallery (`pressure-gallery`) | Switch check valves and drive pistons: conserved liquid displacement and piston areas couple all connected strokes, while pressure thresholds make a valve open only under useful loading. |
| Shrink Fit (`shrink-fit`) | Heat rings and cool shafts to clear interference fits, then insert in the required geometric order before equilibration permanently locks their positions. |
| Vented Cast (`vented-cast`) | Open gas vents and choose injection gates while liquid advances through a mold; filled cells block gas evacuation, making trapped pockets permanently unfillable. |
| Drawplate (`drawplate`) | Choose irreversible die reductions under volume conservation: every draw increases length and work hardening, so anneal timing must leave enough ductility and fuel for the final gauge. |
| Wet Paper (`wet-paper`) | Place water and pigment before they diffuse across connected wet fibers; drying locks color, while later water reactivates only unfixed pigment and bleeds across still-wet edges. |
| Sand Table (`sand-table`) | Drop conserved grains and place removable baffles so local angle-of-repose avalanches build required support elevations without burying marked fragile openings. |
| Crack Compass (`crack-compass`) | Notch a brittle plate and apply directional loading; a crack follows the most highly stressed accessible bond, while reinforcing a bond redirects the growing fracture toward a release seam. |
| Pulley Bay (`pulley-bay`) | Thread one continuous rope through fixed and movable pulleys, choose anchoring points, then operate it: rope-length constraints couple several load displacements and mechanical advantage. |
| Clutch Dock (`clutch-dock`) | Accelerate independent flywheels, then connect clutches that conserve angular momentum; synchronize a load without crossing clutch slip-energy or engine-stall limits. |
| Lens Craft (`lens-craft`) | Place curved lenses at separations that transform both ray height and angle; focus two incident ray bundles while matching the image orientation and avoiding aperture clipping. |
| Polarization Stage (`polarization-stage`) | Order polarizers and quarter-wave plates: plates transform linear light into elliptical states, so downstream intensity depends on component order rather than independent filter strength. |
| Seal Shop (`seal-shop`) | Tighten bolts around an elastic gasket: each tightening changes neighboring compressions and total load; prevent leaks while avoiding local crush and bolt yield. |
| Capstan Crossing (`capstan-crossing`) | Route a loaded rope around posts with different friction coefficients: each wrap can sustain a tension ratio but consumes rope length and increases required release effort. |
| Spring Form (`spring-form`) | Bend a strip around dies while elastic springback depends on material and prior yielding; tool reach and already-bent sections constrain which bends can be formed next. |
| Vacuum Patch (`vacuum-patch`) | Patch leaks in a flexible membrane while pump pressure increases peel forces along exposed patch edges; overlap can reinforce a seal but transfer stress to another edge. |
| Mill Fixture (`mill-fixture`) | Machine an exact cavity in a solid block while retaining clamped stock and choosing tool approach axes; removing one support may make later cuts inaccessible or the part unholdable. |
| Sound Splice (`sound-splice`) | Cut labeled phoneme ribbons and exchange suffixes between two words, simultaneously changing both; produce every target word with a limited number of coupled splices while intermediate ribbons remain pronounceable dictionary entries. |

Detailed neighboring-mechanic comparisons, finite/endless designs, loss conditions and generation strategy: [proposal record](design400/atelier-proposals.json).
