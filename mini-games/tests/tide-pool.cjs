const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const base=process.env.BASE_URL||'http://127.0.0.1:8790';
 for(const mode of ['desktop','mobile','get','set']){
  const mobile=mode==='mobile'||mode==='get';
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile,reducedMotion:mobile?'reduce':'no-preference'});
  if(mode==='get'||mode==='set') await context.addInitScript(method=>{Storage.prototype[method+'Item']=function(){throw new Error('blocked');};},mode);
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/mini-games/tide-pool/');
  async function best(){return page.evaluate(()=>{const tiles=[...document.querySelectorAll('.glass')],n=Math.sqrt(tiles.length),owned=new Set(tiles.flatMap((t,i)=>t.dataset.owned==='true'?[i]:[])),current=+tiles[0].dataset.color;let best=-1,count=-1;for(let c=0;c<5;c++){if(c===current)continue;const region=new Set(owned),queue=[...owned];for(let k=0;k<queue.length;k++){const i=queue[k];for(const j of [i>=n?i-n:-1,i<n*(n-1)?i+n:-1,i%n?i-1:-1,i%n<n-1?i+1:-1])if(j>=0&&!region.has(j)&&+tiles[j].dataset.color===c){region.add(j);queue.push(j);}}if(region.size>count){count=region.size;best=c;}}return best;});}
  for(let stage=1;stage<=3;stage++){
   let steps=0;
   while(await page.locator('#result').isHidden()){
    assert(++steps<100);const c=await best();if(mobile)await page.locator('#palette button').nth(c).tap();else await page.keyboard.press(String(c+1));
   }
   assert.match(await page.locator('#result-title').textContent(),stage===3?/whole little ocean/:/pool is yours/);
   if(stage<3)await page.locator('#next').click();
  }
  assert.notEqual(await page.locator('#best').textContent(),'—');
  if(mode==='get'||mode==='set')assert.match(await page.locator('#storage-note').textContent(),/unavailable/);
  await page.locator('#next').click();assert.equal(await page.locator('#stage').textContent(),'1 / 3');
  if(mode==='desktop'){const saved=await page.locator('#best').textContent();await page.reload();assert.equal(await page.locator('#best').textContent(),saved);}
  // Repeated restarts and a deliberately unproductive route exercise failure and retry.
  for(let i=0;i<4;i++)await page.locator('#restart').click();
  const original=await page.locator('.glass').evaluateAll(ts=>ts.map(t=>t.dataset.color));
  let tries=0;while(await page.locator('#result').isHidden()) {assert(++tries<100);const current=Number(await page.locator('.glass').first().getAttribute('data-color'));await page.locator('#palette button').nth(current===0?1:0).click();}
  assert.match(await page.locator('#result-title').textContent(),/tide ran out/);
  await page.locator('#next').click();assert.deepEqual(await page.locator('.glass').evaluateAll(ts=>ts.map(t=>t.dataset.color)),original);
  const before=await page.locator('#moves').textContent();await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));assert.equal(await page.locator('#moves').textContent(),before);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:`/tmp/tide-pool-${mobile?'mobile':'desktop'}.png`,fullPage:true});
  if(mobile){await page.setViewportSize({width:320,height:750});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await page.locator('.back').click();assert.equal(new URL(page.url()).pathname,'/mini-games/');assert.deepEqual(errors,[]);await context.close();
 }
 // Storage read and write errors must not stop rounds or session bests.
 for(const failure of ['get','set']){
  const context=await browser.newContext();await context.addInitScript(mode=>{Storage.prototype[mode+'Item']=function(){throw new Error('blocked');};},failure);
  const page=await context.newPage();await page.goto(base+'/mini-games/tide-pool/');
  await page.evaluate(()=>SmallHours.record('test-storage').save(500));
  assert.match(await page.locator('#storage-note').textContent(),/unavailable/);
  await page.locator('#restart').click();assert.equal(await page.locator('.glass').count(),36);await context.close();
 }
 const constant=await browser.newContext();await constant.addInitScript(()=>Math.random=()=>0);const constantPage=await constant.newPage();await constantPage.goto(base+'/mini-games/tide-pool/');assert.equal(await constantPage.locator('#gathered').textContent(),'35 / 36');await constantPage.keyboard.press('2');assert.match(await constantPage.locator('#result-title').textContent(),/pool is yours/);await constant.close();
 await browser.close();console.log('Tide Pool: desktop/mobile three-pool wins, loss/retry, repeated restart, keyboard/touch, navigation, 320px, reduced motion, storage read/write failure passed.');
})().catch(e=>{console.error(e);process.exit(1)});
