/* Public-UI regression checks. No model probes, state writes or solver guidance. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const playwright=require('playwright');
const engine=process.env.BROWSER_ENGINE||'chromium';
const base=process.env.BASE_URL||'http://127.0.0.1:8790';
const report={suite:'puzzle-remediation',browser:engine,passed:false,cases:[],limits:['Public UI interactions test rules, errors and reset; full solver-guided wins are recorded separately.','Touchscreen is browser emulation, not physical phone testing. No actual screen reader test.']};
const output=process.env.REPORT_PATH||path.join(__dirname,'../coverage/puzzle-remediation-'+engine+'.json');
const save=()=>{fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');};
(async()=>{
 const browser=await playwright[engine].launch(engine==='chromium'?{executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']}:{});
 try{
  for(const mobile of [false,true]){
   const context=await browser.newContext({viewport:mobile?{width:320,height:820}:{width:1280,height:900},hasTouch:mobile,isMobile:mobile});
   for(const id of ['seed-tomorrow','circuit-break','river-capacity','safety-ferry','map-inks']){
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    const click=selector=>page.locator(selector)[mobile?'tap':'click']();
    await page.goto(base+'/mini-games/puzzle-lab/?game='+id);
    await click('#start');const initial=await page.locator('#clues').innerText();
    await click('#check');assert.equal(await page.locator('#result').isHidden(),true,'incomplete study rejected');
    const checks=[];
    if(id==='seed-tomorrow'){
     assert.match(initial,/Day 0\/3.*Interventions 0\/2/);
     for(let i=1;i<=7;i++)assert.match(initial,new RegExp('Cell '+i+': (live|empty)'));
     assert.match(initial,/FINAL TARGET:.*Cell 7: (live|empty)/);
     assert.match(initial,/CURRENT:.*Cell 7: (live|empty)/);
     assert.match(await page.locator('#board').innerText(),/Left \/ current \/ right/);
     await click('[data-key="seed-0"]');
     assert.match(await page.locator('#clues').innerText(),/Day 0\/3.*Interventions 0\/2/,'selection does not advance or spend');
     assert.match(await page.locator('#clues').innerText(),/Pending: (plant|prune) cell 1/);
     await click('[data-key="advance"]');
     assert.match(await page.locator('#clues').innerText(),/Day 1\/3.*Interventions 1\/2/);
     assert.match(await page.locator('#board').innerText(),/Day 1 \(after intervention at cell 1\)/);
     await click('#undo');assert.match(await page.locator('#clues').innerText(),/Day 0\/3.*Interventions 0\/2/);
     await click('[data-key="wait"]');
     assert.equal(await page.locator('#clues').innerText(),initial,'undo + clear pending restores entire visible initial garden');
     await click('[data-key="advance"]');await click('#check');assert.match(await page.locator('#status').innerText(),/Advance through all/);
     await click('[data-key="advance"]');await click('[data-key="advance"]');await click('#check');
     assert.match(await page.locator('#status').innerText(),/differs from the target/,'waiting-only journey cannot win');
     const final=await page.locator('#clues').innerText();await click('[data-key="advance"]');assert.equal(await page.locator('#clues').innerText(),final,'cannot advance past final day');
     await click('#undo');assert.match(await page.locator('#clues').innerText(),/Day 2\/3/,'failed terminal attempt remains undoable');
     checks.push('indexed live/empty target/current/preview','noncommitting selection','explicit time/budget progression','history and whole-day undo','premature/final failure checks','no overrun past horizon');
    }else if(id==='circuit-break'){
     await click('[data-key="node-0"]');assert.match(await page.locator('#status').innerText(),/cannot be removed/);
     await click('[data-key="node-1"]');await click('[data-key="node-2"]');await click('#check');assert.match(await page.locator('#status').innerText(),/Too many relays/);checks.push('terminal protection','overbudget rejection');
    }else if(id==='river-capacity'){
     await click('[data-key="edge-0"]');await click('#check');assert.match(await page.locator('#status').innerText(),/Basin/);checks.push('directed channel labels','conservation violation rejected');
    }else if(id==='safety-ferry'){
     assert.match(initial,/capacity 2.*shortest safe journey 7/);await click('[data-key="sail"]');assert.match(await page.locator('#status').innerText(),/Unsafe crossing/);
     await click('[data-key="cargo-0"]');await click('[data-key="cargo-1"]');await click('[data-key="cargo-2"]');assert.match(await page.locator('#status').innerText(),/at most 2/);checks.push('unsafe crossing reason','capacity enforced','visible shortest journey');
    }else{
     const nodes=page.locator('#board [data-key^="node-"]');for(let i=0;i<await nodes.count();i++)await click('[data-key="node-'+i+'"]');
     await click('#check');assert.match(await page.locator('#status').innerText(),/Border conflict/);checks.push('monochrome graph rejected');
    }
    await click('#reset');assert.equal(await page.locator('#clues').innerText(),initial,'reset preserves exact same study');
    await click('#restart');await click('#start');assert.equal(await page.locator('#study').innerText(),'1 / 3');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'viewport has no horizontal overflow');
    if(!mobile){await page.locator('#board button').first().focus();await page.keyboard.press('Space');assert.notEqual(await page.evaluate(()=>document.activeElement.tagName),'BODY');checks.push('keyboard focus remains after activation');}
    assert.deepEqual(errors,[]);report.cases.push({id,profile:mobile?'emulated-touch-320':'desktop',passed:true,checks});save();await page.close();
   }
   await context.close();
  }
  report.passed=true;save();
 }finally{await browser.close();}
})().catch(e=>{report.failure=String(e.stack||e);save();console.error(e);process.exitCode=1;});
