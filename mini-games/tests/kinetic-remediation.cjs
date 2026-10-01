'use strict';
// Regression checks use public controls only. Solution paths are authored/search-derived,
// not evidence of unaided play or physical-phone/screenreader usability.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:8790';
const browserName=process.env.BROWSER_ENGINE||'chromium';
const root=path.resolve(__dirname,'..');
const plans=JSON.parse(fs.readFileSync(path.join(__dirname,'kinetic-plans.json')));
const spaces={ 'lantern-heist':'wait','boulder-burrow':'wait','fuse-garden':'wait','quiet-foil':'rest','four-holds':'rest','gravity-boots':'wait','portal-parcel':'wait','echo-steps':'wait','wind-sail':'sail','scissor-lift':'settle','ricochet-duel':'wait','spring-courier':'wait','shatter-belt':'wait','lantern-defense':'wait','little-walkers':'wait'};
(async()=>{
 const browser=await(browserName==='webkit'?webkit.launch({headless:true}):chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']}));
 const evidence={browser:browserName,passed:false,cases:[],limits:['Touch is browser emulation, not a physical-device test.','No screenreader session.','Terminal paths are source-derived and replayed through public inputs, not unaided difficulty evidence.']};
 try{
 for(const touch of[false,true]){
  const context=await browser.newContext({viewport:touch?{width:390,height:844}:{width:1280,height:1000},hasTouch:touch,isMobile:touch});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const activate=async loc=>{if(touch)await loc.tap();else{await loc.focus();await page.keyboard.press('Enter')}};
  const open=async id=>{await page.goto(`${base}/mini-games/kinetic-room/?game=${id}`);await page.locator('body[data-game-ready="true"]').waitFor();await activate(page.locator('#start'))};
  const snapshot=async()=>({turn:await page.locator('#turn').innerText(),telemetry:await page.locator('#telemetry').innerText(),status:await page.locator('#status').innerText(),description:await page.locator('#description').textContent()});
  const act=async a=>activate(page.locator(`[data-action="${a}"]`));
  const seq=async actions=>{for(const a of actions){if(await page.locator('#status').evaluate(e=>!!e.className))break;await act(a)}};
  for(const[id,action]of Object.entries(spaces)){
   await open(id);assert.equal(await page.evaluate(()=>document.activeElement.id),'board',id+' start focus');
   // Literal Start→Space must operate the advertised action, not the first focused button.
   await page.evaluate(()=>{window.controlClick=null;document.querySelector('#inputs').addEventListener('click',e=>window.controlClick=e.target.closest('button')?.dataset.action,{once:true})});
   if(touch)await act(action);else await page.keyboard.press('Space');
   const actual=await snapshot();if(!touch)assert.equal(await page.evaluate(()=>window.controlClick),null,id+' Space must not synthesize another button activation');
   await open(id);await act(action);assert.deepEqual(actual,await snapshot(),id+' advertised action matches direct control');
   await activate(page.locator('#restart'));assert.equal(await page.evaluate(()=>document.activeElement.id),'board');
   // Preserve ordinary keyboard activation when a user deliberately tabs to a button.
   const first=page.locator('#inputs button').first();const firstAction=await first.getAttribute('data-action');await first.focus();await page.keyboard.press('Space');const native=await snapshot();await open(id);await act(firstAction);assert.deepEqual(native,await snapshot(),id+' native focused-button Space preserved');
   evidence.cases.push({id,profile:touch?'emulated-touch':'keyboard',check:touch?'touch action+restart+native Space':'actual Start→Space+restart+native Space',passed:true});
  }
  for(const id of['quiet-foil','phase-walk','scissor-lift','soft-sculpt']){
   await open(id);await seq(plans[id].win);assert.equal(await page.locator('#status').getAttribute('class'),'won',id+' public-input win');assert.equal(await page.locator('#inputs button:enabled').count(),0);if(id==='soft-sculpt')assert.equal(await page.locator('#sculpt-bonds button:enabled').count(),0);
   await activate(page.locator('#restart'));await seq(plans[id].loss);assert.equal(await page.locator('#status').getAttribute('class'),'lost',id+' public-input loss');if(id==='soft-sculpt'){assert.match(await page.locator('#sculpt-weights').innerText(),/fallen/);assert.match(await page.locator('#sculpt-bonds').innerText(),/fallen/)}await activate(page.locator('#restart'));assert.equal(await page.locator('#turn').innerText(),'TURN 0');
   evidence.cases.push({id,profile:touch?'emulated-touch':'keyboard',check:'full win/loss/terminal lock/restart',passed:true});
  }
  await open('quiet-foil');await seq(['in','thrust','thrust','rest','thrust','rest','thrust','thrust']);assert.notEqual(await page.locator('#status').getAttribute('class'),'won');assert.match(await page.locator('#status').innerText(),/opposing touches/);
  for(const policy of[['thrust'],['parry'],['out','rest'],['parry','thrust']]){await open('quiet-foil');await seq(Array.from({length:122},(_,i)=>policy[i%policy.length]));assert.equal(await page.locator('#status').getAttribute('class'),'lost','unconditional foil policy must not win/stall forever: '+policy)}
  await open('phase-walk');await seq(['right','up','phase']);assert.match(await page.locator('#telemetry').innerText(),/Phase B.*Unused anchors 5\/6/);await act('phase');assert.match(await page.locator('#status').innerText(),/unused anchor/);await act('undo');assert.match(await page.locator('#telemetry').innerText(),/Phase A.*Unused anchors 6\/6/);
  await open('scissor-lift');await seq(['right','up','up','up','transfer','down','down','down']);assert.equal(await page.locator('#status').getAttribute('class'),'lost');assert.match(await page.locator('#status').innerText(),/cargo struck the floor/);
  await open('soft-sculpt');assert.equal(await page.locator('#sculpt-bonds button').count(),13);await act('cut');assert.match(await page.locator('[data-bond="0"]').innerText(),/cut/);await activate(page.locator('[data-bond="4"]'));assert.match(await page.locator('#telemetry').innerText(),/Bond 5: 1–2/);assert.equal(await page.locator('[data-bond="4"]').getAttribute('aria-pressed'),'true');
  for(const width of[320,390]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.ok(await page.locator('[data-bond="0"]').evaluate(e=>parseFloat(getComputedStyle(e).fontSize))>=14);await activate(page.locator('#zoom-board'));assert.equal(await page.locator('#board').evaluate(e=>Math.round(e.getBoundingClientRect().width)),600);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await activate(page.locator('#zoom-board'))}
  await open('shatter-belt');assert.match(await page.locator('#description').textContent(),/Ship velocity/);await open('lantern-defense');await act('fire');assert.match(await page.locator('#description').textContent(),/age1\/6 growing/);
  evidence.cases.push({profile:touch?'emulated-touch':'keyboard',check:'foil old/spam/stall policies; phase anchor undo; cargo geometry; readable live sculpture list+contained zoom; essential text',passed:true});assert.deepEqual(errors,[]);await context.close();
 }
 evidence.passed=true;console.log(JSON.stringify(evidence,null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
