// Browser integration with a simulated transport. This does NOT prove WebRTC connectivity.
const assert = require("node:assert/strict");
const { launchBrowser } = require("./browser-launch.cjs");
const base = process.env.BASE_URL || "http://127.0.0.1:8000/kitchen-cats/";
async function bridge(page) {
  await page.evaluate(async () => {
    const { WebRTCTransport: T } = await import("./webrtc-transport.js");
    const { KitchenGame: G } = await import("./game-core.js");
    const snapshot = G.prototype.snapshot;
    G.prototype.snapshot = function () {
      const s = snapshot.call(this);
      window.testSnapshot = s;
      return s;
    };
    function init(t) {
      if (t.bus) return;
      t.bus = new BroadcastChannel("kitchen-test-wire");
      t.bus.onmessage = ({ data: m }) => {
        if (m.to !== t.role) return;
        if (m.kind === "connected") {
          t.peers.set(m.id, { dc: { readyState: "open" } });
          t.onStatus(m.id, "connected");
        }
        if (m.kind === "data") t.onMessage(m.id, m.msg);
        if (m.kind === "close") {
          t.peers.delete(m.id);
          t.onStatus(m.id, "closed");
        }
      };
    }
    T.prototype.createOffer = async function (id, sessionId) {
      this.role = "host";
      init(this);
      return JSON.stringify({ id, sessionId });
    };
    T.prototype.acceptOffer = async function (s) {
      this.role = "guest";
      init(this);
      const data = JSON.parse(s);
      this.id = data.id;
      return JSON.stringify(data);
    };
    T.prototype.acceptAnswer = async function (s) {
      const { id } = JSON.parse(s);
      this.bus.postMessage({ to: "guest", kind: "connected", id });
      this.peers.set(id, { dc: { readyState: "open" } });
      this.onStatus(id, "connected");
    };
    T.prototype.send = function (id, msg) {
      this.bus.postMessage({
        to: this.role === "host" ? "guest" : "host",
        kind: "data",
        id,
        msg,
      });
      return true;
    };
    T.prototype.closePeer = function (id) {
      if (!this.peers.has(id)) return;
      this.peers.delete(id);
      this.bus.postMessage({
        to: this.role === "host" ? "guest" : "host",
        kind: "close",
        id,
      });
      this.onStatus(id, "closed");
    };
  });
}
(async () => {
  const b = await launchBrowser();
  try {
    const c = await b.newContext();
    const h = await c.newPage(),
      g = await c.newPage();
    const errors = [];
    for (const p of [h, g]) {
      p.on("pageerror", (e) => errors.push(e.message));
      await p.goto(base);
      await bridge(p);
    }
    await g.locator("#name").fill("Guest Cat");
    await g.locator('[data-avatar="2"]').click();
    async function pair() {
      await h.locator("#mp-host").click();
      await g.locator("#mp-join").click();
      await g
        .locator("#mp-offer")
        .fill(await h.locator("#mp-offer").inputValue());
      await g.locator("#mp-import").click();
      await g.evaluate(() => {
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: {
            writeText: async (t) => {
              window.copied = t;
            },
          },
        });
      });
      await g.locator("#mp-copy").click();
      assert.equal(
        await g.evaluate(() => window.copied),
        await g.locator("#mp-answer").inputValue(),
      );
      await h
        .locator("#mp-answer")
        .fill(await g.locator("#mp-answer").inputValue());
      await h.locator("#mp-import").click();
      await g.locator("#lobby").waitFor({ state: "visible" });
      assert.equal(await g.locator(".crewcat").count(), 2);
      assert.equal(await h.locator(".crewcat").count(), 2);
    }
    await pair();
    await h.locator("#start").click();
    await g.locator("#play").waitFor({ state: "visible" });
    const state = () => h.evaluate(() => window.testSnapshot);
    const gp = async () => (await state()).players.find((p) => p.id !== "host");
    async function axis(axis, target) {
      for (let i = 0; i < 150; i++) {
        const v = (await gp())[axis];
        if (Math.abs(v - target) < 12) break;
        const key =
          axis === "x"
            ? target > v
              ? "ArrowRight"
              : "ArrowLeft"
            : target > v
              ? "ArrowDown"
              : "ArrowUp";
        await g.keyboard.down(key);
        await g.waitForTimeout(50);
        await g.keyboard.up(key);
      }
      await g.waitForTimeout(100);
    }
    const act = async () => {
      await g.locator("#action").click();
      await g.waitForTimeout(100);
    };
    await axis("y", 175);
    await axis("x", 280);
    await act();
    assert.equal((await gp()).held, "carrot");
    await axis("x", 460);
    await act();
    await g.waitForTimeout(3100);
    await act();
    assert.equal((await gp()).held, "chopped-carrot");
    await axis("x", 690);
    await act();
    await g.waitForTimeout(5100);
    await act();
    await axis("y", 465);
    await act();
    assert.equal((await state()).score, 100);
    assert.equal(await g.locator("#score").textContent(), "100");
    assert.match(await g.locator("#holding").textContent(), /Empty paws/);
    await h.evaluate(() => {
      const old = Date.now;
      Date.now = () => old() + 91000;
    });
    await g.locator("#results").waitFor({ state: "visible" });
    assert(await g.locator("#replay").isDisabled());
    await h.locator("#replay").click();
    await g.locator("#play").waitFor({ state: "visible" });
    assert.equal((await gp()).name, "Guest Cat");
    assert.equal((await gp()).avatar, 2);
    assert.equal((await gp()).x, 305);
    await g.locator("#leave").click();
    await h.waitForFunction(() => window.testSnapshot.players.length === 1);
    await h.locator("#leave").click();
    await pair();
    await h.locator("#start").click();
    await g.locator("#play").waitFor({ state: "visible" });
    await h.locator("#leave").click();
    await g.locator("#welcome").waitFor({ state: "visible" });
    await g.locator("#solo").click();
    assert(await g.locator("#play").isVisible());
    assert.deepEqual(errors, []);
    console.log(
      "PASS simulated-transport browser UI: role-specific copy, two chefs, guest cooking/score, results, host replay, guest leave, re-pair, host disconnect, solo recovery. NOT real WebRTC evidence.",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
