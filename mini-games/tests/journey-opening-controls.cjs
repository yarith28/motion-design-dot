/* Native opening-control regression across generated replay seeds. Smoke only. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const E=require('../tools/evidence.cjs'),engine=process.env.BROWSER_ENGINE||'chromium',browserType=require('playwright')[engine];
const base=(process.env.BASE_URL||'http://127.0.0.1:8790').replace(/\/$/,''),seeds=[0,1,20261002,4294967295];
const rooms=E.journeyRooms.filter(room=>fs.existsSync(path.join(E.root,room,'games.json')));
const games=rooms.flatMap(room=>JSON.parse(fs.readFileSync(path.join(E.root,room,'games.json'))).map(game=>({...game,room})));
const files=[...new Set([...rooms.flatMap(room=>E.runtimeFingerprint(room).files),path.relative(E.root,__filename)])].sort();
const hashes=()=>files.map(file=>({path:'mini-games/'+file,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(E.root,file))).digest('hex')}));
const before=hashes(),observe=page=>page.evaluate(()=>JSON.stringify({board:document.querySelector('#board').innerHTML,status:document.querySelector('#status').textContent,score:document.querySelector('#score').textContent,outcome:document.body.dataset.outcome}));
(async()=>{
 const browser=await browserType.launch({headless:true,...(engine==='webkit'?{}:{executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']})}),cases=[],errors=[];
 try{
  for(const mobile of [false,true]){
   const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:900},isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'}),page=await context.newPage();
   page.on('pageerror',error=>errors.push(error.message));
   for(const game of games)for(const seed of seeds){
    const response=await page.goto(base+'/mini-games/'+game.url+'&seed='+seed);assert.equal(response.status(),200);
    await page.waitForSelector('body[data-game-ready="true"]');assert.equal(await page.locator('body').getAttribute('data-game-id'),game.id);
    const activate=async selector=>{const control=page.locator(selector).first();assert(await control.count(),game.id+' missing '+selector);assert(await control.isVisible(),game.id+' invisible '+selector);assert(await control.isEnabled(),game.id+' disabled '+selector+' seed '+seed);await control[mobile?'tap':'click']();};
    await activate(game.smoke?.startSelector||'#start');
    const selector=game.smoke?.actionSelector||game.smoke?.action;assert(selector&&selector!=='#restart',game.id+' meaningful opening action');
    const initial=await observe(page);await activate(selector);const changed=await observe(page);
    assert.notEqual(changed,initial,game.id+' opening action must change the board or give game feedback, seed '+seed);
    assert.deepEqual(errors,[]);cases.push({id:game.id,seed,profile:mobile?'mobile-touch':'desktop-mouse',selector,enabled:true,nativeAction:true,feedbackChanged:true});
   }
   await context.close();
  }
  const after=hashes();assert.deepEqual(after,before,'Opening-control source changed during regression');assert.equal(cases.length,games.length*seeds.length*2);
  const report={passed:true,verifiedAt:new Date().toISOString(),engine,browserVersion:browser.version(),sourceSha:process.env.GITHUB_SHA||null,sourceFiles:after,sourceUnchanged:true,seeds,games:games.length,cases,errors,scope:'Each manifest opening action is visible and enabled, receives an actual native mouse or touch input, and changes game content or feedback across four replay seeds. This is opening-control smoke, not completion, solvability or difficulty evidence.'};
  fs.writeFileSync(path.join(E.root,'coverage','opening-controls-'+engine+'.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:true,engine,games:games.length,cases:cases.length,sourceUnchanged:true}));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
