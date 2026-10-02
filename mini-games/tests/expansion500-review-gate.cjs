/* Release gate: exact inventory, current gameplay evidence and independently inspected sources. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const {ordinaryCampaigns,openingControls}=require('./verification-scopes.cjs');
const E=require('../tools/evidence.cjs'),root=path.dirname(E.root),baseline=require('./fixtures/baseline300.json'),milestone=require('./fixtures/baseline400.json');
const read=name=>JSON.parse(fs.readFileSync(path.join(E.root,name),'utf8'));
const inventory=read('inventory.json'),rooms=E.journeyRooms,metadata=rooms.flatMap(family=>read(family+'/games.json').map(game=>({...game,family})));
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
function filesIn(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?filesIn(path.join(dir,entry.name)):[path.join(dir,entry.name)])}
function ordinaryRuntimeFiles(room){return [...filesIn(path.join(E.root,room)).filter(file=>/\.(html|css|js|mjs|json)$/.test(file)),...filesIn(path.join(E.root,'journey'))].map(file=>path.relative(E.root,file)).sort()}
function sourceBinding(report,label){
 assert.equal(report.sourceUnchanged,true,label+' changed during sampling');
 assert(Array.isArray(report.sourceFiles)&&report.sourceFiles.length>0,label+' missing source binding');
 for(const file of report.sourceFiles){assert(file.path.startsWith('mini-games/')&&!file.path.includes('..'));assert.equal(sha(file.path),file.sha256,label+' stale source: '+file.path)}
}
function child(name){const result=spawnSync(process.execPath,[path.join(__dirname,name)],{cwd:root,stdio:'inherit'});assert.equal(result.status,0,name+' failed')}
(async()=>{
 assert.equal(inventory.games.length,500,'Exactly500 catalog games required');assert.equal(metadata.length,200);assert.equal(new Set(metadata.map(g=>g.id)).size,200);assert.equal(rooms.length,10);assert.deepEqual(inventory.games.slice(0,400),milestone.games,'Preserve the verified400 milestone');
 assert.deepEqual(inventory.games.slice(0,300),baseline.games,'Preserve all300 original inventory entries in their original order');
 assert.deepEqual(inventory.games.slice(300).map(g=>g.id).sort(),metadata.map(g=>g.id).sort(),'Exactly200 additions to the300 baseline, no missing or unrelated entries');
 const proposals=['design400','design500'].flatMap(folder=>fs.readdirSync(path.join(E.root,folder)).filter(n=>n.endsWith('-proposals.json')).flatMap(name=>{const record=read(folder+'/'+name);return Array.isArray(record)?record:record.games}));
 assert.equal(proposals.length,200);assert.deepEqual(proposals.map(g=>g.id).sort(),metadata.map(g=>g.id).sort(),'All additions map to concrete distinct-game proposals');
 const html=fs.readFileSync(path.join(E.root,'index.html'),'utf8');
 assert.equal((html.match(/<article\s+class="(?:feature|game-card[^\"]*)"/g)||[]).length,500,'500 actual catalog articles including featured Signal Run');
 assert(html.includes('500 games / ready to play'));assert(html.includes('data-view-choice="grid"')&&html.includes('data-view-choice="list"'));
 const filterCategories=[...html.matchAll(/data-filter="([^"]+)"/g)].map(match=>match[1]);
 assert.equal(new Set(filterCategories).size,filterCategories.length,'No duplicate category filters');
 assert.deepEqual(filterCategories.sort(),['all',...new Set(inventory.games.map(game=>game.category))].sort(),'Every catalog category has a usable filter');
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
 const preservedSuites=['browser','signal-mobile-complete','collection','afterglow','lantern-lines','tide-pool','word-weave','sky-stack','pebble-post','spatial-room','logic-room','number-room','word-room','strategy-room','arcade-room','systems-room','tabletop-room','puzzle-lab','kinetic-room','discovery-room','construct-room','parlour-room','motion-room','workbench-room'];
 assert.deepEqual(Object.keys(E.suites).sort(),[...preservedSuites,...rooms].sort(),'Exactly the current34 suite registrations');
 for(const suite of Object.keys(E.suites))assert(E.validRun(read('coverage/suite-runs/'+suite+'.json'),suite),'Stale or incomplete preserved-game suite '+suite);
 const review={games:['review400','review500'].flatMap(folder=>read(folder+'/newgames-source-review.json').games)};assert.equal(review.games.length,200);assert.deepEqual(review.games.map(g=>g.id).sort(),metadata.map(g=>g.id).sort());
 for(const game of metadata){const row=review.games.find(g=>g.id===game.id);assert.equal(row.reviewStatus,'complete');assert.equal(row.distinctMechanicReview?.sourceInspected,true);assert(row.distinctMechanicReview.difference.length>40,game.id+' distinct decisions');assert.equal(row.currentEndlessSupport.optionalModeImplemented,game.endless.supported);assert.equal(row.openFindings?.length||0,0,game.id+' unresolved source findings');for(const file of row.sourceFiles)assert.equal(sha(file.path),file.sha256,game.id+' stale independent source review');if(game.endless.supported&&game.endless.kind==='challenge-stream')assert.equal(row.generationReview.substantiveSeedVariation,true,game.id+' substantive generated variation')}
 const sampleReports=['review400','review500'].map(folder=>read(folder+'/newgames-browser-samples.json'));for(const report of sampleReports)sourceBinding(report,'Independent ordinary-input samples');const samples={cases:sampleReports.flatMap(report=>report.cases)};assert.equal(samples.cases.length,200);assert.deepEqual(samples.cases.map(g=>g.id).sort(),metadata.map(g=>g.id).sort());
 for(const c of samples.cases){assert.equal(c.restartVerified,true);assert.equal(c.optionalGateVerified,true);assert.equal(c.overflow,false);assert.deepEqual(c.errors,[]);assert(c.actions.length>0,c.id+' observed native input')}
 let ordinaryCampaignWins=0;
 for(const [file,start] of [['coverage/ordinary400-constraint-review.json',300],['coverage/ordinary500-review.json',400]]){
  const ordinary=read(file),checked=ordinaryCampaigns(ordinary,{label:file,expectedIds:new Set(inventory.games.slice(start,start+100).map(game=>game.id)),roomForId:id=>metadata.find(game=>game.id===id)?.family,runtimeFiles:ordinaryRuntimeFiles,hashFile:file=>sha('mini-games/'+file)});
  ordinaryCampaignWins+=checked.currentWins;
  for(const sample of checked.samples){const screenshots=sample.screenshots||sample.screens||[];assert(Array.isArray(screenshots),sample.id+' screenshot list');for(const file of screenshots)assert(fs.statSync(path.join(E.root,file)).size>100,sample.id+' empty ordinary screenshot')}
 }
 const generationReports=['review400','review500'].map(folder=>read(folder+'/newgames-generator-samples.json'));for(const report of generationReports)sourceBinding(report,'Independent generator initialization samples');const generation={cases:generationReports.flatMap(report=>report.cases)};assert.equal(generation.cases.length,200);assert.deepEqual(generation.cases.map(c=>c.id).sort(),metadata.map(g=>g.id).sort());for(const c of generation.cases){assert.equal(c.passed,true);const game=metadata.find(g=>g.id===c.id);assert(c.initialized>=(game.endless.supported?500:300),c.id+' independent stage/seed initialization samples')}
 const previewReports=['design400','design500'].map(folder=>read(folder+'/preview-captures.json'));const previews={captures:previewReports.flatMap(report=>report.captures)};assert.equal(previews.captures.length,200);assert.deepEqual(previews.captures.map(c=>c.id).sort(),metadata.map(g=>g.id).sort());for(const report of previewReports)assert.equal(report.baselinePreviewChecks.passed,true);
 const firstBatch=new Set(baseline.games.map(g=>g.id));const first100=new Set(milestone.games.filter(g=>!firstBatch.has(g.id)).map(g=>g.id));
 for(const p of previews.captures){const toolHash=sha('mini-games/tools/'+(first100.has(p.id)?'capture400':'capture500')+'-previews.cjs');if(p.id==='branch-archive'){assert.equal(p.opening,false);assert.deepEqual(p.gameplayActions,[{selector:'#board [data-action="begin"]',inputMethod:'native mouse click'}]);assert.equal(p.stage,0);assert.equal(p.mode,'finite')}else{assert.equal(p.opening,true);assert.deepEqual(p.gameplayActions,[])}assert.equal(p.toolHash,toolHash,p.id+' stale preview tool');assert.equal(sha('mini-games/previews/'+p.id+'.png'),p.pngSha256,p.id+' preview image changed');const h=crypto.createHash('sha256');for(const file of p.sourceFiles){assert(!file.includes('..'));h.update(file+'\0').update(fs.readFileSync(path.join(E.root,file)))}assert.equal(h.digest('hex'),p.sourceHash,p.id+' stale preview source')}
 const journey=read('coverage/journey-chromium.json');assert.equal(journey.passed,true);sourceBinding(journey,'Shared lifecycle checks');
 const openings=read('coverage/opening-controls-chromium.json');sourceBinding(openings,'Generated opening controls');const openingScope=openingControls(openings,{metadata});
 child('../preservation/remediations-test.cjs');child('preservation.cjs');child('preservation200.cjs');child('preservation300.cjs');child('preservation400.cjs');child('expansion300-review-gate.cjs');child('endless-review.cjs');
 console.log(JSON.stringify({passed:true,originalGames:300,preservedMilestoneGames:400,newGames:200,catalogGames:500,families:rooms.length,finiteProfiles,finiteStudyWins:finiteProfiles*3,optionalProfiles,optionalChallengeWins:optionalProfiles*2,modes,currentSuites:Object.keys(E.suites).length,independentOrdinarySamples:samples.cases.length,ordinaryCampaignWins,openingCases:openingScope.cases,scope:'Current source-bound scripted UI completions and separate ordinary-input/source reviews. Mobile uses Chromium touch emulation. Finite/optional model witnesses and generation samples are disclosed in each report; no claim of unaided difficulty, physical-device or screen-reader certification.'}));
})().catch(error=>{console.error(error);process.exitCode=1});
