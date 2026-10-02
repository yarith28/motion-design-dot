const assert = require("node:assert/strict");
const { launchBrowser } = require("./browser-launch.cjs");
const base = process.env.BASE_URL || "http://127.0.0.1:8000/kitchen-cats/";
(async () => {
  const b = await launchBrowser();
  try {
    const storageContext = await b.newContext({
      viewport: { width: 844, height: 390 },
      isMobile: true,
      hasTouch: true,
    });
    await storageContext.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        configurable: true,
        get() {
          throw Error("storage blocked by test");
        },
      });
    });
    const storagePage = await storageContext.newPage();
    const storageErrors = [];
    storagePage.on("pageerror", (e) => storageErrors.push(e.message));
    await storagePage.goto(base);
    await storagePage.locator("#solo").click();
    await storagePage.locator("#motion").click();
    assert.match(await storagePage.locator("#toast").textContent(), /could not be saved/);
    assert.deepEqual(storageErrors, []);
    await storageContext.close();

    const c = await b.newContext({
      viewport: { width: 844, height: 390 },
      isMobile: true,
      hasTouch: true,
    });
    const p = await c.newPage();
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
    await p.goto(base);
    await p.clock.pauseAt(new Date("2026-01-02T00:00:00Z"));
    // Observe emitted snapshots only; all game actions below use actual UI input.
    await p.evaluate(async () => {
      const { KitchenGame } = await import("./game-core.js");
      const original = KitchenGame.prototype.snapshot;
      KitchenGame.prototype.snapshot = function () {
        const s = original.call(this);
        window.testSnapshot = s;
        return s;
      };
      const tick = KitchenGame.prototype.tick;
      KitchenGame.prototype.tick = function (...args) {
        window.testTickCount = (window.testTickCount || 0) + 1;
        return tick.apply(this, args);
      };
      window.testTickCount = 0;
    });
    const state = () => p.evaluate(() => window.testSnapshot);
    const step = (ms) => p.clock.runFor(ms);
    async function axis(axis, target) {
      for (let i = 0; i < 180; i++) {
        const v = (await state()).players[0][axis];
        if (Math.abs(target - v) < 10) break;
        const key =
          axis === "x"
            ? target > v
              ? "ArrowRight"
              : "ArrowLeft"
            : target > v
              ? "ArrowDown"
              : "ArrowUp";
        await p.keyboard.down(key);
        await step(50);
        await p.keyboard.up(key);
      }
      await step(100);
    }
    const action = () => p.locator("#action").click();
    assert(await p.locator("#welcome").isVisible());
    assert(!(await p.locator("#game").isVisible()));
    await p.locator("#name").fill("Nori");
    await p.locator('[data-avatar="3"]').click();
    await p.locator("#solo").click();
    await step(100);
    assert.equal((await state()).phase, "playing");
    assert.equal(await p.locator(".order").count(), 2);
    await p.keyboard.down("ArrowRight");
    await step(100);
    await p.evaluate(() => window.dispatchEvent(new Event("blur")));
    await step(100);
    assert.deepEqual((await state()).players[0].input, { x: 0, y: 0 });
    await p.keyboard.up("ArrowRight");
    await p.evaluate(() => window.dispatchEvent(new Event("orientationchange")));
    await step(100);
    assert.deepEqual((await state()).players[0].input, { x: 0, y: 0 });
    await axis("y", 175);
    await axis("x", 280);
    await action();
    assert.equal((await state()).players[0].held, "carrot");
    assert.match(await p.locator("#holding").textContent(), /carrot/);
    await axis("x", 460);
    await action();
    assert((await state()).prep);
    await step(3100);
    await action();
    assert.equal((await state()).players[0].held, "chopped-carrot");
    await axis("x", 690);
    await action();
    await step(5100);
    await action();
    assert.equal((await state()).players[0].held, "soup-carrot");
    await axis("y", 465);
    await action();
    assert.equal((await state()).score, 100);
    assert.equal((await state()).served, 1);
    assert.equal(await p.locator("#score").textContent(), "100");
    for (const id of ["clock", "score", "leave", "joystick", "action"]) {
      const r = await p.locator("#" + id).boundingBox();
      assert(
        r &&
          r.y >= 0 &&
          r.y + r.height <= 390 &&
          r.x >= 0 &&
          r.x + r.width <= 844,
        `${id} clipped: ${JSON.stringify(r)}`,
      );
    }
    await p.clock.fastForward(91000);
    assert(await p.locator("#results").isVisible());
    assert.match(await p.locator("#totals").textContent(), /1 served/);
    await p.locator("#replay").click();
    await step(100);
    assert.equal((await state()).phase, "playing");
    assert.equal((await state()).players[0].name, "Nori");
    assert.equal((await state()).players[0].avatar, 3);
    assert.equal((await state()).players[0].held, null);
    assert.equal((await state()).players[0].x, 250);
    for (let i = 0; i < 3; i++) {
      await p.locator("#leave").click();
      assert(await p.locator("#welcome").isVisible());
      await p.locator("#solo").click();
      await step(100);
      assert.equal((await state()).score, 0);
    }
    for (let i = 0; i < 8; i++) {
      const beforeTicks = await p.evaluate(() => window.testTickCount);
      await p.locator("#leave").click();
      assert(await p.locator("#welcome").isVisible());
      await p.locator("#solo").click();
      await step(250);
      const runningTicks =
        (await p.evaluate(() => window.testTickCount)) - beforeTicks;
      assert(runningTicks >= 2 && runningTicks <= 8, `unexpected tick count: ${runningTicks}`);
      await p.locator("#leave").click();
      const stoppedTicks = await p.evaluate(() => window.testTickCount);
      await step(1000);
      assert.equal(await p.evaluate(() => window.testTickCount), stoppedTicks);
      if (i < 7) {
        await p.locator("#solo").click();
        await step(50);
      }
    }
    await p.locator("#solo").click();
    await step(100);
    await axis("y", 175);
    const cd = await c.newCDPSession(p),
      r = await p.locator("#joystick").boundingBox(),
      a = await p.locator("#action").boundingBox();
    const t = { x: r.x + r.width / 2 + 10, y: r.y + r.height / 2, id: 1 };
    const before = (await state()).players[0].x;
    await cd.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [t],
    });
    await step(100);
    await cd.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [t, { x: a.x + a.width / 2, y: a.y + a.height / 2, id: 2 }],
    });
    await step(300);
    await cd.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await step(150);
    const after = (await state()).players[0];
    assert.equal(after.held, "carrot");
    assert(after.x > before && after.x - before < 60);
    assert.deepEqual(after.input, { x: 0, y: 0 });
    await p.locator("#leave").click();
    await p.locator("#mp-join").click();
    await p.locator("#mp-advanced").click();
    await p.locator("#mp-offer").fill("bad-json");
    await p.locator("#mp-import").click();
    assert.match(await p.locator("#mp-status").textContent(), /Pairing failed/);
    await p.locator("#mp-cancel").click();
    await p.locator("#solo").click();
    assert(await p.locator("#play").isVisible());
    assert.deepEqual(errors, []);
    console.log(
      "PASS UI: actual pickup/chop/cook/serve, score, results/replay, eleven Leave/restarts, tick cleanup, 844x390 bounds, simultaneous thumbstick/action, analog/release, malformed pairing/cancel/solo; zero page errors",
    );
    await c.close();
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
