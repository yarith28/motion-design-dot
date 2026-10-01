# Small Hours: 200 → 300 verification

Local release gates passed: 100 independent primary review records, all 24 source-matched suites, 400 Chromium control cases, 600 desktop/mobile route-reset cases, and exact preservation of the corrected 200-game baseline. See [suite summary](coverage/expansion300-suite-summary.json), [control evidence](coverage/expansion-controls-chromium.json), and [local route evidence](coverage/expansion300-local-routes.json). Publication is certified separately by the successful **Verify live arcade** workflow on the release commit; this local report does not substitute for that exact-commit deployment result.

The expansion adds 100 games: 14 Construction Room, 35 Parlour, 24 Motion Room, and 27 Workbench. [The accepted inventory](EXPANSION-300-DESIGNS.md) and [baseline comparison](EXPANSION-300-BASELINE-RECHECK.md) describe their mechanics and rejected overlaps.

The corrected 200-game baseline is `e78396ddd2c64c1b779bfaf2633dfd111637b1fb`. `tests/preservation200.cjs` verifies the original 200 metadata entries and 305 runtime files byte for byte. Catalog generation adds entries while preserving the catalog's existing interaction code, grid/list controls, search and filters. The separate original-100 preservation gate remains in place.

## Independent play and design review

Seven primary reports must contain exactly 100 distinct game records, with no substitutions or duplicate counting:

| Report | Responsibility |
| --- | --- |
| [Uniqueness](coverage/independent300/uniqueness-review.json) | Computational designs, selected construction designs and additional competitive games |
| [Depth](coverage/independent300/depth-review.json) | Multi-study progression, tactical decisions and selected competitive games |
| [Root review](coverage/independent300/root-review.json) | Packing, word allocation, liberty capture, reserve tactics, deck building, solitaire, ring scoring and quilt economics |
| [Motion cross-review](coverage/independent300/cross-motion-review.json) | Motion interactions and selected tabletop games |
| [Construction cross-review](coverage/independent300/cross-construct-review.json) | Construction campaigns, four-step movement and betting |
| [Parlour cross-review](coverage/independent300/cross-parlour-review.json) | Economic, vocabulary, conflict and drafting games |
| [Parlour-to-motion review](coverage/independent300/parlour-motion-review.json) | Projected-shadow platforms and conservative water routing |

`tests/expansion300-review-gate.cjs` requires full ordinary-input wins, natural failures or explicitly identified recoverable failed puzzle attempts, restart evidence, observed meaningful decisions, persisted public-input logs, and exact runtime hashes. It validates the records; it does not itself perform independent gameplay or infer quality from a passing boolean. Supplemental reports never replace a missing primary game.

Reviewers used rendered rules, labels and state before consulting source or authored routes. Their successful paths were then replayed with native keyboard navigation and emulated touch. Original versions that permitted shallow wins were rejected and revised. Where a reviewer had already inspected source before retesting a revision, the report says so. In particular, the root's revised Cascade Orchard and Bubble Canopy play was manual but post-source. A separate [fresh final-version review](coverage/independent300/packing-fresh-review.json) subsequently completed both full campaigns without source, routes or solver access; it is supplemental, not duplicate inventory. Patient Columns' full winning path was independently discovered; its separate terminal-loss route used disclosed author guidance. Night Collector's actual unsafe-sweep failure was checked after source inspection. Ascending Expeditions' final horizon-fix follow-up followed its original source audit; its original full win and loss were discovered first. These scopes must not be summarized as 100 wholly blind final-version wins and losses.

Concrete corrections include stronger late-study constraints; actual hinged-rod motion; finite suppression ammunition and dead-unit reaction guards; fair hidden-information memory; coordinated simultaneous orders; visible-rank danger avoidance; full-board economic endings; endgame investment valuation; complete visible word legality; startup loading guards; and initial-position repetition accounting. Per-game reports preserve the actual findings, corrections and limitations.

## Automated regression scope

The 24 registered suites use `tools/run-suite.cjs`. The existing Afterglow test now waits for its injected observation probe after catalog navigation before asserting the saved score; the preserved game runtime is unchanged. The route checker selects the first catalog-return link because new rooms intentionally expose both header and footer links. It decodes every catalog preview sequentially: requesting all previews concurrently caused Chromium 140 decode rejections for loaded images in CI. Decode failures still fail the check and report exact image URLs. The runner hashes current source, tests and fixtures, verifies served bytes before and after execution, rejects partial runs, and requires fresh per-game evidence for expansion rooms. Every primary expansion case must be a full win; losses and draws are separate variants. `coverage/index.json` is the current aggregate, and stale evidence fails closed.

The 390px route check exposed a keyboard hint overflowing Step and Spring even though the 320px control check passed. A CSS-only fix puts keyboard hints on separate lines, wraps labels and retains 44px controls. Independent checks cover all 24 Motion games at actual 320px and 390px widths; a second audit covers before/after Start at 320px, 390px and 1280px. The control suite now checks both phone widths against the requested viewport, not the browser's potentially expanded layout width. The [CSS binding audit](coverage/independent300/motion-mobile-layout-audit.json) confirms unchanged non-CSS runtime hashes and preserves original gameplay-review provenance.

Author-guided plans and solvers establish reachability and regression behavior. They are separate from ordinary-input reviews and are never counted as new independent discoveries. The Parlour suite also covers alternate deals and deliberate losses. Source-level invariant tests are labeled as such.

The GitHub workflow runs nine expansion completion jobs, verifies the deployed commit's assets, checks all 300 routes on desktop and mobile (600 route/reset cases), and runs control/remediation regressions in Chromium and WebKit. Route smoke does not substitute for full game completion. WebKit controls do not imply full WebKit winning campaigns for every game.

## Limits

Touch tests emulate phone input and viewport sizes. No physical-device or screen-reader user study was performed. Competitive opponents are bounded, legal heuristics, not expert-level engines. Some puzzle and motion games contain three fixed studies; replay depth is limited accordingly. Simplified physics and computational models are game rules, not engineering or scientific prediction tools. Passing reviews cannot establish that every strategy, deal, accessibility need or browser/device combination has been exhausted.

No paid service, account change, analytics or runtime dependency is introduced. The word-game dictionary's source and redistribution notice are in [LEXICON-LICENSE.txt](parlour-room/LEXICON-LICENSE.txt).
