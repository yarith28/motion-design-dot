/* Source-binding and complete ID coverage, never inferred feasibility or play evidence. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),mini=path.join(root,'mini-games');
const baseline=require('./fixtures/baseline300.json'),inventory=require('../inventory.json');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function verify(report,expected,label){
 assert(Array.isArray(report.games),label+' rows missing');assert.equal(report.games.length,expected.length,label+' exact game count');
 assert.equal(new Set(report.games.map(g=>g.id)).size,expected.length,label+' duplicate rows');
 const allowed=new Set(expected.map(g=>g.id));let files=new Set(),excerpts=0;
 for(const row of report.games){
  assert(allowed.has(row.id),label+' unknown game '+row.id);const original=expected.find(g=>g.id===row.id);assert.equal(row.name,original.name);assert.equal(row.family,original.family);
  for(const field of ['currentEndCondition','feasibilityReason','finitePreservedReason','reviewMethod'])assert.equal(typeof row[field],'string',row.id+' '+field);assert.equal(row.reviewStatus,'complete',row.id+' review incomplete');
  assert(['existing','suitable','conditional','inappropriate'].includes(row.feasibility),row.id+' classification');
  assert.equal(typeof row.currentEndlessSupport?.optionalModeImplemented,'boolean',row.id+' missing current support');
  assert(row.optionalModeDesign&&typeof row.optionalModeDesign.design==='string'&&row.optionalModeDesign.design.length>30,row.id+' concrete optional design');
  assert(typeof row.optionalModeDesign.scoringFailureReset==='string'&&row.optionalModeDesign.scoringFailureReset.length>20,row.id+' score/failure/restart design');
  assert(row.sourceFiles?.length>0&&row.sourceEvidence?.length>0,row.id+' source evidence required');
  const rowFiles=new Set();
  for(const source of row.sourceFiles){assert(source.path.startsWith('mini-games/')&&!source.path.includes('..'),row.id+' source path');const p=path.join(root,source.path);assert.equal(hash(p),source.sha256,row.id+' audited source changed: '+source.path);rowFiles.add(source.path);files.add(source.path)}
  for(const e of row.sourceEvidence){assert(rowFiles.has(e.file),row.id+' excerpt without source hash');assert(Number.isInteger(e.line)&&e.line>0);assert(typeof e.function==='string'&&e.function.length>0);assert(typeof e.excerpt==='string'&&e.excerpt.length>0);const text=fs.readFileSync(path.join(root,e.file),'utf8').split(/\r?\n/)[e.line-1];assert(text?.includes(e.excerpt),row.id+' stale excerpt '+e.file+':'+e.line);excerpts++}
 }
 assert.deepEqual([...allowed].sort(),report.games.map(g=>g.id).sort(),label+' inventory coverage');return {reviewed:report.games.length,sourceFiles:files.size,excerpts};
}
const initial=JSON.parse(fs.readFileSync(path.join(mini,'review400/endless-baseline.json')));assert.equal(initial.baselineCommit,baseline.commit);assert.equal(initial.inventorySha256,baseline.inventorySha256);const results={baseline:verify(initial,baseline.games,'baseline300')};
const final=path.join(mini,'review400/endless-all.json');
if(inventory.games.length>300||process.env.REQUIRE_FULL_AUDIT==='1'){assert(fs.existsSync(final),'The expanded catalog requires a complete source-bound endless-all.json');results.current=verify(JSON.parse(fs.readFileSync(final)),inventory.games,'current inventory')}
console.log(JSON.stringify({passed:true,...results,scope:'Checks exact audit coverage, current source hashes and quoted source anchors; classifications are human/agent source review, not browser certification.'}));
