/* Source-informed legal routes replayed through actual keyboard/touch controls.
   This suite is reachability and regression evidence, not unaided play evidence. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),BASE=process.env.BASE_URL||'http://127.0.0.1:8781';
const file=path.join(ROOT,'coverage/workbench-room.json');
const report={passed:false,cases:[],limits:['Source-derived legal plans; no claim of unaided solving. Independent ordinary review is reported separately.','Chromium keyboard activation and touch emulation, not physical-device or screen-reader certification.','All three studies must win for every primary case; deliberate losses are separately recorded.']};
function save(){fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n')}
function hash(){let files=fs.readdirSync(path.join(ROOT,'workbench-room')).sort().map(n=>'workbench-room/'+n).concat(['tests/workbench-room.cjs','tests/workbench-paths.json']);let h=crypto.createHash('sha256');files.forEach(n=>h.update(n+'\0').update(fs.readFileSync(path.join(ROOT,n))));return h.digest('hex')}
const failures={
'pebble-engine':Array.from({length:8},()=>['make-a','drop-a']).flat().slice(0,-1),
'cache-hotel':['serve','evict-A'],
'heap-garden':['at-3','request'],
'ledger-race':['step-0','step-0','step-0','step-1','step-1','step-1'],
'receipt-route':Array(11).fill('ack'),
'stack-kitchen':['op-0','run','run','run'],
'pattern-tailor':['literal-b','check','check','check'],
'bracket-workshop':['shift','shift','shift','shift','shift','finish'],
'type-loom':['check','check','check'],
'proof-lantern':['assume-0','assume-0','assume-0',...Array.from({length:5},()=>['fact-3','fact-4','and']).flat()],
 'table-confluence':['add-sum','run','run','run'],
 'branch-librarian':['L-1','R-2','L-1','R-2'],
 'row-orchestra':['factor-2','scale','scale'],
 'state-courier':['check','check','check'],
 'compare-parade':['check','check','check'],
 'token-crucible':['fire-0'],
 'copy-ribbon':['literal-b'],
 'parallel-manuscripts':['upper','upper','upper'],
 'private-census':['publish','publish','publish'],
 'tiny-soundbook':['check','check','check'],
 'agenda-garden':['pick-A','pick-C','vote'],
 'causal-camera':['cut-0-0','check','check','check'],
 'linked-orchard':['lg-0','rg-0','breed','breed','discard-3','breed','discard-4','breed'],
 'clearing-circle':['settle'],
 'night-collector':['scan-A','scan-B','sweep'],
 'gathering-grounds':Array(6).fill('harvest-1'),
 'loop-transit':Array(20).fill('advance')};
function legal(e,s){let a=[];e.render({p(){},h(){},pre(){},table(){},group(){},button(k,l,d){if(!d)a.push(k)}},s);return a}
(async()=>{save();const tested=hash(),{engines}=await import('../workbench-room/engines.mjs'),games=JSON.parse(fs.readFileSync(path.join(ROOT,'workbench-room/games.json'))),plans=JSON.parse(fs.readFileSync(path.join(__dirname,'workbench-paths.json')));assert.equal(games.length,27);assert.equal(new Set(games.map(g=>g.id)).size,27);
 for(const g of games){const e=engines[g.id];for(let stage=0;stage<3;stage++){let s=e.init(stage);for(const k of plans[g.id][stage]){assert.equal(s.outcome,'playing',g.id+' premature terminal');assert.ok(legal(e,s).includes(k),g.id+' legal '+k);e.act(s,k)}assert.equal(s.outcome,'win',g.id+' model full-study win')}let s=e.init(0);for(const k of failures[g.id]){assert.equal(s.outcome,'playing',g.id+' early failure');assert.ok(legal(e,s).includes(k),g.id+' legal failure '+k);e.act(s,k)}assert.equal(s.outcome,'loss',g.id+' natural failure route')}
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const mobile of[false,true]){let context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:900},hasTouch:mobile,isMobile:mobile,reducedMotion:mobile?'reduce':'no-preference'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));const activate=async selector=>{let b=page.locator(selector).first();if(mobile)await b.tap();else{await b.focus();await b.press('Enter')}};const action=k=>activate(`[data-action="${k}"]`);
 for(const g of games){console.log((mobile?'touch ':'keyboard ')+g.id);await page.goto(BASE+'/mini-games/'+g.url);await page.waitForSelector('body[data-game-ready="true"]');assert.equal(await page.locator('body').getAttribute('data-game-id'),g.id);assert.equal(await page.locator('h1').innerText(),g.name);assert.ok((await page.locator('#rules').innerText()).length>100);await activate('#start');const opening=await page.locator('#board').innerText(),score=await page.locator('#scoreboard').innerText();
 // One unsolved control activation covers input/focus, not gameplay quality.
 await activate('#board button:not(:disabled)');assert.notEqual(await page.evaluate(()=>document.activeElement.tagName),'BODY');if(await page.locator('#undo').isEnabled()){await activate('#undo');assert.equal(await page.locator('#board').innerText(),opening,'Undo restores full rendered state')}await activate('#restart');assert.equal(await page.locator('#board').innerText(),opening);assert.equal(await page.locator('#scoreboard').innerText(),score);
 for(const k of failures[g.id])await action(k);assert.equal(await page.locator('body').getAttribute('data-outcome'),'loss',g.id+' UI failure');assert.equal(await page.locator('#board button:not(:disabled)').count(),0);await activate('#restart');assert.equal(await page.locator('#board').innerText(),opening);
 for(let stage=0;stage<3;stage++){const fresh=await page.locator('#board').innerText();await activate('#board button:not(:disabled)');await activate('#reset');assert.equal(await page.locator('#board').innerText(),fresh,'Reset study preserves progression and restores state');for(const k of plans[g.id][stage])await action(k);assert.equal(await page.locator('body').getAttribute('data-outcome'),stage===2?'win':'study-win',g.id+' stage '+stage);assert.equal(await page.locator('#board button:not(:disabled)').count(),0);if(stage<2)await activate('#next')}
 assert.equal(await page.locator('body').getAttribute('data-outcome'),'win');assert.ok(await page.locator('#result').isVisible());assert.notEqual(await page.evaluate(()=>document.activeElement.tagName),'BODY');await activate('#again');assert.equal(await page.locator('#board').innerText(),opening);assert.equal(await page.locator('#scoreboard').innerText(),score);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal overflow '+g.id);if(mobile){await page.setViewportSize({width:320,height:720});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'320px document fits');await page.setViewportSize({width:390,height:844})}assert.deepEqual(errors,[]);
 report.cases.push({id:g.id,profile:mobile?'mobile-touch':'desktop',passed:true,outcome:'win',restart:true,touchOnly:mobile,inputMethod:mobile?'Touchscreen taps on real controls; source-derived legal route through all three studies':'Keyboard focus and Enter on native controls; source-derived legal route through all three studies',winActions:plans[g.id].reduce((n,p)=>n+p.length,0),lossActions:failures[g.id].length,edgeCases:['Natural failure route reaches loss through actual UI','All three studies win','Native focused controls retain focus','Terminal gameplay controls disabled','Restart and Play again restore complete initial rendered state','No page errors or document horizontal overflow at desktop, 390px and 320px','Undo restores full opening after a legal action; Reset study preserves campaign progress'],ordinaryInput:'Only an initial unsolved control/focus smoke here; independent ordinary play is separate'});save()}
 await context.close()}assert.equal(hash(),tested,'Runtime or test source changed during suite; rerun required');report.sourceHash=tested;report.passed=report.cases.length===54;save()}finally{await browser.close()}})().catch(e=>{report.error=e.stack;report.passed=false;save();console.error(e);process.exitCode=1});
