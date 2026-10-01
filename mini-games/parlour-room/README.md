# Parlour Room — 35 additional games

This isolated room implements approved designs B01–B35. `games.json` supplies descriptive IDs, rules, control/accessibility descriptions and catalog metadata. Each game has its own rule engine; `game.js` supplies only the shared host and native controls. No existing game's runtime is replaced.

## Engine contract

A module exports `init(state)`, `actions(state)`, `move(state, actionCode)`, and `view(state)`. Every player action is exposed as a native button. The host checks the action against the current legal-action list before applying it, hides terminal actions, and restores focus after rendering. Board games also expose large textual controls; visible state is described in labels and panels rather than relying on color alone. Arrow keys move board focus; Enter/Space retain native button behavior.

Seed 731 is the initial deal. Restart repeats that deal; Another deal increments the seed by 7919. Some established abstract games have a fixed empty opening and vary the opponent's tied choices; others vary layout, stock, cards or the travel graph. Opponents use their own hidden information plus public information and legitimate remembered inspections. Source-planned test routes may use more information than a player; those routes are not ordinary-play evidence.

## Verification and provenance

`tests/parlour-room.cjs` replays visible UI actions in desktop Chromium and a 390px touch context, checks 320px overflow, terminal outcomes, removal of actions and same-deal restart. The complete release contract requires a main win, natural loss, and a win on a distinct deal for all 35 games in both profiles: 210 cases. Missing fixtures or changed engine hashes fail verification. `GAME_IDS` restricts author iteration but cannot produce a complete passing report.

Fixtures are in `tests/fixtures/parlour-paths.json`, `parlour-b02-b05-paths.json`, and `parlour-b13-guided-paths.json`. Classifications distinguish source-planned routes from guided reproductions of independently recorded public-input routes. No runtime state setter or hidden-information browser hook is used to replay them. Programmatically focusing a native button followed by Enter is reported accurately; it is not described as an unaided Tab-only session.

`tests/parlour-rules.mjs` covers authored capture/superko/suicide, corner contact, layered freedom and 100 deal generations, expedition penalties, consecutive-run scoring, feature closure/claim denial, mosaic spill, anchor disconnection, terrain restrictions, capstone/wall interactions, known losing card comparisons, and ring-run traversal. The separate B02–B05 and market/estate helper suites cover their rules. These authored-state checks do not substitute for full games.

Independent reviewers play through the ordinary public UI before reading a game's engine or any proposed solution. Their records live under `coverage/independent300/`. Ordinary quality approval, winning reachability, and scripted reproducibility are separate gates. Author fixture success alone never establishes that a game has sufficient depth or a usable opponent.

## Review-driven corrections so far

- Almost a Word retires each used opening letter and offers varied mixed-parity branches, preventing repetition of one universally winning opening.
- Twin Roofs rejects stranded deal construction and requires alternative pair orders that can block, while retaining a complete legal construction witness. All exposed rules correctly promise three undo credits.
- One Last Card remembers identities learned by both parties to an exchange or comparison, scores joint card-and-target choices, avoids knowingly losing comparisons, values forced redraws of known high cards, and never guesses the prohibited rank 1.
- Veiled Standard avoids threats from publicly revealed stronger attackers and fatal last-unit exchanges. Orders at Dusk chooses a coordinated sealed faction plan, including matching support, instead of repeatedly bouncing its own armies. Ascending Expeditions bounds new commitments by the remaining public stock horizon.
- Factory Mosaic excludes already-full pattern rows from the opponent's productive placement choices. Four Houses rejects leader attacks that cannot beat public defender strength even with all own support, can exchange for recovery support, avoids gifting enemy points, and settles a fully occupied board immediately after conflicts.
- Carried Road's opponent checks immediate opposing road threats instead of ignoring direct wins.
- Letters We Cannot See displays only legitimate hint information and a public attainable-score bound. Three unaided losses motivated a reviewed design revision: deliver12 at full stock/final-reply resolution, with15 as perfect correspondence; three fuse errors still lose. The partner prioritizes newly safe human plays and protects known last copies, instead of consuming the draw budget through avoidable discards. The parent's approval of this calibration does not substitute for fresh ordinary-play acceptance.
- Crossgrain accepts105,241 board-fit words from the public-domain ENABLE list (see LEXICON-LICENSE.txt). Its prefix browser paginates results, and its opponent uses a separate smaller familiar vocabulary with bounded search. Masks and Coins adapts to observed blocks instead of repeating denied Aid.
- Market of Five has finite termination and forbids same-type exchange loops. The Other Half balances total terrain valuation and allows each divider's limited redraws before a cut begins.

The current review record, not this document, determines release readiness. The shared host guards initial controls until handlers and engines are ready, and versions its script URL to avoid cached startup mismatches. Full ordinary reviews and a source-fingerprinted registered suite run remain required before catalog integration/publication.
