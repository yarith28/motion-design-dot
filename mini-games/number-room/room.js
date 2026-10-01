(async () => {
  "use strict";
  const $ = (id) => document.getElementById(id),
    scene = $("scene"),
    actions = $("actions");
  const catalog = await fetch("games.json").then((r) => {
    if (!r.ok) throw Error("Catalog unavailable");
    return r.json();
  });
  const requested = new URLSearchParams(location.search).get("game");
  const game = catalog.find((g) => g.id === requested) || catalog[0];
  document.title = game.name + " — Small Hours";
  document.documentElement.style.setProperty("--accent", game.accent);
  document.body.dataset.game = game.id;
  document.body.dataset.gameId = game.id;
  $("title").textContent = game.name;
  $("description").textContent = game.description;
  $("mechanic").textContent = game.mechanic;
  $("emblem").textContent = game.symbol;
  $("controls").textContent = game.controls;
  for (const rule of game.rules) {
    const li = document.createElement("li"),
      p = document.createElement("p");
    p.textContent = rule;
    li.append(p);
    $("rules").append(li);
  }
  const chapterCount =
    game.id === "merge-garden"
      ? 1
      : ["bit-lanterns", "estimation-studio", "sequence-detective"].includes(
            game.id,
          )
        ? 5
        : 3;
  const record = SmallHours.record("small-hours-number-" + game.id);
  let chapter = 0,
    score = 0,
    checks = 0,
    moves = 0,
    ended = false,
    state = {},
    history = [],
    sequencePositions = [];
  const fmt = (n) =>
    Number.isInteger(n) ? String(n) : String(Math.round(n * 1000) / 1000);
  const fraction = (n) =>
    ({
      1: "1/12",
      2: "1/6",
      3: "1/4",
      4: "1/3",
      6: "1/2",
      8: "2/3",
      9: "3/4",
      12: "1",
      14: "7/6",
      15: "5/4",
    })[n] || `${n}/12`;
  const button = (label, action, value = "", cls = "", ariaLabel = "") =>
    `<button class="${cls}" data-action="${action}" data-value="${value}" ${ariaLabel ? `aria-label="${ariaLabel}"` : ""}>${label}</button>`;
  const target = (label, value) =>
    `<div class="target"><small>${label}</small>${value}</div>`;
  const say = (message) => ($("message").textContent = message);
  const snapshot = () => history.push(JSON.stringify(state));
  function draw() {
    engines[game.id].render();
    if (game.id === "make-24" || game.id === "factor-loom") {
      scene
        .querySelectorAll('[data-action="select"], [data-action="spool"]')
        .forEach((b, i) => {
          const position = state.selected.indexOf(i);
          b.setAttribute("aria-pressed", String(position >= 0));
          b.setAttribute(
            "aria-label",
            game.id === "make-24"
              ? `Card ${i + 1}: ${fmt(state.cards[i].n)}${position >= 0 ? ", " + (position === 0 ? "first" : "second") + " operand" : ""}`
              : `Spool ${i + 1}: prime ${state.spools[i]}`,
          );
        });
    }
    if (game.id === "matchstick-equation" && state.picked)
      scene.querySelector('[data-match-select="lift"]').value = state.picked;
    $("round").textContent = `${chapter + 1} / ${chapterCount}`;
    $("score").textContent = score;
    $("checks").textContent = checks;
  }
  function finish(success = true) {
    if (ended) return;
    ended = true;
    $("result").hidden = false;
    const final = chapter === chapterCount - 1;
    if (success) {
      score += Math.max(100, 1000 - checks * 80);
      $("result-title").textContent = final
        ? "Beautifully worked."
        : "That clicks.";
      $("result-copy").textContent = final
        ? `Complete. Your score is ${score.toLocaleString()}. A little thinking goes a long way.`
        : `Chapter ${chapter + 1} complete. A new idea is waiting in the next chapter.`;
      $("next").textContent = final ? "Play again ↗" : "Next chapter ↗";
      if (final) record.save(score);
      say(
        final
          ? "Game complete. Your best is recorded below."
          : "Solved. Continue to the next chapter.",
      );
    } else {
      $("result-title").textContent = "Time for a fresh angle.";
      $("result-copy").textContent =
        "This board has no moves left. Start a fresh garden and make room around your largest tile.";
      $("next").textContent = "Try again ↗";
      say("No legal moves remain. Try again below.");
    }
    state.failed = !success;
    $("score").textContent = score;
    $("next").focus({ preventScroll: true });
  }
  function check(
    ok,
    miss = "Not quite. Adjust your arrangement and try again.",
  ) {
    checks++;
    $("checks").textContent = checks;
    if (ok) finish();
    else say(miss);
  }
  function begin() {
    checks = 0;
    moves = 0;
    ended = false;
    history = [];
    $("result").hidden = true;
    state = engines[game.id].init();
    say("Take your time. Every move is yours.");
    draw();
  }
  function restart() {
    chapter = 0;
    score = 0;
    if (game.id === "sequence-detective") {
      // Cover every answer slot so repeating one position cannot solve a session.
      sequencePositions = SmallHours.shuffle([
        0, 1, 2, 3, Math.floor(Math.random() * 4),
      ]);
    }
    begin();
  }
  $("restart").onclick = restart;
  $("next").onclick = () => {
    if (chapter === chapterCount - 1 || state.failed) restart();
    else {
      chapter++;
      begin();
    }
    const b =
      scene.querySelector("button:not(:disabled),input") ||
      actions.querySelector("button");
    b?.focus({ preventScroll: true });
  };
  function undo() {
    if (history.length) {
      state = JSON.parse(history.pop());
      say("One step back. A fresh possibility.");
    } else say("You are already at the beginning.");
  }
  const engines = {};
  engines["make-24"] = {
    init: () => ({
      cards: [
        [1, 2, 3, 4],
        [2, 3, 4, 6],
        [2, 4, 6, 8],
      ][chapter].map((n) => ({ n, label: String(n) })),
      selected: [],
    }),
    render() {
      scene.innerHTML =
        target("Use every card", "Make 24") +
        `<div class="cards">${state.cards.map((v, i) => button(fmt(v.n), "select", i, "card" + (state.selected.includes(i) ? " selected" : ""))).join("")}</div><p class="hint">Select a first card, then a second. Order matters for − and ÷.</p><p class="hint">${state.cards.map((x) => x.label).join(" · ")}</p>`;
      actions.innerHTML =
        ["+", "−", "×", "÷"].map((op) => button(op, "operate", op)).join("") +
        button("Undo", "undo");
    },
    action(a, v) {
      if (a === "select") {
        const i = +v;
        state.selected = state.selected.includes(i)
          ? state.selected.filter((x) => x !== i)
          : state.selected.length < 2
            ? [...state.selected, i]
            : [i];
        say(
          state.selected.length
            ? state.selected
                .map(
                  (index, order) =>
                    `${order === 0 ? "First" : "Second"} operand: ${fmt(state.cards[index].n)}`,
                )
                .join(". ") + "."
            : "No cards selected.",
        );
      } else if (a === "undo") undo();
      else if (a === "operate") {
        if (state.selected.length !== 2) {
          say("Choose two cards first.");
          return;
        }
        const [i, j] = state.selected,
          x = state.cards[i],
          y = state.cards[j];
        if (v === "÷" && Math.abs(y.n) < 1e-9) {
          say("Division by zero has no result. Try another pair.");
          return;
        }
        snapshot();
        const n =
          v === "+"
            ? x.n + y.n
            : v === "−"
              ? x.n - y.n
              : v === "×"
                ? x.n * y.n
                : x.n / y.n;
        state.cards = state.cards.filter((_, k) => k !== i && k !== j);
        state.cards.push({ n, label: `(${x.label} ${v} ${y.label})` });
        state.selected = [];
        if (state.cards.length === 1)
          check(
            Math.abs(n - 24) < 1e-8,
            "That result is not 24. Undo a step to explore another expression.",
          );
      }
    },
  };
  function shift(board, d) {
    let next = [...board],
      gain = 0;
    for (let line = 0; line < 4; line++) {
      const ids = Array.from({ length: 4 }, (_, k) =>
          d === "left"
            ? line * 4 + k
            : d === "right"
              ? line * 4 + 3 - k
              : d === "up"
                ? k * 4 + line
                : (3 - k) * 4 + line,
        ),
        row = ids.map((i) => board[i]).filter(Boolean),
        merged = [];
      for (let k = 0; k < row.length; k++) {
        if (row[k] === row[k + 1]) {
          merged.push(row[k] * 2);
          gain += row[k] * 2;
          k++;
        } else merged.push(row[k]);
      }
      ids.forEach((id, k) => (next[id] = merged[k] || 0));
    }
    return { board: next, changed: next.some((v, i) => v !== board[i]), gain };
  }
  function grow() {
    const empty = state.board.flatMap((v, i) => (v ? [] : [i]));
    if (empty.length)
      state.board[empty[Math.floor(Math.random() * empty.length)]] =
        Math.random() < 0.9 ? 2 : 4;
  }
  engines["merge-garden"] = {
    init() {
      const s = { board: Array(16).fill(0), growth: 0 };
      s.board[0] = 2;
      s.board[10] = 2;
      return s;
    },
    render() {
      scene.innerHTML =
        target("Grow a tile to", "128") +
        `<div class="number-grid" role="img" aria-label="${state.board.map((v) => v || "empty").join(", ")}">${state.board.map((v) => `<span data-number="${v}" class="${v ? "filled" : ""} ${v >= 32 ? "large" : ""}">${v || ""}</span>`).join("")}</div><p class="hint">Garden yield: ${state.growth}. Keep an open corner.</p>`;
      actions.innerHTML = [
        ["↑", "up"],
        ["←", "left"],
        ["↓", "down"],
        ["→", "right"],
      ]
        .map(([l, d]) => button(l, "slide", d))
        .join("");
    },
    action(a, v) {
      if (a !== "slide") return;
      const r = shift(state.board, v);
      if (!r.changed) {
        say("Nothing moves that way. Choose another direction.");
        return;
      }
      state.board = r.board;
      state.growth += r.gain;
      grow();
      moves++;
      say(r.gain ? `A little growth: +${r.gain}.` : "A little room to grow.");
      if (state.board.some((v) => v >= 128)) {
        score = state.growth;
        finish();
      } else if (
        ["left", "right", "up", "down"].every(
          (d) => !shift(state.board, d).changed,
        )
      )
        finish(false);
    },
    key(k) {
      return {
        ArrowLeft: ["slide", "left"],
        ArrowRight: ["slide", "right"],
        ArrowUp: ["slide", "up"],
        ArrowDown: ["slide", "down"],
      }[k];
    },
  };
  engines["bit-lanterns"] = {
    init: () => ({
      target: [13, 73, 166, 219, 114][chapter],
      bits: Array(8).fill(false),
    }),
    render() {
      const sum = state.bits.reduce((a, b, i) => a + (b ? 2 ** (7 - i) : 0), 0);
      scene.innerHTML =
        target("Send this number", state.target) +
        `<div class="lanterns">${state.bits.map((on, i) => `<button class="lantern ${on ? "on" : ""}" data-action="bit" data-value="${i}" aria-pressed="${on}" aria-label="${2 ** (7 - i)} lantern"><small>${2 ** (7 - i)}</small>${on ? "●" : "○"}</button>`).join("")}</div>` +
        target("Your signal", sum);
      actions.innerHTML = button("Check signal", "check", "", "primary");
    },
    action(a, v) {
      if (a === "bit") state.bits[+v] = !state.bits[+v];
      if (a === "check")
        check(
          state.bits.reduce((a, b, i) => a + (b ? 2 ** (7 - i) : 0), 0) ===
            state.target,
        );
    },
  };
  engines["fraction-balance"] = {
    init: () => ({ target: [12, 14, 15][chapter], weights: [] }),
    render() {
      const total = state.weights.reduce((a, b) => a + b, 0);
      scene.innerHTML = `<div class="pans"><div class="pan"><small>Target pan</small><strong>${fraction(state.target)}</strong></div><div class="pan"><small>Your pan</small><strong>${fraction(total)}</strong>${state.weights.map((w, i) => button(fraction(w), "remove", i, "choice")).join("")}</div></div><div class="beam" style="--tilt:${Math.max(-10, Math.min(10, total - state.target))}deg"></div><p class="hint">Choose up to three weights. Click a placed weight to remove it.</p><div class="cards">${[2, 3, 4, 6, 9].map((w) => button(fraction(w), "weight", w, "card")).join("")}</div>`;
      actions.innerHTML = button("Check balance", "check", "", "primary");
    },
    action(a, v) {
      if (a === "weight") {
        if (state.weights.length === 3) {
          say("The pan holds three weights. Remove one before adding another.");
          return;
        }
        state.weights.push(+v);
      }
      if (a === "remove") state.weights.splice(+v, 1);
      if (a === "check")
        check(state.weights.reduce((a, b) => a + b, 0) === state.target);
    },
  };
  const segmentNames = {
    a: "top",
    b: "upper right",
    c: "lower right",
    d: "bottom",
    e: "lower left",
    f: "upper left",
    g: "middle",
    v: "vertical",
  };
  const segments = [
    "abcdef",
    "bc",
    "abdeg",
    "abcdg",
    "bcfg",
    "acdfg",
    "acdefg",
    "abc",
    "abcdefg",
    "abcdfg",
  ];
  // Standard zero has no middle segment.
  function digitValue(set) {
    return segments.findIndex(
      (s) => [...s].sort().join("") === [...set].sort().join(""),
    );
  }
  engines["matchstick-equation"] = {
    init() {
      const seeds = [
          [6, 4, 4],
          [2, 1, 8],
          [2, 3, 3],
        ],
        d = seeds[chapter];
      return {
        sets: [segments[d[0]], "gv", segments[d[1]], segments[d[2]]],
        picked: null,
        moved: false,
      };
    },
    render() {
      scene.innerHTML =
        target("Relocate exactly one match", "Make it true") +
        `<div class="digits">${state.sets.map((set, i) => `${i === 3 ? '<span class="equals">=</span>' : ""}<div class="seven ${i === 1 ? "operator" : ""}">${[...(i === 1 ? "gv" : "abcdefg")].map((s) => `<button class="segment ${"agd".includes(s) ? "horizontal" : "vertical"} ${s} ${set.includes(s) ? "lit" : ""} ${state.picked === i + ":" + s ? "selected" : ""}" data-action="match" data-value="${i}:${s}" aria-label="${["First digit", "Operator", "Second digit", "Result digit"][i]}, ${segmentNames[s]} slot, ${set.includes(s) ? "occupied" : "empty"}"></button>`).join("")}</div>`).join("")}</div><div class="match-selects"><label>Lift a match<select data-match-select="lift" ${state.moved ? "disabled" : ""}><option value="">Choose occupied slot</option>${state.sets.flatMap((set, i) => [...set].map((s) => `<option value="${i}:${s}">${["First digit", "Operator", "Second digit", "Result"][i]} · ${segmentNames[s]}</option>`)).join("")}</select></label><label>Place it<select data-match-select="place" ${!state.picked || state.moved ? "disabled" : ""}><option value="">Choose empty slot</option>${state.sets.flatMap((set, i) => [...(i === 1 ? "gv" : "abcdefg")].filter((s) => !set.includes(s)).map((s) => `<option value="${i}:${s}">${["First digit", "Operator", "Second digit", "Result"][i]} · ${segmentNames[s]}</option>`)).join("")}</select></label></div><p class="match-note">${state.moved ? "One match moved. Check your equation." : state.picked ? "Select an empty slot for the lifted match." : "Select a dark match, then a pale empty slot."}</p>`;
      actions.innerHTML =
        button("Check equation", "check", "", "primary") +
        button("Undo", "restore");
    },
    action(a, v) {
      if (a === "restore") {
        state = this.init();
        return;
      }
      if (a === "match") {
        if (state.moved) {
          say("Only one match may move. Undo to try another.");
          return;
        }
        const [i, s] = v.split(":");
        if (state.sets[i].includes(s)) {
          state.picked = state.picked === v ? null : v;
          return;
        }
        if (!state.picked) {
          say("Select an occupied match first.");
          return;
        }
        const [from, seg] = state.picked.split(":");
        state.sets[from] = state.sets[from].replace(seg, "");
        state.sets[i] += s;
        state.picked = null;
        state.moved = true;
      }
      if (a === "check") {
        const [a, b, c] = [0, 2, 3].map((i) => digitValue(state.sets[i])),
          op = [...state.sets[1]].sort().join("");
        check(
          state.moved &&
            a >= 0 &&
            b >= 0 &&
            c >= 0 &&
            ((op === "gv" && a + b === c) || (op === "g" && a - b === c)),
          "Check every digit and the arithmetic. Exactly one match must move.",
        );
      }
    },
  };
  engines["factor-loom"] = {
    init: () => ({
      target: [84, 180, 630][chapter],
      spools: [2, 2, 3, 3, 5, 7],
      selected: [],
    }),
    render() {
      const product = state.selected.reduce((a, i) => a * state.spools[i], 1);
      scene.innerHTML =
        target("Weave this product", state.target) +
        `<div class="cards">${state.spools.map((p, i) => button(p, "spool", i, "card" + (state.selected.includes(i) ? " selected" : ""))).join("")}</div>` +
        target(
          "Your threads",
          state.selected.length
            ? state.selected.map((i) => state.spools[i]).join(" × ") +
                " = " +
                product
            : "1",
        );
      actions.innerHTML = button("Check product", "check", "", "primary");
    },
    action(a, v) {
      if (a === "spool")
        state.selected = state.selected.includes(+v)
          ? state.selected.filter((i) => i !== +v)
          : [...state.selected, +v];
      if (a === "check")
        check(
          state.selected.reduce((a, i) => a * state.spools[i], 1) ===
            state.target,
        );
    },
  };
  engines.clockwork = {
    init: () => ({
      at: 0,
      target: [4, 7, 2][chapter],
      limit: [3, 4, 4][chapter],
      steps: 0,
    }),
    render() {
      scene.innerHTML = `<div class="clock">${Array.from({ length: 12 }, (_, i) => `<span class="clock-number ${i === state.at ? "current" : ""} ${i === state.target ? "destination" : ""}" style="left:${50 + 40 * Math.sin((i * Math.PI) / 6)}%;top:${50 - 40 * Math.cos((i * Math.PI) / 6)}%">${i || 12}</span>`).join("")}<span class="clock-center">${state.steps}/${state.limit}</span></div><p class="hint">Destination: ${state.target || 12}. Use exactly ${state.limit} jumps.</p>`;
      actions.innerHTML =
        [3, -2, 5].map((n) => button(n > 0 ? "+" + n : n, "jump", n)).join("") +
        button("Undo", "undo");
    },
    action(a, v) {
      if (a === "undo") undo();
      if (a === "jump") {
        if (state.steps >= state.limit) {
          say("No jumps remain. Undo to try another route.");
          return;
        }
        snapshot();
        state.at = (state.at + +v + 12) % 12;
        state.steps++;
        if (state.steps === state.limit)
          check(
            state.at === state.target,
            "A different shore. Undo a jump and try a new route.",
          );
      }
    },
  };
  engines["fraction-mosaic"] = {
    init: () => ({
      pieces: [
        [3, 4, 3, 2],
        [2, 4, 6],
        [3, 3, 2, 4],
      ][chapter],
      boundaries: [
        [3, 7, 10, 12],
        [6, 8, 12],
        [4, 7, 9, 12],
      ][chapter],
      placed: [],
    }),
    render() {
      let total = 0;
      scene.innerHTML =
        target("Fill the marked unit ribbon", "One whole") +
        `<div class="ribbon">${state.placed
          .map((i) => {
            total += state.pieces[i];
            return `<button data-action="unplace" aria-label="Remove last piece" style="width:${(state.pieces[i] / 12) * 100}%;background:${["#267c72", "#b67354", "#687b95", "#7b7253"][i]}">${fraction(state.pieces[i])}</button>`;
          })
          .join("")}${state.boundaries
          .slice(0, -1)
          .map(
            (n) => `<span class="tick" style="left:${(n / 12) * 100}%"></span>`,
          )
          .join(
            "",
          )}</div><p class="hint">Seams: ${state.boundaries.map(fraction).join(" · ")}. Filled ${fraction(total)}.</p><div class="cards">${state.pieces.map((p, i) => `<button class="card" data-action="piece" data-value="${i}" ${state.placed.includes(i) ? "disabled" : ""}>${fraction(p)}</button>`).join("")}</div>`;
      actions.innerHTML = button("Remove last", "unplace");
    },
    action(a, v) {
      if (a === "unplace") {
        state.placed.pop();
        return;
      }
      if (a === "piece") {
        const i = +v;
        if (state.placed.includes(i)) return;
        const end =
          state.placed.reduce((a, j) => a + state.pieces[j], 0) +
          state.pieces[i];
        if (end !== state.boundaries[state.placed.length]) {
          say(
            "That piece crosses a seam or stops too soon. Try another length.",
          );
          checks++;
          return;
        }
        state.placed.push(i);
        if (end === 12) finish();
      }
    },
  };
  function arithmetic(nums, ops) {
    const ns = [...nums],
      os = [...ops];
    for (let i = 0; i < os.length; ) {
      if (os[i] === "×") {
        ns.splice(i, 2, ns[i] * ns[i + 1]);
        os.splice(i, 1);
      } else i++;
    }
    let n = ns[0];
    os.forEach((o, i) => (n = o === "+" ? n + ns[i + 1] : n - ns[i + 1]));
    return n;
  }
  function bracketValue() {
    if (state.ends.length !== 2) return null;
    const [lo, hi] = [...state.ends].sort((a, b) => a - b),
      middle = arithmetic(
        state.nums.slice(lo, hi + 1),
        state.ops.slice(lo, hi),
      ),
      ns = [...state.nums.slice(0, lo), middle, ...state.nums.slice(hi + 1)],
      os = [...state.ops.slice(0, lo), ...state.ops.slice(hi)];
    return arithmetic(ns, os);
  }
  engines["precedence-lab"] = {
    init: () =>
      [
        { nums: [2, 3, 4], ops: ["+", "×"], target: 20, ends: [] },
        { nums: [8, 3, 2], ops: ["−", "×"], target: 10, ends: [] },
        { nums: [2, 3, 4, 5], ops: ["×", "+", "×"], target: 70, ends: [] },
      ][chapter],
    render() {
      const ends = [...state.ends].sort((a, b) => a - b);
      scene.innerHTML =
        target("One pair of brackets. Target", state.target) +
        `<div class="cards">${state.nums.map((n, i) => (i ? `<span class="equation">${state.ops[i - 1]}</span>` : "") + button((i === ends[0] ? "(" : "") + n + (ends.length === 2 && i === ends[1] ? ")" : ""), "end", i, "card" + (state.ends.includes(i) ? " selected" : ""))).join("")}</div><p class="hint">${state.ends.length === 2 ? "Your expression equals " + fmt(bracketValue()) : "Select the first and last number inside the brackets."}</p>`;
      actions.innerHTML = button("Check expression", "check", "", "primary");
    },
    action(a, v) {
      if (a === "end")
        state.ends = state.ends.includes(+v)
          ? state.ends.filter((i) => i !== +v)
          : state.ends.length === 2
            ? [+v]
            : [...state.ends, +v];
      if (a === "check")
        check(state.ends.length === 2 && bracketValue() === state.target);
    },
  };
  engines["estimation-studio"] = {
    init: () => ({ target: [8, 70, 420, 3, 180][chapter], position: 50 }),
    render() {
      scene.innerHTML =
        target("Locate this magnitude", state.target) +
        `<label for="scale" class="sr-only">Estimated position on logarithmic scale</label><input class="slider" id="scale" data-action="estimate" type="range" min="0" max="100" step="1" value="${state.position}"><div class="axis"><span>1</span><span>10</span><span>100</span><span>1,000</span></div><p class="hint">Each third of the line is one power of ten.<br>Use the slider, or focus it and use arrow keys.</p>`;
      actions.innerHTML = button("Commit estimate", "check", "", "primary");
    },
    action(a, v) {
      if (a === "estimate") state.position = +v;
      if (a === "check") {
        const estimate = 10 ** (state.position * 0.03);
        check(
          Math.max(estimate / state.target, state.target / estimate) <= 1.3,
          `Your estimate was about ${Math.round(estimate)}. Aim ${estimate < state.target ? "farther right" : "farther left"}.`,
        );
      }
    },
  };
  engines["ratio-mixer"] = {
    init: () => ({
      ratio: [
        [1, 2],
        [3, 2],
        [2, 3],
      ][chapter],
      capacity: [9, 10, 15][chapter],
      amount: [0, 0],
    }),
    render() {
      const sum = state.amount[0] + state.amount[1];
      scene.innerHTML =
        target("Coral : teal", state.ratio.join(" : ")) +
        `<div class="jar"><div class="coral" style="height:${(state.amount[0] / state.capacity) * 100}%">${state.amount[0] || ""}</div><div class="teal" style="height:${(state.amount[1] / state.capacity) * 100}%">${state.amount[1] || ""}</div></div><div class="steppers">${["Coral", "Teal"].map((name, i) => `<div class="stepper"><p>${name}</p>${button("−", "scoop", i + ":-1", "", "Remove " + name.toLowerCase() + " scoop")}<strong>${state.amount[i]}</strong>${button("+", "scoop", i + ":1", "", "Add " + name.toLowerCase() + " scoop")}</div>`).join("")}</div><p class="hint">Jar: ${sum} / ${state.capacity} scoops. Fill it exactly.</p>`;
      actions.innerHTML = button("Check recipe", "check", "", "primary");
    },
    action(a, v) {
      if (a === "scoop") {
        const [i, d] = v.split(":").map(Number);
        if (
          state.amount[i] + d < 0 ||
          state.amount[0] + state.amount[1] + d > state.capacity
        ) {
          say("Stay within the jar: no negative scoops or overflow.");
          return;
        }
        state.amount[i] += d;
      }
      if (a === "check")
        check(
          state.amount[0] + state.amount[1] === state.capacity &&
            state.amount[0] * state.ratio[1] ===
              state.amount[1] * state.ratio[0],
        );
    },
  };
  engines["sequence-detective"] = {
    init() {
      const puzzle = [
        {
          terms: [2, 5, 11, 23],
          answer: 47,
          choices: [35, 46, 47, 49],
          clue: "Repeat the same multiplication, then the same addition.",
        },
        {
          terms: [1, 4, 9, 16],
          answer: 25,
          choices: [20, 24, 25, 32],
          clue: "Picture growing squares.",
        },
        {
          terms: [2, 3, 5, 8, 13],
          answer: 21,
          choices: [18, 20, 21, 26],
          clue: "Two neighbors make the next.",
        },
        {
          terms: [3, 8, 6, 11, 9],
          answer: 14,
          choices: [10, 12, 14, 18],
          clue: "Two alternating steps: forward, then back.",
        },
        {
          terms: [1, 3, 6, 10, 15],
          answer: 21,
          choices: [19, 20, 21, 25],
          clue: "Each gap grows by one.",
        },
      ][chapter];
      const choices = SmallHours.shuffle(
        puzzle.choices.filter((n) => n !== puzzle.answer),
      );
      choices.splice(sequencePositions[chapter], 0, puzzle.answer);
      return { ...puzzle, choices };
    },
    render() {
      scene.innerHTML =
        target("What comes next?", state.terms.join(" · ") + " · ?") +
        `<p class="hint">${state.clue}</p><div class="cards">${state.choices.map((n) => button(n, "answer", n, "card")).join("")}</div>`;
      actions.innerHTML = "";
    },
    action(a, v) {
      if (a === "answer")
        check(
          +v === state.answer,
          "That breaks the pattern. Use the family clue to test your next idea.",
        );
    },
  };
  engines["decimal-market"] = {
    init: () => ({
      prices: [
        [125, 75, 50],
        [110, 65, 40],
        [135, 85, 60],
      ][chapter],
      budget: [450, 435, 585][chapter],
      items: [5, 5, 6][chapter],
      basket: [0, 0, 0],
    }),
    render() {
      const cents = state.basket.reduce(
          (a, n, i) => a + n * state.prices[i],
          0,
        ),
        count = state.basket.reduce((a, b) => a + b, 0);
      scene.innerHTML =
        target(
          `Spend exactly $${(state.budget / 100).toFixed(2)} · buy ${state.items} items`,
          "The small market",
        ) +
        `<div class="steppers">${["Pear", "Plum", "Fig"].map((name, i) => `<div class="stepper"><p>${name} · $${(state.prices[i] / 100).toFixed(2)}</p>${button("−", "buy", i + ":-1", "", "Remove " + name.toLowerCase())}<strong>${state.basket[i]}</strong>${button("+", "buy", i + ":1", "", "Add " + name.toLowerCase())}</div>`).join("")}</div>` +
        target(`${count} items in basket`, "$" + (cents / 100).toFixed(2));
      actions.innerHTML = button("Pay exactly", "check", "", "primary");
    },
    action(a, v) {
      if (a === "buy") {
        const [i, d] = v.split(":").map(Number);
        if (
          state.basket[i] + d < 0 ||
          state.basket.reduce((a, b) => a + b, 0) + d > state.items
        ) {
          say("Keep your basket within the item limit.");
          return;
        }
        state.basket[i] += d;
      }
      if (a === "check")
        check(
          state.basket.reduce((a, b) => a + b, 0) === state.items &&
            state.basket.reduce((a, n, i) => a + n * state.prices[i], 0) ===
              state.budget,
        );
    },
  };
  engines["digit-forge"] = {
    init: () =>
      [
        { digits: [1, 2, 4], divisor: 4, min: 100, max: 300, placed: [] },
        { digits: [1, 3, 5], divisor: 5, min: 200, max: 400, placed: [] },
        { digits: [0, 2, 4, 8], divisor: 8, min: 4000, max: 5000, placed: [] },
      ][chapter],
    render() {
      scene.innerHTML =
        target(
          `Between ${state.min} and ${state.max} · divisible by ${state.divisor}`,
          state.placed.length
            ? state.placed.map((i) => state.digits[i]).join("")
            : "_ ".repeat(state.digits.length),
        ) +
        `<div class="cards">${state.digits.map((n, i) => `<button class="card" data-action="digit" data-value="${i}" ${state.placed.includes(i) ? "disabled" : ""}>${n}</button>`).join("")}</div><p class="hint">Every card, once. No leading zero.</p>`;
      actions.innerHTML =
        button("Check number", "check", "", "primary") +
        button("Take back last", "back");
    },
    action(a, v) {
      if (a === "back") state.placed.pop();
      if (a === "digit") {
        if (state.placed.includes(+v)) return;
        if (!state.placed.length && state.digits[+v] === 0) {
          say("Zero cannot lead this number.");
          return;
        }
        state.placed.push(+v);
      }
      if (a === "check") {
        const n = Number(state.placed.map((i) => state.digits[i]).join(""));
        check(
          state.placed.length === state.digits.length &&
            n > state.min &&
            n < state.max &&
            n % state.divisor === 0,
        );
      }
    },
  };
  engines["coordinate-courier"] = {
    init: () => ({
      x: 0,
      y: 0,
      route: [
        [
          [2, 1],
          [-1, 2],
        ],
        [
          [2, -2],
          [-2, -1],
          [0, 2],
        ],
        [
          [-3, 1],
          [1, 3],
          [2, -2],
        ],
      ][chapter],
      parcel: 0,
      steps: 0,
      budget: [8, 14, 17][chapter],
    }),
    render() {
      scene.innerHTML = `<div class="coordinate-grid" role="img" aria-label="Courier at (${state.x}, ${state.y})">${Array.from(
        { length: 49 },
        (_, i) => {
          const x = (i % 7) - 3,
            y = 3 - Math.floor(i / 7),
            p = state.route.findIndex(
              ([a, b], j) => j >= state.parcel && a === x && b === y,
            ),
            at = x === state.x && y === state.y;
          return `<span class="${x === 0 || y === 0 ? "origin" : ""} ${p >= 0 ? "parcel" : ""} ${at ? "courier" : ""}">${at ? "✦" : p >= 0 ? p + 1 : x === 0 && y === 0 ? "0" : ""}</span>`;
        },
      ).join(
        "",
      )}</div><div class="route">${state.route.map(([x, y], i) => `<span class="${i < state.parcel ? "done" : ""}">${i + 1}: (${x}, ${y})</span>`).join("")}</div><p class="hint">Position (${state.x}, ${state.y}) · ${state.steps}/${state.budget} steps. Up is +y.</p>`;
      actions.innerHTML =
        [
          ["↑", "up"],
          ["←", "left"],
          ["↓", "down"],
          ["→", "right"],
        ]
          .map(([l, d]) => button(l, "move", d))
          .join("") + button("Undo", "undo");
    },
    action(a, v) {
      if (a === "undo") undo();
      if (a === "move") {
        if (state.steps === state.budget) {
          say("Step budget reached. Undo to shorten your route.");
          return;
        }
        const dx = v === "left" ? -1 : v === "right" ? 1 : 0,
          dy = v === "up" ? 1 : v === "down" ? -1 : 0;
        if (Math.abs(state.x + dx) > 3 || Math.abs(state.y + dy) > 3) {
          say("That is the edge of the map.");
          return;
        }
        snapshot();
        state.x += dx;
        state.y += dy;
        state.steps++;
        const [x, y] = state.route[state.parcel];
        if (x === state.x && y === state.y) {
          state.parcel++;
          say("Parcel collected. Follow the next coordinate.");
          if (state.parcel === state.route.length) finish();
        }
      }
    },
    key(k) {
      return {
        ArrowLeft: ["move", "left"],
        ArrowRight: ["move", "right"],
        ArrowUp: ["move", "up"],
        ArrowDown: ["move", "down"],
      }[k];
    },
  };
  function dispatch(a, v) {
    if (ended) return;
    const focused = document.activeElement,
      fa = focused?.dataset.action,
      fv = focused?.dataset.value,
      matchSelect = focused?.dataset.matchSelect;
    engines[game.id].action(a, v);
    draw();
    if (!ended && fa) {
      const replacement = [...document.querySelectorAll("[data-action]")].find(
        (b) => b.dataset.action === fa && b.dataset.value === fv && !b.disabled,
      );
      const nextCard = ["digit", "piece"].includes(fa)
        ? scene.querySelector(`[data-action="${fa}"]:not(:disabled)`) ||
          actions.querySelector('[data-action="check"]')
        : null;
      (replacement || nextCard)?.focus({ preventScroll: true });
    }
    if (!ended && matchSelect) {
      const replacement = scene.querySelector(
        `[data-match-select="${matchSelect}"]`,
      );
      (replacement && !replacement.disabled
        ? replacement
        : actions.querySelector('[data-action="check"]')
      )?.focus({ preventScroll: true });
    }
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-action]");
    if (b && b.tagName === "BUTTON")
      dispatch(b.dataset.action, b.dataset.value);
  });
  document.addEventListener("change", (e) => {
    if (e.target.matches("[data-match-select]") && e.target.value)
      dispatch("match", e.target.value);
  });
  document.addEventListener("input", (e) => {
    if (e.target.matches('[data-action="estimate"]')) {
      state.position = +e.target.value;
    }
  });
  document.addEventListener("keydown", (e) => {
    if (
      e.altKey ||
      e.ctrlKey ||
      e.metaKey ||
      e.repeat ||
      e.target.matches("input,textarea,select")
    )
      return;
    const action = engines[game.id].key?.(e.key);
    if (action) {
      e.preventDefault();
      dispatch(...action);
    }
  });
  restart();
  document.body.dataset.gameReady = "true";
})().catch((error) => {
  document.getElementById("message").textContent =
    "This room could not load. Refresh the page to try again.";
  console.error(error);
});
