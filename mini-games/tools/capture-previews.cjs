/* Captures real game boards for static catalog previews; Playwright is test-only. */
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.BASE_URL||'http://127.0.0.1:8790';
(async()=>{fs.mkdirSync(path.join(root,'previews'),{recursive:true});const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true});const page=await browser.newPage({viewport:{width:1120,height:940},reducedMotion:'reduce'});
for(const room of process.argv.slice(2)){for(const game of JSON.parse(fs.readFileSync(path.join(root,room,'games.json')))){
 await page.goto(base+'/mini-games/'+game.url);await page.waitForSelector('body[data-game-ready="true"]');
 const added={'systems-room':'.desk','tabletop-room':'#play-area','puzzle-lab':'#board','kinetic-room':'#board','discovery-room':'#board'};
 if(added[room]){
  if(await page.locator('#start').isVisible())await page.locator('#start').click();
  const field=page.locator(added[room]);await field.scrollIntoViewIfNeeded();const box=await field.boundingBox();
  if(!box||box.width<20||box.height<20)throw Error('No playable preview for '+game.id);
  await page.screenshot({path:path.join(root,'previews',game.id+'.png'),clip:{x:box.x,y:box.y,width:box.width,height:Math.min(box.height,480)}});
  console.log(game.id);continue;
 }
 let field=page.locator(room==='logic-room'?'.studio':room==='number-room'?'#scene':room==='arcade-room'?'#game':'#board');
 if(!await field.count())field=page.locator('.tabletop');
 await field.screenshot({path:path.join(root,'previews',game.id+'.png')});
 console.log(game.id);
}}
await browser.close();})().catch(e=>{console.error(e);process.exit(1)});
