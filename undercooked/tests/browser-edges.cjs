const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.BASE_URL || 'http://127.0.0.1:8790/';
const dir = process.env.EVIDENCE_DIR || path.join(__dirname, '..', 'test-results');
fs.mkdirSync(dir, { recursive: true });
const report = { base, checks: [], errors: [] };
async function wait(p, ms) { while (ms > 0) { const step = Math.min(250, ms); await p.clock.fastForward(step); ms -= step; } }
const state = p => p.evaluate(() => window.__UNDERCOOKED__.getState());
async function axis(p, key, target) { for (let n = 0; n < 12; n++) { const delta = target - (await state(p)).player[key]; if (Math.abs(delta) < 0.08) return; const button = key === 'x' ? delta > 0 ? 'KeyD' : 'KeyA' : delta > 0 ? 'KeyS' : 'KeyW'; await p.keyboard.down(button); await wait(p, Math.max(32, Math.abs(delta) / 3.4 * 1000)); await p.keyboard.up(button); } throw Error('Station path blocked'); }
async function nav(p, x) { await axis(p, 'z', -1.4); await axis(p, 'x', x); }
async function act(p) { await p.keyboard.press('Space'); await wait(p, 40); }
async function screenshot(p, name) { await p.screenshot({ path: path.join(dir, name + '.png') }); }
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'] });
  try {
    const p = await browser.newPage({ viewport: { width: 844, height: 390 } }); p.on('pageerror', e => report.errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()); });
    await p.clock.install({ time: new Date('2026-10-04T08:00:00Z') }); await p.goto(base); await p.waitForFunction(() => window.__UNDERCOOKED__); await p.clock.pauseAt(new Date('2026-10-04T10:00:00Z')); await screenshot(p, 'final-home'); await p.click('#start');
    await nav(p, -4.5); await act(p); await nav(p, -0.9); await act(p); await wait(p, 800); await screenshot(p, 'chopping-progress'); const progress = (await state(p)).stations.board.item.chop; assert.ok(progress > 0 && progress < 2);
    await p.keyboard.down('ArrowDown'); await wait(p, 160); await p.keyboard.up('ArrowDown'); await wait(p, 1000); assert.equal((await state(p)).stations.board.item.prepared, false); await nav(p, -0.9); await act(p); await wait(p, 1500); assert.equal((await state(p)).stations.board.item.prepared, true); await screenshot(p, 'chopped-vegetable'); await act(p); await nav(p, 0.9); await act(p); await wait(p, 1800); assert.equal((await state(p)).stations['stove-a'].status, 'cooking'); assert.match(await p.locator('#station-labels').innerText(), /Simmering/); await screenshot(p, 'simmering-progress'); await wait(p, 3400); assert.equal((await state(p)).stations['stove-a'].status, 'ready'); assert.match(await p.locator('#station-labels').innerText(), /Ready/); await screenshot(p, 'soup-ready');
    await wait(p, 17400); assert.equal((await state(p)).stations['stove-a'].status, 'burnt'); assert.match(await p.locator('#station-labels').innerText(), /Burnt/); await screenshot(p, 'burnt-soup'); await act(p); assert.equal((await state(p)).stations['stove-a'].status, 'empty'); assert.equal((await state(p)).burnt, 1); report.checks.push('Space and arrow controls; visible chop/cook/readiness progress; interrupted prep resumes; actual burn and pot recovery');
    await p.keyboard.press('Escape'); const time = (await state(p)).time; await p.click('#help-pause'); await wait(p, 3000); assert.equal((await state(p)).time, time); await p.click('#help-close'); assert.equal((await state(p)).phase, 'paused'); await p.click('#resume'); report.checks.push('Help from pause preserves pause and timers');
    if (await p.locator('#fullscreen').isVisible()) { await p.click('#fullscreen'); await wait(p, 64); assert.equal(await p.evaluate(() => Boolean(document.fullscreenElement)), true); await p.click('#fullscreen'); report.checks.push('Fullscreen enter and exit'); }
    assert.deepEqual(report.errors, []); await p.close();
    const real = await browser.newPage({ viewport: { width: 568, height: 320 } }); await real.goto(base); await real.waitForFunction(() => window.__UNDERCOOKED__); await real.waitForTimeout(1500); await real.click('#start');
    const clockBefore = (await state(real)).time, wallBefore = Date.now(); await real.waitForTimeout(5000); const wall = (Date.now() - wallBefore) / 1000, gameSeconds = clockBefore - (await state(real)).time; report.realTime = { wallSeconds: wall, gameSeconds, ratio: gameSeconds / wall, rendering: await real.evaluate(() => window.__UNDERCOOKED__.renderInfo()) }; assert.ok(gameSeconds / wall > 0.8 && gameSeconds / wall < 1.1, 'Shift timer keeps real time'); report.checks.push('Real unmodified RAF rendering and shift timer at 568×320');
    await screenshot(real, 'final-playing-phone'); await real.close(); report.ok = true; fs.writeFileSync(path.join(dir, 'browser-edges.json'), JSON.stringify(report, null, 2)); console.log(JSON.stringify(report, null, 2));
  } catch (error) { report.ok = false; report.failure = error.stack; fs.writeFileSync(path.join(dir, 'browser-edges.json'), JSON.stringify(report, null, 2)); throw error; }
  finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
