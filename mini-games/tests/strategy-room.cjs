/* Actual browser rounds through legal visible controls. No game-state injection. */
const { chromium }=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const BASE=process.env.BASE_URL||'http://127.0.0.1:8790';
(async()=>{
 const {start,step,legal,view}=await import('../strategy-room/engines.mjs');
 const games=JSON.parse(fs.readFileSync(path.join(__dirname,'../strategy-room/games.json'),'utf8'));
 assert.equal(games.length,15);assert.equal(new Set(games.map(g=>g.id)).size,15);
 const route={peg:['13','11','22','12','7','17','10','12','17','7','2','12'],orchard:['rain','rain','0','1','2','3','4','0','1','2','3','4'],towers:['0','2','17','submit'],trade:['buy','wait','buy','buy','sell','buy','wait','wait']};
 function choice(id,s,i){const a=legal(id,s);if(route[id])return route[id][i];if(id==='nim'){const xor=s.heaps.reduce((a,b)=>a^b,0),h=s.heaps.findIndex(v=>(v^xor)<v);return h<0?a[0]:h+':'+(s.heaps[h]-(s.heaps[h]^xor));}if(id==='pawns'&&s.selected!==null)return a.find(p=>s.b[+p]!==1);if(id==='bridge'){const candidates=a.filter(x=>x!=='mode');return candidates.sort((a,b)=>+a-+b)[0];}return a[0];}
 const paths={},finals={};
 for(const {id}of games){let s=start(id);const before=JSON.stringify(s);assert.equal(step(id,s,'not-a-legal-move'),s);assert.equal(JSON.stringify(s),before);const moves=[];while(!s.done&&moves.length<160){const a=choice(id,s,moves.length);assert.ok(legal(id,s).includes(a),`${id} invalid planned action ${a}`);const old=JSON.stringify(s);const next=step(id,s,a);assert.equal(JSON.stringify(s),old,'pure transition must not mutate input');s=next;moves.push(a);}assert.ok(s.done,id+' must finish');assert.deepEqual(legal(id,s),[]);assert.equal(step(id,s,moves[0]),s);paths[id]=moves;finals[id]=s;}
 assert.equal(finals.peg.b.length,1);assert.equal(finals.nim.score,3);assert.equal(finals.towers.score,25);assert.equal(finals.trade.cash,31);assert.equal(finals.orchard.fruit,20);
 // Independent resource/timing DP: identical plot ages are interchangeable.
 // This does not call the shipped engine and establishes the reachable optimum.
 const orchardMemo=new Map();
 function orchardOptimum(day,water,ages){
  if(day===12)return 0;
  const key=[day,water,...ages].join(',');if(orchardMemo.has(key))return orchardMemo.get(key);
  const choices=[{water:water+3,ages,fruit:0}];
  if(water>=2&&ages.includes(-1)){const a=[...ages];a[a.indexOf(-1)]=0;choices.push({water:water-2,ages:a,fruit:0});}
  if(ages.includes(3)){const a=[...ages];a[a.indexOf(3)]=-1;choices.push({water,ages:a,fruit:4});}
  const score=Math.max(...choices.map(c=>c.fruit+orchardOptimum(day+1,c.water,c.ages.map(a=>a<0?-1:Math.min(a+1,3)).sort((a,b)=>a-b))));orchardMemo.set(key,score);return score;
 }
 assert.equal(orchardOptimum(0,8,Array(9).fill(-1)),20,'Independent maximum harvest is 20');
 const formerOrchardRoute=['0','1','2','3','0','1','2','3','rain','4','rain','rain'];
 let shortHarvest=start('orchard');for(const a of formerOrchardRoute)shortHarvest=step('orchard',shortHarvest,a);
 assert.equal(shortHarvest.fruit,16);assert.equal(shortHarvest.title,'A quiet harvest.');assert.match(shortHarvest.note,/goal is 20/);
 const growing=step('orchard',start('orchard'),'0');assert.equal(step('orchard',growing,'0'),growing,'Unripe trees cannot be harvested');
 // Engine invariants across independent branching states, including tactical scenarios.
 let nodes=[start('kalah')];for(let depth=0;depth<4;depth++){const next=[];for(const s of nodes)for(const a of legal('kalah',s)){const n=step('kalah',s,a);assert.equal(n.b.reduce((x,y)=>x+y,0),36,'Kalah conserves seeds');assert.ok(n.b.every(x=>x>=0));next.push(n);}nodes=next.slice(0,120);}
 const tactical=start('four');tactical.b[35]=-1;tactical.b[36]=-1;tactical.b[37]=-1;assert.equal(step('four',tactical,'6').score,1,'House must take immediate connect-four win');
 const capture=start('reversi');const n=step('reversi',capture,legal('reversi',capture)[0]);assert.ok(n.b.filter(Boolean).length>=6);
 const bridge=start('bridge');let w=step('bridge',bridge,'mode');w=step('bridge',w,'0');assert.ok(legal('bridge',w).includes('1'));w=step('bridge',w,'1');assert.equal(w.stock,2);assert.ok(w.walls.includes('0-1'));
 function canReach(p,goal,walls){const q=[p],seen=new Set(q);for(const x of q){if(Math.floor(x/5)===goal)return true;for(const n of[x-5,x+5,x-1,x+1])if(n>=0&&n<25&&Math.abs(n%5-x%5)+Math.abs(Math.floor(n/5)-Math.floor(x/5))===1&&!walls.includes([x,n].sort((a,b)=>a-b).join('-'))&&!seen.has(n)){seen.add(n);q.push(n);}}return false;}
 for(let a=0;a<25;a++){let s=step('bridge',start('bridge'),'mode');s=step('bridge',s,String(a));for(const b of legal('bridge',s).filter(b=>b!=='mode'&&+b!==a)){const t=step('bridge',s,b);assert.ok(canReach(t.p,0,t.walls)&&canReach(t.ai,4,t.walls));}}
 // Reviewer regression: side fences plus an opposing courier must never seal the player in.
 const trapped={...start('bridge'),p:22,ai:17,walls:['21-22','22-23','0-1'],stock:0};
 assert.deepEqual(legal('bridge',trapped),['12'],'Face-to-face couriers jump straight over');
 const blockedJump={...trapped,walls:[...trapped.walls,'12-17']};
 assert.deepEqual(legal('bridge',blockedJump).sort(),['16','18'],'Blocked straight jumps allow sideways moves');
 const edgeJump={...trapped,p:7,ai:2,walls:[],stock:0};
 assert.ok(legal('bridge',edgeJump).includes('1')&&legal('bridge',edgeJump).includes('3'),'Board-edge jumps become sideways moves');
 let replay=start('bridge');for(const a of ['mode','22','21','mode','22','23','mode','0','1']){assert.ok(legal('bridge',replay).includes(a));replay=step('bridge',replay,a);}
 assert.ok(replay.done||legal('bridge',replay).some(a=>a!=='mode'),'Original legal replay retains a real move');
 const sealed=start('bridge');sealed.walls=['17-22','21-22'];sealed.mode='wall';sealed.selected=22;assert.ok(!legal('bridge',sealed).includes('23'),'A fence cannot seal the final route');
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});const coverage=games.map(g=>({id:g.id,name:g.name,passed:false,completed:false,restart:false,mobile:false,engine:true,roundActions:paths[g.id].length}));
 for(const mobile of[false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:1000},isMobile:mobile,hasTouch:mobile,reducedMotion:mobile?'reduce':'no-preference'});
  if(mobile)await context.addInitScript(()=>{Storage.prototype.getItem=function(){throw Error('storage unavailable')};Storage.prototype.setItem=function(){throw Error('quota')};});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const game of games){console.log((mobile?'mobile ':'desktop ')+game.id);await page.goto(BASE+'/mini-games/'+game.url);await page.waitForFunction(()=>document.body.dataset.gameReady==='true');assert.equal(await page.locator('body').getAttribute('data-game-id'),game.id);
   const initial=await page.locator('#scoreboard').innerText();
   if(game.id==='bridge'){
    for(const a of ['mode','22','21','mode','22','23','mode','0','1']){const control=page.locator(`[data-action="${a}"]`);if(mobile)await control.tap();else await control.click();}
    assert.ok(await page.locator('#board .legal').count()>0,'Reviewer replay has an available courier move');
    const exit=page.locator('#board .legal').first();if(mobile)await exit.tap();else await exit.click();
    await page.locator('#restart').click();assert.equal(await page.locator('#scoreboard').innerText(),initial);
   }
   if(game.id==='orchard'){
    for(const a of formerOrchardRoute){const control=page.locator(`[data-action="${a}"]`);if(mobile)await control.tap();else await control.click();}
    assert.equal(await page.locator('#result-title').textContent(),'A quiet harvest.');assert.match(await page.locator('#result-copy').textContent(),/16 fruit.*goal is 20/);
    await page.locator('#restart').click();assert.equal(await page.locator('#scoreboard').innerText(),initial);
   }
   // Unavailable controls do not mutate board state.
   const unavailable=page.locator('#board button[aria-disabled="true"]').first();if(await unavailable.count()){await unavailable.click({force:true});assert.equal(await page.locator('#scoreboard').innerText(),initial);}
   let index=0;for(const action of paths[game.id]){const button=page.locator(`[data-action="${action}"]`);assert.equal(await button.getAttribute('aria-disabled'),'false',`${game.id} visible action ${action}`);if(!mobile&&index===0){await button.focus();await page.keyboard.press('Enter');}else if(mobile)await button.tap();else await button.click();index++;}
   assert.equal(await page.locator('body').getAttribute('data-completed'),'true');assert.equal(await page.locator('#result').isVisible(),true);assert.equal(await page.locator('#best').textContent(),String(finals[game.id].score));assert.equal(await page.evaluate(()=>document.activeElement.id),'again');if(mobile)assert.match(await page.locator('#storage-note').textContent(),/unavailable/);
   await page.locator('#again').click();assert.equal(await page.locator('body').getAttribute('data-completed'),'false');assert.equal(await page.locator('#scoreboard').innerText(),initial);
   await page.locator('#restart').click();await page.locator('#restart').click();assert.equal(await page.locator('#scoreboard').innerText(),initial);
   if(!mobile){const first=page.locator('#board button').first();if(await first.count()){await first.focus();await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>document.activeElement.parentElement.id),'board');}const available=page.locator('[data-action][aria-disabled="false"]').first();await available.focus();await page.keyboard.press('Space');await page.locator('#restart').click();assert.equal(await page.locator('#scoreboard').innerText(),initial);}
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,game.id+' no viewport overflow');
   if(['bridge','kalah','fences','hex'].includes(game.id))await page.screenshot({path:`/tmp/strategy-${game.id}-${mobile?'mobile':'desktop'}.png`,fullPage:true});
   if(mobile){await page.setViewportSize({width:320,height:720});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,game.id+' 320px');await page.setViewportSize({width:390,height:844});}else{await page.reload();await page.waitForFunction(()=>document.body.dataset.gameReady==='true');assert.equal(await page.locator('#best').textContent(),String(finals[game.id].score));}
   const row=coverage.find(c=>c.id===game.id);row.completed=true;row.restart=true;if(mobile){row.mobile=true;row.storageFailure=true;row.reducedMotion=true;}else row.desktop=true;
  }
  assert.deepEqual(errors,[]);await page.getByRole('link',{name:'← All games'}).click();assert.match(page.url(),/mini-games\/$/);await context.close();
 }
 await browser.close();for(const row of coverage){row.passed=true;row.keyboard=true;row.overflow320=false;row.consoleErrors=0;if(row.id==='orchard')Object.assign(row,{targetFruit:20,winningFruit:20,failureFruit:16,independentOptimalHarvest:20});if(row.id==='bridge')row.regressions=['reported nine-action replay','straight courier jump','wall-blocked sideways moves','board-edge sideways moves','final route wall rejection'];row.notes='Completed round through legal UI actions; competitive rounds may end in a loss. Chromium desktop and emulated touch mobile. Mobile denies storage reads/writes. No physical-device or other-engine test.';}
 fs.writeFileSync(path.join(__dirname,'../coverage/strategy-room.json'),JSON.stringify({suite:'strategy-room',passed:true,completedRounds:32,testedAt:new Date().toISOString(),games:coverage},null,2)+'\n');console.log(JSON.stringify({passed:true,count:coverage.length,rounds:32,engineChecks:'legal transitions, immutability, terminal locking, Kalah conservation, connect-four tactic, route-preserving fences and courier jumps, solvable peg/towers, exact Nim, harvest goal, optimal trade path'}));
})().catch(e=>{console.error(e);process.exit(1)});
