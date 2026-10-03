const assert = require("node:assert/strict");
const { launchBrowser } = require("./browser-launch.cjs");

const base = process.env.BASE_URL || "http://127.0.0.1:8000/kitchen-cats/";
const sizes = [[568, 320], [667, 375], [844, 390], [390, 844], [1440, 900]];
const offer = JSON.stringify({
  version: 1,
  peerId: "peer-viewport-1234",
  sessionId: "session-viewport-5678",
  description: {
    type: "offer",
    sdp: [
      "v=0", "o=- 1 2 IN IP4 127.0.0.1", "s=-", "t=0 0",
      "m=application 9 UDP/DTLS/SCTP webrtc-datachannel",
      ...Array.from({ length: 10 }, (_, n) =>
        `a=candidate:${n + 1} 1 udp 2122260223 192.168.1.${20 + n} ${5000 + n} typ host generation 0`),
    ].join("\r\n"),
  },
});

async function fit(page, label, selectors) {
  const metrics = await page.evaluate((items) => {
    const root = document.documentElement;
    return {
      width: root.clientWidth,
      height: root.clientHeight,
      scrollWidth: root.scrollWidth,
      scrollHeight: root.scrollHeight,
      scrollY: window.scrollY,
      boxes: items.map((selector) => {
        const element = document.querySelector(selector);
        const box = element?.getBoundingClientRect();
        const style = element && getComputedStyle(element);
        return {
          selector,
          visible: !!box && box.width > 0 && box.height > 0 &&
            style.display !== "none" && style.visibility !== "hidden",
          x: box?.x, y: box?.y, width: box?.width, height: box?.height,
        };
      }),
    };
  }, selectors);
  assert(metrics.scrollWidth <= metrics.width + 1, `${label}: horizontal document scroll ${JSON.stringify(metrics)}`);
  assert(metrics.scrollHeight <= metrics.height + 1, `${label}: vertical document scroll ${JSON.stringify(metrics)}`);
  assert.equal(metrics.scrollY, 0, `${label}: page moved`);
  for (const box of metrics.boxes) {
    assert(box.visible, `${label}: ${box.selector} is not visible`);
    assert(box.x >= -1 && box.y >= -1 && box.x + box.width <= metrics.width + 1 &&
      box.y + box.height <= metrics.height + 1,
    `${label}: ${box.selector} is outside the viewport: ${JSON.stringify(box)}`);
    if (box.selector.includes("summary") || new Set([
      "#solo", "#home-host", "#home-join", ".help-link", "#name", ".avatar-option",
      "#mp-start", "#mp-cancel", "#mp-retry", "#mp-scan", "#mp-stop-scan", "#mp-image-pick",
      "#mp-copy", "#mp-import", "#replay", "#leave", "#action", "#joystick",
      "#start", "#add-player", "#close-help",
    ]).has(box.selector))
      assert(box.width >= 44 && box.height >= 44,
        `${label}: ${box.selector} has a small touch target: ${JSON.stringify(box)}`);
  }
  return metrics;
}

async function mockPairing(page) {
  await page.evaluate(async (mockOffer) => {
    const { WebRTCTransport } = await import("./webrtc-transport.js");
    const { QrCameraScanner } = await import("./qr-pairing.js");
    window.viewportPeerIds = [];
    WebRTCTransport.prototype.createOffer = async function (peerId, sessionId) {
      window.viewportTransport = this;
      window.viewportPeerIds.push(peerId);
      return JSON.stringify({ ...JSON.parse(mockOffer), peerId, sessionId });
    };
    WebRTCTransport.prototype.acceptOffer = async () => JSON.stringify({
      ...JSON.parse(mockOffer),
      description: { type: "answer", sdp: "v=0\r\na=candidate:answer" },
    });
    WebRTCTransport.prototype.send = () => true;
    QrCameraScanner.prototype.start = async function () { this.video.hidden = false; };
    QrCameraScanner.prototype.stop = function () { this.video.hidden = true; };
  }, offer);
}

async function swipeAndStay(page, label) {
  if (process.env.BROWSER_ENGINE === "webkit") return;
  const client = await page.context().newCDPSession(page);
  const { width, height } = page.viewportSize();
  const x = Math.round(width * .5);
  const y = Math.round(height * .72);
  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y, id: 1 }] });
  await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: Math.round(height * .25), id: 1 }] });
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  assert.equal(await page.evaluate(() => window.scrollY), 0, `${label}: finger swipe moved the page`);
  await client.detach();
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
      const label = `${width}x${height}`;

      await fit(page, `${label} Home`, ["#welcome", "#solo", "#home-host", "#home-join", ".help-link", "#name", ".avatar-option", "#home-connection"]);
      if (width < 900) await swipeAndStay(page, `${label} Home`);
      await page.locator(".help-link").click();
      await fit(page, `${label} Help`, ["#how", "#how summary", "#close-help", ".how-steps", ".localnote"]);
      if (width < 900) await swipeAndStay(page, `${label} Help`);
      await page.locator("#close-help").click();
      assert.equal(await page.evaluate(() => document.activeElement?.className), "help-link");
      await fit(page, `${label} Home after Help`, ["#solo", "#home-host", "#home-join"]);

      await page.evaluate(async () => {
        const { WebRTCTransport } = await import("./webrtc-transport.js");
        WebRTCTransport.prototype.createOffer = async () => { throw Error("No ICE candidates gathered"); };
      });
      await page.locator("#home-host").click();
      await page.waitForFunction(() => document.querySelector("#mp-status").textContent.includes("failed"));
      await fit(page, `${label} Host setup failure`, ["#experimental-mp", "#mp-retry", "#mp-start", "#mp-cancel", "#mp-status"]);
      assert(!(await page.locator("#mp-flow").isVisible()), `${label}: failed setup showed the offer flow`);

      await mockPairing(page);
      await page.locator("#mp-retry").click();
      await page.locator("#mp-qr").waitFor({ state: "visible" });
      assert(!(await page.locator("#mp-retry").isVisible()), `${label}: Retry remained visible after success`);
      await fit(page, `${label} Host QR`, ["#experimental-mp", "#mp-qr", "#mp-scan", "#mp-image-pick", "#mp-start", "#mp-cancel", "#mp-status"]);
      if (width < 900) await swipeAndStay(page, `${label} Host QR`);
      await page.locator(".pair-help summary").click();
      await fit(page, `${label} Pairing help`, [".pair-help summary", "#mp-intro"]);
      await page.locator(".pair-help summary").click();
      const qr = await page.locator("#mp-qr").boundingBox();
      assert(qr.width >= 170 && qr.height >= 170, `${label}: Host QR too small to scan`);
      await page.locator("#mp-scan").click();
      await fit(page, `${label} Host camera`, ["#mp-video", "#mp-scan", "#mp-stop-scan", "#mp-cancel", "#mp-status"]);
      assert(!(await page.locator("#mp-qr-view").isVisible()), `${label}: QR still occupies the camera step`);
      await page.locator("#mp-stop-scan").click();
      await page.locator("#mp-advanced summary").click();
      await fit(page, `${label} Host manual`, ["#mp-offer", "#mp-answer", "#mp-copy", "#mp-import", "#mp-cancel"]);
      await page.locator("#mp-answer").focus();
      assert.equal(await page.evaluate(() => window.scrollY), 0, `${label}: manual field focus moved the page`);
      await page.locator("#mp-advanced summary").click();
      const firstSessionId = JSON.parse(await page.locator("#mp-offer").inputValue()).sessionId;
      await page.evaluate(() => window.viewportTransport.onStatus(window.viewportPeerIds.at(-1), "connected"));
      await page.locator("#lobby").waitFor({ state: "visible" });
      await fit(page, `${label} paired lobby`, ["#game", "#lobby", "#crew", "#add-player", "#start", "#leave"]);
      assert.equal(await page.locator(".crewcat").count(), 2);
      await page.locator("#add-player").click();
      await page.locator("#mp-qr").waitFor({ state: "visible" });
      await fit(page, `${label} Add player QR`, ["#experimental-mp", "#mp-qr", "#mp-scan", "#mp-start", "#mp-cancel"]);
      assert.equal(JSON.parse(await page.locator("#mp-offer").inputValue()).sessionId, firstSessionId,
        `${label}: Add player replaced the host session`);
      await page.locator("#mp-cancel").click();
      await page.locator("#lobby").waitFor({ state: "visible" });
      assert.equal(await page.locator(".crewcat").count(), 2, `${label}: cancel dropped the connected guest`);
      assert.equal(await page.evaluate(() => document.activeElement?.id), "add-player",
        `${label}: Add player did not regain focus after cancel`);
      await fit(page, `${label} Add cancelled`, ["#lobby", "#crew", "#add-player", "#start"]);

      for (const expectedCrew of [3, 4]) {
        await page.locator("#add-player").click();
        await page.locator("#mp-qr").waitFor({ state: "visible" });
        assert.equal(JSON.parse(await page.locator("#mp-offer").inputValue()).sessionId, firstSessionId,
          `${label}: new guest replaced the host session`);
        await page.evaluate(() => window.viewportTransport.onStatus(window.viewportPeerIds.at(-1), "connected"));
        await page.locator("#lobby").waitFor({ state: "visible" });
        assert.equal(await page.locator(".crewcat").count(), expectedCrew,
          `${label}: adding another guest lost a connected chef`);
        if (expectedCrew < 4)
          await fit(page, `${label} ${expectedCrew}-chef lobby`, ["#lobby", "#crew", "#add-player", "#start"]);
      }
      assert(!(await page.locator("#add-player").isVisible()), `${label}: full lobby still offers Add player`);
      await fit(page, `${label} full lobby`, ["#lobby", "#crew", "#start", "#leave"]);
      await page.locator("#start").click();
      await page.locator("#play").waitFor({ state: "visible" });
      await fit(page, `${label} playing`, ["#kitchen", "#joystick", "#action", "#leave", "#orders"]);
      if (width < 900) await swipeAndStay(page, `${label} playing`);
      if (width === 667) {
        await page.setViewportSize({ width: 375, height: 667 });
        await fit(page, "375x667 rotated", ["#kitchen", "#joystick", "#action", "#leave"]);
        await page.setViewportSize({ width, height });
        await fit(page, `${label} rotated back`, ["#kitchen", "#joystick", "#action", "#leave"]);
      }
      await page.locator("#leave").click();
      await fit(page, `${label} returned Home`, ["#welcome", "#solo", "#home-join"]);

      await page.locator("#home-join").click();
      await fit(page, `${label} Join`, ["#experimental-mp", "#mp-scan", "#mp-image-pick", "#mp-cancel", "#mp-status"]);
      if (width < 900) await swipeAndStay(page, `${label} Join`);
      await page.locator("#mp-scan").click();
      await fit(page, `${label} Join camera`, ["#mp-video", "#mp-scan", "#mp-stop-scan", "#mp-cancel"]);
      await page.locator("#mp-stop-scan").click();
      await page.locator("#mp-advanced summary").click();
      await fit(page, `${label} Join manual`, ["#mp-offer", "#mp-answer", "#mp-copy", "#mp-import", "#mp-cancel"]);
      await page.locator("#mp-offer").fill(offer);
      await page.locator("#mp-import").click();
      await page.locator("#mp-qr").waitFor({ state: "visible" });
      await fit(page, `${label} Guest reply`, ["#mp-qr", "#mp-cancel", "#mp-status"]);
      await page.locator("#mp-cancel").click();
      await fit(page, `${label} Cancel`, ["#welcome", "#solo", "#home-host", "#home-join"]);

      await page.locator("#solo").click();
      await page.locator("#play").waitFor({ state: "visible" });
      await page.evaluate(() => {
        const now = Date.now();
        Date.now = () => now + 91000;
      });
      await page.locator("#results").waitFor({ state: "visible", timeout: 10000 });
      await fit(page, `${label} Results`, ["#results", "#results-title", "#totals", "#replay"]);
      if (width < 900) await swipeAndStay(page, `${label} Results`);
      await page.locator("#replay").click();
      await fit(page, `${label} Replay`, ["#kitchen", "#joystick", "#action", "#leave"]);
      assert.deepEqual(errors, [], `${label}: page errors`);
      await context.close();
    }
    const shortContext = await browser.newContext({ viewport: { width: 568, height: 230 } });
    const shortPage = await shortContext.newPage();
    await shortPage.goto(base, { waitUntil: "domcontentloaded" });
    await shortPage.locator("#home-join").focus();
    const short = await shortPage.evaluate(() => ({
      pageHeight: document.documentElement.scrollHeight,
      viewportHeight: document.documentElement.clientHeight,
      pageY: scrollY,
      mainY: document.querySelector("main").scrollTop,
      button: document.querySelector("#home-join").getBoundingClientRect().toJSON(),
    }));
    assert.equal(short.pageHeight, short.viewportHeight, "keyboard-height fallback scrolled the page");
    assert.equal(short.pageY, 0);
    assert(short.mainY > 0 && short.button.y >= 0 && short.button.bottom <= short.viewportHeight,
      `keyboard-height focus could not reveal Join: ${JSON.stringify(short)}`);
    await shortContext.close();
    console.log("PASS viewport: Home, Help, Host retry/QR/camera/manual, Add player/cancel/full lobby, play, Join/reply, results/replay fit landscape, portrait and desktop; page never scrolls; short-height focus pans within Home");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
