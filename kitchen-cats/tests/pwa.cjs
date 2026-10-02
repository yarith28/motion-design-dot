const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  os = require("node:os"),
  http = require("node:http");
const { chromium } = require("playwright");
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
  const server = http.createServer((req, res) => {
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
    res.end(fs.readFileSync(p));
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}/kitchen-cats/`;
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
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
    await c.setOffline(false);
    await p.locator("#leave").click();
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
      "PASS PWA: complete precache, offline launch, waiting update/status, activation/reopen offline, scope/cache isolation, failed update preserves old offline version, failed download reporting/no partial cache",
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
