# Small Hours 300 — design-only review

Status: final design-only handoff — 100 primary proposals passed independent written uniqueness and depth review conditionally. This is not implementation/test evidence or permission to implement or publish.

Start with [accepted inventory and risks](ACCEPTED-INVENTORY.md). The full combined specification is [accepted-designs.json](accepted-designs.json); separate reviewer records are [uniqueness](review-uniqueness.md) and [depth](review-depth.md). The primary selection is A14 + B35 + C24 + D27. A05 and C16 are rejected; A15 and A17 are uncounted reserves.

Inspected baseline: `fb1aabe76e6e2420ac68dce1941ffe8d940c924c`, 200 entries. All planning artifacts live outside the repository. No repository AGENTS.md or local .agents skills were found. Sources include inventory.json, original-game rules in README.md, room/runtime sources, EXPANSION-200-DESIGNS.md, EXPANSION-200-REVIEW.md and REVIEW-FIXES.md. Existing review claims are not taken as proof of depth or ordinary-play quality.

## Acceptance contract

- Strip theme, art, story and nouns before comparing actions, persistent state, information and objectives. A changed board, vocabulary, domain, parameter or independent toggle does not establish a new game.
- Compare each candidate against all 200 inventory entries and the 99 other candidates; inspect implementation of nearest existing neighbors. Record the strongest contrary comparison, not an easy comparison.
- A defining mechanic must change a useful decision on a nontrivial scenario. Multiple buttons alone do not establish depth. Repeated-first-legal, always-attack, always-wait, greedy-immediate-score and independent-per-control strategies are explicit design challenges where applicable.
- Designs require coupled choices with consequences, discoverable visible rules, replay that changes decisions, explicit success/failure, accessible controls and concrete ordinary-input QA.
- Independent reviewers may reject or require redesign; a full list is not itself an acceptance criterion. Design acceptance is conditional and must not be described as demonstrated implementation quality.

## Shared implementation and ordinary-play gate (future, unauthorized now)

For each accepted game, implement a named teaching scenario and at least two materially different challenge scenarios or a generator with checked solvability and degeneracy limits. Record a complete legitimate win and a natural failure through ordinary displayed UI. The first reviewer must use only rules and visible game state; do not read source solutions, hidden probes, solver output or prescripted winning traces before that review. Record attempts, decisions, observed ending and retry outcome. A solver-assisted path can be supplementary reachability evidence, never a substitute. Competitive losses alone do not demonstrate a winnable opponent.

Every game must have both keyboard-only and touch-only complete-run evidence. Test Enter and Space on every focused native control; game hotkeys must not double-fire actions or steal those activations. Check 320px and 390px layouts, focus after rerenders, selection/pressed state semantics, non-color identity cues, concise turn/status announcements, zoom, reduced motion, invalid actions, restart during an active state and after terminal state, return navigation and blocked storage. Distinguish viewport emulation, actual touch dispatch, physical device and screen-reader testing; disclose unperformed categories. Timing/precision games must state their access limitations and provide adjustable practice without claiming the core mode is fully nonvisual.

## Handoff hold

Do not implement, modify runtime/catalog, commit, push or publish. Await parent-provided verified remediation commit and evidence. Diff every changed mechanic against these proposals, with particular attention to Seed Tomorrow, Safe Return, Convoy Ledger, Quiet Foil and the five discovery experiment loops. Reopen affected acceptances. Preserve original games and catalog grid/list/search in later authorized implementation.
