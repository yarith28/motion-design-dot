const assert = require("node:assert/strict");
const { launchBrowser } = require("./browser-launch.cjs");

const base = process.env.BASE_URL || "http://127.0.0.1:8000/kitchen-cats/";
const sizes = [
  [568, 320],
  [667, 375],
  [844, 390],
  [390, 844],
  [1440, 900],
];

async function assertHomeFits(page, width, height) {
  const metrics = await page.evaluate(() => {
    const box = (selector) => {
      const r = document.querySelector(selector).getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    };
    return {
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
      controls: ["#solo", "#home-host", "#home-join", ".help-link", "#name", ".avatar-option"].map(box),
      status: box("#home-connection"),
      skins: ["#solo", "#name", ".intro"].map((selector) =>
        getComputedStyle(document.querySelector(selector)).borderImageSource),
    };
  });
  assert(metrics.scrollWidth <= metrics.viewportWidth + 1, `${width}x${height}: horizontal overflow`);
  for (const box of metrics.controls) {
    assert(box.width >= 44 && box.height >= 44, `${width}x${height}: undersized control ${JSON.stringify(box)}`);
    assert(box.x >= 0 && box.y >= 0 && box.x + box.width <= width + 1 && box.y + box.height <= height + 1,
      `${width}x${height}: control clipped ${JSON.stringify(box)}`);
  }
  const status = metrics.status;
  assert(status.width > 0 && status.height > 0 && status.x >= 0 && status.y >= 0 &&
    status.x + status.width <= width + 1 && status.y + status.height <= height + 1,
  `${width}x${height}: offline status clipped ${JSON.stringify(status)}`);
  assert(metrics.skins.every((value) => value === "none"), `${width}x${height}: old square image skin remains`);
}

(async () => {
  const browser = await launchBrowser();
  try {
    for (const [width, height] of sizes) {
      const context = await browser.newContext({ viewport: { width, height }, isMobile: width < 900, hasTouch: width < 900 });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(base, { waitUntil: "domcontentloaded" });
      await assertHomeFits(page, width, height);
      assert.deepEqual(errors, [], `${width}x${height}: page errors`);
      await context.close();
    }

    const context = await browser.newContext({ viewport: { width: 667, height: 375 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base, { waitUntil: "domcontentloaded" });
    assert.equal(await page.locator("#welcome .home-actions #home-host").count(), 1,
      "Home must offer one Host action");
    assert.equal(await page.locator("#mp-host, #mp-join").count(), 0,
      "Pairing must not repeat the Home Host and Join actions");
    await page.locator(".avatar-option.selected").focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(await page.locator(".avatar-option.selected").getAttribute("data-avatar"), "1");
    assert.equal(await page.evaluate(() => document.activeElement?.dataset.avatar), "1");
    await page.keyboard.press("End");
    assert.equal(await page.locator(".avatar-option.selected").getAttribute("data-avatar"), "3");
    await page.keyboard.press("Home");
    assert.equal(await page.locator(".avatar-option.selected").getAttribute("data-avatar"), "0");
    await page.locator(".help-link").click();
    assert(await page.locator("#how").evaluate((el) => el.open), "Help link did not open optional instructions");

    await page.goto(base, { waitUntil: "domcontentloaded" });
    await page.locator("#home-join").click();
    assert(await page.locator("#mp-flow").isVisible(), "Join did not open pairing");
    assert.equal(await page.evaluate(() => document.activeElement?.id), "experimental-mp");
    assert(await page.locator("#mp-scan").isVisible(), "Join did not offer explicit camera scan");
    await page.locator("#mp-cancel").click();
    assert(await page.locator("#welcome").isVisible(), "Cancel did not return home");
    assert.equal(await page.evaluate(() => document.activeElement?.id), "home-join");

    await page.evaluate(async () => {
      const { WebRTCTransport } = await import("./webrtc-transport.js");
      window.homeOfferAttempts = 0;
      WebRTCTransport.prototype.createOffer = async (peerId, sessionId) => {
        window.homeOfferAttempts++;
        if (window.homeOfferAttempts === 2) throw Error("No ICE candidates gathered");
        return JSON.stringify({
          version: 1, peerId, sessionId,
          description: { type: "offer", sdp: "v=0\r\na=candidate:home-test" },
        });
      };
    });
    await page.locator("#home-host").click();
    await page.locator("#mp-qr").waitFor({ state: "visible" });
    assert(await page.locator("#mp-flow").isVisible(), "Host did not enter the offer step");
    assert(await page.locator("#mp-start").isVisible(), "Host cannot start a shift while offering a code");
    assert(!(await page.locator("#mp-retry").isVisible()), "Retry appeared without an offer failure");
    assert(await page.locator("#mp-offer").inputValue(), "Host did not create an offer");
    assert.equal(await page.evaluate(() => document.activeElement?.id), "experimental-mp");
    await page.locator("#mp-cancel").click();
    assert(await page.locator("#welcome").isVisible(), "Host cancel did not return home");
    assert.equal(await page.evaluate(() => document.activeElement?.id), "home-host");
    await page.locator("#home-host").click();
    await page.waitForFunction(() => document.querySelector("#mp-status").textContent.includes("failed"));
    assert(await page.locator("#mp-retry").isVisible(), "A failed offer needs a retry action");
    assert.equal(await page.evaluate(() => document.activeElement?.id), "mp-retry",
      "A failed offer should focus its recovery action");
    assert(!(await page.locator("#mp-flow").isVisible()), "Failed offer still showed an empty QR step");
    assert(await page.locator("#mp-start").isVisible(), "Failed offer blocked a solo host shift");
    await page.locator("#mp-retry").click();
    await page.locator("#mp-qr").waitFor({ state: "visible" });
    assert(!(await page.locator("#mp-retry").isVisible()), "Retry remained after an offer succeeded");
    assert.equal(await page.evaluate(() => window.homeOfferAttempts), 3);
    await page.locator("#mp-start").click();
    assert(await page.locator("#play").isVisible(), "Host cannot start before a guest joins");
    await page.locator("#leave").click();
    assert(await page.locator("#welcome").isVisible(), "Leave did not return home");
    assert.equal(await page.evaluate(() => document.activeElement?.id), "solo");
    assert.deepEqual(errors, [], "Home interaction page errors");
    await context.close();
    console.log("PASS home: landscape/portrait/desktop controls fit; avatar keyboard and Help; one-step Host offer, failure retry, Join/cancel and Host/leave focus paths");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
