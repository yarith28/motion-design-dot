/* Public UI only. Engine/input smoke, not completion or a screen-reader study. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const engine=process.env.BROWSER_ENGINE||'chromium',browserType=require('playwright')[engine];
const base=(process.env.BASE_URL||'http://127.0.0.1:8790').replace(/\/$/,'');
const rooms=['systems-room','tabletop-room','puzzle-lab','kinetic-room','discovery-room'];
const games=rooms.flatMap(room=>JSON.parse(fs.readFileSync(path.join(__dirname,'..',room,'games.json'))).map(g=>({...g,room})));
(async()=>{
 assert.equal(games.length,100);assert.equal(new Set(games.map(g=>g.id)).size,100);
 const browser=await browserType.launch({headless:true,...(engine==='webkit'?{}:{executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']})});
 const cases=[],errors=[];
 try{
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:320,height:740}:{width:1280,height:900},hasTouch:mobile,isMobile:mobile,reducedMotion:'reduce'});
  await context.addInitScript(mode=>{if(mode==='read')Object.defineProperty(window,'localStorage',{get(){throw Error('blocked storage')}});else Storage.prototype.setItem=()=>{throw Error('quota')};},mobile?'write':'read');
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  const activate=async selector=>{const control=page.locator(selector).first();if(mobile)await control.tap();else{await control.focus();await page.keyboard.press('Enter');}};
  for(const game of games){
   const response=await page.goto(base+'/mini-games/'+game.url);assert.equal(response.status(),200);
   await page.waitForSelector('body[data-game-ready="true"]');assert.equal(await page.locator('body').getAttribute('data-game-id'),game.id);
   assert.equal(await page.locator('h1').innerText(),game.name);
   assert.ok((await page.locator('#rules').innerText()).trim().length>50,'Useful visible rules '+game.id);
   if(await page.locator('#start').isVisible())await activate('#start');
   assert.ok((await page.locator('#status').innerText()).trim().length>0,'Visible game status '+game.id);
   const action=game.smoke?.actionSelector||game.smoke?.action;
   assert.ok(action&&action!=='#restart','A meaningful gameplay smoke selector is required '+game.id);
   await activate(action);
   if(!mobile)assert.equal(await page.evaluate(()=>document.activeElement!==document.body),true,'Keyboard focus survives action '+game.id);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'Responsive action state '+game.id);
   await activate('#restart');
   assert.equal(await page.locator('body').getAttribute('data-game-id'),game.id);
   assert.ok((await page.locator('#status').innerText()).trim().length>0);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'Responsive restart '+game.id);
   assert.deepEqual(errors,[]);
   cases.push({id:game.id,profile:mobile?'320px touch':'desktop keyboard',launch:true,gameAction:true,restart:true,focus:mobile?'not asserted':'retained',storage:mobile?'writes blocked':'reads blocked',reducedMotion:true});
  }
  await context.close();
 }
 assert.equal(cases.length,200);
 const report={passed:true,sourceSha:process.env.GITHUB_SHA||null,engine,version:browser.version(),verifiedAt:new Date().toISOString(),base,cases,errors,scope:'One normal game action, keyboard focus, touch activation, restart, 320px layout, blocked storage and reduced-motion preference in each new game. No full completion, physical device or screen-reader claim.'};
 const dir=process.env.CONTROLS_REPORT_DIR||'live-verification';fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'expansion-controls-'+engine+'.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:true,engine,version:browser.version(),cases:cases.length,scope:report.scope}));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
