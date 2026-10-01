const inventory=require('../inventory.json').games;
const categoryCount=c=>c==='all'?inventory.length:inventory.filter(g=>g.category===c).length;
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const E=require('../afterglow/engine.js');
const base=process.env.BASE_URL||'http://127.0.0.1:8781';
const out=process.env.SCREENSHOT_DIR||'/tmp/small-hours-afterglow';fs.mkdirSync(out,{recursive:true});
const errors=[];
async function setup(page){
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/afterglow/game.js',async route=>{
  const response=await route.fetch();let source=await response.text();
  source=source.replace(/\}\)\(\);\s*$/,`window.probe=()=>({mode,garden,angle,total,power,orbs,saves,volleys,particles:particles.length,s:structuredClone(s),sound,audio:audio?.state||null,reduced:reduced.matches});\n})();`);
  await route.fulfill({response,body:source});
 });
}
function bestAngle(model){
 let best={value:-Infinity};
 for(let d=12;d<=168;d+=2){
  const trial=structuredClone(model);E.launch(trial,-d*Math.PI/180);
  for(let t=0;t<1500&&!trial.done;t++)E.advance(trial,E.STEP);
  assert.ok(trial.done);assert.ok(Number.isFinite(trial.origin));
  const value=(model.blocks.length-trial.blocks.length)*120+(trial.score-model.score)+trial.orbs*10;
  if(value>best.value)best={value,d};
 }
 return best.d;
}
async function aim(page,d){await page.locator('#aim').evaluate((input,value)=>{input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}))},String(d))}
async function win(page,touch=false,choices=['power','orbs']){
 let turns=0;
 while(turns++<25){
  const p=await page.evaluate(()=>probe());
  if(p.mode==='won')return p;
  assert.notEqual(p.mode,'lost','The input-driven expedition should be winnable');
  if(p.mode==='upgrade'){
   assert.equal(await page.locator('#toast').innerText(),'');
   await page.screenshot({path:out+`/upgrade-${touch?'mobile':'desktop'}-${p.garden}.png`,fullPage:true});
   const button=page.locator(`[data-upgrade="${choices[p.garden]}"]`);touch?await button.tap():await button.click();continue;
  }
  assert.equal(p.mode,'aim');await aim(page,bestAngle(p.s));
  if(touch)await page.locator('#launch').tap();else{await page.locator('#launch').focus();await page.keyboard.press('Enter')}
  for(let i=0;i<15;i++){await page.clock.runFor(1000);if((await page.evaluate(()=>probe())).mode!=='volley')break}
 }
 throw Error('Expedition did not finish within 25 turns');
}
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:1150}});await setup(page);
 await page.goto(base+'/mini-games/');assert.equal(await page.locator('[data-category]:visible').count(),inventory.length);
 await page.locator('[data-filter="adventure"]').click();assert.equal(await page.locator('[data-category]:visible').count(),categoryCount('adventure'));
 await page.getByRole('link',{name:'Enter the night garden'}).click();await page.waitForFunction(()=>typeof window.probe==='function');await page.screenshot({path:out+'/intro-desktop.png',fullPage:true});
 assert.equal((await page.evaluate(()=>probe())).audio,null);
 await page.locator('#begin').click();await page.locator('#sound').click();assert.equal((await page.evaluate(()=>probe())).sound,true);
 await page.locator('#sound').click();assert.equal((await page.evaluate(()=>probe())).sound,false);
 const beforeAngle=(await page.evaluate(()=>probe())).angle;await page.locator('canvas').focus();await page.keyboard.press('ArrowLeft');assert.ok((await page.evaluate(()=>probe())).angle<beforeAngle);
 const box=await page.locator('canvas').boundingBox();await page.mouse.move(box.x+box.width*.4,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width*.7,box.y+box.height*.2);await page.mouse.up();assert.ok((await page.evaluate(()=>probe())).angle>-Math.PI/2);
 await page.locator('#aim').focus();await page.keyboard.press('Home');assert.equal(await page.locator('#aim').inputValue(),'11');await page.keyboard.press('End');assert.equal(await page.locator('#aim').inputValue(),'169');
 // Measure actual rendering cadence before installing the accelerated browser clock.
 await aim(page,20);await page.locator('canvas').focus();await page.keyboard.press('Space');
 const cadence=await page.evaluate(()=>new Promise(resolve=>{let times=[],previous=null;function sample(now){if(previous!==null)times.push(now-previous);previous=now;if(times.length<90)requestAnimationFrame(sample);else resolve({frames:times.length,meanMs:times.reduce((a,b)=>a+b)/times.length,maxMs:Math.max(...times)})}requestAnimationFrame(sample)}));
 await page.screenshot({path:out+'/volley-desktop.png',fullPage:true});
 await page.clock.install();await page.keyboard.press('p');const paused=await page.evaluate(()=>probe());await page.clock.runFor(3000);assert.deepEqual((await page.evaluate(()=>probe())).s,paused.s);await page.locator('#begin').click();
 for(let i=0;i<5;i++){await page.locator('#restart').click();await page.locator('#launch').click();await page.clock.runFor(100);await page.locator('#restart').click();const p=await page.evaluate(()=>probe());assert.equal(p.mode,'aim');assert.equal(p.volleys,0);assert.equal(p.s.balls.length,0);assert.equal(p.total,0)}
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal((await page.evaluate(()=>probe())).mode,'paused');await page.locator('#begin').click();
 await page.locator('#launch').click();await page.clock.runFor(100);await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));delete document.hidden});assert.equal((await page.evaluate(()=>probe())).mode,'paused');await page.locator('#begin').click();
 await page.locator('#restart').click();const victory=await win(page);assert.equal(victory.garden,2);assert.ok(victory.s.orbs>=8);assert.ok(victory.power>=2);await page.screenshot({path:out+'/victory-desktop.png',fullPage:true});
 const best=await page.locator('#best').innerText();await page.locator('#begin').click();assert.equal((await page.evaluate(()=>probe())).mode,'aim');
 // Recalling a fresh volley sacrifices the turn. Eventually exhaust rescue and lose.
 let rescued=false;for(let i=0;i<12;i++){let p=await page.evaluate(()=>probe());if(p.mode==='lost')break;await page.locator('#launch').click();await page.locator('#recall').click();p=await page.evaluate(()=>probe());if(p.saves===0)rescued=true}
 assert.equal((await page.evaluate(()=>probe())).mode,'lost');assert.equal(rescued,true);await page.screenshot({path:out+'/loss-desktop.png',fullPage:true});
 await page.getByRole('link',{name:'All games',exact:false}).click();await page.getByRole('link',{name:'Enter the night garden'}).click();await page.waitForFunction(()=>typeof window.probe==='function');assert.equal(await page.locator('#best').innerText(),best);
 let mobileScore;
 for(const failure of ['read','write']){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,reducedMotion:'reduce'});
  const mp=await context.newPage();await setup(mp);await mp.addInitScript(mode=>{if(mode==='read')Object.defineProperty(window,'localStorage',{get(){throw Error('blocked')}});else Storage.prototype.setItem=function(){throw Error('quota')}},failure);
  await mp.goto(base+'/mini-games/afterglow/');await mp.clock.install();assert.equal((await mp.evaluate(()=>probe())).reduced,true);assert.equal(await mp.locator('.flower-mark').evaluate(e=>getComputedStyle(e).animationName),'none');
  await mp.screenshot({path:out+'/intro-mobile.png',fullPage:true});await mp.locator('#begin').tap();
  const cb=await mp.locator('canvas').boundingBox();await mp.touchscreen.tap(cb.x+cb.width*.2,cb.y+cb.height*.4);assert.ok((await mp.evaluate(()=>probe())).angle<-Math.PI/2);
  const finished=await win(mp,true,['saves','power']);mobileScore=finished.total+finished.s.score;assert.equal(finished.particles,0);assert.match(await mp.locator('#storage-note').innerText(),/unavailable/);await mp.screenshot({path:out+'/victory-mobile.png',fullPage:true});
  await mp.locator('#begin').tap();await mp.setViewportSize({width:320,height:740});assert.equal(await mp.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await mp.keyboard.press('p');
  await mp.screenshot({path:out+'/small-phone.png',fullPage:true});const panel=await mp.locator('.panel').boundingBox(),stage=await mp.locator('.stage').boundingBox();assert.ok(panel.height<=stage.height);
  await mp.getByRole('link',{name:'All games',exact:false}).tap();await mp.waitForURL('**/mini-games/');await mp.locator('[data-category]').first().waitFor();assert.equal(await mp.locator('[data-category]:visible').count(),inventory.length);await context.close();
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,desktopScore:victory.total+victory.s.score,volleys:victory.volleys,mobileScore,cadence,errors,screenshots:out}));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
