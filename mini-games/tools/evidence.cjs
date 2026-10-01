/* Shared evidence schema: hashes content, not commit IDs or generated reports. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const original={browser:['signal-run'],'signal-mobile-complete':['signal-run'],collection:['double-take','good-order','pocket-orbit'],afterglow:['afterglow'],'lantern-lines':['lantern-lines'],'tide-pool':['tide-pool'],'word-weave':['word-weave'],'sky-stack':['sky-stack'],'pebble-post':['pebble-post']};
const expansionRooms=['systems-room','tabletop-room','puzzle-lab','kinetic-room','discovery-room'];
const rooms=['spatial-room','logic-room','number-room','word-room','strategy-room','arcade-room',...expansionRooms];
const helpers={afterglow:['afterglow-engine'], 'spatial-room':['gear-depth','balance-depth'],'word-room':['word-room-edges']};
const suites=Object.fromEntries([...Object.entries(original),...rooms.map(id=>[id,[id]])].map(([id,dirs])=>[id,{id,dirs,tests:[id,...(helpers[id]||[])]}]));
function filesIn(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?filesIn(path.join(dir,e.name)):[path.join(dir,e.name)]);}
function fingerprint(id){const suite=suites[id];if(!suite)throw Error('Unknown suite '+id);const files=[...suite.dirs.flatMap(d=>filesIn(path.join(root,d))),...fs.readdirSync(root).filter(n=>/\.(html|css|js|json)$/.test(n)&&!['progress.json','inventory-plan.json'].includes(n)&&!n.startsWith('design-')).map(n=>path.join(root,n)),...[...new Set([...suite.tests.map(n=>n+'.cjs'),...fs.readdirSync(path.join(root,'tests')).filter(n=>expansionRooms.includes(id)&&n.startsWith(id.split('-')[0]+'-'))])].map(n=>path.join(root,'tests',n)),...(expansionRooms.includes(id)?filesIn(path.join(root,'tests','fixtures')):[]),__filename,path.join(__dirname,'run-suite.cjs')].sort();const h=crypto.createHash('sha256');for(const file of files)h.update(path.relative(root,file)+'\0').update(fs.readFileSync(file)).update('\0');return {sha256:h.digest('hex'),files:files.map(f=>path.relative(root,f))};}
function gameIds(id){return original[id]||JSON.parse(fs.readFileSync(path.join(root,id,'games.json'))).map(g=>g.id);}
function scope(id){const mobileOnly=id==='signal-mobile-complete',desktopOnly=id==='browser';return {desktopCompletion:!mobileOnly,mobileViewportCompletion:!desktopOnly,touchGameplayCompletion:!desktopOnly&&!['arcade-room','afterglow','word-room','number-room','word-weave','pebble-post',...expansionRooms].includes(id),touchControlSmoke:!mobileOnly,completionMeans:['strategy-room','tabletop-room'].includes(id)?'terminal result; competitive losses and draws count':'winning full progression',method:['browser','signal-mobile-complete','collection','afterglow','logic-room','arcade-room'].includes(id)?'solver-directed UI with read-only injected observations; timing suites control virtual time':'scripted UI; curated answers or board solvers',mobileMethod:['word-weave','pebble-post'].includes(id)?'touch gameplay mixed with mouse check/undo actions':id==='arcade-room'?'keyboard/mouse solver in mobile viewport; separate touch smoke':id==='afterglow'?'DOM-set aiming with touch launch and upgrades':id==='word-room'?'touch buttons mixed with programmatic text entry':id==='number-room'?'touch controls mixed with keyboard/range actions':desktopOnly?'touch smoke only':'touch gameplay with scripted navigation/solvers'};}
const partialOptions=['GAMES','GAME_IDS','GAME','EDGE_ONLY','ONLY_GAME','RESUME','SKIP_DEEP'];
function runtimeFingerprint(id){const files=fingerprint(id).files.filter(f=>!f.startsWith('tests/')&&!f.startsWith('tools/'));const h=crypto.createHash('sha256');for(const f of files)h.update(f+'\0').update(fs.readFileSync(path.join(root,f))).update('\0');return {sha256:h.digest('hex'),files};}
function validRun(run,id){if(!run||typeof run!=='object')return false;const start=Date.parse(run.startedAt),finish=Date.parse(run.finishedAt),served=run.servedRuntime,verified=Date.parse(served?.verifiedAt),expected=runtimeFingerprint(id);return run.schemaVersion===2&&run.suite===id&&run.passed===true&&run.status==='passed'&&run.exitCode===0&&run.sourceUnchanged===true&&Number.isFinite(start)&&Number.isFinite(finish)&&finish>=start&&run.browser?.engine==='Chromium'&&typeof run.browser.version==='string'&&run.browser.version.trim().length>0&&run.browser.version!=='unknown'&&run.source?.sha256===fingerprint(id).sha256&&JSON.stringify(run.source?.files)===JSON.stringify(fingerprint(id).files)&&served?.passed===true&&served.sha256===expected.sha256&&served.fileCount===expected.files.length&&/^https?:\/\//.test(served.baseURL)&&verified>=start&&verified<=finish;}
function scopeForGame(id,run,game){
 const result=scope(id);
 if(!expansionRooms.includes(id))return result;
 const c=run.completionEvidence?.cases?.find(c=>c.id===game&&c.profile==='mobile-touch');
 return {...result,touchGameplayCompletion:c?.touchOnly===true,method:'Per-game UI completion, restart and edge assertions; consult case inputMethod',mobileMethod:c?.inputMethod||'No current per-game input evidence',completionMeans:run.completionEvidence?.cases?.filter(c=>c.id===game).map(c=>c.profile+': '+c.outcome).join('; ')};
}
function expansionEvidence(id){
 if(!expansionRooms.includes(id))return null;
 const file=path.join(root,'coverage',id+'.json'),bytes=fs.readFileSync(file),report=JSON.parse(bytes);
 if(report.passed!==true||!Array.isArray(report.cases))throw Error(id+': missing successful per-game evidence');
 const ids=gameIds(id),cases=[];
 if(report.cases.some(c=>!ids.includes(c.id)||!['desktop','mobile-touch'].includes(c.profile)||c.passed!==true))throw Error(id+': failed or unidentified per-game case');
 const caseKeys=report.cases.map(c=>`${c.id}/${c.profile}/${c.variant||'main'}`);
 if(new Set(caseKeys).size!==caseKeys.length)throw Error(id+': duplicate per-game/profile/variant evidence');
 for(const game of ids)for(const profile of ['desktop','mobile-touch']){
  const entry=report.cases.find(c=>c.id===game&&c.profile===profile&&(!c.variant||c.variant==='main')&&c.passed===true&&['win','loss','draw'].includes(c.outcome)&&c.restart===true&&Array.isArray(c.edgeCases)&&c.edgeCases.length>0&&c.edgeCases.every(x=>typeof x==='string'&&x.trim().length>0)&&typeof c.inputMethod==='string'&&c.inputMethod.trim().length>0);
  if(entry&&profile==='mobile-touch'&&typeof entry.touchOnly!=='boolean')throw Error(id+': mobile input scope must explicitly record touchOnly for '+game);
  if(!entry)throw Error(id+': incomplete completion/restart/edge evidence for '+game+' '+profile);
  if(id!=='tabletop-room'&&entry.outcome!=='win')throw Error(id+': solitaire progression must win for '+game+' '+profile);
  cases.push(entry);
 }
 return {sha256:crypto.createHash('sha256').update(bytes).digest('hex'),file:'coverage/'+id+'.json',cases};
}
const provenanceValidRun=validRun;
validRun=(run,id)=>{
 if(!provenanceValidRun(run,id))return false;
 if(!expansionRooms.includes(id))return true;
 try{return JSON.stringify(run.completionEvidence)===JSON.stringify(expansionEvidence(id));}catch{return false;}
};
module.exports={root,suites,fingerprint,runtimeFingerprint,gameIds,scope,validRun,partialOptions,expansionRooms,expansionEvidence,scopeForGame};
