# Independent Trajectory ordinary-play review

All three sampled games completed all three finite studies: **9/9 wins** at seed **20261002**, through native keyboard controls. The final current-byte replay produced no browser errors, helper errors, or source hash changes.

| Game | Studies won | Final visible outcome | Screenshot |
| --- | ---: | --- | --- |
| Induction Coast | 3/3 | Campaign complete | [Evidence](ordinary500-trajectory-review/final-byte-induction-coast-campaign-win.png) |
| Refractory Route | 3/3 | Campaign complete | [Evidence](ordinary500-trajectory-review/final-byte-refractory-route-campaign-win.png) |
| Meniscus Maze | 3/3 | Campaign complete | [Evidence](ordinary500-trajectory-review/final-byte-meniscus-maze-campaign-win.png) |

The reviewer used only rendered instructions, diagrams, public state tables, and native button labels. Playwright focused each public button and sent an actual browser Enter key. Engine source, planners, tests, fixture paths, owner solutions, storage, and writable/evaluation state hooks were excluded. Runtime files were read only as opaque buffers for SHA-256 provenance.

Natural failures were ordinary premature Clamp, Certify, and Seal actions. Each game then recovered through Reset challenge and Play again; Restart game restored study 1 and score 0. Refractory also checked Reset on study 2 after a gate change.

Induction Coast ended at x 11.24 / speed 0.17 / energy 5.20 of 6.00, then x 11.29 / speed 0.72 / energy 7.01 of 7.00, then x 11.23 / speed 0.22 / energy 6.64 of 7.50. The public field diagram prompted a polarity reversal in studies 2/3. Receiver charging, coasting, and resistor braking all used native controls.

Refractory Route delivered arrivals 12, 14, and 12 → 24, then certified extinction at beats 13, 15, and 25. The diagram showed the protected 6–13 branch and the 3–8 shortcut; closing those gates and timing pulses from injector 0 yielded all 3 wins. Protected cell 13 stayed resting.

Meniscus Maze ended with full fronts and closed source gates: study 1 cups 0.59/0.70 at beat 16, and studies 2/3 cups 0.60/0.67/0.58 at beat 58. Study 2 required priming the high entry barrier and isolating faster cups while the tall narrow channel continued filling. Study 3 also required closing the competing siphon.

One usability observation: **Play again restarts the whole campaign**, while **Reset challenge retries the current study**. This was observed after failing Meniscus study 3. The guide explains Reset and Restart but leaves Play again’s scope implicit. This distinction is recorded without treating it as a rules failure. The initial queued retry mistakenly assumed study 3 and encountered missing channel 3 controls on study 1; its original log remains preserved and is excluded from success evidence. A separate fresh campaign and the final-byte replay completed all 3 studies.

The exact ordered native paths, visible terminal states, recovery inputs, limitations, and hashes are in [the JSON report](ordinary500-trajectory-review.json). [Final native inputs](ordinary500-trajectory-review/final-byte-commands.jsonl), [public action log](ordinary500-trajectory-review/final-byte-public-actions.jsonl), and [replay script](ordinary500-trajectory-review/final-byte-replay.cjs) make the evidence reviewable. Original observations and the separate Meniscus completion log remain preserved.

Final replay hashes cover every Trajectory Room and shared Journey file. Before: 2026-10-02T21:24:48.104Z; after: 2026-10-02T21:25:36.721Z; changed during replay: **none**. Compared with the original pre-freeze snapshot, these files changed: `mini-games/trajectory-room/contact.mjs`, `mini-games/trajectory-room/fluids.mjs`, `mini-games/trajectory-room/handles.mjs`, `mini-games/trajectory-room/transport.mjs`. Those earlier bytes are not presented as final-byte evidence.

This is a desktop keyboard sample of three games at one seed. It does not claim mobile touch, endless mode, other seeds, the other 17 Trajectory games, or broad edge-case coverage. No playability blocker was found.
