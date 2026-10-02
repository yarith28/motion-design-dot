/* Direct screenshots of real expansion400 interfaces. No engine state injection,
   CSS rewrite, synthetic artwork, image resizing, or gameplay-success claim. */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),BASE=process.env.BASE_URL||'http://127.0.0.1:8790',SEED=20261002;
const allowed=new Set(['constraint-room','signal-lab','commons-room','field-room','atelier-room']);
const replace=process.argv.includes('--replace-new'),rooms=process.argv.slice(2).filter(x=>!x.startsWith('--'));
const captureFile=path.join(ROOT,'design400/preview-captures.json'),baseline=JSON.parse(fs.readFileSync(path.join(ROOT,'tests/fixtures/baseline300.json'))),oldIds=new Set(baseline.games.map(g=>g.id));
const sha=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
const overrides={
 'seam-quilt':{selector:'#board .table-wrap',height:760},
 'exclusive-print':{selector:'#board canvas',height:420},
 'wraparound-witness':{selector:'#board .table-wrap',height:540},
 'quorum-garden':{selector:'#board .buttons',height:480},
 'bound-names':{selector:'#board > h3',height:420},
 'credit-method':{selector:'#board',height:420},
 'separating-line':{selector:'#board canvas',height:560},
 'pruning-room':{selector:'#board canvas',height:520},
 'privacy-dials':{selector:'#board .table-wrap',height:460},
 'divisor-house':{selector:'#board .table-wrap',height:560},
 'package-yard':{selector:'#board .table-wrap',height:660},
 'orderbook-wharf':{selector:'#board .table-wrap',height:560},
 'congestion-crossing':{selector:'#board .table-wrap',height:760},
 'last-applicant':{selector:'#board',height:420},
 'seasonal-ledger':{selector:'#board .game-grid',height:480},
 'permit-and-progress':{selector:'#board .table-wrap',height:700},
 'school-of-shoals':{selector:'#board',height:520},
 'maturity-garden':{selector:'#board .table-wrap',height:540}
};
function files(dir){return fs.readdirSync(path.join(ROOT,dir),{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name)).flatMap(e=>e.isDirectory()?files(dir+'/'+e.name):[dir+'/'+e.name])}
function sources(room){return files(room).filter(f=>!/\.(md|png|jpg|webp)$/i.test(f)).concat(files('journey'),['play.css']).sort()}
function hashSources(list){const h=crypto.createHash('sha256');for(const f of list)h.update(f+'\0').update(fs.readFileSync(path.join(ROOT,f)));return h.digest('hex')}
function save(report){const temp=captureFile+'.tmp';fs.writeFileSync(temp,JSON.stringify(report,null,2)+'\n');fs.renameSync(temp,captureFile)}
function dimensions(buffer){assert.equal(buffer.subarray(0,8).toString('hex'),'89504e470d0a1a0a');return{width:buffer.readUInt32BE(16),height:buffer.readUInt32BE(20)}}
(async()=>{if(!rooms.length)throw Error('Pass explicitly frozen expansion rooms; for example constraint-room signal-lab.');for(const room of rooms)if(!allowed.has(room))throw Error('Not an expansion400 room: '+room);
 const report=fs.existsSync(captureFile)?JSON.parse(fs.readFileSync(captureFile)):{version:1,scope:'Direct opening-board screenshot previews; presentation evidence, not gameplay completion.',seed:SEED,viewport:{width:726,height:1400},oldGamesProtected:300,captures:[]};
 const toolHash=sha(fs.readFileSync(__filename)),oldPreviewHashes=new Map(fs.readdirSync(path.join(ROOT,'previews')).filter(n=>n.endsWith('.png')&&oldIds.has(n.slice(0,-4))).map(n=>[n,sha(fs.readFileSync(path.join(ROOT,'previews',n)))]));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{const page=await browser.newPage({viewport:report.viewport,deviceScaleFactor:1,reducedMotion:'reduce'});let errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const room of rooms){const gameList=JSON.parse(fs.readFileSync(path.join(ROOT,room,'games.json')));assert.equal(gameList.length,20);const sourceFiles=sources(room),sourceHash=hashSources(sourceFiles),staged=[],temp=fs.mkdtempSync(path.join(os.tmpdir(),'arcade-preview400-'));
 try{for(const game of gameList){assert.ok(!oldIds.has(game.id),'Refuse overwrite of baseline300 id '+game.id);const target=path.join(ROOT,'previews',game.id+'.png'),existing=report.captures.find(c=>c.id===game.id);
 if(fs.existsSync(target)&&!replace){if(existing&&existing.sourceHash===sourceHash&&existing.toolHash===toolHash&&existing.pngSha256===sha(fs.readFileSync(target))){staged.push({skip:true,record:existing});continue}throw Error('New preview already exists with different/unrecorded source: '+game.id+'; use --replace-new only after checking freeze.');}
 errors=[];const url=BASE+'/mini-games/'+game.url+'&seed='+SEED;await page.goto(url);await page.waitForSelector('body[data-game-ready="true"]');assert.equal(await page.locator('body').getAttribute('data-game-id'),game.id);assert.equal(await page.locator('#title').innerText(),game.name);await page.locator('#start').click();assert.equal(await page.locator('body').getAttribute('data-outcome'),'playing');
 let pausedForScreenshot=false;if(await page.locator('#pause').isVisible()){await page.locator('#pause').click();pausedForScreenshot=true}
 await page.evaluate(()=>document.fonts.ready);const config=overrides[game.id]||{},board=page.locator('#board'),boardBox=await board.boundingBox();assert.ok(boardBox&&boardBox.width>=630&&boardBox.width<=650,'Expected native640px board '+game.id);
 let selector=config.selector||game.previewSelector;if(!selector){if(await page.locator('#board canvas').count())selector='#board canvas';else if(await page.locator('#board .game-grid').count())selector='#board .game-grid';else if(await page.locator('#board .table-wrap').count())selector='#board .table-wrap';else selector='#board .buttons'}
 const anchor=page.locator(selector).first();assert.ok(await anchor.count(),'Missing preview anchor '+selector+' for '+game.id);assert.ok(await anchor.isVisible(),'Preview anchor visible '+game.id);const box=await anchor.boundingBox(),scroll=await page.evaluate(()=>({x:scrollX,y:scrollY}));
 let height=config.height||Math.max(420,Math.ceil(box.height+(selector.includes('canvas')?72:0)));height=Math.min(760,height);const clip={x:Math.floor(boardBox.x+scroll.x),y:Math.floor(box.y+scroll.y),width:640,height};
 const stagedPath=path.join(temp,game.id+'.png'),buffer=await page.screenshot({path:stagedPath,fullPage:true,clip,animations:'disabled',caret:'hide'}),size=dimensions(buffer);assert.equal(size.width,640);assert.equal(size.height,height);assert.deepEqual(errors,[],'No page error during '+game.id+' capture');
 const record={id:game.id,room,url:game.url+'&seed='+SEED,seed:SEED,mode:'finite',stage:0,opening:true,lifecycleActions:pausedForScreenshot?['begin','pause']:['begin'],gameplayActions:[],pausedForScreenshot,anchor:selector,clip,dimensions:size,sourceFiles,sourceHash,toolHash,pngSha256:sha(buffer),capturedAt:new Date().toISOString(),scope:'Real rendered opening board and nearby native controls; no gameplay-completion claim.'};staged.push({stagedPath,target,record});}
 assert.equal(hashSources(sourceFiles),sourceHash,'Room runtime changed during capture; outputs not promoted: '+room);
 for(const item of staged){if(!item.skip)fs.copyFileSync(item.stagedPath,item.target);const i=report.captures.findIndex(c=>c.id===item.record.id);if(i<0)report.captures.push(item.record);else report.captures[i]=item.record}
 report.captures.sort((a,b)=>a.room.localeCompare(b.room)||a.id.localeCompare(b.id));report.captureCount=report.captures.length;report.toolHash=toolHash;report.lastCapturedAt=new Date().toISOString();save(report);console.log(room+': '+staged.length+' real previews; runtime unchanged.');
 }finally{fs.rmSync(temp,{recursive:true,force:true})}}
 for(const[name,hash]of oldPreviewHashes)assert.equal(sha(fs.readFileSync(path.join(ROOT,'previews',name))),hash,'Baseline preview preserved '+name);
 report.baselinePreviewChecks={passed:true,count:oldPreviewHashes.size,scope:'All existing PNG files whose IDs belong to preserved300 were byte-hashed before and after this invocation.'};save(report);console.log('Total recorded: '+report.captures.length+'; baseline previews unchanged: '+oldPreviewHashes.size+'.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
