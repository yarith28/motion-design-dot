const { chromium, webkit } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.BASE_URL || 'http://127.0.0.1:8790/';
const engine = process.env.BROWSER_ENGINE || 'chromium';
const evidence = process.env.EVIDENCE_DIR || path.join(__dirname, '..', 'test-results');
fs.mkdirSync(evidence, { recursive: true });
const report = { base, engine, checks: [], errors: [], screenshots: [], startedAt: new Date().toISOString(), clock: 'Playwright browser clock; gameplay through keyboard and native touch only; state hook is read-only' };
const state = p => p.evaluate(() => window.__UNDERCOOKED__.getState());
async function advance(p, ms) { await jump(p, ms); }
async function jump(p, ms) { while (ms > 0) { const step = Math.min(250, ms); await p.clock.fastForward(step); ms -= step; } }
async function snap(p, name) { const file = name + '-' + engine + '.png'; await p.screenshot({ path: path.join(evidence, file) }); report.screenshots.push(file); }
async function open(browser, viewport, mobile = false, reduced = false) {
  const context = await browser.newContext({ viewport, hasTouch: mobile, isMobile: mobile, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const page = await context.newPage();
  page.on('pageerror', e => report.errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()); });
  await page.clock.install({ time: new Date('2026-10-04T08:00:00Z') });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__UNDERCOOKED__);
  await page.clock.pauseAt(new Date('2026-10-04T10:00:00Z'));
  return { page, context };
}
async function keyAxis(p, axis, target) {
  for (let i = 0; i < 15; i++) {
    const current = (await state(p)).player[axis], error = target - current;
    if (Math.abs(error) < 0.07) return;
    const key = axis === 'x' ? error > 0 ? 'KeyD' : 'KeyA' : error > 0 ? 'KeyS' : 'KeyW';
    await p.keyboard.down(key); await advance(p, Math.max(32, Math.min(1400, Math.abs(error) / 3.4 * 1000))); await p.keyboard.up(key);
  }
  throw Error('Navigation blocked: ' + axis + '=' + target + ' at ' + JSON.stringify((await state(p)).player));
}
const spots = { tomato: [-4.5, -1.4], mushroom: [-2.7, -1.4], board: [-0.9, -1.4], 'stove-a': [0.9, -1.4], 'stove-b': [2.7, -1.4], plates: [4.5, -1.4], serve: [4.05, 0.15], trash: [-4.05, 0.15], 'counter-a': [-0.9, -0.1], 'counter-b': [0.9, -0.1] };
async function navigate(p, id, axis = keyAxis) { const [x, z] = spots[id]; await axis(p, 'z', -1.4); await axis(p, 'x', x); await axis(p, 'z', z); assert.equal((await state(p)).nearest, id, 'Station reachability: ' + id); }
async function keyAction(p) { await p.keyboard.press('KeyE'); await advance(p, 32); }
async function soup(p, ingredients, { axis = keyAxis, action = keyAction, serve = true, stove = 'stove-a' } = {}) {
  for (const ingredient of ingredients) {
    await navigate(p, ingredient, axis); await action(p); assert.equal((await state(p)).hand.type, ingredient);
    await navigate(p, 'board', axis); await action(p); await advance(p, 2150); assert.equal((await state(p)).stations.board.item.prepared, true);
    await action(p); await navigate(p, stove, axis); await action(p); assert.equal((await state(p)).hand, null);
  }
  await navigate(p, 'plates', axis); await action(p); await advance(p, 5100); await navigate(p, stove, axis); await action(p); assert.ok((await state(p)).hand.recipe);
  await navigate(p, 'serve', axis);
  if (serve) { const previous = (await state(p)).served; await action(p); assert.equal((await state(p)).served, previous + 1); assert.equal((await state(p)).hand, null); }
}
async function touchDrivers(p) {
  const cdp = await p.context().newCDPSession(p);
  const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points.map(v => ({ id: v.id, x: v.x, y: v.y, radiusX: 2, radiusY: 2, force: 1 })) });
  const stick = await p.locator('#joystick').boundingBox(), button = await p.locator('#action').boundingBox();
  const center = { id: 1, x: stick.x + stick.width / 2, y: stick.y + stick.height / 2 }, actionPoint = { id: 2, x: button.x + button.width / 2, y: button.y + button.height / 2 };
  async function axis(page, field, target) {
    for (let i = 0; i < 15; i++) {
      const error = target - (await state(page)).player[field]; if (Math.abs(error) < 0.09) return;
      await touch('touchStart', [center]);
      const point = { ...center, x: center.x + (field === 'x' ? Math.sign(error) * stick.width * 0.4 : 0), y: center.y + (field === 'z' ? Math.sign(error) * stick.height * 0.4 : 0) };
      await touch('touchMove', [point]); await advance(page, Math.max(32, Math.min(1400, Math.abs(error) / 3.4 * 1000))); await touch('touchEnd', []);
    }
    throw Error('Touch navigation blocked: ' + field + '=' + target);
  }
  async function action(page) { await touch('touchStart', [actionPoint]); await advance(page, 32); await touch('touchEnd', []); }
  return { axis, action, touch, center, actionPoint, stick };
}

(async () => {
  const browser = engine === 'webkit' ? await webkit.launch({ headless: true }) : await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'] });
  try {
    const { page: desktop, context } = await open(browser, { width: 1280, height: 720 });
    await snap(desktop, 'home-desktop');
    await desktop.click('#help'); assert.equal(await desktop.locator('#help-screen').isVisible(), true); await desktop.click('#help-close');
    await desktop.click('#start'); await advance(desktop, 64);
    console.log('Desktop kitchen started');
    assert.equal((await state(desktop)).phase, 'playing');
    await soup(desktop, ['tomato']); report.checks.push('Desktop full tomato order through actual keyboard movement and E actions');
    console.log('First desktop order served');
    await snap(desktop, 'served-desktop');
    for (let i = 0; i < 4; i++) {
      if (!(await state(desktop)).orders.length) await jump(desktop, 4000);
      const order = (await state(desktop)).orders[0]; assert.ok(order);
      await soup(desktop, order.recipe === 'garden' ? ['tomato', 'mushroom'] : [order.recipe], { stove: i % 2 ? 'stove-b' : 'stove-a' });
      console.log('Uninterrupted order ' + (i + 2) + ' served');
    }
    assert.equal((await state(desktop)).served, 5); report.checks.push('Five uninterrupted orders, both pots, order generation, mixed soup when ordered, scoring and chain');
    await navigate(desktop, 'tomato'); await desktop.keyboard.down('KeyW'); await advance(desktop, 1500); await desktop.keyboard.up('KeyW'); assert.ok((await state(desktop)).player.z >= -1.745 - 0.001); report.checks.push('Solid counter collision blocks held movement');
    await desktop.keyboard.down('KeyD'); await advance(desktop, 64); await desktop.evaluate(() => window.dispatchEvent(new Event('blur'))); await desktop.keyboard.up('KeyD');
    assert.equal((await state(desktop)).phase, 'paused'); const paused = (await state(desktop)).time; await jump(desktop, 5000); assert.equal((await state(desktop)).time, paused); assert.deepEqual(await desktop.evaluate(() => window.__UNDERCOOKED__.input().keys), []); await desktop.click('#resume'); report.checks.push('Focus loss pauses timers and clears held keys; explicit resume');
    await jump(desktop, (await state(desktop)).time * 1000 + 500); assert.equal((await state(desktop)).phase, 'results'); assert.equal(await desktop.locator('#results').isVisible(), true); await snap(desktop, 'results-desktop'); report.checks.push('Full 180 second shift reaches results through browser animation clock');
    console.log('Full desktop shift completed');
    const score = (await state(desktop)).score; assert.ok(score >= 500);
    await desktop.click('#replay'); assert.equal((await state(desktop)).score, 0); assert.equal((await state(desktop)).served, 0); assert.equal((await state(desktop)).hand, null);
    await soup(desktop, ['tomato', 'mushroom'], { serve: false }); const wrong = (await state(desktop)).mistakes; await keyAction(desktop); assert.equal((await state(desktop)).mistakes, wrong + 1); assert.equal((await state(desktop)).hand.recipe, 'garden'); assert.match((await state(desktop)).feedback.text, /No matching/); report.checks.push('Actual mixed soup and incorrect serve feedback retain the dish');
    await navigate(desktop, 'counter-a'); await keyAction(desktop); assert.equal((await state(desktop)).hand, null); await keyAction(desktop); assert.equal((await state(desktop)).hand.recipe, 'garden'); await navigate(desktop, 'trash'); await keyAction(desktop); assert.equal((await state(desktop)).hand, null); report.checks.push('Pickup, set down, recover, and compost through the UI');
    await desktop.keyboard.press('Escape'); await desktop.click('#restart-pause'); await soup(desktop, ['tomato']); report.checks.push('Results replay and paused restart each support another complete order');
    report.desktopRendering = await desktop.evaluate(() => window.__UNDERCOOKED__.renderInfo()); assert.equal(report.desktopRendering.threeRevision, '170'); assert.equal(report.desktopRendering.camera, 'OrthographicCamera'); assert.ok(report.desktopRendering.context); assert.ok(report.desktopRendering.meshes < 300 && report.desktopRendering.triangles < 100000);
    await context.close();
    const sizes = [[568, 320], [667, 375], [844, 390], [390, 844]];
    for (const [width, height] of sizes) {
      const { page, context } = await open(browser, { width, height }, true, width === 667);
      await snap(page, 'home-' + width + 'x' + height);
      const startBox = await page.locator('#start').boundingBox(); assert.ok(startBox.y >= 0 && startBox.y + startBox.height <= height); assert.ok(startBox.height >= 44);
      await page.click('#start'); await advance(page, 96);
      const layout = await page.evaluate(() => ({ scroll: document.documentElement.scrollHeight > innerHeight || document.body.scrollWidth > innerWidth, controls: ['action', 'pause', 'mute', 'joystick'].map(id => { const r = document.getElementById(id).getBoundingClientRect(); return { id, x: r.x, y: r.y, w: r.width, h: r.height }; }), reduced: matchMedia('(prefers-reduced-motion: reduce)').matches }));
      assert.equal(layout.scroll, false); for (const control of layout.controls) { assert.ok(control.w >= 44 && control.h >= 44, control.id); assert.ok(control.x >= 0 && control.y >= 0 && control.x + control.w <= width + 1 && control.y + control.h <= height + 1, control.id + ' is in viewport'); }
      await snap(page, 'playing-' + width + 'x' + height);
      if (width === 568 && engine === 'chromium') {
        const d = await touchDrivers(page); await soup(page, ['tomato'], d); await soup(page, ['mushroom'], { ...d, serve: false });
        await d.touch('touchStart', [d.center]); await d.touch('touchMove', [{ ...d.center, x: d.center.x - d.stick.width * 0.4 }]); await advance(page, 96);
        const before = (await state(page)).player.x; await d.touch('touchStart', [{ ...d.center, x: d.center.x - d.stick.width * 0.4 }, d.actionPoint]); await advance(page, 96); assert.ok((await state(page)).player.x < before); await d.touch('touchCancel', []); const stopped = (await state(page)).player.x; await advance(page, 400); assert.equal((await state(page)).player.x, stopped); assert.equal(await page.evaluate(() => window.__UNDERCOOKED__.input().joystick.id), null); report.checks.push('Native phone touch completes an order, supports simultaneous thumbstick/action, and stops on touch cancel');
        await page.evaluate(() => window.dispatchEvent(new Event('blur'))); assert.equal((await state(page)).phase, 'paused'); await page.click('#resume'); await page.click('#mute'); assert.equal(await page.locator('#mute').getAttribute('aria-pressed'), 'true'); await snap(page, 'served-phone');
      }
      report.checks.push(width + '×' + height + ': viewport, no scrolling, all controls ≥44px, screenshot' + (layout.reduced ? ', reduced motion' : ''));
      await context.close();
    }
    if (engine === 'chromium') {
      const fallback = await browser.newContext({ viewport: { width: 667, height: 375 } }); await fallback.addInitScript(() => { const original = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function(type, ...args) { return /webgl/.test(type) ? null : original.call(this, type, ...args); }; }); const page = await fallback.newPage(); await page.goto(base); await page.waitForSelector('#unsupported', { state: 'visible' }); await snap(page, 'webgl-fallback'); await fallback.close(); report.checks.push('WebGL unavailable produces a readable recovery screen');
    }
    assert.deepEqual(report.errors, [], 'Browser console/page errors');
    report.ok = true; report.finishedAt = new Date().toISOString(); fs.writeFileSync(path.join(evidence, 'browser-' + engine + '.json'), JSON.stringify(report, null, 2)); console.log(JSON.stringify(report, null, 2));
  } catch (error) { report.ok = false; report.failure = error.stack; fs.writeFileSync(path.join(evidence, 'browser-' + engine + '.json'), JSON.stringify(report, null, 2)); throw error; }
  finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
