const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const base=process.env.BASE_URL || 'http://127.0.0.1:8765';
const out=process.env.SCREENSHOT_DIR || '/tmp/small-hours-check';
require('node:fs').mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:1100}}); const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/mini-games/'); await page.screenshot({path:out+'/catalog-desktop.png',fullPage:true});
 assert.equal(await page.locator('.feature').count(),1); await page.getByRole('link',{name:"Let's play"}).click();
 await page.screenshot({path:out+'/game-desktop.png',fullPage:true});
 await page.route('**/game.js',async route=>{let response=await route.fetch();let source=await response.text();source=source.replace('recordUI(); updateUI(); requestAnimationFrame(frame);',`window.probe=()=>({state,lane,score,health,elapsed,objects:objects.map(o=>({...o}))}); recordUI(); updateUI(); requestAnimationFrame(frame);`);await route.fulfill({response,body:source});});
 await page.reload();await page.clock.install();await page.getByRole('button',{name:'Start run'}).click();
 await page.keyboard.press('ArrowLeft');assert.equal((await page.evaluate(()=>probe())).lane,0);
 await page.keyboard.press('d');assert.equal((await page.evaluate(()=>probe())).lane,1);
 await page.keyboard.press('p');const pausedAt=(await page.evaluate(()=>probe())).elapsed;await page.clock.runFor(2000);assert.equal((await page.evaluate(()=>probe())).elapsed,pausedAt);
 await page.getByRole('button',{name:'Resume run'}).click();
 for(let i=0;i<5;i++){await page.clock.runFor(250);await page.getByRole('button',{name:'Restart'}).click();assert.equal((await page.evaluate(()=>probe())).score,0);assert.equal((await page.evaluate(()=>probe())).health,3)}
 // Drive actual keyboard inputs toward each arriving signal; no gameplay state mutation.
 for(let i=0;i<610;i++){
  const s=await page.evaluate(()=>probe());if(s.state==='ended')break;
  const target=s.objects.filter(o=>o.kind==='signal'&&!o.resolved&&o.y>130).sort((a,b)=>b.y-a.y)[0];
  if(target){for(let n=0;n<Math.abs(target.lane-s.lane);n++)await page.keyboard.press(target.lane<s.lane?'ArrowLeft':'ArrowRight')}
  await page.clock.runFor(100);
 }
 const won=await page.evaluate(()=>probe());assert.equal(won.state,'ended');assert.equal(won.elapsed,60);assert.ok(won.score>5000);assert.equal(won.health,3);assert.match(await page.locator('#overlay-title').innerText(),/delivered/);
 await page.screenshot({path:out+'/win.png',fullPage:true});
 const saved=await page.locator('#best').innerText();await page.getByRole('button',{name:'Play again'}).click();
 for(let i=0;i<400;i++){let s=await page.evaluate(()=>probe());if(s.state==='ended')break;const target=s.objects.filter(o=>o.kind==='static'&&!o.resolved&&o.y>200).sort((a,b)=>b.y-a.y)[0];if(target)await page.locator(`[data-lane="${target.lane}"]`).click();await page.clock.runFor(100)}
 let lost=await page.evaluate(()=>probe());assert.equal(lost.health,0);assert.equal(lost.state,'ended');assert.match(await page.locator('#overlay-title').innerText(),/lost/);
 await page.getByRole('link',{name:'All games'}).click();assert.equal(await page.locator('#best').innerText(),saved);
 await page.getByRole('link',{name:"Let's play"}).click();assert.equal(await page.locator('#best').innerText(),saved);
 await page.getByRole('button',{name:'Start run'}).click();await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal((await page.evaluate(()=>probe())).state,'paused');
 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,reducedMotion:'reduce'});const mp=await mobile.newPage();mp.on('pageerror',e=>errors.push(e.message));
 await mp.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('disabled')}})});
 await mp.goto(base+'/mini-games/');assert.equal(await mp.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.equal(await mp.locator('.shape').first().evaluate(e=>getComputedStyle(e).animationName),'none');await mp.screenshot({path:out+'/catalog-mobile.png',fullPage:true});
 await mp.getByRole('link',{name:"Let's play"}).tap();assert.match(await mp.locator('#storage-note').innerText(),/unavailable/);assert.equal(await mp.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await mp.screenshot({path:out+'/game-mobile.png',fullPage:true});
 await mp.getByRole('button',{name:'Start run'}).tap();await mp.getByRole('button',{name:'Move to right lane'}).tap();assert.equal(await mp.locator('[data-lane="2"]').getAttribute('aria-pressed'),'true');const box=await mp.locator('canvas').boundingBox();await mp.touchscreen.tap(box.x+box.width/6,box.y+box.height/2);assert.equal(await mp.locator('[data-lane="0"]').getAttribute('aria-pressed'),'true');
 await mp.getByRole('button',{name:'Pause'}).tap();assert.equal(await mp.locator('#overlay-title').innerText(),'Take a breath.');

 // Small-phone layout and desktop pointer input, plus a blocked-storage scored end state.
 await mp.setViewportSize({width:320,height:740});await mp.screenshot({path:out+'/game-small-phone.png',fullPage:true});
 assert.equal(await mp.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 const startBox=await mp.locator('#start').boundingBox(), arenaBox=await mp.locator('.arena').boundingBox();assert.ok(startBox.y+startBox.height<arenaBox.y+arenaBox.height);
 await page.getByRole('button',{name:'Resume run'}).click();const cb=await page.locator('canvas').boundingBox();await page.mouse.click(cb.x+cb.width/6,cb.y+cb.height/2);assert.equal((await page.evaluate(()=>probe())).lane,0);
 await page.evaluate(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked storage')}})});
 await page.getByRole('button',{name:'Restart'}).click();
 // Existing best is higher, so use a fresh context to exercise failed record writes.
 const bp=await browser.newPage();await bp.addInitScript(()=>{Storage.prototype.setItem=function(){throw new Error('quota exceeded')}});
 await bp.route('**/game.js',async route=>{const response=await route.fetch();const source=(await response.text()).replace('recordUI(); updateUI(); requestAnimationFrame(frame);','window.probe=()=>({state,lane,score,objects:objects.map(o=>({...o}))}); recordUI(); updateUI(); requestAnimationFrame(frame);');await route.fulfill({response,body:source})});
 await bp.goto(base+'/mini-games/signal-run/');await bp.clock.install();await bp.getByRole('button',{name:'Start run'}).click();
 for(let i=0;i<250;i++){const s=await bp.evaluate(()=>probe());if(s.state==='ended')break;const kind=s.score>0?'static':'signal';const target=s.objects.filter(o=>o.kind===kind&&!o.resolved&&o.y>200).sort((a,b)=>b.y-a.y)[0];if(target)await bp.locator(`[data-lane="${target.lane}"]`).click();await bp.clock.runFor(100)}
 assert.equal((await bp.evaluate(()=>probe())).state,'ended');assert.ok((await bp.evaluate(()=>probe())).score>0);assert.match(await bp.locator('#storage-note').innerText(),/unavailable/);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,winScore:won.score,winHealth:won.health,lossTime:lost.elapsed,errors,screenshots:out}));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
