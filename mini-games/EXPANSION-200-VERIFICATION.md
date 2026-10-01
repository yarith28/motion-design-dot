# 200-game release verification

The catalog contains 200 entries: the original 100 plus 100 additions. The [design inventory](EXPANSION-200-DESIGNS.md) compares every addition with its nearest neighbors. [Independent review](EXPANSION-200-REVIEW.md) records rejected duplicates and required revisions. This document describes evidence scope; current completion status comes from the generated [source-matched index](coverage/index.json).

| Check | Evidence and scope |
| --- | --- |
| Original collection preservation | `tests/preservation.cjs`: original 100 inventory entries and 66 protected runtime/catalog/showcase files match baseline `6f4469cc7491b2b6255e7479c20880adf99787df`. |
| Every new game, desktop and mobile | Five provenance-wrapped suites, 40 primary cases per room: actual UI inputs reach terminal outcomes, restart, and exercise relevant edges. Tabletop adds eight alternative cases. Solvers, read-only probes or source-derived legal plans guide completion. Competitive losses count as terminal outcomes. |
| Touch completion | 97 of the 100 additions have touch-only mobile completion paths. Discovery's Transit Observatory, Specimen Rule and Causal Lab also use native-field entry. The aggregate labels mixed paths separately. |
| Public controls | [Chromium control report](coverage/expansion-controls-chromium.json): 200 cases covering each addition with desktop keyboard and 320px touch activation, focus, restart, blocked storage and reduced-motion preference. These are control checks, not full completions. |
| Local catalog integration | [Local report](coverage/catalog-200-local.json): 400 desktop/mobile routes and resets, 313 matching served assets, grid/list persistence, search/filtering, 320px layout and no browser errors. This local run is not publication proof. |
| Evidence integrity | Isolated fixtures reject missing, failed, stale, malformed, partial and contradictory records, wrong source manifests, altered copied flags, mixed input mislabeled as touch-only, engine mismatch, wrong served bytes and reused reports from zero-exit/no-output children. |
| Independent ordinary play | Explicitly sampled in the review reports. Includes full visible-rule reasoning through selected games and partial usability exploration. It does not represent 100 unaided completions. |
| Publication | The [Verify live arcade workflow](https://github.com/yarith28/motion-design-dot/actions/workflows/verify-pages.yml) requires matching deployed bytes, 400 route/reset cases, five new-room completion jobs, original reviewed-issue regressions and all new-game control checks in Chromium and WebKit. Inspect the successful run whose head SHA matches the published commit. |

The original regression harness needed test-only corrections for the larger adventure category, deferred-script navigation readiness, deterministic virtual-time control, and a billiards solver that incorrectly penalized pocketing its final ball. Protected game code was not changed.

No physical iPhone, other physical phone or actual screen-reader session was performed. Browser emulation and WebKit checks do not establish physical-device usability. The games vary in difficulty, authored versus generated content and replay depth; this release does not claim uniformly deep polish.
