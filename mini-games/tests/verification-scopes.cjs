/* Validate evidence coverage; this module does not run games or create reports. */
const assert=require('node:assert/strict'),path=require('node:path');
const SHA256=/^[a-f0-9]{64}$/;
function relativeSource(file,label){
 assert.equal(typeof file,'string',label+' source path');
 assert(file.length>0&&!path.isAbsolute(file)&&!file.split(/[\\/]/).includes('..')&&!file.includes('\0'),label+' relative source path');
}
function ordinaryCampaigns(report,{label,expectedIds,roomForId,runtimeFiles,hashFile}){
 assert(report&&typeof report==='object',label+' report');
 assert(Array.isArray(report.samples),label+' samples');
 assert(Array.isArray(report.limits)&&report.limits.length>0,label+' disclosed limits');
 assert(report.summary&&typeof report.summary==='object',label+' summary');
 const latest=report.summary.latestSamples;
 assert(latest&&typeof latest==='object'&&!Array.isArray(latest),label+' latest sample map');
 const entries=Object.entries(latest);
 assert.equal(entries.length,6,label+' exactly six latest campaigns');
 const ids=entries.map(([id])=>id),indices=entries.map(([,index])=>index);
 assert.equal(new Set(ids).size,6,label+' distinct latest game IDs');
 assert.equal(new Set(indices).size,6,label+' distinct latest sample indices');
 const samples=[];
 for(const[id,index]of entries){
  assert(expectedIds.has(id),label+' game outside reviewed batch: '+id);
  assert(Number.isInteger(index)&&index>=0&&index<report.samples.length,label+' valid sample index for '+id);
  const sample=report.samples[index],room=roomForId(id);
  assert(sample&&typeof sample==='object',label+' sample '+id);
  assert.equal(sample.id,id,label+' indexed game');
  assert.equal(typeof room,'string',label+' expected room for '+id);
  assert.equal(sample.room,room,id+' sample room');
  assert.equal(sample.fullCampaignWin,true,id+' full campaign win');
  assert.deepEqual(sample.finiteStudiesObservedWon,[0,1,2],id+' all three finite studies');
  assert.equal(sample.naturalFailureObserved,true,id+' natural failure');
  assert.equal(sample.sourceUnchanged,true,id+' source unchanged');
  assert.deepEqual(sample.browserErrors,[],id+' browser errors');
  assert(Array.isArray(sample.actions)&&sample.actions.length>10,id+' recorded ordinary actions');
  for(const key of['beforeHashes','afterHashes']){
   const hashes=sample[key];assert(hashes&&typeof hashes==='object'&&!Array.isArray(hashes),id+' '+key);
   assert(Object.keys(hashes).length>0,id+' nonempty '+key);
  }
  assert.deepEqual(sample.beforeHashes,sample.afterHashes,id+' before/after source binding');
  const required=runtimeFiles(room);
  assert(Array.isArray(required)&&required.length>0,id+' expected room/Journey runtime');
  for(const file of required)assert(Object.hasOwn(sample.afterHashes,file),id+' missing runtime binding '+file);
  for(const[file,hash]of Object.entries(sample.afterHashes)){
   relativeSource(file,id);assert(typeof hash==='string'&&SHA256.test(hash),id+' SHA256 source binding '+file);
   assert.equal(hashFile(file),hash,id+' stale ordinary source '+file);
  }
  samples.push(sample);
 }
 const currentWins=samples.filter(sample=>sample.fullCampaignWin===true&&JSON.stringify(sample.finiteStudiesObservedWon)==='[0,1,2]').length;
 assert.equal(report.summary.uniqueGamesReviewed,new Set(ids).size,label+' derived unique campaign count');
 assert.equal(report.summary.currentCampaignWins,currentWins,label+' derived current campaign wins');
 assert.equal(currentWins,6,label+' six observed current campaign wins');
 return{ids,samples,currentWins};
}
function openingControls(report,{metadata,seeds=[0,1,20261002,4294967295]}){
 assert.equal(report.passed,true,'Opening regression passed');
 assert(Array.isArray(metadata)&&metadata.length>0,'Opening metadata');
 const games=new Map(metadata.map(game=>[game.id,game]));
 assert.equal(games.size,metadata.length,'Distinct opening metadata IDs');
 const profiles=['desktop-mouse','mobile-touch'];
 assert.equal(report.games,games.size,'Opening game count');
 assert.deepEqual(report.seeds,seeds,'Opening replay seed coverage');
 assert.deepEqual(report.errors,[],'Opening browser errors');
 assert(Array.isArray(report.cases),'Opening cases');
 const expected=new Set(metadata.flatMap(game=>profiles.flatMap(profile=>seeds.map(seed=>JSON.stringify([game.id,profile,seed])))));
 assert.equal(report.cases.length,expected.size,'Exact opening case count');
 const observed=new Set();
 for(const c of report.cases){
  assert(c&&typeof c==='object','Opening case record');
  assert(games.has(c.id),'Unknown opening game '+c.id);
  assert(profiles.includes(c.profile),c.id+' unknown opening input profile '+c.profile);
  assert(seeds.includes(c.seed),c.id+' unknown opening seed '+c.seed);
  const key=JSON.stringify([c.id,c.profile,c.seed]);
  assert(!observed.has(key),'Duplicate opening tuple '+key);observed.add(key);
  assert.equal(c.enabled,true,c.id+' enabled opening control');
  assert.equal(c.nativeAction,true,c.id+' native opening input');
  assert.equal(c.feedbackChanged,true,c.id+' meaningful opening feedback');
  const game=games.get(c.id),selector=game.smoke?.actionSelector||game.smoke?.action;
  assert(typeof selector==='string'&&selector.length>0&&selector!=='#restart',c.id+' manifest gameplay selector');
  assert.equal(c.selector,selector,c.id+' tested manifest opening selector');
 }
 assert.deepEqual([...observed].sort(),[...expected].sort(),'Exact game/profile/seed Cartesian coverage');
 return{games:games.size,cases:observed.size,profiles,seeds};
}
module.exports={ordinaryCampaigns,openingControls};
