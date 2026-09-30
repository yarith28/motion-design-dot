const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const games = require("../number-room/games.json");
const base = process.env.BASE_URL || "http://127.0.0.1:8790";
const op = (a, b, o) =>
  o === "+" ? a + b : o === "−" ? a - b : o === "×" ? a * b : a / b;
function solve24(ns) {
  if (ns.length === 1) return Math.abs(ns[0] - 24) < 1e-7 ? [] : null;
  for (let i = 0; i < ns.length; i++)
    for (let j = 0; j < ns.length; j++)
      if (i !== j)
        for (const o of ["+", "−", "×", "÷"]) {
          if (o === "÷" && Math.abs(ns[j]) < 1e-8) continue;
          const next = ns.filter((_, k) => k !== i && k !== j);
          next.push(op(ns[i], ns[j], o));
          const rest = solve24(next);
          if (rest) return [[i, j, o], ...rest];
        }
  return null;
}
function shift(b, d) {
  const r = [...b];
  for (let l = 0; l < 4; l++) {
    const ids = Array.from({ length: 4 }, (_, k) =>
        d === "left"
          ? l * 4 + k
          : d === "right"
            ? l * 4 + 3 - k
            : d === "up"
              ? k * 4 + l
              : (3 - k) * 4 + l,
      ),
      v = ids.map((i) => b[i]).filter(Boolean),
      out = [];
    for (let i = 0; i < v.length; i++) {
      if (v[i] === v[i + 1]) {
        out.push(v[i] * 2);
        i++;
      } else out.push(v[i]);
    }
    ids.forEach((id, i) => (r[id] = out[i] || 0));
  }
  return r;
}
function goodness(b) {
  const weights = [15, 14, 13, 12, 8, 9, 10, 11, 7, 6, 5, 4, 0, 1, 2, 3];
  let value = b.filter((x) => !x).length * 500;
  for (let i = 0; i < 16; i++)
    value += (b[i] ? Math.log2(b[i]) : 0) * weights[i] * 12;
  for (let i = 0; i < 16; i++)
    if (b[i])
      for (const j of [i % 4 < 3 ? i + 1 : -1, i < 12 ? i + 4 : -1])
        if (j >= 0 && b[j])
          value -= Math.abs(Math.log2(b[i]) - Math.log2(b[j])) * 12;
  return value;
}
function bestMove(b, depth = 2) {
  let best = { value: -Infinity, d: null };
  for (const d of ["up", "left", "right", "down"]) {
    const n = shift(b, d);
    if (n.every((v, i) => v === b[i])) continue;
    let value = goodness(n);
    if (depth) {
      const empty = n.flatMap((v, i) => (v ? [] : [i]));
      let sum = 0;
      for (const i of empty) {
        const possible = [...n];
        possible[i] = 2;
        sum += bestMove(possible, depth - 1).value;
      }
      if (empty.length) value = sum / empty.length;
    }
    if (value > best.value) best = { value, d };
  }
  return best.d ? best : { value: goodness(b) - 5000, d: null };
}
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const coveragePath = path.join(__dirname, "../coverage/number-room.json");
  const coverage =
    (process.env.GAME || process.env.EDGE_ONLY) && fs.existsSync(coveragePath)
      ? JSON.parse(fs.readFileSync(coveragePath, "utf8")).games.filter(
          (g) => g.id !== process.env.GAME,
        )
      : [];
  for (const game of games.filter(
    (g) =>
      !process.env.EDGE_ONLY &&
      (!process.env.GAME || g.id === process.env.GAME),
  )) {
    const rounds =
      game.id === "merge-garden"
        ? 1
        : ["bit-lanterns", "estimation-studio", "sequence-detective"].includes(
              game.id,
            )
          ? 5
          : 3;
    const result = {
      id: game.id,
      passed: false,
      completed: false,
      restart: false,
      mobile: false,
      desktop: false,
      storageFailures: false,
      checks: [],
    };
    for (const mobile of [false, true]) {
      const context = await browser.newContext({
        viewport: mobile
          ? { width: 390, height: 844 }
          : { width: 1440, height: 1000 },
        isMobile: mobile,
        hasTouch: mobile,
        reducedMotion: mobile ? "reduce" : "no-preference",
      });
      if (mobile)
        await context.addInitScript(() => {
          Storage.prototype.getItem = function () {
            throw Error("blocked");
          };
          Storage.prototype.setItem = function () {
            throw Error("blocked");
          };
        });
      const page = await context.newPage(),
        errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(`${base}/mini-games/number-room/?game=${game.id}`);
      await page.waitForSelector('body[data-game-ready="true"]');
      const click = async (a, v) => {
        const selector = `[data-action="${a}"]${v === undefined ? "" : `[data-value="${v}"]`}`;
        if (mobile) await page.locator(selector).first().tap();
        else await page.locator(selector).first().click();
      };
      // Every game starts again safely, before and after a full completion.
      await page.locator("#restart").click();
      await page.locator("#restart").click();
      result.restart = true;
      if (game.id === "make-24") {
        await click("operate", "+");
        assert.match(await page.locator("#message").textContent(), /two cards/);
      } else if (game.id === "matchstick-equation") {
        await click("match", "0:b");
        await click("check");
        assert(await page.locator("#result").isHidden());
      } else if (game.id === "fraction-mosaic") {
        await click("piece", 1);
        assert.match(await page.locator("#message").textContent(), /seam/);
      } else if (game.id === "ratio-mixer") {
        await click("scoop", "0:-1");
        assert.match(await page.locator("#message").textContent(), /negative/);
      } else if (game.id === "decimal-market") {
        await click("buy", "0:-1");
        assert.match(await page.locator("#message").textContent(), /limit/);
      } else if (game.id === "coordinate-courier") {
        for (let i = 0; i < 4; i++) await click("move", "left");
        assert.match(await page.locator("#message").textContent(), /edge/);
        await page.locator("#restart").click();
      } else if (game.id === "clockwork") {
        await click("undo");
        assert.match(await page.locator("#message").textContent(), /beginning/);
      } else if (game.id === "sequence-detective") {
        await click("answer", 35);
        assert(await page.locator("#result").isHidden());
      } else if (game.id === "merge-garden") {
        await page.keyboard.press("ArrowLeft");
        assert(await page.locator(".number-grid").isVisible());
        await page.locator("#restart").click();
      } else {
        await click("check");
        assert(await page.locator("#result").isHidden());
      }
      for (let round = 0; round < rounds; round++) {
        switch (game.id) {
          case "make-24": {
            const steps = solve24(
              [
                [1, 2, 3, 4],
                [2, 3, 4, 6],
                [2, 4, 6, 8],
              ][round],
            );
            assert(steps);
            for (const [a, b, o] of steps) {
              await click("select", a);
              await click("select", b);
              await click("operate", o);
            }
            break;
          }
          case "merge-garden": {
            let steps = 0,
              retries = 0;
            while (true) {
              const b = await page
                .locator("[data-number]")
                .evaluateAll((ts) => ts.map((t) => +t.dataset.number));
              if (Math.max(...b) >= 128) break;
              if (!(await page.locator("#result").isHidden())) {
                assert(++retries < 4, "Merge solver exhausted retries");
                await page.locator("#restart").click();
                continue;
              }
              assert(++steps < 1500, "Merge solver exceeded budget");
              const { d } = bestMove(b);
              assert(d);
              await click("slide", d);
            }
            result.checks.push(
              `128 reached with ${steps} legal slides (${mobile ? "mobile" : "desktop"}), ${retries} retries`,
            );
            break;
          }
          case "bit-lanterns": {
            const n = [13, 73, 166, 219, 114][round];
            for (let i = 0; i < 8; i++)
              if (n & (2 ** (7 - i))) await click("bit", i);
            await click("check");
            break;
          }
          case "fraction-balance":
            for (const n of [
              [6, 6],
              [6, 6, 2],
              [9, 6],
            ][round])
              await click("weight", n);
            await click("check");
            break;
          case "matchstick-equation": {
            await click("restore");
            const [from, to] = [
              ["1:v", "0:b"],
              ["3:e", "2:a"],
              ["3:b", "3:f"],
            ][round];
            if (mobile) {
              await page
                .locator('[data-match-select="lift"]')
                .selectOption(from);
              await page
                .locator('[data-match-select="place"]')
                .selectOption(to);
            } else {
              await click("match", from);
              await click("match", to);
            }
            await click("check");
            break;
          }
          case "factor-loom":
            for (const i of [
              [0, 1, 2, 5],
              [0, 1, 2, 3, 4],
              [0, 2, 3, 4, 5],
            ][round])
              await click("spool", i);
            await click("check");
            break;
          case "clockwork":
            for (const n of [
              [3, 3, -2],
              [3, 3, 3, -2],
              [3, 3, -2, -2],
            ][round])
              await click("jump", n);
            break;
          case "fraction-mosaic":
            for (const i of [
              [0, 1, 2, 3],
              [2, 0, 1],
              [3, 0, 2, 1],
            ][round])
              await click("piece", i);
            break;
          case "precedence-lab":
            for (const i of [
              [0, 1],
              [0, 1],
              [1, 2],
            ][round])
              await click("end", i);
            await click("check");
            break;
          case "estimation-studio": {
            const pos = Math.round(
              (Math.log10([8, 70, 420, 3, 180][round]) / 3) * 100,
            );
            await page.locator("#scale").focus();
            await page.keyboard.press("Home");
            for (let i = 0; i < pos; i++)
              await page.keyboard.press("ArrowRight");
            await click("check");
            break;
          }
          case "ratio-mixer": {
            const amounts = [
              [3, 6],
              [6, 4],
              [6, 9],
            ][round];
            for (let i = 0; i < 2; i++)
              for (let j = 0; j < amounts[i]; j++)
                await click("scoop", i + ":1");
            await click("check");
            break;
          }
          case "sequence-detective":
            await click("answer", [47, 25, 21, 14, 21][round]);
            break;
          case "decimal-market": {
            const prices = [
                [125, 75, 50],
                [110, 65, 40],
                [135, 85, 60],
              ][round],
              budget = [450, 435, 585][round],
              items = [5, 5, 6][round];
            let counts;
            for (let a = 0; a <= items; a++)
              for (let b = 0; b <= items - a; b++) {
                const c = items - a - b;
                if (a * prices[0] + b * prices[1] + c * prices[2] === budget)
                  counts = [a, b, c];
              }
            assert(counts);
            for (let i = 0; i < 3; i++)
              for (let j = 0; j < counts[i]; j++) await click("buy", i + ":1");
            await click("check");
            break;
          }
          case "digit-forge":
            for (const i of [
              [0, 1, 2],
              [1, 0, 2],
              [2, 1, 0, 3],
            ][round])
              await click("digit", i);
            await click("check");
            break;
          case "coordinate-courier": {
            const route = [
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
            ][round];
            let x = 0,
              y = 0;
            for (const [tx, ty] of route) {
              while (x !== tx) {
                const d = x < tx ? "right" : "left";
                if (mobile) await click("move", d);
                else
                  await page.keyboard.press(
                    d === "right" ? "ArrowRight" : "ArrowLeft",
                  );
                x += x < tx ? 1 : -1;
              }
              while (y !== ty) {
                const d = y < ty ? "up" : "down";
                if (mobile) await click("move", d);
                else
                  await page.keyboard.press(
                    d === "up" ? "ArrowUp" : "ArrowDown",
                  );
                y += y < ty ? 1 : -1;
              }
            }
            break;
          }
        }
        assert(
          await page.locator("#result").isVisible(),
          game.id +
            " round " +
            round +
            " not solved: " +
            (await page.locator("#message").textContent()),
        );
        assert.match(
          await page.locator("#result-title").textContent(),
          /Beautifully|clicks/,
        );
        if (round < rounds - 1) await page.locator("#next").click();
      }
      assert.notEqual(await page.locator("#best").textContent(), "—");
      if (mobile) {
        assert.match(
          await page.locator("#storage-note").textContent(),
          /unavailable/,
        );
        result.storageFailures = true;
      } else {
        const saved = await page.locator("#best").textContent();
        await page.reload();
        await page.waitForSelector('body[data-game-ready="true"]');
        assert.equal(await page.locator("#best").textContent(), saved);
      }
      await page.locator("#restart").click();
      assert(await page.locator("#result").isHidden());
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        game.id + " overflow",
      );
      if (mobile) {
        await page.setViewportSize({ width: 320, height: 750 });
        assert(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          game.id + " 320px overflow",
        );
      }
      if (
        [
          "matchstick-equation",
          "fraction-mosaic",
          "merge-garden",
          "ratio-mixer",
          "coordinate-courier",
        ].includes(game.id)
      )
        await page.screenshot({
          path: `/tmp/number-${game.id}-${mobile ? "mobile" : "desktop"}.png`,
          fullPage: true,
        });
      await page.locator(".back").click();
      assert.equal(new URL(page.url()).pathname, "/mini-games/");
      assert.deepEqual(errors, []);
      result[mobile ? "mobile" : "desktop"] = true;
      await context.close();
    }
    result.completed = true;
    result.passed = true;
    result.checks.push(
      "All chapters completed through legal UI input; invalid input, repeated restart, record persistence, storage failure, reduced motion, 320px layout, navigation, no page errors.",
    );
    coverage.push(result);
    console.log(game.id + " passed desktop/mobile");
    fs.writeFileSync(
      path.join(__dirname, "../coverage/number-room.json"),
      JSON.stringify(
        {
          suite: "number-room",
          testedAt: new Date().toISOString(),
          browser: "Chromium",
          limitations: [
            "Mobile viewport/touch emulation, not physical device",
            "Other browser engines untested",
            "Curated puzzle chapters repeat on replay; Merge Garden uses random spawns",
          ],
          games: coverage,
        },
        null,
        2,
      ) + "\n",
    );
  }
  // Read-only response probe exposes pure production functions, never mutable game state.
  const edgeContext = await browser.newContext({ reducedMotion: "reduce" });
  const edge = await edgeContext.newPage();
  await edge.route("**/number-room/room.js", async (route) => {
    const source = fs.readFileSync(
      path.join(__dirname, "../number-room/room.js"),
      "utf8",
    );
    await route.fulfill({
      contentType: "application/javascript",
      body: source.replace(
        "  restart();\n  document.body.dataset.gameReady",
        "  window.__readOnlyNumberFunctions = {shift, arithmetic, digitValue};\n  restart();\n  document.body.dataset.gameReady",
      ),
    });
  });
  await edge.goto(base + "/mini-games/number-room/?game=merge-garden");
  await edge.waitForSelector('body[data-game-ready="true"]');
  const pure = await edge.evaluate(() => {
    const { shift, arithmetic, digitValue } = window.__readOnlyNumberFunctions;
    const row = [2, 2, 2, 2, ...Array(12).fill(0)];
    const blocked = [2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2];
    return {
      once: shift(row, "left").board.slice(0, 4),
      unchanged: shift([4, 0, 0, 0, ...Array(12).fill(0)], "left").changed,
      dead: ["left", "right", "up", "down"].every(
        (d) => !shift(blocked, d).changed,
      ),
      precedence: arithmetic([2, 3, 4], ["+", "×"]),
      zero: digitValue("abcdef"),
      invalid: digitValue("a"),
    };
  });
  assert.deepEqual(pure, {
    once: [4, 4, 0, 0],
    unchanged: false,
    dead: true,
    precedence: 14,
    zero: 0,
    invalid: -1,
  });
  const motion = await edge
    .locator(".filled")
    .first()
    .evaluate((el) => ({
      animation: getComputedStyle(el).animationName,
      transition: getComputedStyle(el).transitionDuration,
    }));
  assert.equal(motion.animation, "none");
  assert.equal(motion.transition, "0s");
  await edge.goto(base + "/mini-games/number-room/?game=bit-lanterns");
  await edge.waitForSelector('body[data-game-ready="true"]');
  await edge.locator('[data-action="bit"]').first().focus();
  await edge.keyboard.press("Enter");
  assert.equal(
    await edge
      .locator('[data-action="bit"]')
      .first()
      .getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(
    await edge.evaluate(() => document.activeElement.dataset.action),
    "bit",
  );
  await edge.keyboard.press("Space");
  assert.equal(
    await edge
      .locator('[data-action="bit"]')
      .first()
      .getAttribute("aria-pressed"),
    "false",
  );
  const prior = await edge.locator("#scene").innerHTML();
  await edge.evaluate(() =>
    document.dispatchEvent(new Event("visibilitychange")),
  );
  assert.equal(await edge.locator("#scene").innerHTML(), prior);
  await edge.goto(base + "/mini-games/number-room/?game=matchstick-equation");
  await edge.waitForSelector('body[data-game-ready="true"]');
  await edge.locator('[data-match-select="lift"]').focus();
  await edge.keyboard.press("ArrowDown");
  assert.equal(
    await edge.evaluate(() => document.activeElement.dataset.matchSelect),
    "lift",
  );
  assert.notEqual(
    await edge.locator('[data-match-select="lift"]').inputValue(),
    "",
  );
  await edge.keyboard.press("ArrowDown");
  assert.equal(
    await edge.evaluate(() => document.activeElement.dataset.matchSelect),
    "lift",
  );
  await edge.locator('[data-match-select="lift"]').selectOption("1:v");
  await edge.keyboard.press("Tab");
  assert.equal(
    await edge.evaluate(() => document.activeElement.dataset.matchSelect),
    "place",
  );
  await edge.locator('[data-match-select="place"]').selectOption("0:b");
  assert.equal(
    await edge.evaluate(() => document.activeElement.dataset.action),
    "check",
  );
  await edge.keyboard.press("Enter");
  assert(await edge.locator("#result").isVisible());
  await edge.goto(base + "/mini-games/number-room/?game=make-24");
  await edge.waitForSelector('body[data-game-ready="true"]');
  await edge.locator('[data-action="select"]').nth(0).focus();
  await edge.keyboard.press("Enter");
  assert.equal(
    await edge
      .locator('[data-action="select"]')
      .nth(0)
      .getAttribute("aria-pressed"),
    "true",
  );
  await edge.locator('[data-action="select"]').nth(1).focus();
  await edge.keyboard.press("Enter");
  assert.match(
    await edge
      .locator('[data-action="select"]')
      .nth(0)
      .getAttribute("aria-label"),
    /first operand/,
  );
  assert.match(
    await edge
      .locator('[data-action="select"]')
      .nth(1)
      .getAttribute("aria-label"),
    /second operand/,
  );
  assert.match(
    await edge.locator("#message").textContent(),
    /First operand: 1. Second operand: 2/,
  );
  await edge.goto(base + "/mini-games/number-room/?game=factor-loom");
  await edge.waitForSelector('body[data-game-ready="true"]');
  await edge
    .getByRole("button", { name: "Spool 1: prime 2", exact: true })
    .click();
  assert.equal(
    await edge
      .getByRole("button", { name: "Spool 1: prime 2", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  for (const [id, labels] of [
    [
      "ratio-mixer",
      [
        "Add coral scoop",
        "Remove coral scoop",
        "Add teal scoop",
        "Remove teal scoop",
      ],
    ],
    [
      "decimal-market",
      [
        "Add pear",
        "Remove pear",
        "Add plum",
        "Remove plum",
        "Add fig",
        "Remove fig",
      ],
    ],
  ]) {
    await edge.goto(base + "/mini-games/number-room/?game=" + id);
    await edge.waitForSelector('body[data-game-ready="true"]');
    for (const name of labels)
      assert.equal(
        await edge.getByRole("button", { name, exact: true }).count(),
        1,
      );
  }
  await edgeContext.close();
  if (fs.existsSync(coveragePath)) {
    const report = JSON.parse(fs.readFileSync(coveragePath, "utf8"));
    report.deepChecks = [
      "Read-only production merge: each tile merges once, no-op unchanged, full dead board detected",
      "Production operator precedence and seven-segment validity",
      "Keyboard Enter/Space preserves focus and toggles bits",
      "Reduced-motion computed animation:none / transition:0s",
      "Visibilitychange leaves turn-based state unchanged",
      "Matchlight native dropdown keyboard focus survives rerender and advances to Check after placement",
      "Make24 operand order and Factor spool selected state exposed; ratio/market steppers have contextual names",
    ];
    fs.writeFileSync(coveragePath, JSON.stringify(report, null, 2) + "\n");
  }
  await browser.close();
  console.log("Number Room requested games and deep checks passed.");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
