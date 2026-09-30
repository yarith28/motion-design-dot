/* Run against a local static server: BASE_URL=http://127.0.0.1:8790 node mini-games/tests/pebble-post.cjs */
const { chromium }=require('playwright');
const assert=require('node:assert/strict');
const base=process.env.BASE_URL||'http://127.0.0.1:8790';
function solve(cells){
  const width=Math.max(...cells.map(c=>+c.match(/column (\d+)/)[1]));
  const floor=new Set(),goals=new Set(),boxes=[];let player;
  cells.forEach((c,p)=>{if(!c.endsWith('Wall'))floor.add(p);if(c.endsWith('Stamp'))goals.add(p);if(c.endsWith('Parcel'))boxes.push(p);if(c.endsWith('Courier'))player=p;});
  const key=(p,b)=>p+':'+b.join(',');boxes.sort((a,b)=>a-b);
  const queue=[[player,boxes,'']],seen=new Set([key(player,boxes)]);
  for(let i=0;i<queue.length;i++){
    const [p,b,path]=queue[i];if(b.every(v=>goals.has(v)))return path;
    for(const [d,delta] of [['U',-width],['R',1],['D',width],['L',-1]]){
      const n=p+delta;if(!floor.has(n))continue;let bs=[...b];
      if(bs.includes(n)){if(!floor.has(n+delta)||bs.includes(n+delta))continue;bs[bs.indexOf(n)]=n+delta;bs.sort((a,b)=>a-b);}
      const k=key(n,bs);if(!seen.has(k)){seen.add(k);queue.push([n,bs,path+d]);}
    }
  }throw Error('Unsolvable board');
}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const report=[];
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:1000},isMobile:mobile,hasTouch:mobile,reducedMotion:mobile?'reduce':'no-preference'});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/mini-games/pebble-post/');
  const press=async d=>mobile?await page.locator(`[data-dir="${d}"]`).tap():await page.keyboard.press({U:'ArrowUp',R:'ArrowRight',D:'ArrowDown',L:'ArrowLeft'}[d]);
  // Walking into a wall is free; restart is repeatable; undo reverses a step.
  await press('L');await press('L');assert.equal(await page.locator('#moves').textContent(),'1 / 1');
  await page.locator('#undo').click();assert.equal(await page.locator('#moves').textContent(),'0 / 1');
  for(let i=0;i<3;i++)await page.locator('#restart').click();
  const paths=[];
  for(let i=0;i<5;i++){
   const labels=await page.locator('#board .cell').evaluateAll(c=>c.map(x=>x.getAttribute('aria-label')));
   const path=solve(labels);paths.push(path);
   assert.equal(await page.locator('#moves').textContent(),`0 / ${path.length}`);
   // Independently derived solution from accessible rendered board, no debug API.
   for(const d of path)await press(d);
   assert.equal(await page.locator('#result').isVisible(),true);
   assert.equal(await page.evaluate(()=>document.activeElement.id),'next');
   assert.equal(await page.locator('#moves').textContent(),`${path.length} / ${path.length}`);
   await page.locator('#undo').click();assert.equal(await page.locator('#result').isVisible(),false);
   await press(path.at(-1));assert.equal(await page.locator('#result').isVisible(),true);
   if(i===4){assert.match(await page.locator('#result-title').textContent(),/All signed/);assert.equal(await page.locator('#best').textContent(),'47');}
   await page.locator('#next').click();
  }
  assert.equal(await page.locator('#stop').textContent(),'1 / 5');
  // Push a parcel away from a stamp and into a wall: blocked push doesn't cost a move.
  await press('U');await press('R');await press('R');await press('D');await press('L');
  await press('L');const before=await page.locator('#moves').textContent();await press('L');assert.equal(await page.locator('#moves').textContent(),before);
  await page.locator('#restart-route').click();await page.locator('#restart-route').click();
  await page.reload();assert.equal(await page.locator('#best').textContent(),'47');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  for(const b of await page.locator('[data-dir]').all()){const r=await b.boundingBox();assert.ok(r.width>=44&&r.height>=44);}
  await page.locator('#board').focus();await page.keyboard.press('d');assert.equal(await page.locator('#result').isVisible(),true);await page.keyboard.press('z');assert.equal(await page.locator('#result').isVisible(),false);
  await page.screenshot({path:`/tmp/pebble-post-${mobile?'mobile':'desktop'}.png`,fullPage:true});
  if(mobile){await page.setViewportSize({width:320,height:720});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}
  await page.getByRole('link',{name:'← All games'}).click();assert.match(page.url(),/mini-games\/$/);
  assert.deepEqual(errors,[]);report.push({mobile,solutions:paths,total:47,errors});await context.close();
 }
 for(const failure of ['read','write']){
  const c=await browser.newContext();await c.addInitScript(mode=>{if(mode==='read')Storage.prototype.getItem=function(){throw Error('blocked')};Storage.prototype.setItem=function(){throw Error('quota')};},failure);
  const p=await c.newPage();await p.goto(base+'/mini-games/pebble-post/');
  for(let i=0;i<5;i++){const path=solve(await p.locator('#board .cell').evaluateAll(c=>c.map(x=>x.getAttribute('aria-label'))));for(const d of path)await p.locator(`[data-dir="${d}"]`).click();if(i<4)await p.locator('#next').click();}
  assert.equal(await p.locator('#best').textContent(),'47');assert.match(await p.locator('#storage-note').textContent(),/Storage unavailable/);await c.close();
 }
 await browser.close();console.log(JSON.stringify({passed:true,report,storageFailures:'read/write passed',checks:'BFS optimal solvability all 5; full routes; undo after win; blocked movement/push; restart/replay; keyboard/WASD/touch; 320px; reduced motion; navigation'}));
})().catch(e=>{console.error(e);process.exit(1)});
