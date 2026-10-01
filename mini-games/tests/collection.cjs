const inventory=require('../inventory.json').games;
const categoryCount=c=>c==='all'?inventory.length:inventory.filter(g=>g.category===c).length;
/* Optional Playwright integration checks. Probes are read-only and test-injected. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.BASE_URL || 'http://127.0.0.1:8765';
const out = process.env.SCREENSHOT_DIR || '/tmp/small-hours-collection';
fs.mkdirSync(out, {recursive:true});
const probes = {
  'double-take': '({deck:[...deck],first,second,matched:[...matched],turns,locked})',
  'good-order': '({cells:[...cells],moves,finished,peeking})',
  'pocket-orbit': '({state,angle,target,width,round,score,misses,wait})'
};
const errors = [];
async function instrument(page) {
  page.on('pageerror', e=>errors.push(e.message));
  await page.route('**/game.js', async route => {
    const response = await route.fetch();
    const slug = new URL(route.request().url()).pathname.split('/').at(-2);
    let source = await response.text();
    if(probes[slug]) source = source.replace(/\}\)\(\);\s*$/, `window.probe=()=>${probes[slug]};\n})();`);
    await route.fulfill({response,body:source});
  });
}
async function open(page, slug) { await page.goto(`${base}/mini-games/${slug}/`); }
async function completeMemory(page, touch=false) {
  const {deck} = await page.evaluate(()=>probe());
  for(let symbol=0;symbol<8;symbol++) {
    for(const i of deck.map((n,i)=>n===symbol?i:-1).filter(i=>i>=0)) {
      if(touch) await page.locator('.card').nth(i).tap();
      else { await page.locator('.card').nth(i).focus(); await page.keyboard.press('Enter'); }
    }
  }
  assert.equal(await page.locator('#pairs').innerText(),'8 / 8');
  assert.equal(await page.locator('#turns').innerText(),'8');
  assert.equal(await page.locator('#result').isVisible(),true);
}
function solve(cells) {
  const start=cells.join(''), goal='123456780', queue=[start], parent=new Map([[start,null]]);
  for(let head=0;head<queue.length;head++) {
    const s=queue[head]; if(s===goal)break;
    const z=s.indexOf('0');
    for(const n of [z-3,z+3,...(z%3?[z-1]:[]),...(z%3<2?[z+1]:[])].filter(n=>n>=0&&n<9)) {
      const a=s.split(''),value=a[n];[a[z],a[n]]=[a[n],a[z]];const next=a.join('');
      if(!parent.has(next)){parent.set(next,[s,value]);queue.push(next)}
    }
  }
  assert.ok(parent.has(goal),'Puzzle must be solvable');
  const path=[];for(let state=goal;parent.get(state);){const [prev,value]=parent.get(state);path.push(value);state=prev}return path.reverse();
}
async function completePuzzle(page, touch=false) {
  const path=solve((await page.evaluate(()=>probe())).cells);
  for(const value of path) {
    const tile=page.locator(`[data-value="${value}"]`);
    if(touch) await tile.tap(); else await tile.click();
  }
  assert.equal((await page.evaluate(()=>probe())).finished,true);
  assert.equal(await page.locator('#placed').innerText(),'8 / 8');
  return path.length;
}
async function completeOrbit(page, touch=false) {
  // Freeze wall-clock drift while Playwright performs touch/actionability checks.
  await page.clock.pauseAt(await page.evaluate(() => Date.now()) + 100);
  await page.locator('#action').click();
  for(let round=0;round<8;round++) {
    const s=await page.evaluate(()=>probe()); assert.equal(s.state,'playing');
    const delta=(s.target-s.angle+Math.PI*2)%(Math.PI*2);
    await page.clock.runFor(Math.max(0,Math.round(delta/(1.8+s.round*.14)*1000)));
    if(touch) await page.locator('#action').tap(); else {await page.locator('#action').focus();await page.keyboard.press('Space')}
    assert.equal((await page.evaluate(()=>probe())).misses,0);
    await page.clock.runFor(800);
  }
  const end=await page.evaluate(()=>probe());assert.equal(end.state,'ended');assert.ok(end.score>=320);return end.score;
}
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1440,height:1100}});await instrument(page);
  await page.goto(base+'/mini-games/');assert.equal(await page.locator('[data-category]:visible').count(),inventory.length);
  await page.screenshot({path:out+'/catalog-desktop.png',fullPage:true});
  for(const [filter,count] of ['memory','puzzle','strategy','reflex','adventure','all'].map(c=>[c,categoryCount(c)])) {
    await page.locator(`[data-filter="${filter}"]`).click();assert.equal(await page.locator('[data-category]:visible').count(),count);
  }
  await page.getByRole('link',{name:'Find your pairs'}).click();await page.clock.install();
  await page.screenshot({path:out+'/memory-desktop.png',fullPage:true});
  const d=(await page.evaluate(()=>probe())).deck, other=d.findIndex(n=>n!==d[0]);
  await page.locator('.card').nth(0).click();await page.locator('.card').nth(0).click({force:true});assert.equal((await page.evaluate(()=>probe())).turns,0);
  await page.locator('.card').nth(other).click();const third=[...d.keys()].find(i=>i!==0&&i!==other);
  await page.locator('.card').nth(third).click({force:true});assert.equal((await page.evaluate(()=>probe())).turns,1);assert.equal((await page.evaluate(()=>probe())).locked,true);
  await page.locator('#restart').click();await page.clock.runFor(1200);assert.equal((await page.evaluate(()=>probe())).turns,0);assert.equal((await page.evaluate(()=>probe())).first,null);
  const fresh=(await page.evaluate(()=>probe())).deck;
  await page.locator('.card').nth(0).click();await page.locator('.card').nth(fresh.findIndex(n=>n!==fresh[0])).click();
  await page.clock.runFor(1000);assert.equal((await page.evaluate(()=>probe())).locked,false);assert.equal((await page.evaluate(()=>probe())).first,null);
  for(let i=0;i<4;i++)await page.locator('#restart').click();
  await page.locator('.card').first().focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('.card').nth(1).evaluate(e=>e===document.activeElement),true);
  await completeMemory(page);await page.screenshot({path:out+'/memory-complete.png',fullPage:true});
  await page.locator('#again').click();assert.equal((await page.evaluate(()=>probe())).turns,0);
  await page.getByRole('link',{name:'All games'}).click();await page.getByRole('link',{name:'Find your pairs'}).click();
  // The new document exposes #best before its deferred game script restores storage.
  // Wait for page readiness, then assert the record; do not poll for the expected value.
  await page.waitForLoadState('load');assert.equal(await page.locator('#best').innerText(),'8');
  await open(page,'good-order');await page.screenshot({path:out+'/puzzle-desktop.png',fullPage:true});
  for(let i=0;i<25;i++) {const {cells}=await page.evaluate(()=>probe());let inversions=0;for(let a=0;a<9;a++)for(let b=a+1;b<9;b++)if(cells[a]&&cells[b]&&cells[a]>cells[b])inversions++;assert.equal(inversions%2,0);assert.notEqual(cells.join(''),'123456780');await page.locator('#restart').click()}
  await page.locator('#peek').click();const before=await page.evaluate(()=>probe());await page.keyboard.press('ArrowLeft');assert.deepEqual((await page.evaluate(()=>probe())).cells,before.cells);await page.locator('#peek').click();
  const c=(await page.evaluate(()=>probe())).cells,z=c.indexOf(0);await page.keyboard.press(z%3?'ArrowLeft':'ArrowRight');assert.equal((await page.evaluate(()=>probe())).moves,1);
  await page.locator('#restart').click();const puzzleMoves=await completePuzzle(page);await page.screenshot({path:out+'/puzzle-complete.png',fullPage:true});
  await page.locator('#again').click();assert.equal((await page.evaluate(()=>probe())).moves,0);await page.reload();assert.equal(await page.locator('#best').innerText(),String(puzzleMoves));
  await open(page,'pocket-orbit');await page.screenshot({path:out+'/orbit-desktop.png',fullPage:true});
  await page.locator('#action').click();await page.clock.runFor(200);await page.keyboard.press('p');const paused=await page.evaluate(()=>probe());await page.clock.runFor(5000);assert.equal((await page.evaluate(()=>probe())).angle,paused.angle);await page.keyboard.press('Escape');
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal((await page.evaluate(()=>probe())).state,'paused');await page.locator('#pause').click();
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));delete document.hidden});assert.equal((await page.evaluate(()=>probe())).state,'paused');
  for(let i=0;i<4;i++)await page.locator('#restart').click();
  // Restart begins immediately; refresh restores the ready screen for a full round.
  await page.reload();const orbitScore=await completeOrbit(page);await page.screenshot({path:out+'/orbit-complete.png',fullPage:true});
  await page.locator('#again').click();assert.equal((await page.evaluate(()=>probe())).score,0);
  for(let i=0;i<3;i++) {await page.locator('#action').click();const s=await page.evaluate(()=>probe());assert.equal(s.state,'between');if(i===0){await page.locator('#pause').click();const frozenWait=(await page.evaluate(()=>probe())).wait;await page.clock.runFor(2000);assert.equal((await page.evaluate(()=>probe())).wait,frozenWait);await page.locator('#pause').click()}await page.clock.runFor(800)}
  assert.equal((await page.evaluate(()=>probe())).state,'ended');assert.equal((await page.evaluate(()=>probe())).misses,3);await page.reload();assert.equal(await page.locator('#best').innerText(),String(orbitScore));
  // Mobile reduced-motion play-throughs with blocked storage reads and writes.
  for(const mode of ['read','write']) {
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
    const mp=await context.newPage();await instrument(mp);
    await mp.addInitScript(mode=>{if(mode==='read')Object.defineProperty(window,'localStorage',{get(){throw Error('blocked')}});else Storage.prototype.setItem=function(){throw Error('quota')}},mode);
    await mp.goto(base+'/mini-games/');assert.equal(await mp.locator('.mini-pair').last().evaluate(e=>getComputedStyle(e).animationName),'none');
    if(mode==='read')await mp.screenshot({path:out+'/catalog-mobile.png',fullPage:true});
    await mp.clock.install();
    for(const slug of Object.keys(probes)) {
      await open(mp,slug);assert.equal(await mp.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      if(mode==='read')await mp.screenshot({path:out+'/'+slug+'-mobile.png',fullPage:true});
      if(slug==='double-take')await completeMemory(mp,true);if(slug==='good-order')await completePuzzle(mp,true);if(slug==='pocket-orbit')await completeOrbit(mp,true);
      assert.match(await mp.locator('#storage-note').innerText(),/unavailable/);assert.equal(await mp.locator('#result').isVisible(),true);
      await mp.locator('#again').tap();await mp.setViewportSize({width:320,height:740});assert.equal(await mp.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await mp.setViewportSize({width:390,height:844});
      await mp.getByRole('link',{name:'All games'}).tap();await mp.waitForURL('**/mini-games/');await mp.locator('[data-category]').first().waitFor();assert.equal(await mp.locator('[data-category]:visible').count(),inventory.length);
    }
    await context.close();
  }
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,puzzleMoves,orbitScore,solvableShuffles:25,errors,screenshots:out}));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
