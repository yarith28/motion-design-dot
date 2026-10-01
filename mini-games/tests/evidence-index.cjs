/* Isolated synthetic fixtures: never writes passing records into real coverage. */
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'small-hours-evidence-')),source=path.resolve(__dirname,'..'),root=path.join(temp,'mini-games');
try{
 fs.cpSync(source,root,{recursive:true,filter:p=>!p.split(path.sep).includes('coverage')});
 const E=require(path.join(root,'tools/evidence.cjs')),dir=path.join(root,'coverage/suite-runs');fs.mkdirSync(dir,{recursive:true});
 const run=()=>{const p=spawnSync(process.execPath,[path.join(root,'tools/coverage-index.cjs')],{encoding:'utf8'});assert(!p.error);return {status:p.status,report:JSON.parse(fs.readFileSync(path.join(root,'coverage/index.json')))}};
 let result=run();assert.equal(result.status,1);assert.equal(result.report.verified,0,'missing suite evidence cannot pass');
 const records={};for(const id of Object.keys(E.suites)){records[id]={schemaVersion:2,suite:id,passed:true,status:'passed',exitCode:0,sourceUnchanged:true,source:E.fingerprint(id),servedRuntime:{baseURL:'http://127.0.0.1:8790',passed:true,...E.runtimeFingerprint(id),fileCount:E.runtimeFingerprint(id).files.length,verifiedAt:'2026-01-01T00:00:30Z'},fixture:true,startedAt:'2026-01-01T00:00:00Z',finishedAt:'2026-01-01T00:01:00Z',browser:{engine:'Chromium',version:'Synthetic Chromium fixture'}};fs.writeFileSync(path.join(dir,id+'.json'),JSON.stringify(records[id]));}
 result=run();assert.equal(result.status,0);assert.equal(result.report.verified,100,'current successful fixture records accepted');
 const file=path.join(dir,'collection.json');fs.writeFileSync(file,JSON.stringify({...records.collection,passed:false,status:'failed'}));result=run();assert.equal(result.status,1);assert.equal(result.report.verified,97,'failed suite cannot pass');
 fs.writeFileSync(file,JSON.stringify(records.collection));fs.appendFileSync(path.join(root,'pocket-orbit/game.js'),'\n// synthetic stale-source fixture\n');result=run();assert.equal(result.status,1);assert.equal(result.report.verified,97,'changed runtime invalidates dependent suite');
 fs.copyFileSync(path.join(source,'pocket-orbit/game.js'),path.join(root,'pocket-orbit/game.js'));fs.writeFileSync(file,'not JSON');result=run();assert.equal(result.status,1);assert.equal(result.report.verified,97,'malformed record cannot pass');
 fs.writeFileSync(file,JSON.stringify({...records.collection,schemaVersion:0}));result=run();assert.equal(result.status,1);assert.equal(result.report.verified,97,'legacy evidence cannot pass');
 for(const patch of [{suite:'browser'},{startedAt:'invalid'},{finishedAt:'2025-01-01'},{browser:{engine:'Chromium',version:'unknown'}},{servedRuntime:null},{servedRuntime:{...records.collection.servedRuntime,sha256:'wrong'}}]){fs.writeFileSync(file,JSON.stringify({...records.collection,...patch}));assert.equal(run().status,1,'invalid provenance rejected');}
 fs.writeFileSync(file,JSON.stringify(records.collection));fs.appendFileSync(path.join(root,'README.md'),'\nSynthetic docs change\n');result=run();assert.equal(result.status,0,'documentation does not create circular staleness');
 const arcade=result.report.games.find(g=>g.id==='velvet-snake');assert.equal(arcade.fullCompletionMobileViewport,true);assert.equal(arcade.touchGameplayCompletion,false,'mobile keyboard solver is not touch completion');
 for(const option of E.partialOptions){const child=spawnSync(process.execPath,[path.join(root,'tools/run-suite.cjs'),'browser'],{env:{...process.env,[option]:'1'},encoding:'utf8'});assert.equal(child.status,2,option+' partial run rejected');assert.match(child.stderr,new RegExp('Unset '+option));}
 console.log('Evidence index: missing, failed, stale, malformed, legacy, documentation-only and input-scope fixtures passed.');
}finally{fs.rmSync(temp,{recursive:true,force:true});}
