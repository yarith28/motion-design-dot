const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  os = require("node:os"),
  http = require("node:http");
const { launchBrowser } = require("./browser-launch.cjs");
(async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "kitchen-pwa-"));
  fs.cpSync(path.resolve(__dirname, ".."), path.join(root, "kitchen-cats"), {
    recursive: true,
  });
  const sw = path.join(root, "kitchen-cats/sw.js");
  const swSource = fs.readFileSync(sw, "utf8");
  const expectedPrecacheCount = (
    swSource.match(/^\s+"\.\/[^"]*",?\s*$/gm) || []
  ).length;
  let pauseAsset = null;
  let resolvePaused;
  let releasePaused;
  const paused = new Promise((resolve) => (resolvePaused = resolve));
  const server = http.createServer(async (req, res) => {
    const file = path.join(
      root,
      decodeURIComponent(new URL(req.url, "http://local").pathname),
    );
    let p = file;
    if (p.endsWith("/")) p += "index.html";
    if (!p.startsWith(root) || !fs.existsSync(p)) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.setHeader(
      "Content-Type",
      {
        ".js": "text/javascript",
        ".css": "text/css",
        ".html": "text/html",
        ".json": "application/json",
        ".png": "image/png",
      }[path.extname(p)] || "text/plain",
    );
    if (pauseAsset && p.endsWith(pauseAsset)) {
      resolvePaused();
      await new Promise((resolve) => (releasePaused = resolve));
    }
    res.end(fs.readFileSync(p));
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}/kitchen-cats/`;
  const b = await launchBrowser();
  try {
    // Interrupt a brand-new install while one precache response is in flight.
    // Closing the page is the closest portable browser-level approximation to
    // an interrupted first download; the follow-up install must still be
    // complete and usable offline.
    pauseAsset = "assets/icon-512.png";
    const interrupted = await b.newContext();
    const interruptedPage = await interrupted.newPage();
    const interruptedNavigation = interruptedPage.goto(base).catch(() => {});
    assert(
      await Promise.race([
        paused.then(() => true),
        new Promise((resolve) => setTimeout(() => resolve(false), 5000)),
      ]),
      "first install did not reach the interrupted asset",
    );
    await interrupted.close();
    pauseAsset = null;
    releasePaused?.();
    await interruptedNavigation;

    const recovered = await b.newContext();
    const recoveredPage = await recovered.newPage();
    await recoveredPage.goto(base);
    await recoveredPage.waitForFunction(
      () => document.querySelector("#connection").textContent === "Offline ready",
    );
    await recovered.setOffline(true);
    await recoveredPage.reload();
    assert(await recoveredPage.locator("#solo").isVisible());
    await recovered.close();

    const c = await b.newContext();
    let p = await c.newPage();
    await p.goto(base);
    await p.waitForFunction(
      () =>
        document.querySelector("#connection").textContent === "Offline ready",
    );
    assert.equal(
      await p.evaluate(
        async () =>
          (await (await caches.open((await caches.keys())[0])).keys()).length,
      ),
      expectedPrecacheCount,
    );
    await p.evaluate(() => caches.open("arcade-sentinel"));
    const registrationScope = await p.evaluate(
      async () => (await navigator.serviceWorker.getRegistration()).scope,
    );
    assert.equal(registrationScope, base);
    assert.equal(
      await p.evaluate(
        async () =>
          !!(await navigator.serviceWorker.getRegistration("/mini-games/")),
      ),
      false,
    );
    await c.setOffline(true);
    await p.reload();
    await p.locator("#solo").click();
    assert(await p.locator("#play").isVisible());
    await p.close();
    p = await c.newPage();
    await p.goto(base);
    assert(await p.locator("#solo").isVisible(), "offline cold reopen lost the app shell");
    await c.setOffline(false);
    await p.locator("#solo").click();
    assert(await p.locator("#play").isVisible(), "offline cold reopen could not start a shift");
    fs.writeFileSync(
      sw,
      swSource.replace(
        /const VERSION = "[^"]+";/,
        'const VERSION = "kitchen-cats-test-update";',
      ),
    );
    await p.evaluate(async () => {
      await (await navigator.serviceWorker.getRegistration()).update();
    });
    await p.waitForFunction(
      async () => !!(await navigator.serviceWorker.getRegistration()).waiting,
    );
    await p.waitForFunction(() =>
      document
        .querySelector("#connection")
        .textContent.includes("Update downloaded"),
    );
    assert(await p.locator("#play").isVisible(), "update during active shift tore down play");
    await p.goto("about:blank");
    await p.waitForTimeout(300);
    await p.goto(base);
    await p.waitForFunction(
      () =>
        document.querySelector("#connection").textContent === "Offline ready",
    );
    const keys = await p.evaluate(() => caches.keys());
    assert.deepEqual(keys.sort(), [
      "arcade-sentinel",
      "kitchen-cats-test-update-precache",
    ]);
    await c.setOffline(true);
    await p.reload();
    assert(await p.locator("#solo").isVisible());
    await c.setOffline(false);
    fs.unlinkSync(path.join(root, "kitchen-cats/assets/icon-512.png"));
    fs.writeFileSync(
      sw,
      fs.readFileSync(sw, "utf8").replace("test-update", "test-failed-update"),
    );
    await p.evaluate(async () => {
      await (await navigator.serviceWorker.getRegistration()).update();
    });
    await p.waitForFunction(() =>
      document
        .querySelector("#connection")
        .textContent.includes("update failed"),
    );
    assert.deepEqual(
      (await p.evaluate(() => caches.keys())).sort(),
      keys.sort(),
    );
    await c.setOffline(true);
    await p.reload();
    assert(await p.locator("#solo").isVisible());
    await c.close();
    const bad = await b.newContext();
    p = await bad.newPage();
    await p.goto(base);
    await p.waitForFunction(() =>
      document
        .querySelector("#connection")
        .textContent.includes("Offline setup failed"),
    );
    assert.equal(
      await p.evaluate(() => !!navigator.serviceWorker.controller),
      false,
    );
    assert.deepEqual(await p.evaluate(() => caches.keys()), []);
    assert(
      !(await p
        .locator(".localnote")
        .textContent()
        .then((t) => /^Offline ready/.test(t.trim()))),
    );
    await bad.close();
    console.log(
      "PASS PWA: interrupted first-install recovery, complete precache, warm/cold offline launch, active-shift update, scope/cache isolation, failed update preserves old version, failed download reporting/no partial cache",
    );
  } finally {
    await b.close();
    server.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
