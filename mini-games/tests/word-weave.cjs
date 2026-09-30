/* Local/browser regression. Reads the curated answers from source; never alters game runtime. */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const source = fs.readFileSync(path.join(__dirname, '../word-weave/game.js'), 'utf8');
const answers = new Map([...source.matchAll(/\['([A-Z]+)','([^']+)'\]/g)].map(m => [m[2], m[1]]));
(async () => {
 const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args:['--no-sandbox']});
 const reports=[];
 for(const mobile of [false,true]) for(const blocked of [false,true]) {
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:900},isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
  if(blocked) await context.addInitScript(()=>{Storage.prototype.getItem=()=>{throw Error('blocked')};Storage.prototype.setItem=()=>{throw Error('blocked')};});
  if(!mobile && !blocked) await context.addInitScript(()=>{Math.random=()=>.999;});
  const page=await context.newPage(); const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${process.env.BASE_URL || 'http://127.0.0.1:8790'}/mini-games/word-weave/`);
  const assert=(ok,msg)=>{if(!ok)throw Error(msg)};
  for(let r=0;r<5;r++) {
   const answer=answers.get(await page.locator('#clue').textContent());assert(answer,'clue has answer');
   if(r===0) {await page.locator('#hint').click();assert(await page.locator('#value').textContent()==='80','hint cost');await page.locator('#clear').click();}
   if(mobile) {
    for(const letter of answer) await page.locator('#letters button:not(:disabled)').filter({hasText:new RegExp(`^${letter}$`)}).first().tap();
   } else {await page.locator('h1').click();await page.keyboard.type(answer);}
   assert(await page.locator('#answer').getAttribute('aria-label')===`Your word: ${answer}`,'duplicate letters selection');
   if(!mobile){await page.locator('h1').click();await page.keyboard.press('Enter');}else await page.locator('#check').click();assert(await page.locator('#next').isVisible(),'solved');await page.locator('#next').click();
  }
  assert(await page.locator('#result').isVisible(),'completed five rounds');
  assert(await page.locator('#score').textContent()==='480','score');assert(await page.locator('#best').textContent()==='480','best');
  if(blocked)assert((await page.locator('#storage-note').textContent()).includes('unavailable'),'storage fallback');
  await page.locator('#again').click();
  await page.locator('#letters button').first().focus();await page.keyboard.press('Enter');assert(await page.evaluate(()=>document.activeElement.matches('#letters button:not(:disabled)')),'tile keyboard focus retained');await page.locator('#restart').click();
  for(let i=0;i<4;i++){await page.locator('#letters button').first().click();await page.locator('#restart').click();}
  assert(await page.locator('#answer button').count()===0,'restart clear');assert(await page.locator('#round').textContent()==='1 / 5','restart round');
  await page.locator('#letters button').first().click();await page.keyboard.press('Backspace');assert(await page.locator('#answer button').count()===0,'backspace');
  const wrongAnswer=answers.get(await page.locator('#clue').textContent());
  await page.locator('h1').click();await page.keyboard.type(wrongAnswer.slice(1)+wrongAnswer[0]);await page.keyboard.press('Enter');assert(await page.locator('#value').textContent()==='90','wrong check cost');
  await page.locator('#hint').click();assert(await page.locator('#answer button').count()===1,'hint repairs incorrect prefix');
  await page.locator('#restart').click();
  await page.setViewportSize({width:mobile?320:1280,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no overflow');
  if(mobile){const box=await page.locator('#letters button').first().boundingBox();assert(box.width>=44&&box.height>=44,'mobile bank target size');}
  await page.screenshot({path:`/tmp/word-weave-${mobile?'mobile':'desktop'}-${blocked?'blocked':'normal'}.png`,fullPage:true});
  await page.reload();assert(await page.locator('#best').textContent()===(blocked?'—':'480'),'best persistence');await page.locator('.back').click();assert(new URL(page.url()).pathname.endsWith('/mini-games/'),'catalog navigation');
  assert(!errors.length,errors.join(';'));reports.push({mobile,blocked,fullRound:true,restart:true,overflow:false,errors});await context.close();
 }
 await browser.close();console.log(JSON.stringify(reports));
})().catch(e=>{console.error(e);process.exit(1)});
