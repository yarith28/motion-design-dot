/* Preserve the 300-game release, with only the pinned Arrow Audit init remediation. */
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const baseline=require('./fixtures/baseline300.json'),inventory=require('../inventory.json');
assert.equal(baseline.games.length,300);
const preservation=require('../preservation/verify.cjs').verifyRuntimeFiles(baseline.files);
assert.equal(preservation.intentionalRemediations.length,1,'Exactly one pinned Arrow Audit initialization remediation');
assert.equal(Object.keys(baseline.previewFiles).length,290,'All original room previews must be preserved');
for(const [file,hash]of Object.entries(baseline.previewFiles))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),hash,'Original game preview changed: '+file);
for(const game of baseline.games)assert.deepEqual(inventory.games.find(g=>g.id===game.id),game,'Baseline inventory entry changed: '+game.id);
console.log(JSON.stringify({passed:true,baseline:baseline.commit,preservedGames:300,checkedRuntimeFiles:preservation.checkedFiles,exactFiles:preservation.exactFiles,intentionalRemediations:preservation.intentionalRemediations,preservedPreviews:Object.keys(baseline.previewFiles).length,scope:'Exact inventory, previews and all other runtime preservation including Kitchen Cats and motion showcase; one pinned, archived, init-only Arrow Audit generator remediation. Not gameplay evidence.'}));
