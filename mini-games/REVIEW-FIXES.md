# Review fixes — October 1, 2026

This update addresses the confirmed interaction, gameplay, accessibility-information and evidence-reporting defects in the independent review of release `4754c133720b274d48149bc47d807267a5e1386a`. The catalog remains 100 playable entries. It does not claim to resolve the review's broader concerns about fixed puzzle content, repeated mechanics or replay depth.

## Changes

- **Sky Stack / Pocket Orbit / Afterglow:** Resume restores gameplay focus, so the documented Space action no longer activates Pause. A final sibling check found and repaired the same issue in Afterglow, which now focuses its aiming field. Live Chromium 140 testing additionally exposed a zero-detail touch click that activated Orbit twice; pointer-generated clicks are now excluded from its keyboard/assistive fallback. Orbit also handles resuming during between-round feedback without leaving Space on Pause or stealing focus after the player navigates elsewhere.
- **Sequence Detective:** each session covers every answer slot, with shuffled positions and distractors. Repeating the third position cannot complete a session; choices stay stable after a wrong answer.
- **Beat Post:** wrong-lane and mistimed taps now share the eight-mistake budget with missed notes. Blind three-lane spam loses; accurate play still wins. The rules, loss explanation and remaining-mistakes display explain the change.
- **Stamp Studio:** the accessibility tree exposes target/current filled coordinates, each stamp's geometry and selection state.
- **Shadow Turn:** accessible names describe current and reference shapes in the same grid/rotation model as the artwork, with rotation feedback.
- **Loose Ends:** the accessible graph describes point positions, connections and crossings; controls expose selection and swaps announce changed positions.
- **Digit Forge / Fraction Mosaic / Matchstick Market:** consuming/removing a control moves focus to a usable action instead of BODY.
- **Verification:** current completion claims come from actual suite exits, browser/time provenance and source-content hashes. Missing, failed, malformed, stale or partial-run evidence is never a pass. Playable inventory metadata is separate from verification status. Historical release reports remain explicitly historical.

## Validation boundaries

New regression suites use public controls and rendered/accessibility information, without source interception or hidden game-state probes:

- `tests/resume-focus.cjs`: desktop/mobile-sized Resume→Space, Orbit feedback interval, Afterglow aiming/volley states, restart, simulated blur freeze, and touch action checks.
- `tests/number-room-review-regressions.cjs`: independently solves displayed sequence families over three sessions per profile; checks positional diversity and keyboard/touch focus/completion in Digit Forge and Fraction Mosaic.
- `tests/spatial-accessibility.cjs`: completes the three affected spatial games using desktop keyboard and emulated mobile touch; asserts essential accessibility-tree information, state changes and replay.
- `tests/review-arcade-strategy.cjs`: blind keyboard/touch spam loses; precise keyboard and touch-only Beat Post charts win; Nim keyboard flow survives consumed actions. Timing is virtual and the authored chart is known, so this is a control/rules regression, not human difficulty evidence.
- `tests/evidence-index.cjs`: isolated negative fixtures verify that invalid evidence cannot pass.

Full existing completion suites remain solver-assisted and/or known-answer regressions. Their precise scopes are in `coverage/index.json` and `coverage/suite-runs/`; desktop completion, mobile-viewport completion, touch gameplay and competitive terminal outcomes are kept distinct. See README for reproduction commands.

The official live workflow first requires published runtime assets to match the checked-out bytes, then runs 200 route/viewport smoke cases and the new fixed-issue regressions. It also attempts the regressions in WebKit. Successful workflow results—not a push or local result—establish deployment verification. WebKit is a browser-engine check, not physical iPhone/Safari testing. No physical screen-reader user study or device-performance claim is made.

## Next depth work

Prioritize content over catalog size: label single-study games honestly; expand fixed Number/Spatial puzzles into curated difficulty progressions; add authored scenarios to Pebble Post and strategy solitaires; group Compound Works/Rhyme Lines as variants or make their decisions meaningfully different. These improvements remain future work.

## Recorded local result

All 100 entries have fresh source-content-matched desktop and mobile-viewport completion results. The aggregate separately records 54 touch-gameplay completions; that number excludes mixed-input suites and is not a physical-device claim. The new issue regressions and both evidence-gate fixture suites passed. The 100-game collection keeps its existing navigation, storage and game progression. Actual deployment/browser-engine results are attached to the matching GitHub Actions run.
