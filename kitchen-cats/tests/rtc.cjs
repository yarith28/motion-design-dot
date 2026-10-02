const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const base = process.env.BASE_URL || "http://127.0.0.1:8000/kitchen-cats/";
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const c = await b.newContext();
    const h = await c.newPage();
    await h.goto(base);
    const errs = [];
    h.on("pageerror", (e) => errs.push(e.message));
    await h.evaluate(async () => {
      const { WebRTCTransport } = await import("./webrtc-transport.js");
      const orig = WebRTCTransport.prototype.createPeer;
      WebRTCTransport.prototype.createPeer = function (...a) {
        window.testTransport = this;
        return orig.apply(this, a);
      };
    });
    await h.locator("#mp-host").click();
    await h.waitForFunction(
      () =>
        document.querySelector("#mp-offer").value ||
        document.querySelector("#mp-status").textContent.includes("failed"),
    );
    if (!(await h.locator("#mp-offer").inputValue())) {
      assert.match(
        await h.locator("#mp-status").textContent(),
        /No ICE candidates|timed out/,
      );
      assert.equal(await h.evaluate(() => testTransport.peers.size), 0);
      for (let i = 0; i < 2; i++) {
        await h.locator("#mp-host").click();
        await h.waitForFunction(() =>
          document.querySelector("#mp-status").textContent.includes("failed"),
        );
        assert.equal(await h.evaluate(() => testTransport.peers.size), 0);
      }
      await h.locator("#mp-host").click();
      await h.locator("#mp-cancel").click();
      await h.waitForTimeout(300);
      assert.equal(await h.locator("#mp-status").textContent(), "Cancelled");
      assert.equal(await h.evaluate(() => testTransport.peers.size), 0);
      await h.locator("#solo").click();
      assert(await h.locator("#play").isVisible());
      assert.deepEqual(errs, []);
      console.log(
        "PASS native failure recovery: repeated ICE failure cleanup, pending cancellation, solo recovery. NOT RUN real peer gameplay: browser gathered no usable ICE candidates.",
      );
    } else {
      const gc = await b.newContext(),
        g = await gc.newPage();
      await g.goto(base);
      await g.locator("#mp-join").click();
      await g
        .locator("#mp-offer")
        .fill(await h.locator("#mp-offer").inputValue());
      await g.locator("#mp-import").click();
      await g.waitForFunction(
        () =>
          document.querySelector("#mp-answer").value ||
          document.querySelector("#mp-status").textContent.includes("failed"),
      );
      assert(
        await g.locator("#mp-answer").inputValue(),
        "Guest could not gather candidates",
      );
      await h
        .locator("#mp-answer")
        .fill(await g.locator("#mp-answer").inputValue());
      await h.locator("#mp-import").click();
      await g.locator("#lobby").waitFor({ state: "visible" });
      await h.locator("#start").click();
      await g.locator("#play").waitFor({ state: "visible" });
      await g.keyboard.down("ArrowUp");
      await g.waitForTimeout(500);
      await g.keyboard.up("ArrowUp");
      await h.locator("#leave").click();
      await g.locator("#welcome").waitFor({ state: "visible" });
      console.log(
        "PASS real local WebRTC: two browser contexts paired, started, guest input, host leave. Physical phones remain untested.",
      );
      await gc.close();
    }
    await c.close();
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
