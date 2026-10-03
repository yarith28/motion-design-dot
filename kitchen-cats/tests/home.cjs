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

    await page.locator("#home-host").click();
    assert(await page.locator("#lobby").isVisible(), "Host did not open lobby");
    assert.equal(await page.locator("#mp-host").textContent(), "Offer for another chef");
    assert.equal(await page.evaluate(() => document.activeElement?.id), "experimental-mp");
    await page.locator("#leave").click();
    assert(await page.locator("#welcome").isVisible(), "Leave did not return home");
    assert.equal(await page.evaluate(() => document.activeElement?.id), "solo");
    assert.deepEqual(errors, [], "Home interaction page errors");
    await context.close();
    console.log("PASS home: 568/667/844 landscape, portrait and desktop controls/status fit; rounded skin; avatar keyboard, Help, Join/cancel and Host/leave focus paths");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
