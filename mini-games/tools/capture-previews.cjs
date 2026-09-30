/* Captures real game boards for static catalog previews; Playwright is test-only. */
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.BASE_URL||'http://127.0.0.1:8790';
(async()=>{fs.mkdirSync(path.join(root,'previews'),{recursive:true});const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true});const page=await browser.newPage({viewport:{width:1120,height:940},reducedMotion:'reduce'});
for(const room of process.argv.slice(2)){for(const game of JSON.parse(fs.readFileSync(path.join(root,room,'games.json')))){
 await page.goto(base+'/mini-games/'+game.url);await page.waitForSelector('body[data-game-ready="true"]');
 let field=page.locator(room==='logic-room'?'.studio':room==='number-room'?'#scene':room==='arcade-room'?'#game':'#board');
 if(!await field.count())field=page.locator('.tabletop');
 await field.screenshot({path:path.join(root,'previews',game.id+'.png')});
 console.log(game.id);
}}
await browser.close();})().catch(e=>{console.error(e);process.exit(1)});
