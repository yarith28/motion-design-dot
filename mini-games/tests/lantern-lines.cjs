const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const results=[];
 for(const mobile of [false,true]) for(const blocked of [false,true]) {
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile,reducedMotion:blocked?'reduce':'no-preference'});
  if(blocked) await context.addInitScript(()=>{Storage.prototype.getItem=()=>{throw Error('blocked')};Storage.prototype.setItem=()=>{throw Error('blocked')};});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${process.env.BASE_URL||'http://127.0.0.1:8790'}/mini-games/lantern-lines/`);
  const activate=async selector=>mobile?page.locator(selector).tap():page.locator(selector).click();
  const state=()=>page.locator('.lantern').evaluateAll(bs=>bs.map(b=>b.getAttribute('aria-pressed')));
  const initial=await state();await activate('.lantern:first-child');assert.equal(await page.locator('#moves').textContent(),'1');await activate('#undo');assert.deepEqual(await state(),initial);
  await activate('.lantern:first-child');await activate('#retry');assert.deepEqual(await state(),initial);assert.equal(await page.locator('#moves').textContent(),'0');
  await page.locator('.lantern:first-child').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('.lantern').nth(1).evaluate(e=>e===document.activeElement),true);await page.keyboard.press('Space');assert.equal(await page.locator('#moves').textContent(),'1');await activate('#retry');
  for(let chapter=0;chapter<3;chapter++) {
   assert.equal(await page.locator('.lantern').count(),(chapter+3)**2);
   let steps=0;
   while(await page.locator('#result').isHidden()) {
    await activate('#hint');await activate('.lantern.hinted');assert.ok(++steps<30);
   }
   assert.equal(await page.locator('#lit').textContent(),'0');
   if(chapter<2) await activate('#next');
  }
  assert.equal(await page.locator('#result-title').textContent(),'The city is dreaming.');assert.ok(Number(await page.locator('#best').textContent())>0);
  if(blocked) assert.match(await page.locator('#storage-note').textContent(),/unavailable/);
  await page.screenshot({path:`/tmp/lantern-${mobile?'mobile':'desktop'}-${blocked?'blocked':'normal'}.png`,fullPage:true});
  const savedBest=await page.locator('#best').textContent();
  await activate('#next');assert.equal(await page.locator('#chapter').textContent(),'1 / 3');
  for(let repeat=0;repeat<5;repeat++){await activate('.lantern:first-child');await activate('#restart');assert.equal(await page.locator('#moves').textContent(),'0');assert.equal(await page.locator('#result').isHidden(),true);}
  await page.reload();if(!blocked) assert.equal(await page.locator('#best').textContent(),savedBest);
  for(const width of mobile?[320,390]:[1440]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await page.getByRole('link',{name:'← All games'}).click();assert.match(page.url(),/mini-games\/$/);assert.deepEqual(errors,[]);
  results.push({mobile,blocked,completedChapters:3,restarts:5,keyboard:true,overflow:false});await context.close();
 }
 await browser.close();console.log(JSON.stringify({passed:true,results},null,2));
})().catch(e=>{console.error(e);process.exit(1)});
