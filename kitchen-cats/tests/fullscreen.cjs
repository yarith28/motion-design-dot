const assert = require("node:assert/strict");
const { launchBrowser } = require("./browser-launch.cjs");
const base = process.env.BASE_URL || "http://127.0.0.1:8000/kitchen-cats/";

(async () => {
  const browser = await launchBrowser();
  try {
    const context = await browser.newContext({ viewport: { width: 667, height: 375 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await page.locator("#solo").click();
    await page.locator("#fullscreen").click();
    await page.waitForFunction(() => document.fullscreenElement?.id === "game");
    assert.equal(await page.locator("#fullscreen").getAttribute("aria-pressed"), "true");

    // Errors must stay visible over the fullscreen top layer.
    await page.locator("#action").click();
    assert.match(await page.locator("#toast").textContent(), /Walk closer/);
    assert(await page.locator("#toast").isVisible());
    assert.equal(await page.locator("#toast").evaluate((el) => el.parentElement.id), "game");

    const joystick = await page.locator("#joystick").boundingBox();
    await page.mouse.move(joystick.x + joystick.width * .75, joystick.y + joystick.height / 2);
    await page.mouse.down();
    assert.notEqual(await page.locator("#stick-knob").evaluate((el) => el.style.transform), "translate(0,0)");
    await page.locator("#joystick").dispatchEvent("pointercancel", { pointerId: 1 });
    assert.equal(await page.locator("#stick-knob").evaluate((el) => el.style.transform), "translate(0px, 0px)");
    await page.mouse.up();

    for (const viewport of [{ width: 844, height: 390 }, { width: 390, height: 844 }, { width: 568, height: 320 }]) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(90);
      const bounds = await page.locator("#kitchen").boundingBox();
      const intrinsic = await page.locator("#kitchen").evaluate((el) => [el.width, el.height]);
      assert(Math.abs(bounds.width - viewport.width) < 2);
      assert(Math.abs(bounds.height - viewport.height) < 2);
      assert(Math.abs(intrinsic[0] / intrinsic[1] - bounds.width / bounds.height) < .01,
        "resizing stretched the room canvas");
      assert(await page.evaluate(() => document.documentElement.scrollHeight <= document.documentElement.clientHeight + 1 && window.scrollY === 0),
        "fullscreen shift became scrollable");
    }

    await page.locator("#fullscreen").click();
    await page.waitForFunction(() => !document.fullscreenElement);
    assert.equal(await page.locator("#toast").evaluate((el) => el.parentElement.tagName), "BODY");
    await page.setViewportSize({ width: 667, height: 375 });
    await page.locator("#fullscreen").click();
    await page.evaluate(() => {
      const now = Date.now();
      Date.now = () => now + 91000;
    });
    await page.locator("#results").waitFor({ state: "visible" });
    const replayBounds = await page.locator("#replay").boundingBox();
    assert(replayBounds.y >= 0 && replayBounds.y + replayBounds.height <= 375,
      "fullscreen results clipped the replay action");
    assert(await page.evaluate(() => document.documentElement.scrollHeight <= document.documentElement.clientHeight + 1 && window.scrollY === 0),
      "fullscreen results became scrollable");
    await page.locator("#replay").click();
    await page.locator("#play").waitFor({ state: "visible" });
    await page.locator("#leave").click();
    await page.waitForFunction(() => !document.fullscreenElement);
    assert(await page.locator("#welcome").isVisible());
    assert.deepEqual(errors, []);
    await context.close();
    console.log("PASS fullscreen: enter/exit, visible alerts, pointercancel, resize/orientation, results/replay, leave cleanup");
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
