/* Runs against the published website, without response rewriting or game-state probes. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const base=(process.env.LIVE_BASE_URL||'https://yarith28.github.io/motion-design-dot').replace(/\/$/,'');
const out=process.env.SCREENSHOT_DIR||'live-verification';fs.mkdirSync(out,{recursive:true});
const games=['signal-run','double-take','pocket-orbit','good-order','afterglow','lantern-lines','tide-pool','word-weave','sky-stack','pebble-post'];
const files=['index.html','mini-games/index.html','mini-games/styles.css','mini-games/catalog.css','mini-games/catalog.js','mini-games/common.js','mini-games/play.css',...games.flatMap(g=>['index.html','game.css','game.js'].map(f=>`mini-games/${g}/${f}`)),'mini-games/afterglow/engine.js'];
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
async function publishedFiles(){
 for(let attempt=0;attempt<20;attempt++){
  const checks=await Promise.all(files.map(async file=>{
   try{const response=await fetch(`${base}/${file}?verify=${process.env.GITHUB_SHA||'manual'}`,{signal:AbortSignal.timeout(15000)});const bytes=Buffer.from(await response.arrayBuffer());return {file,status:response.status,match:response.ok&&hash(bytes)===hash(fs.readFileSync(file))}}catch(e){return {file,error:e.message,match:false}}
  }));
  if(checks.every(c=>c.match))return checks;
  console.log('Waiting for published files',checks.filter(c=>!c.match));
  if(attempt<19)await new Promise(resolve=>setTimeout(resolve,10000));
 }
 throw Error('Published files did not match the checked-out source within the deployment window');
}
(async()=>{
 const assets=await publishedFiles();const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});const errors=[],failures=[],results=[];
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?2:1,reducedMotion:mobile?'reduce':'no-preference'});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&['document','script','stylesheet'].includes(r.request().resourceType()))failures.push({url:r.url(),status:r.status()})});
  const root=await page.goto(base+'/',{waitUntil:'networkidle'});assert.equal(root.status(),200);await page.waitForURL(base+'/mini-games/');
  assert.equal(await page.locator('[data-category]:visible').count(),10);
  assert.equal(await page.locator('#game-catalog').getAttribute('data-view'),'grid');
  const listButton=page.getByRole('button',{name:'List',exact:true}),gridButton=page.getByRole('button',{name:'Grid',exact:true});
  if(mobile)await listButton.tap();else{await listButton.focus();await page.keyboard.press('Enter')}
  assert.equal(await listButton.getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#game-catalog').getAttribute('data-view'),'list');
  for(const [filter,count] of [['reflex',3],['adventure',1],['all',10]]){await page.locator(`[data-filter="${filter}"]`).click();assert.equal(await page.locator('[data-category]:visible').count(),count)}
  await page.locator('[data-filter="memory"]').click();await gridButton.click();assert.equal(await page.locator('[data-category]:visible').count(),1);await listButton.click();assert.equal(await page.locator('[data-category]:visible').count(),1);await page.locator('[data-filter="all"]').click();
  await page.reload();assert.equal(await page.locator('#game-catalog').getAttribute('data-view'),'list');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:`${out}/catalog-list-${mobile?'mobile':'desktop'}.png`,fullPage:true});
  if(mobile){await page.setViewportSize({width:320,height:740});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.setViewportSize({width:390,height:844})}
  for(const link of await page.locator('[data-category] a.cta').all()){const box=await link.boundingBox();assert.ok(box&&box.width>=40&&box.height>=32)}
  await page.locator('[data-category="adventure"] a.cta').click();await page.waitForURL('**/afterglow/');await page.getByRole('link',{name:'All games',exact:false}).click();await page.waitForURL(base+'/mini-games/');assert.equal(await page.locator('#game-catalog').getAttribute('data-view'),'list');
  await gridButton.focus();await page.keyboard.press('Space');await page.reload();assert.equal(await page.locator('#game-catalog').getAttribute('data-view'),'grid');
  const entries=await page.locator('[data-category] a.cta').evaluateAll(links=>links.map(a=>a.href));assert.equal(entries.length,10);
  await page.screenshot({path:`${out}/catalog-${mobile?'mobile':'desktop'}.png`,fullPage:true});
  for(const [filter,count] of [['adventure',1],['reflex',3],['memory',1],['puzzle',3],['strategy',2],['all',10]]){await page.locator(`[data-filter="${filter}"]`).click();assert.equal(await page.locator('[data-category]:visible').count(),count)}
  for(const url of entries){
   const response=await page.goto(url,{waitUntil:'networkidle'});assert.equal(response.status(),200);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   const game=new URL(url).pathname.split('/').filter(Boolean).at(-1);assert.ok(games.includes(game));
   if(game==='signal-run'){await page.locator('#start').click();await page.keyboard.press('ArrowLeft');assert.equal(await page.locator('[data-lane="0"]').getAttribute('aria-pressed'),'true');await page.locator('#pause').click();assert.equal(await page.locator('#overlay-title').innerText(),'Take a breath.');}
   if(game==='double-take'){const card=page.locator('.card').first();mobile?await card.tap():await card.click();assert.match(await card.getAttribute('aria-label'),/Card 1:/);assert.doesNotMatch(await card.getAttribute('aria-label'),/face down/);await page.locator('#restart').click();assert.match(await card.getAttribute('aria-label'),/face down/);}
   if(game==='pocket-orbit'){mobile?await page.locator('#action').tap():await page.locator('#action').click();assert.match(await page.locator('#action').innerText(),/Lock orbit/);await page.locator('#pause').click();assert.equal(await page.locator('#dial-value').textContent(),'PAUSED');await page.locator('#restart').click();assert.equal(await page.locator('#score').innerText(),'0');}
   if(game==='good-order'){const tile=page.locator('.tile.neighbor').first();mobile?await tile.tap():await tile.click();assert.equal(await page.locator('#moves').innerText(),'1');await page.locator('#peek').click();assert.equal(await page.locator('#goal').isVisible(),true);await page.locator('#restart').click();assert.equal(await page.locator('#moves').innerText(),'0');}
   if(game==='lantern-lines'){await page.locator('#board button').first().click();assert.equal(await page.locator('#moves').innerText(),'1');await page.locator('#undo').click();assert.equal(await page.locator('#moves').innerText(),'0');await page.locator('#restart').click();}
   if(game==='tide-pool'){const before=Number(await page.locator('#moves').innerText());await page.locator('#palette button:enabled').first().click();assert.equal(Number(await page.locator('#moves').innerText()),before-1);await page.locator('#restart').click();assert.equal(await page.locator('#stage').innerText(),'1 / 3');}
   if(game==='word-weave'){await page.locator('#letters button').first().click();assert.equal(await page.locator('#answer button').count(),1);await page.locator('#clear').click();assert.equal(await page.locator('#answer button').count(),0);await page.locator('#restart').click();assert.equal(await page.locator('#score').innerText(),'0');}
   if(game==='sky-stack'){await page.locator('#action').click();await page.locator('#pause').click();assert.equal(await page.locator('#curtain-title').innerText(),'Sky on hold.');await page.locator('#restart').click();assert.equal(await page.locator('#floors').innerText(),'0 / 12');}
   if(game==='pebble-post'){await page.locator('[data-dir="R"]').click();assert.equal(await page.locator('#result').isVisible(),true);await page.locator('#undo').click();assert.equal(await page.locator('#result').isVisible(),false);await page.locator('#restart-route').click();assert.equal(await page.locator('#stop').innerText(),'1 / 5');}
   if(game==='afterglow'){
    mobile?await page.locator('#begin').tap():await page.locator('#begin').click();assert.equal(await page.locator('#launch').isEnabled(),true);
    if(mobile){const rect=await page.locator('canvas').boundingBox();await page.touchscreen.tap(rect.x+rect.width*.25,rect.y+rect.height*.4)}else{await page.locator('canvas').focus();await page.keyboard.press('ArrowLeft')}
    assert.notEqual(await page.locator('#aim').inputValue(),'90');mobile?await page.locator('#launch').tap():await page.locator('#launch').click();assert.equal(await page.locator('#recall').isEnabled(),true);
    await page.waitForTimeout(700);await page.locator('#pause').click();assert.equal(await page.locator('#panel-title').innerText(),'Take a breath.');await page.locator('#begin').click();assert.equal(await page.locator('#recall').isEnabled(),true);await page.locator('#recall').click();assert.equal(await page.locator('#launch').isEnabled(),true);
    await page.locator('#restart').click();assert.equal(await page.locator('#orbs').innerText(),'5');assert.equal(await page.locator('#score').innerText(),'0');
    await page.screenshot({path:`${out}/afterglow-${mobile?'mobile':'desktop'}.png`,fullPage:true});
   }
   results.push({game,viewport:mobile?'mobile':'desktop',url,status:response.status(),smoke:'passed'});
   await page.getByRole('link',{name:'All games',exact:false}).click();await page.waitForURL(base+'/mini-games/');assert.equal(await page.locator('[data-category]:visible').count(),10);
  }
  await context.close();
 }
 for(const failure of ['read','write']){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(mode=>{if(mode==='read')Object.defineProperty(window,'localStorage',{get(){throw Error('blocked')}});else Storage.prototype.setItem=function(){throw Error('quota')}},failure);
  await page.goto(base+'/mini-games/');assert.equal(await page.locator('#game-catalog').getAttribute('data-view'),'grid');
  await page.getByRole('button',{name:'List',exact:true}).tap();assert.equal(await page.locator('#game-catalog').getAttribute('data-view'),'list');assert.equal(await page.locator('[data-category]:visible').count(),10);
  await page.getByRole('button',{name:'Grid',exact:true}).tap();await page.getByRole('button',{name:'List',exact:true}).tap();await page.reload();assert.equal(await page.locator('#game-catalog').getAttribute('data-view'),'grid');await context.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);await browser.close();
 const report={passed:true,sourceSha:process.env.GITHUB_SHA||null,base,catalogViews:'grid/list, persistence, filters, keyboard, 320px, reduced motion and blocked storage passed',rootRedirect:base+'/mini-games/',assetChecks:assets,results,errors,failures};fs.writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,`## Live arcade verified\n\n- Catalog: ${base}/mini-games/\n- Afterglow: ${base}/mini-games/afterglow/\n- Source: ${process.env.GITHUB_SHA}\n- ${assets.length} published files matched source byte-for-byte.\n- All ten games passed desktop and mobile smoke checks.\n- Root redirect, filters, navigation, Afterglow aim/launch/pause/recall/restart, and zero script/asset errors verified.\n`);
})().catch(e=>{console.error(e);fs.writeFileSync(`${out}/failure.txt`,e.stack||String(e));process.exit(1)});
