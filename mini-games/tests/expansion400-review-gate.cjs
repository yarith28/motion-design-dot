/* Release gate: exact inventory, current gameplay evidence and independently inspected sources. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const E=require('../tools/evidence.cjs'),root=path.dirname(E.root),baseline=require('./fixtures/baseline300.json');
const read=name=>JSON.parse(fs.readFileSync(path.join(E.root,name),'utf8'));
const inventory=read('inventory.json'),rooms=E.journeyRooms,metadata=rooms.flatMap(family=>read(family+'/games.json').map(game=>({...game,family})));
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
function sourceBinding(report,label){
 assert.equal(report.sourceUnchanged,true,label+' changed during sampling');
 assert(Array.isArray(report.sourceFiles)&&report.sourceFiles.length>0,label+' missing source binding');
 for(const file of report.sourceFiles){assert(file.path.startsWith('mini-games/')&&!file.path.includes('..'));assert.equal(sha(file.path),file.sha256,label+' stale source: '+file.path)}
}
function child(name){const result=spawnSync(process.execPath,[path.join(__dirname,name)],{cwd:root,stdio:'inherit'});assert.equal(result.status,0,name+' failed')}
(async()=>{
 assert.equal(inventory.games.length,400,'Exactly400 catalog games required');assert.equal(metadata.length,100);assert.equal(new Set(metadata.map(g=>g.id)).size,100);
 assert.deepEqual(inventory.games.slice(0,300),baseline.games,'Preserve all300 original inventory entries in their original order');
 assert.deepEqual(inventory.games.slice(300).map(g=>g.id).sort(),metadata.map(g=>g.id).sort(),'Exactly100 additions, no missing or unrelated entries');
 const proposals=fs.readdirSync(path.join(E.root,'design400')).filter(n=>n.endsWith('-proposals.json')).flatMap(name=>{const record=read('design400/'+name);return Array.isArray(record)?record:record.games});
 assert.equal(proposals.length,100);assert.deepEqual(proposals.map(g=>g.id).sort(),metadata.map(g=>g.id).sort(),'All additions map to concrete distinct-game proposals');
 const html=fs.readFileSync(path.join(E.root,'index.html'),'utf8');
 assert.equal((html.match(/<article\s+class="(?:feature|game-card[^\"]*)"/g)||[]).length,400,'400 actual catalog articles including featured Signal Run');
 assert(html.includes('400 games / ready to play'));assert(html.includes('data-view-choice="grid"')&&html.includes('data-view-choice="list"'));
 const modes={generatedChallengeStreams:0,matchSeries:0,finiteOnly:0};let finiteProfiles=0,optionalProfiles=0;
 for(const room of rooms){
  const games=metadata.filter(g=>g.family===room);assert.equal(games.length,20);
  const {engines}=await import(path.join(E.root,room,'engines.mjs'));assert.deepEqual(Object.keys(engines).sort(),games.map(g=>g.id).sort(),room+' engine registry');
  const run=read('coverage/suite-runs/'+room+'.json');assert(E.validRun(run,room),room+' requires a complete current byte-matched browser run');
  const report=read('coverage/'+room+'.json');assert.equal(report.passed,true);assert(Array.isArray(report.limits)&&report.limits.length>0,room+' disclose browser/solver scope');
  for(const game of games){
   assert.equal(game.stages,3,game.id+' finite studies');assert.equal(engines[game.id].stages||game.stages||3,3,game.id+' effective finite studies');
   for(const field of ['name','mechanic','description','controls'])assert(typeof game[field]==='string'&&game[field].trim().length>5,game.id+' '+field);
   assert(Array.isArray(game.rules)&&game.rules.length>=3&&game.rules.every(r=>typeof r==='string'&&r.length>8),game.id+' actual instructions');
   assert(Array.isArray(game.nearestExisting)&&game.nearestExisting.length>0,game.id+' nearest comparison');
   for(const neighbor of game.nearestExisting){const id=typeof neighbor==='string'?neighbor:neighbor.id;assert(id!==game.id&&inventory.games.some(g=>g.id===id),game.id+' unknown nearest game '+id);if(typeof neighbor==='object')assert(typeof neighbor.difference==='string'&&neighbor.difference.length>30,game.id+' concrete neighboring decisions')}
   assert.equal(typeof game.endless?.supported,'boolean');
   if(game.endless.supported){assert(['challenge-stream','match-series'].includes(game.endless.kind),game.id+' optional mode kind');modes[game.endless.kind==='match-series'?'matchSeries':'generatedChallengeStreams']++}else{assert(typeof game.endless.reason==='string'&&game.endless.reason.length>20,game.id+' finite-only reason');modes.finiteOnly++}
   for(const profile of ['desktop','mobile-touch']){
    const c=report.cases.find(c=>c.id===game.id&&c.profile===profile&&(!c.variant||c.variant==='main'));assert(c,game.id+' '+profile+' primary case');
    assert.equal(c.passed,true);assert.equal(c.outcome,'win');assert.equal(c.restart,true);assert.equal(c.finiteStudiesCompleted,3,game.id+' '+profile+' all3 finite studies');
    if(profile==='mobile-touch')assert.equal(c.touchOnly,true,game.id+' actual native touch gameplay');
    assert.equal(c.optionalMode?.supported,game.endless.supported,game.id+' tested optional gate');
    if(game.endless.supported){const o=c.optionalMode;assert.equal(o.kind,game.endless.kind);assert.equal(o.completedChallenges,2);for(const key of ['freshChallenges','scoreAccumulated','terminalRecovery','playerEndRun','lateStageProperties'])assert.equal(o[key],true,game.id+' optional '+key);assert(typeof o.lateStageScope==='string'&&o.lateStageScope.length>30,game.id+' disclose pure-model late-stage scope');optionalProfiles++}
    finiteProfiles++;
   }
  }
 }
 for(const suite of Object.keys(E.suites))assert(E.validRun(read('coverage/suite-runs/'+suite+'.json'),suite),'Stale or incomplete preserved-game suite '+suite);
 const review=read('review400/newgames-source-review.json');assert.equal(review.games.length,100);assert.deepEqual(review.games.map(g=>g.id).sort(),metadata.map(g=>g.id).sort());
 for(const game of metadata){const row=review.games.find(g=>g.id===game.id);assert.equal(row.reviewStatus,'complete');assert.equal(row.distinctMechanicReview?.sourceInspected,true);assert(row.distinctMechanicReview.difference.length>40,game.id+' distinct decisions');assert.equal(row.currentEndlessSupport.optionalModeImplemented,game.endless.supported);assert.equal(row.openFindings?.length||0,0,game.id+' unresolved source findings');for(const file of row.sourceFiles)assert.equal(sha(file.path),file.sha256,game.id+' stale independent source review');if(game.endless.supported&&game.endless.kind==='challenge-stream')assert.equal(row.generationReview.substantiveSeedVariation,true,game.id+' substantive generated variation')}
 const samples=read('review400/newgames-browser-samples.json');sourceBinding(samples,'Independent ordinary-input samples');assert.equal(samples.cases.length,100);assert.deepEqual(samples.cases.map(g=>g.id).sort(),metadata.map(g=>g.id).sort());
 for(const c of samples.cases){assert.equal(c.restartVerified,true);assert.equal(c.optionalGateVerified,true);assert.equal(c.overflow,false);assert.deepEqual(c.errors,[]);assert(c.actions.length>0,c.id+' observed native input')}
 const ordinary=read('coverage/ordinary400-constraint-review.json');assert.equal(ordinary.summary.uniqueGamesReviewed,6);assert.equal(ordinary.summary.currentCampaignWins,6);assert(Array.isArray(ordinary.limits)&&ordinary.limits.length>0);
 for(const [id,index] of Object.entries(ordinary.summary.latestSamples)){const sample=ordinary.samples[index];assert.equal(sample.id,id);assert.equal(sample.fullCampaignWin,true);assert.deepEqual(sample.finiteStudiesObservedWon,[0,1,2]);assert.equal(sample.naturalFailureObserved,true);assert.equal(sample.sourceUnchanged,true);assert.deepEqual(sample.beforeHashes,sample.afterHashes);assert.deepEqual(sample.browserErrors,[]);assert(sample.actions.length>10);for(const [file,hash] of Object.entries(sample.afterHashes))assert.equal(sha('mini-games/'+file),hash,id+' stale sampled full-campaign review');for(const file of sample.screenshots||sample.screens||[])assert(fs.statSync(path.join(E.root,file)).size>100,id+' empty ordinary screenshot')}
 const generation=read('review400/newgames-generator-samples.json');sourceBinding(generation,'Independent generator initialization samples');assert.equal(generation.cases.length,100);assert.deepEqual(generation.cases.map(c=>c.id).sort(),metadata.map(g=>g.id).sort());for(const c of generation.cases){assert.equal(c.passed,true);const game=metadata.find(g=>g.id===c.id);assert(c.initialized>=(game.endless.supported?500:300),c.id+' independent stage/seed initialization samples')}
 const previews=read('design400/preview-captures.json');assert.equal(previews.captures.length,100);assert.deepEqual(previews.captures.map(c=>c.id).sort(),metadata.map(g=>g.id).sort());assert.equal(previews.baselinePreviewChecks.passed,true);
 const toolHash=sha('mini-games/tools/capture400-previews.cjs');
 for(const p of previews.captures){assert.equal(p.opening,true);assert.deepEqual(p.gameplayActions,[]);assert.equal(p.toolHash,toolHash,p.id+' stale preview tool');assert.equal(sha('mini-games/previews/'+p.id+'.png'),p.pngSha256,p.id+' preview image changed');const h=crypto.createHash('sha256');for(const file of p.sourceFiles){assert(!file.includes('..'));h.update(file+'\0').update(fs.readFileSync(path.join(E.root,file)))}assert.equal(h.digest('hex'),p.sourceHash,p.id+' stale preview source')}
 const journey=read('coverage/journey-chromium.json');assert.equal(journey.passed,true);sourceBinding(journey,'Shared lifecycle checks');
 const openings=read('coverage/opening-controls-chromium.json');assert.equal(openings.passed,true);sourceBinding(openings,'Generated opening controls');assert.equal(openings.games,100);assert.deepEqual(openings.seeds,[0,1,20261002,4294967295]);assert.equal(openings.cases.length,800);assert.deepEqual(openings.errors,[]);for(const c of openings.cases){assert.equal(c.enabled,true);assert.equal(c.nativeAction,true);assert.equal(c.feedbackChanged,true)}
 child('preservation.cjs');child('preservation200.cjs');child('preservation300.cjs');child('expansion300-review-gate.cjs');child('endless-review.cjs');
 console.log(JSON.stringify({passed:true,originalGames:300,newGames:100,catalogGames:400,families:rooms.length,finiteProfiles,finiteStudyWins:finiteProfiles*3,optionalProfiles,optionalChallengeWins:optionalProfiles*2,modes,currentSuites:Object.keys(E.suites).length,independentOrdinarySamples:samples.cases.length,scope:'Current source-bound scripted UI completions and separate ordinary-input/source reviews. Mobile uses Chromium touch emulation. Finite/optional model witnesses and generation samples are disclosed in each report; no claim of unaided difficulty, physical-device or screen-reader certification.'}));
})().catch(error=>{console.error(error);process.exitCode=1});
