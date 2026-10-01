/* Regression through real keyboard/touch controls on the unmodified app.
   No closure probes, source replacement, or injected game state. The authored
   Beat Post chart is replayed with virtual time; this is not a human playtest. */
const browserType=require('playwright')[process.env.BROWSER_ENGINE||'chromium'];
const assert=require('node:assert/strict');
const base=process.env.BASE_URL||'http://127.0.0.1:8790';
(async()=>{
 const browser=await browserType.launch({headless:true,...(process.env.BROWSER_ENGINE==='webkit'?{}:{executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']})});
  console.log(JSON.stringify({suite:'review-arcade-strategy',browserEngine:process.env.BROWSER_ENGINE||'chromium',browserVersion:browser.version(),base:process.env.BASE_URL||'local default',sourceSha:process.env.GITHUB_SHA||null,startedAt:new Date().toISOString(),physicalDevice:false}));
 try {
  for(const mobile of [false,true]){
   const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1365,height:900},isMobile:mobile,hasTouch:mobile});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.clock.install({time:new Date('2026-01-01')});await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
   await page.goto(base+'/mini-games/arcade-room/?game=beat-post');
   await page.waitForSelector('body[data-game-ready="true"]');
   const activate=async locator=>mobile?locator.tap():locator.click();
   const lane=async i=>mobile?page.locator('#inputs button').nth(i).tap():page.keyboard.press(['ArrowLeft','ArrowDown','ArrowRight'][i]);
   await activate(page.locator('#start'));
   // Previously all lanes every150ms won24/24. Now wrong inputs exhaust budget.
   for(let batch=0;batch<8&&!await page.locator('#result').isVisible();batch++){
    for(let i=0;i<3;i++){if(await page.locator('#result').isVisible())break;await lane(i);}
    await page.clock.runFor(150);
   }
   assert.equal(await page.locator('#result-title').textContent(),'One more little try?');
   assert.match(await page.locator('#result-copy').textContent(),/Eight missed notes or mistimed taps/);
   assert.equal(await page.locator('#resource').textContent(),'0');
   // Clean authored chart remains winnable using touch ONLY on mobile.
   await activate(page.locator('#again'));await page.clock.runFor(2016);
   for(let note=0;note<24;note++){
    await lane((note*7+Math.floor(note/4))%3);
    await page.clock.runFor(note===23?32:650);
   }
   assert.equal(await page.locator('#result-title').textContent(),'A little victory.');
   assert.match(await page.locator('#result-copy').textContent(),/24 of 24 notes delivered/);
   assert.deepEqual(errors,[]);await context.close();
  }
  const page=await browser.newPage();await page.goto(base+'/mini-games/strategy-room/?game=nim');
  await page.locator('[data-action="0:3"]').focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('#message').textContent(),'House removed 1 from row 3. Your turn.');
  const focused=await page.evaluate(()=>({tag:document.activeElement.tagName,action:document.activeElement.dataset.action,available:document.activeElement.getAttribute('aria-disabled')}));
  assert.equal(focused.tag,'BUTTON');assert.ok(focused.action);assert.equal(focused.available,'false');
  await page.keyboard.press('Enter');assert.notEqual(await page.locator('#message').textContent(),'House removed 1 from row 3. Your turn.');
  console.log('PASS: blind keyboard/touch spam loses; precise desktop/touch-only charts win; Nim consumed action keeps usable keyboard focus. Browser mobile emulation, virtual time, unmodified app.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
