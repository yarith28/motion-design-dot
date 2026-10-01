/* Isolated synthetic fixtures: never writes passing records into real coverage. */
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'small-hours-evidence-')),source=path.resolve(__dirname,'..'),root=path.join(temp,'mini-games');
try{
 fs.cpSync(source,root,{recursive:true,filter:p=>!p.split(path.sep).includes('coverage')});
 const E=require(path.join(root,'tools/evidence.cjs')),dir=path.join(root,'coverage/suite-runs');fs.mkdirSync(dir,{recursive:true});
 const run=()=>{const p=spawnSync(process.execPath,[path.join(root,'tools/coverage-index.cjs')],{encoding:'utf8'});assert(!p.error);return {status:p.status,report:JSON.parse(fs.readFileSync(path.join(root,'coverage/index.json')))}};
 let result=run();assert.equal(result.status,1);assert.equal(result.report.verified,0,'missing suite evidence cannot pass');
 const total=JSON.parse(fs.readFileSync(path.join(root,'inventory.json'))).games.length;
 const records={};for(const id of Object.keys(E.suites)){records[id]={schemaVersion:2,suite:id,passed:true,status:'passed',exitCode:0,sourceUnchanged:true,source:E.fingerprint(id),servedRuntime:{baseURL:'http://127.0.0.1:8790',passed:true,...E.runtimeFingerprint(id),fileCount:E.runtimeFingerprint(id).files.length,verifiedAt:'2026-01-01T00:00:30Z'},fixture:true,startedAt:'2026-01-01T00:00:00Z',finishedAt:'2026-01-01T00:01:00Z',browser:{engine:'Chromium',version:'Synthetic Chromium fixture'}};if(E.expansionRooms.includes(id)){const cases=E.gameIds(id).flatMap(game=>['desktop','mobile-touch'].map(profile=>({id:game,profile,passed:true,outcome:'win',restart:true,edgeCases:['synthetic fixture'],inputMethod:'synthetic fixture; not gameplay',touchOnly:true})));fs.writeFileSync(path.join(root,'coverage',id+'.json'),JSON.stringify({passed:true,cases,fixture:true}));records[id].completionEvidence=E.expansionEvidence(id);}
 fs.writeFileSync(path.join(dir,id+'.json'),JSON.stringify(records[id]));}
 result=run();assert.equal(result.status,0);assert.equal(result.report.verified,total,'current successful fixture records accepted');
 const file=path.join(dir,'collection.json');fs.writeFileSync(file,JSON.stringify({...records.collection,passed:false,status:'failed'}));result=run();assert.equal(result.status,1);assert.equal(result.report.verified,total-3,'failed suite cannot pass');
 fs.writeFileSync(file,JSON.stringify(records.collection));fs.appendFileSync(path.join(root,'pocket-orbit/game.js'),'\n// synthetic stale-source fixture\n');result=run();assert.equal(result.status,1);assert.equal(result.report.verified,total-3,'changed runtime invalidates dependent suite');
 fs.copyFileSync(path.join(source,'pocket-orbit/game.js'),path.join(root,'pocket-orbit/game.js'));fs.writeFileSync(file,'not JSON');result=run();assert.equal(result.status,1);assert.equal(result.report.verified,total-3,'malformed record cannot pass');
 fs.writeFileSync(file,JSON.stringify({...records.collection,schemaVersion:0}));result=run();assert.equal(result.status,1);assert.equal(result.report.verified,total-3,'legacy evidence cannot pass');
 for(const patch of [{source:{...records.collection.source,files:[]}},{suite:'browser'},{startedAt:'invalid'},{finishedAt:'2025-01-01'},{browser:{engine:'Chromium',version:'unknown'}},{servedRuntime:null},{servedRuntime:{...records.collection.servedRuntime,sha256:'wrong'}}]){fs.writeFileSync(file,JSON.stringify({...records.collection,...patch}));assert.equal(run().status,1,'invalid provenance rejected');}
 fs.writeFileSync(file,JSON.stringify(records.collection));fs.appendFileSync(path.join(root,'README.md'),'\nSynthetic docs change\n');result=run();assert.equal(result.status,0,'documentation does not create circular staleness');
 const arcade=result.report.games.find(g=>g.id==='velvet-snake');assert.equal(arcade.fullCompletionMobileViewport,true);assert.equal(arcade.touchGameplayCompletion,false,'mobile keyboard solver is not touch completion');
 for(const option of E.partialOptions){const child=spawnSync(process.execPath,[path.join(root,'tools/run-suite.cjs'),'browser'],{env:{...process.env,[option]:'1'},encoding:'utf8'});assert.equal(child.status,2,option+' partial run rejected');assert.match(child.stderr,new RegExp('Unset '+option));}
 for(const id of E.expansionRooms){const reportFile=path.join(root,'coverage',id+'.json'),before=fs.readFileSync(reportFile);const evidence=JSON.parse(before);evidence.cases.pop();fs.writeFileSync(reportFile,JSON.stringify(evidence));assert.equal(run().status,1,'missing new-game case must fail');fs.writeFileSync(reportFile,before);}
 for(const id of E.expansionRooms){const forged=JSON.parse(JSON.stringify(records[id]));forged.completionEvidence.cases[1].touchOnly=false;const file=path.join(dir,id+'.json');fs.writeFileSync(file,JSON.stringify(forged));assert.equal(run().status,1,'edited copied-case flags cannot reuse an unchanged evidence digest');fs.writeFileSync(file,JSON.stringify(records[id]));}
 for(const id of E.expansionRooms){const file=path.join(root,'coverage',id+'.json'),before=fs.readFileSync(file),report=JSON.parse(before);report.cases.push({...report.cases[0],outcome:'loss'});fs.writeFileSync(file,JSON.stringify(report));assert.throws(()=>E.expansionEvidence(id),/duplicate/,'contradictory duplicate primary cannot be ignored');fs.writeFileSync(file,before);}
 {
  const id=E.expansionRooms[0],file=path.join(root,'coverage',id+'.json'),before=fs.readFileSync(file),evidence=JSON.parse(before),game=E.gameIds(id)[0];
  evidence.cases.find(c=>c.id===game&&c.profile==='mobile-touch').touchOnly=false;
  fs.writeFileSync(file,JSON.stringify(evidence));
  const runFile=path.join(dir,id+'.json');fs.writeFileSync(runFile,JSON.stringify({...records[id],completionEvidence:E.expansionEvidence(id)}));
  const report=run().report;assert.equal(report.games.find(g=>g.id===game)?.touchGameplayCompletion,false,'mixed mobile input is not touch-only');
  fs.writeFileSync(file,before);fs.writeFileSync(runFile,JSON.stringify(records[id]));
 }
 for(const id of E.expansionRooms){const file=path.join(root,'coverage',id+'.json'),before=fs.readFileSync(file),report=JSON.parse(before);for(const outcome of ['loss','draw']){report.cases[0].outcome=outcome;fs.writeFileSync(file,JSON.stringify(report));assert.throws(()=>E.expansionEvidence(id),/primary winning path required/,'terminal loss or draw must not certify primary winning reachability');}fs.writeFileSync(file,before);}
 const otherEngine=spawnSync(process.execPath,[path.join(root,'tools/run-suite.cjs'),'kinetic-room'],{env:{...process.env,BROWSER_ENGINE:'webkit'},encoding:'utf8'});assert.equal(otherEngine.status,2,'WebKit cannot receive a Chromium attestation');
 console.log('Evidence index: missing, failed, stale, malformed, legacy, documentation-only and input-scope fixtures passed.');
}finally{fs.rmSync(temp,{recursive:true,force:true});}
