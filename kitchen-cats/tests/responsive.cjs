const assert = require("node:assert/strict");
const { launchBrowser } = require("./browser-launch.cjs");

const base = process.env.BASE_URL || "http://127.0.0.1:8000/kitchen-cats/";
const landscapes = [
  { width: 667, height: 375 },
  { width: 812, height: 375 },
];
const targets = ["joystick", "action", "mute", "motion", "leave"];

async function assertVisibleAndContained(page, label) {
  const viewport = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    height: document.documentElement.clientHeight,
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
  }));
  assert(
    viewport.scrollWidth <= viewport.width + 1,
    `${label}: horizontal overflow ${JSON.stringify(viewport)}`,
  );
  for (const id of targets) {
    const control = page.locator(`#${id}`);
    assert(await control.isVisible(), `${label}: #${id} is not visible`);
    const box = await control.boundingBox();
    assert(box, `${label}: #${id} has no box`);
    assert(box.width >= 44 && box.height >= 44, `${label}: #${id} is too small: ${JSON.stringify(box)}`);
    assert(box.x >= 0 && box.y >= 0, `${label}: #${id} starts outside viewport: ${JSON.stringify(box)}`);
    assert(
      box.x + box.width <= viewport.width + 1 &&
        box.y + box.height <= viewport.height + 1,
      `${label}: #${id} is clipped: ${JSON.stringify(box)} viewport=${JSON.stringify(viewport)}`,
    );
  }
  const canvas = await page.locator("#kitchen").boundingBox();
  assert(canvas, `${label}: kitchen canvas has no box`);
  assert(canvas.width > 0 && canvas.height > 0, `${label}: kitchen canvas is empty`);
  assert(canvas.x >= 0 && canvas.y >= 0, `${label}: canvas starts outside viewport`);
  assert(
    canvas.x + canvas.width <= viewport.width + 1 &&
      canvas.y + canvas.height <= viewport.height + 1,
    `${label}: canvas is clipped: ${JSON.stringify(canvas)} viewport=${JSON.stringify(viewport)}`,
  );
}

(async () => {
  const b = await launchBrowser();
  try {
    for (const landscape of landscapes) {
      const c = await b.newContext({
        viewport: landscape,
        isMobile: true,
        hasTouch: true,
      });
      const p = await c.newPage();
      const errors = [];
      p.on("pageerror", (e) => errors.push(e.message));
      await p.goto(base, { waitUntil: "domcontentloaded" });
      await p.locator("#solo").click();
      await p.locator("#play").waitFor({ state: "visible" });
      assert.equal(await p.locator("#joystick").getAttribute("role"), "group");
      assert.equal(await p.locator("#joystick").getAttribute("aria-label"), "Analog movement stick");
      assert.match(await p.locator("#kitchen").getAttribute("aria-label"), /Move with arrows/);
      assert.match(await p.locator("#action").getAttribute("aria-label"), /Interact/);
      await assertVisibleAndContained(p, `${landscape.width}x${landscape.height}`);

      await p.evaluate(() => {
        const base = document.querySelector("#joystick");
        const box = base.getBoundingClientRect();
        base.dispatchEvent(
          new PointerEvent("pointerdown", {
            bubbles: true,
            pointerId: 41,
            pointerType: "touch",
            clientX: box.right - 4,
            clientY: box.top + box.height / 2,
          }),
        );
      });
      await p.evaluate(() => window.dispatchEvent(new Event("orientationchange")));
      assert.equal(await p.locator("#stick-knob").evaluate((el) => el.style.transform), "translate(0,0)");

      const portrait = { width: landscape.height, height: landscape.width };
      await p.setViewportSize(portrait);
      await p.waitForTimeout(50);
      await assertVisibleAndContained(p, `${portrait.width}x${portrait.height} portrait return`);

      await p.setViewportSize(landscape);
      await p.evaluate(() => window.dispatchEvent(new Event("orientationchange")));
      await p.waitForTimeout(50);
      await assertVisibleAndContained(p, `${landscape.width}x${landscape.height} return`);
      await p.locator("#leave").click();
      assert(await p.locator("#welcome").isVisible());
      assert.deepEqual(errors, []);
      await c.close();
    }
    console.log(
      "PASS responsive/accessibility: 667x375 and 812x375 landscape, portrait return, zero overflow, visible 44px touch targets, safe control reset, labeled canvas/controls",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
