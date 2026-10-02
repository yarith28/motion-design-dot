/* Source-binding and complete ID coverage, never inferred feasibility or play evidence. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),mini=path.join(root,'mini-games');
const baseline=require('./fixtures/baseline300.json'),inventory=require('../inventory.json');
const {resolveHistoricalSource,resolveCurrentSource,verifyRemediation}=require('../preservation/verify.cjs');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function verify(report,expected,label,historicalBaseline){
 assert(Array.isArray(report.games),label+' rows missing');assert.equal(report.games.length,expected.length,label+' exact game count');
 assert.equal(new Set(report.games.map(g=>g.id)).size,expected.length,label+' duplicate rows');
 const allowed=new Set(expected.map(g=>g.id));let files=new Set(),excerpts=0,historicalArchiveRows=0;
 for(const row of report.games){
  assert(allowed.has(row.id),label+' unknown game '+row.id);const original=expected.find(g=>g.id===row.id);assert.equal(row.name,original.name);assert.equal(row.family,original.family);
  for(const field of ['currentEndCondition','feasibilityReason','finitePreservedReason','reviewMethod'])assert.equal(typeof row[field],'string',row.id+' '+field);assert.equal(row.reviewStatus,'complete',row.id+' review incomplete');
  assert(['existing','suitable','conditional','inappropriate'].includes(row.feasibility),row.id+' classification');
  assert.equal(typeof row.currentEndlessSupport?.optionalModeImplemented,'boolean',row.id+' missing current support');
  assert(row.optionalModeDesign&&typeof row.optionalModeDesign.design==='string'&&row.optionalModeDesign.design.length>30,row.id+' concrete optional design');
  assert(typeof row.optionalModeDesign.scoringFailureReset==='string'&&row.optionalModeDesign.scoringFailureReset.length>20,row.id+' score/failure/restart design');
  assert(row.sourceFiles?.length>0&&row.sourceEvidence?.length>0,row.id+' source evidence required');
  const rowFiles=new Map();let archived=false;
  for(const source of row.sourceFiles){assert(source.path.startsWith('mini-games/')&&!source.path.includes('..'),row.id+' source path');const resolved=historicalBaseline===undefined?resolveCurrentSource(source.path,source.sha256,{root}):resolveHistoricalSource(source.path,source.sha256,{root,baseline:historicalBaseline});rowFiles.set(source.path,resolved.absolutePath);files.add(source.path);archived=archived||resolved.historicalArchive}
  if(archived)historicalArchiveRows++;
  for(const e of row.sourceEvidence){assert(rowFiles.has(e.file),row.id+' excerpt without source hash');assert(Number.isInteger(e.line)&&e.line>0);assert(typeof e.function==='string'&&e.function.length>0);assert(typeof e.excerpt==='string'&&e.excerpt.length>0);const text=fs.readFileSync(rowFiles.get(e.file),'utf8').split(/\r?\n/)[e.line-1];assert(text?.includes(e.excerpt),row.id+' stale excerpt '+e.file+':'+e.line);excerpts++}
 }
 assert.deepEqual([...allowed].sort(),report.games.map(g=>g.id).sort(),label+' inventory coverage');return {reviewed:report.games.length,sourceFiles:files.size,excerpts,historicalArchiveRows};
}
function verifyHistoricalPlanning(report,expected,inventorySha256){
 assert.equal(report.comparedCatalogCount,400);assert.equal(report.comparedCatalogInventorySha256,inventorySha256);assert.equal(report.games.length,100);assert.equal(new Set(report.games.map(g=>g.id)).size,100);
 const expectedIds=new Set(expected.map(g=>g.id));let files=new Set(),excerpts=0,historicalArchiveRows=0;
 for(const row of report.games){assert(expectedIds.has(row.id),'Unknown historical proposal '+row.id);assert.equal(row.actualSourceInspected,true);assert(row.sourceFiles.length>0&&row.sourceEvidence.length>0);const resolvedFiles=new Map();let archived=false;
  for(const source of row.sourceFiles){const resolved=resolveHistoricalSource(source.path,source.sha256,{root,baseline:400});resolvedFiles.set(source.path,resolved.absolutePath);files.add(source.path);archived=archived||resolved.historicalArchive}
  if(archived)historicalArchiveRows++;
  for(const e of row.sourceEvidence){assert(resolvedFiles.has(e.file),row.id+' historical comparison excerpt lacks hash');assert(Number.isInteger(e.line)&&e.line>0);assert(typeof e.function==='string'&&e.function.length>0);assert(typeof e.excerpt==='string'&&e.excerpt.length>0);assert(fs.readFileSync(resolvedFiles.get(e.file),'utf8').split(/\r?\n/)[e.line-1]?.includes(e.excerpt),row.id+' stale historical comparison');excerpts++}
 }
 assert.deepEqual(report.games.map(g=>g.id).sort(),[...expectedIds].sort());return{reviewed:100,sourceFiles:files.size,excerpts,historicalArchiveRows,scope:'Historical400 source comparisons only; actual500 implementations remain separately source-reviewed.'};
}
const initial=JSON.parse(fs.readFileSync(path.join(mini,'review400/endless-baseline.json')));assert.equal(initial.baselineCommit,baseline.commit);assert.equal(initial.inventorySha256,baseline.inventorySha256);const results={baseline:verify(initial,baseline.games,'baseline300',300)};
if(inventory.games.length>400){const baseline400=require('./fixtures/baseline400.json'),milestone=JSON.parse(fs.readFileSync(path.join(mini,'review400/endless-all.json')));results.historical400=verify(milestone,baseline400.games,'historical400',400);const oldIds=new Set(baseline400.games.map(g=>g.id));results.historicalPlanning=verifyHistoricalPlanning(JSON.parse(fs.readFileSync(path.join(mini,'design500/proposal-review.json'))),inventory.games.filter(g=>!oldIds.has(g.id)),milestone.inventorySha256)}
const final=path.join(mini,inventory.games.length>400?'review500/endless-all.json':'review400/endless-all.json');
if(inventory.games.length>300||process.env.REQUIRE_FULL_AUDIT==='1'){assert(fs.existsSync(final),'The expanded catalog requires a complete source-bound endless-all.json');const report=JSON.parse(fs.readFileSync(final));assert.equal(report.inventorySha256,hash(path.join(mini,'inventory.json')),'Endless audit must match the current catalog inventory');results.current=verify(report,inventory.games,'current inventory')}
console.log(JSON.stringify({passed:true,...results,intentionalLegacyRemediation:verifyRemediation({root}),scope:'Exact audit coverage and quoted source anchors. Historical300/400 records alone may resolve the pinned original Arrow archive after init-only byte verification; current500 source hashes always bind live bytes. Classifications are source review, not browser certification.'}));
