# Small Hours — review remediation

Scope: improve the existing 200-game collection after independent review of expansion commit `fb1aabe76e6e2420ac68dce1941ffe8d940c924c`. No additional games are included. The original 100 game sources and showcase remain byte-preserved against the recorded baseline.

## Changes

- **Keyboard and readable state:** fixed Start/Restart → Space dispatch in 15 Kinetic games while preserving native focused-button behavior. Soft Sculpt exposes mass, arm and bond state in visible text and larger controls. Tabletop boards offer large equivalent controls with retained focus; draught kings are named explicitly; Hidden Dice uses a compact quantity/face interface. Discovery selections expose pressed state and textual summaries.
- **Rules and correctness:** corrected blackjack natural precedence and inclusive Elevator Night deadlines. Updated inaccurate policy, sentry, cargo and calibration descriptions. Removed unsupported blanket difficulty-escalation claims.
- **Temporal planning:** Safe Return locks scarce collateral across different contract durations; Convoy Ledger commits escorts across future waves with permanent losses. Both include two scenarios and visible future calendars. Seed Tomorrow interleaves limited interventions with nonlinear daily growth, indexed state/targets and whole-day Undo.
- **Spatial and tactical depth:** Phase Walk has alternative phase-dependent routes and finite anchors. Scissor Lift combines cargo envelopes, trench/ground paths and beam clearance, defeating a universal lift-height policy. Quiet Foil requires reading intent, distance and stamina across three bouts; it remains an approachable tactical study.
- **Varied puzzles:** Circuit Break, River Capacity and Safety Ferry use independently validated varied graphs; Map Inks guarantees a connected graph requiring three colors. Bounded generators have checked fallbacks.
- **Experimental games:** Transit Observatory designs a complete identifying observation schedule; Specimen Rule selects geometric prototypes; Causal Lab diagnoses and repairs multiple failed links; Orchard builds an entire bounded decision tree; Archive Edit constructs compatible dependency-closed releases; Lens Library calibrates an ambiguous model and reconstructs source pixels. Clockmaker adds distinct causal adventures; Track Exchange uses cooperative routes whose gates require actual coordination.

These remain short games with uneven depth. Sharing a genre or familiar mechanic is not itself a defect; the revision targets repeated decision loops and trivial universal policies. Lens calibration still admits a reusable two-measurement strategy, and Foil's visible-intent policy remains easy. Neither is presented as uniformly deep or an advanced opponent.

## Review and verification

The [independent follow-up](REMEDIATION-200-REVIEW.md) separates ordinary public-rule play from later source-informed checks and automated solution replays. The [100-game design matrix](EXPANSION-200-DESIGNS.md) records mechanics and nearest neighbors. Machine evidence is under `coverage/` and exact-commit workflow artifacts.

Every new game's primary desktop and mobile completion evidence must now be a **win**; losses and draws cannot satisfy that requirement. Deliberate failures remain separately labeled coverage. The original Strategy Room's historical terminal-result scope remains explicitly labeled. Fingerprints bind suite results to runtime, tests and served bytes; stale results fail aggregation.

Final local validation passed all 20 source-matched collection suites, with 200/200 catalog entries verified and 200 winning primary paths for the new 100 games. Of their 100 mobile paths, 95 use taps only; Hidden Dice, Transit Observatory, Causal Lab, Clockmaker and Track Exchange include native-field automation. These counts describe automated routes, not ordinary-play samples.

Validation also includes independent puzzle generation/property checks, native Tab/Enter control traversal, narrow viewport/tap regressions, restart and interrupted flows, and preservation checks. Completion routes can use source-derived plans; they are not claims of unaided human completion. Mobile input methods and mixed native-field automation are recorded per game.

The deployment workflow verifies the exact pushed source against published bytes, all 400 desktop/mobile route/reset cases, and reviewed regressions in Chromium and WebKit. Local direct access to GitHub Pages was blocked by the execution environment's proxy; deployment evidence therefore comes from that exact-commit CI run. Local WebKit was unavailable. No physical-phone or screen-reader session was performed, and viewport checks are not physical-device certification. CI status and artifact links should be checked for the commit being reviewed; an earlier green run does not validate later changes.
