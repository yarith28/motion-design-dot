const assert=require('node:assert/strict');
const baseline=require('./fixtures/baseline200.json'),inventory=require('../inventory.json');
const preservation=require('../preservation/verify.cjs').verifyRuntimeFiles(baseline.files);
assert.equal(preservation.intentionalRemediations.length,1,'Exactly one pinned Arrow Audit initialization remediation');
assert.equal(baseline.games.length,200);
for(const game of baseline.games)assert.deepEqual(inventory.games.find(g=>g.id===game.id),game,'Remediated inventory changed: '+game.id);
console.log(JSON.stringify({passed:true,baseline:baseline.commit,preservedGames:200,checkedRuntimeFiles:preservation.checkedFiles,exactFiles:preservation.exactFiles,intentionalRemediations:preservation.intentionalRemediations,scope:'Exact inventory and all other source preservation; one pinned, archived, init-only Arrow Audit generator remediation. Not gameplay evidence.'}));
