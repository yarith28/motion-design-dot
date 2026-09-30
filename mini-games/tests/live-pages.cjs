/* Runs against the published website, without response rewriting or game-state probes. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const base=(process.env.LIVE_BASE_URL||'https://yarith28.github.io/motion-design-dot').replace(/\/$/,'');
const out='live-verification';fs.mkdirSync(out,{recursive:true});
const games=['signal-run','double-take','pocket-orbit','good-order','afterglow'];
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
 const assets=await publishedFiles();const browser=await chromium.launch({headless:true});const errors=[],failures=[],results=[];
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?2:1,reducedMotion:mobile?'reduce':'no-preference'});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&['document','script','stylesheet'].includes(r.request().resourceType()))failures.push({url:r.url(),status:r.status()})});
  const root=await page.goto(base+'/',{waitUntil:'networkidle'});assert.equal(root.status(),200);await page.waitForURL(base+'/mini-games/');
  assert.equal(await page.locator('[data-category]:visible').count(),5);
  const entries=await page.locator('[data-category] a.cta').evaluateAll(links=>links.map(a=>a.href));assert.equal(entries.length,5);
  await page.screenshot({path:`${out}/catalog-${mobile?'mobile':'desktop'}.png`,fullPage:true});
  for(const [filter,count] of [['adventure',1],['reflex',2],['memory',1],['puzzle',1],['all',5]]){await page.locator(`[data-filter="${filter}"]`).click();assert.equal(await page.locator('[data-category]:visible').count(),count)}
  for(const url of entries){
   const response=await page.goto(url,{waitUntil:'networkidle'});assert.equal(response.status(),200);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   const game=new URL(url).pathname.split('/').filter(Boolean).at(-1);assert.ok(games.includes(game));
   if(game==='signal-run'){await page.locator('#start').click();await page.keyboard.press('ArrowLeft');assert.equal(await page.locator('[data-lane="0"]').getAttribute('aria-pressed'),'true');await page.locator('#pause').click();assert.equal(await page.locator('#overlay-title').innerText(),'Take a breath.');}
   if(game==='double-take'){const card=page.locator('.card').first();mobile?await card.tap():await card.click();assert.match(await card.getAttribute('aria-label'),/Card 1:/);assert.doesNotMatch(await card.getAttribute('aria-label'),/face down/);await page.locator('#restart').click();assert.match(await card.getAttribute('aria-label'),/face down/);}
   if(game==='pocket-orbit'){mobile?await page.locator('#action').tap():await page.locator('#action').click();assert.match(await page.locator('#action').innerText(),/Lock orbit/);await page.locator('#pause').click();assert.equal(await page.locator('#dial-value').innerText(),'PAUSED');await page.locator('#restart').click();assert.equal(await page.locator('#score').innerText(),'0');}
   if(game==='good-order'){const tile=page.locator('.tile.neighbor').first();mobile?await tile.tap():await tile.click();assert.equal(await page.locator('#moves').innerText(),'1');await page.locator('#peek').click();assert.equal(await page.locator('#goal').isVisible(),true);await page.locator('#restart').click();assert.equal(await page.locator('#moves').innerText(),'0');}
   if(game==='afterglow'){
    mobile?await page.locator('#begin').tap():await page.locator('#begin').click();assert.equal(await page.locator('#launch').isEnabled(),true);
    if(mobile){const rect=await page.locator('canvas').boundingBox();await page.touchscreen.tap(rect.x+rect.width*.25,rect.y+rect.height*.4)}else{await page.locator('canvas').focus();await page.keyboard.press('ArrowLeft')}
    assert.notEqual(await page.locator('#aim').inputValue(),'90');mobile?await page.locator('#launch').tap():await page.locator('#launch').click();assert.equal(await page.locator('#recall').isEnabled(),true);
    await page.waitForTimeout(700);await page.locator('#pause').click();assert.equal(await page.locator('#panel-title').innerText(),'Take a breath.');await page.locator('#begin').click();assert.equal(await page.locator('#recall').isEnabled(),true);await page.locator('#recall').click();assert.equal(await page.locator('#launch').isEnabled(),true);
    await page.locator('#restart').click();assert.equal(await page.locator('#orbs').innerText(),'5');assert.equal(await page.locator('#score').innerText(),'0');
    await page.screenshot({path:`${out}/afterglow-${mobile?'mobile':'desktop'}.png`,fullPage:true});
   }
   results.push({game,viewport:mobile?'mobile':'desktop',url,status:response.status(),smoke:'passed'});
   await page.getByRole('link',{name:'All games',exact:false}).click();await page.waitForURL(base+'/mini-games/');assert.equal(await page.locator('[data-category]:visible').count(),5);
  }
  await context.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);await browser.close();
 const report={passed:true,sourceSha:process.env.GITHUB_SHA||null,base,rootRedirect:base+'/mini-games/',assetChecks:assets,results,errors,failures};fs.writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,`## Live arcade verified\n\n- Catalog: ${base}/mini-games/\n- Afterglow: ${base}/mini-games/afterglow/\n- Source: ${process.env.GITHUB_SHA}\n- ${assets.length} published files matched source byte-for-byte.\n- All five games passed desktop and mobile smoke checks.\n- Root redirect, filters, navigation, Afterglow aim/launch/pause/recall/restart, and zero script/asset errors verified.\n`);
})().catch(e=>{console.error(e);fs.writeFileSync(`${out}/failure.txt`,e.stack||String(e));process.exit(1)});
