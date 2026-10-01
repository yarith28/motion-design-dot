/* Written source review and ordinary public-input play are separate from guided suites. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const selected=require('../design300/accepted-designs.json').games;
const rooms=['construct-room','parlour-room','motion-room','workbench-room'];
const metadata=rooms.flatMap(room=>JSON.parse(fs.readFileSync(path.join(root,'mini-games',room,'games.json'))).map(g=>({...g,room})));
assert.equal(selected.length,100);assert.equal(metadata.length,100);
assert.equal(new Set(metadata.map(g=>g.id)).size,100);
assert.equal(new Set(metadata.map(g=>g.designId)).size,100,'Each game must map to one accepted design');
for(const game of metadata)assert(selected.some(d=>d.id===game.designId),'Unapproved or missing design ID '+game.id);
const reports=['uniqueness-review.json','depth-review.json','root-review.json','cross-motion-review.json','cross-construct-review.json','cross-parlour-review.json','parlour-motion-review.json'].map(name=>{
 const file=path.join(root,'mini-games/coverage/independent300',name),report=JSON.parse(fs.readFileSync(file));
 assert.equal(report.passed,true,'Independent review not passed: '+name);
 assert(Array.isArray(report.games));assert(Array.isArray(report.limits)&&report.limits.length,'Disclose review limitations');
 return report;
});
const reviews=reports.flatMap(r=>r.games.map(g=>({...g,reviewer:r.reviewer})));
assert.equal(reviews.length,100,'All100 require independent ordinary-input evidence');
assert.equal(new Set(reviews.map(g=>g.gameId)).size,100,'Duplicate independent review cannot replace missing game');
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
for(const game of metadata){
 const review=reviews.find(r=>r.gameId===game.id);assert(review,'Missing ordinary review '+game.id);
 assert.equal(review.designId,game.designId);assert.equal(review.room,game.room);
 for(const field of ['ordinaryBeforeSource','fullWin','naturalFailure','restart'])assert.equal(review[field],true,game.id+' has no passing '+field+' evidence');
 assert(typeof review.meaningfulDecisions==='string'&&review.meaningfulDecisions.trim().length>30,'Describe observed decisions '+game.id);
 assert(typeof review.logFile==='string'&&review.logFile.startsWith('mini-games/coverage/independent300/'),'Persist ordinary evidence log '+game.id);
 const log=path.resolve(root,review.logFile);assert(log.startsWith(root+path.sep));assert(fs.statSync(log).size>100,'Empty ordinary play log '+game.id);
 assert(review.runtimeHashes&&Object.keys(review.runtimeHashes).length>=2,'Missing source-bound review '+game.id);
 assert(Object.keys(review.runtimeHashes).some(file=>file.startsWith('mini-games/'+game.room+'/')),'Review must bind own room sources '+game.id);
 for(const [file,expected] of Object.entries(review.runtimeHashes)){
  const absolute=path.resolve(root,file);assert(absolute.startsWith(root+path.sep),'Invalid review path');
  assert.equal(sha(absolute),expected,'Stale ordinary-review snapshot '+game.id+': '+file);
 }
}
console.log(JSON.stringify({passed:true,primaryGames:100,independentReviews:reviews.length,reviewers:reports.map(r=>r.reviewer),scope:'Checks existence, identity, claims and exact runtime hashes of independent ordinary-input records; does not manufacture or independently replay humanlike decisions.'}));
