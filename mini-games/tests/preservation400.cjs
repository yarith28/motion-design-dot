/* Preserve the 400-game milestone, with only the pinned Arrow Audit init remediation. */
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const baseline=require('./fixtures/baseline400.json'),inventory=require('../inventory.json');
assert.equal(baseline.games.length,400);assert.match(baseline.commit,/^[a-f0-9]{40}$/);
assert.deepEqual(inventory.games.slice(0,400),baseline.games,'Preserve the400 milestone inventory entries in order');
const preservation=require('../preservation/verify.cjs').verifyRuntimeFiles(baseline.files);
assert.equal(preservation.intentionalRemediations.length,1,'Exactly one pinned Arrow Audit initialization remediation');
assert.equal(Object.keys(baseline.previewFiles).length,390);
for(const [file,hash]of Object.entries(baseline.previewFiles))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),hash,'400-game preview changed: '+file);
console.log(JSON.stringify({passed:true,baseline:baseline.commit,preservedGames:400,checkedRuntimeFiles:preservation.checkedFiles,exactFiles:preservation.exactFiles,intentionalRemediations:preservation.intentionalRemediations,preservedPreviews:390,scope:'Exact inventory, previews and all other runtime preservation including the original300 games, Kitchen Cats and motion showcase; one pinned, archived, init-only Arrow Audit generator remediation. This does not attest gameplay or deployment.'}));
