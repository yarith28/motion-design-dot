# Field Room optional endless review

Reviewed actual engine initializers, action rules, win/loss conditions and optional generation. “Challenge stream” starts a new seeded bounded challenge after each win; score accumulates until loss or Bank and end run. “Match series” also restores the race state/reserve and labels that behavior explicitly. Finite options remain intact.

| Game | Existing/new support | Sensible extension and limits | Source |
| --- | --- | --- | --- |
| Ninepin Line | challenge-stream | Seeded rack offsets, lane-hook factors and pinfall quotas vary each three-frame challenge; failed quota ends the cumulative tour. | [sports.mjs](sports.mjs) (`ninepin-line`) |
| Batter’s Window | challenge-stream | Seeded pitch speed/curvature sequences and continuously varied open field sectors; a failed six-pitch quota ends the run. | [sports.mjs](sports.mjs) (`batters-window`) |
| Crease Keeper | challenge-stream | Seeded target offsets, curves and alternating high/low shots. Every generated set requires four of six saves; failure ends the run. | [sports.mjs](sports.mjs) (`crease-keeper`) |
| Last Second Pass | Finite only; generator required | Do not ship an endless toggle initially: a repeating hand-authored possession is not adequate replay. A future generator needs validated reachable onside attacks and defender diversity. | [sports.mjs](sports.mjs) (`last-second-pass`) |
| Court Rotation | challenge-stream | Seeded initial serve height and team offset alter contact timing and blocker commitment. Each generated rally must be won. | [sports.mjs](sports.mjs) (`court-rotation`) |
| Velodrome Draft | match-series | Optional match series: seeded race length, rival pace and surge beats create fresh races, each starting with a restored race reserve. Scores accumulate between won races; a defeat, contact or exhausted reserve ends the series. | [travel.mjs](travel.mjs) (`velodrome-draft`) |
| Clutch Circuit | challenge-stream | Seeded grades, straight lengths and corner speed caps create new finite road sections. A mechanical failure or time-gate miss ends the run. | [travel.mjs](travel.mjs) (`clutch-circuit`) |
| Ribbon Relay | challenge-stream | Seeded exchange positions, runner speeds and outgoing gradient vary the next handoff. A baton drop or zone exit ends the run. | [travel.mjs](travel.mjs) (`ribbon-relay`) |
| Two Oars | challenge-stream | Seeded gate offsets and cross-current drift produce new river reaches. Each has a bounded width and three ordered gates; bank/missed gate/fatigue ends the run. | [travel.mjs](travel.mjs) (`two-oars`) |
| Cable Carrier | challenge-stream | Seeded receiver positions across three obstacle families change the required sway cancellation and rope length. Unsafe detach/contact ends the run. | [balance.mjs](balance.mjs) (`cable-carrier`) |
| Thermal Route | challenge-stream | Seeded air-gate and thermal-column offsets create new height-planning routes. Height depletion or corridor exit ends the run. | [travel.mjs](travel.mjs) (`thermal-route`) |
| Belay Line | challenge-stream | Seeded ledge horizontal offsets and descent heights change rope feed, braking and ledge alignment. Unsafe force or missed route ends the run. | [balance.mjs](balance.mjs) (`belay-line`) |
| Vault Runway | challenge-stream | Seeded bar heights between 2.1 and 2.9 require fresh grip/release choices. Failed plant, bar or landing ends the meet. | [balance.mjs](balance.mjs) (`vault-runway`) |
| Tucked Landing | challenge-stream | Seeded half/full/double-turn dive requirements and water targets create new entry combinations. A poor entry ends the meet. | [balance.mjs](balance.mjs) (`tucked-landing`) |
| Wave Trim | challenge-stream | Seeded gate heights and wave phase create new carve paths. A wipeout or missed gate ends the tour. | [balance.mjs](balance.mjs) (`wave-trim`) |
| Ripple Skimmer | challenge-stream | Seeded ripple phase, contact interval and skip quota create new water contracts. Six failed throws ends the pond tour. | [flow.mjs](flow.mjs) (`ripple-skimmer`) |
| Spin Passage | challenge-stream | Seeded seal offsets alter the torque route around a fixed obstacle with unchanged physical limits. Toppling or missed stability ends the run. | [flow.mjs](flow.mjs) (`spin-passage`) |
| Cascade Hands | challenge-stream | Seeded ball count, initial airborne phases and catch quota create new timing schedules. Three drops ends the cascade. | [flow.mjs](flow.mjs) (`cascade-hands`) |
| Ice Rescue | Finite only; generator required | Do not ship an endless toggle initially: extending fixed lakes needs a generator that proves both outbound and heavier return routes survive cumulative pressure. | [flow.mjs](flow.mjs) (`ice-rescue`) |
| Breathing Lane | challenge-stream | Seeded gate depths and length families change stroke/oxygen routing. A failed depth gate or exhausted swimmer ends the run. | [flow.mjs](flow.mjs) (`breathing-lane`) |

Optional-mode evidence in `coverage/field-room.json` distinguishes two actual generated-challenge browser wins, accumulated score, player bank/end-run, natural loss and restart from separate source-informed late-stage model properties. Generation keeps field size and physical limits bounded; it varies constraints/content rather than incrementing an impossible unbounded numeric target. The finite-only route games need generators that validate full possession or outbound/heavier-return paths before support should be added.
