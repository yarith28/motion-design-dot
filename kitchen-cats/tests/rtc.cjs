const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { launchBrowser } = require("./browser-launch.cjs");
const base = process.env.BASE_URL || "http://127.0.0.1:8000/kitchen-cats/";

async function transferQr(from, to, complete) {
  const seen = new Set();
  const deadline = Date.now() + 90000;
  while (Date.now() < deadline) {
    const image = await from.locator("#mp-qr").screenshot();
    const key = crypto.createHash("sha256").update(image).digest("hex");
    if (!seen.has(key)) {
      seen.add(key);
      await to.locator("#mp-image").setInputFiles({
        name: "kitchen-cats-pairing.png",
        mimeType: "image/png",
        buffer: image,
      });
      if (await complete()) return seen.size;
    }
    await from.waitForTimeout(120);
  }
  const [sourceProgress, sourceStep, targetStatus, targetStep, targetScanStatus, targetFrameProgress, targetAnswerLength, targetOfferLength] = await Promise.all([
    from.locator("#mp-qr-progress").textContent(),
    from.locator("#mp-step").textContent(),
    to.locator("#mp-status").textContent(),
    to.locator("#mp-step").textContent(),
    to.locator("#mp-scan-status").textContent(),
    to.locator("#mp-qr-progress").textContent(),
    to.locator("#mp-answer").inputValue().then((value) => value.length),
    to.locator("#mp-offer").inputValue().then((value) => value.length),
  ]);
  throw Error(
    `QR transfer timed out after ${seen.size} frames; ` +
      `sourceStep=${JSON.stringify(sourceStep)}, source=${JSON.stringify(sourceProgress)}, ` +
      `targetStep=${JSON.stringify(targetStep)}, status=${JSON.stringify(targetStatus)}, ` +
      `scan=${JSON.stringify(targetScanStatus)}, targetProgress=${JSON.stringify(targetFrameProgress)}, ` +
      `targetOfferLength=${targetOfferLength}, targetAnswerLength=${targetAnswerLength}`,
  );
}
(async () => {
  const b = await launchBrowser();
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
        /No ICE candidates|timed out|unavailable/,
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
      const offerFrames = await transferQr(
        h,
        g,
        async () => await g.locator("#mp-answer").inputValue(),
      );
      assert(
        await g.locator("#mp-answer").inputValue(),
        "Guest could not gather candidates",
      );
      const answerFrames = await transferQr(
        g,
        h,
        async () => (await h.locator("#mp-status").innerText()).includes("Connecting"),
      );
      assert(offerFrames >= 1);
      assert(answerFrames >= 1);
      await g.locator("#lobby").waitFor({ state: "visible" });
      await h.locator("#start").click();
      await g.locator("#play").waitFor({ state: "visible" });
      await g.keyboard.down("ArrowUp");
      await g.waitForTimeout(500);
      await g.keyboard.up("ArrowUp");
      await h.locator("#leave").click();
      await g.locator("#welcome").waitFor({ state: "visible" });
      console.log(
        "PASS real local WebRTC + QR image pairing: two browser contexts paired, guest reply scanned from animated QR, started, guest input, host leave. Physical phones remain untested.",
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
