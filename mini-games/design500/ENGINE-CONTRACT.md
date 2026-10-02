# Expansion500 implementation boundaries

The target is500 unique games: preserve the original300, complete the first100 additions, then add100 further games. The first400 release is a checked milestone, not a replacement objective. All workers retain the user-selected inherited GPT-6.1 Sol Ultra settings.

Five owners write only their new room, matching tests, and their proposal/review files. Root owns catalog, shared lifecycle, evidence tooling, commits and publication. Every proposed mechanic must be compared with actual source among all400 and with the other new proposals. Cosmetic, parameter-only or rule-variant clones are rejected before implementation.

New scopes: relation-room, trajectory-room, protocol-room, civic-room and form-room,20 games each. Three finite studies and any optional generated stream/match series must use meaningful choices, explicit controls, feedback, progression, loss/win and restart. Use dispersed-seed and late-stage legal witnesses for supported modes; disable template-only modes honestly.

Do not modify existing rooms or the catalog. Pure helpers and the stable Journey API may be reused without changing an existing mechanic. Proposals precede implementation; reviewers approve the actual distinct transition structure, not names or themes.

The established engine/API and browser evidence contract follows.

# Expansion to 400: isolated game contract

New rooms: `constraint-room`, `field-room`, `signal-lab`, `commons-room`, `atelier-room`. Each owner supplies `games.json` (20 entries), `engines.mjs` (exports `engines` map), any private modules/CSS, and tests. Root owns `journey/`, catalog/inventory/evidence integration, release and preservation. Existing300 runtime files must remain byte-identical.

## Engine

```js
export const engines = {
  'unique-id': {
    stages: 3, // or >=3; a substantial finite campaign
    init({stage, seed, mode}) { // mode = 'finite' or 'endless'; stage starts0
      return {outcome:'playing', note:'Actionable visible feedback', score:0};
    },
    act(state, action) { /* mutate only this serializable state */ },
    render(ui, state) { /* visible field + real labeled native controls */ },
    // Optional real-time only:
    realtime: false,
    tick(state, seconds) { /* fixed/controlled physics, dt <=0.05; no wall clock */ },
    pause(state) { /* clear held inputs if used */ }
  }
};
```

`outcome` is `playing`, `win`, or `loss`. A puzzle can allow reset/undo of a failed study, but must explicitly explain why a submission/action failed. An unconstrained trial-and-error submit counter is weak challenge; constraints must make actual decisions meaningful. `score` is a finite nonnegative current-study score; shell banks it on wins and losses and stores a personal best. Finite campaigns have all studies completed; endless mode continues newly generated studies under a cumulative score until a loss or the player ends the run. Do not call repetitive fixed authored boards procedural/endless. For endless supported metadata, `init()` MUST support unbounded stages via bounded sizes and varied seed-driven content, with an honest difficulty cap; no wrapping the same3 boards as a new challenge. Non-suitable engines omit endless.

All randomness uses `seed` with an owner-supplied deterministic PRNG; gameplay can derive a varied seed per stage. No Math.random in model creation without source-bound tests. Initial finite studies may use seeded procedural generation or fixed authored levels. No shipped solver, test-only state mutation hook, or exposed hidden winning answer. Pure models can be imported by tests; browser tests drive real UI controls from rendered-state/source-derived legal plans and disclose that scope.

The public URL accepts `?game=ID&seed=INTEGER` (unsigned32-bit). This run seed is displayed for ordinary replay. Shell passes `seed=(runSeed+Math.imul(stage+1,0x9e3779b9))>>>0` to init. With a valid replay seed, Restart game reproduces the campaign; without one it creates a fresh run. Reset challenge always retains the current stage seed. Tests should use public seed replay, rather than changing crypto or injecting answers. Finite engines that intentionally use authored stage seeds must document that behavior and display their actual clue/parameters. Only `#next` banks a won study into accumulated score, so reset/re-render cannot mint points.

## Render UI

Methods append into `#board`. Text is inserted safely with textContent.

- `ui.p(text)`, `ui.h(text)`, `ui.pre(text)`; `pre` wraps safely, do not use large ASCII boards as the sole visual UI.
- `ui.group(label?)` starts a flex control group.
- `ui.button(action, label, disabled=false, selected=undefined)` native button; optional aria-pressed. Returns element. `data-action=action` is the stable test selector. Use disabled for impossible moves.
- `ui.grid(columns, label, options?)` creates a responsive grid group; subsequent buttons enter it; return grid. Cells may have selected/ARIA states and CSS classes. Default cells are square on a480px maximum field. `{compact:true}` makes rectangular cards for long text/production rules/options, so a few choices do not occupy multiple screens.
- `ui.table(headings, rows)` scroll-contained data table.
- `ui.range(action, label, {min,max,step,value})` native labeled range; dispatches `${action}:${value}` on input. Do not make keyboard use the only way to aim on mobile.
- `ui.canvas(key,width,height,draw,pointer?)`: labeled focusable responsive canvas; `draw(ctx,state)` paints model; optional `pointer(x,y,phase)` returns action string, coordinates normalized0..1, phase='down'/'move'/'up'. Draw on render and live ticks. Include native controls for every essential mechanic; canvas-only blind inputs are insufficient.
- `ui.live(label, valueFunction)` live text refreshed on real-time ticks. Returns element.
- `ui.hold(action,label)`: native held control dispatches `down:${action}`/`up:${action}` for pointer and Enter/Space, clearing on cancel. Real-time engines keep controls stable between ticks; `act()` is followed by live paint, not a full DOM replacement.

Shell owns `#start`, `#restart`, `#reset` (current study), `#undo` (unless engine.undo === false), `#next`, `#again`, `#pause`, `#mode`, `#scoreboard`, `#status`, `#result`. `document.body.dataset` exposes `gameReady`, `gameId`, `outcome` (intro/playing/study-win/win/loss), `mode`, `stage`. No writable state debug hook. Status always contains a useful message. Engine-generated controls disable on terminal outcomes. Shell pauses real-time on blur/visibility loss and permits restart while paused. Focus remains on native control/result. Invalid URL must show honest unavailable state and catalog link, not load a different game under the requested name.

Room `index.html`/`room.js` boilerplate will be provided by root once engines exist; owners may create them from shell contract for local tests if needed but ask root first to avoid edits colliding.

## Manifest

Match existing manifest shape: id, name, category (existing categories only), url:`ROOM/?game=ID`, mechanic, description, rules:[>=3 precise constraints/objective/restart rules], controls, accent, symbol. Add `stages`, `endless:{supported:boolean,kind?,design,reason?,difficultyCap?}`, `nearestExisting:[{id,difference}]`, `smoke:{startSelector:'#start',actionSelector:'[data-action="..."]'}` and source module evidence. Every20 must differ meaningfully from all300 and the other new rooms. Shell can render metadata. Scores must reflect a sensible measurable accomplishment; no high score from repeated free reset exploits.

## Verification

Own tests: `tests/ROOM.cjs` + fixtures/helpers prefixed ROOM. Report `coverage/ROOM.json`: passed, sourceHash (all room runtime + journey runtime + tests/fixtures), cases for exactly20 ids each desktop/mobile-touch, outcome:'win', restart:true, touchOnly explicit, inputMethod, edgeCases nonempty, winActions, lossActions. Tests must execute EVERY finite chapter/study through actual UI, plus natural failure/recovery, progression, restart, specific nontrivial rule regression, 320px bounds, zero page errors. Use server `BASE_URL=http://127.0.0.1:8790`; Playwright and /usr/bin/chromium available. Reports may only claim genuinely executed scope. Pure-engine plans do not replace browser interactions. Endless-supported games need second generated challenge played, accumulated score, failure/restart and seed/generation constraints. Appropriate real-time test virtual clocks are allowed with scope disclosure; touch tests must use touchscreen input for game actions, not keyboard pretending to be mobile. Root additionally runs cross-room source/design review and independent ordinary-input samples.
