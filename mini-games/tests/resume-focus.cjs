/* Documented controls only: no answer probes, source interception, or forced game state. */
const browserType=require('playwright')[process.env.BROWSER_ENGINE||'chromium'];
const assert=require('node:assert/strict');
const base=process.env.BASE_URL||'http://127.0.0.1:8790';
(async()=>{
 const browser=await browserType.launch({headless:true,...(process.env.BROWSER_ENGINE==='webkit'?{}:{executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']})});
  console.log(JSON.stringify({suite:'resume-focus',browserEngine:process.env.BROWSER_ENGINE||'chromium',browserVersion:browser.version(),base:process.env.BASE_URL||'local default',sourceSha:process.env.GITHUB_SHA||null,startedAt:new Date().toISOString(),physicalDevice:false}));
 try {
 const checks=[],errors=[];
 for(const mobile of [false,true])for(const game of ['sky-stack','pocket-orbit']){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:900},hasTouch:mobile,isMobile:mobile});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${base}/mini-games/${game}/`);
  const activate=async id=>page.locator(id)[mobile?'tap':'click']();
  await activate('#action');await activate('#pause');await activate('#pause');
  assert.equal(await page.locator('#pause').textContent(),'Pause');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'action');
  await page.keyboard.press('Space');
  assert.notEqual(await page.locator('#pause').textContent(),'Resume','Space after Resume must not pause');
  if(game==='sky-stack')assert.equal(await page.locator('#floors').textContent(),'1 / 12');
  else {
   assert.match(await page.locator('#message').textContent(),/Missed|Connected|Perfect/);
   // Pause/resume during the between-orbits feedback interval too.
   await activate('#pause');await activate('#pause');
   assert.notEqual(await page.evaluate(()=>document.activeElement.id),'pause');
   await page.keyboard.press('Space');assert.equal(await page.locator('#pause').textContent(),'Pause');
   await page.waitForTimeout(900);
   assert.equal(await page.evaluate(()=>document.activeElement.id),'action');
  }
  // Restart then background: the ordinary blur event must freeze gameplay,
  // and the Resume button must lead back to the gameplay action.
  await activate('#restart');if(game==='sky-stack')await activate('#action');
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  assert.equal(await page.locator('#pause').textContent(),'Resume');
  const geometry=()=>page.locator(game==='sky-stack'?'#moving':'#courier').evaluate(n=>n.outerHTML);
  const before=await geometry();
  await page.waitForTimeout(150);
  assert.equal(await geometry(),before);
  await activate('#pause');assert.equal(await page.evaluate(()=>document.activeElement.id),'action');
  // Mobile primary-action control is exercised with touch, not a mouse fallback.
  if(mobile){await activate('#action');assert.notEqual(await page.locator('#pause').textContent(),'Resume');}
  checks.push({game,viewport:mobile?'390x844':'1280x900',resumeSpace:true,betweenInterval:game==='pocket-orbit',restartBlurResume:true,touchAction:mobile,input:mobile?'touch buttons + explicit keyboard regression':'mouse buttons + keyboard'});
  await context.close();
 }
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:900},hasTouch:mobile,isMobile:mobile});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  const activate=async id=>page.locator(id)[mobile?'tap':'click']();
  await page.goto(`${base}/mini-games/afterglow/`);
  await activate('#begin');await activate('#pause');await activate('#begin');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'field');
  await page.keyboard.press('Space');
  assert(await page.locator('#recall').isEnabled(),'Space after resume launches a volley');
  assert.equal(await page.locator('#veil').isVisible(),false);
  await activate('#pause');await activate('#begin');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'field');
  await page.keyboard.press('Space');
  assert.equal(await page.locator('#veil').isVisible(),false,'Space during resumed volley does not re-pause');
  await activate('#restart');
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  assert.equal(await page.locator('#pause').getAttribute('aria-label'),'Resume game');
  await activate('#begin');assert.equal(await page.evaluate(()=>document.activeElement.id),'field');
  if(mobile){await activate('#launch');assert(await page.locator('#recall').isEnabled());}
  checks.push({game:'afterglow',viewport:mobile?'390x844':'1280x900',resumeSpace:true,volleyResume:true,restartBlurResume:true,touchAction:mobile});
  await context.close();
 }
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({suite:'resume-focus',checks,errors,scope:'Ordinary-input interaction regressions, not full rounds or physical-device tests.'},null,2));
 } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1});
