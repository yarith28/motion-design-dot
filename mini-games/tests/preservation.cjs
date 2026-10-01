/* Explicit release boundary: all original games and motion showcase are preserved. */
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const baseline=require('./fixtures/baseline100.json'),inventory=require('../inventory.json');
for(const [file,expected] of Object.entries(baseline.files)){
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),expected,'Baseline runtime changed: '+file);
}
assert.equal(baseline.games.length,100);
for(const game of baseline.games)assert.deepEqual(inventory.games.find(g=>g.id===game.id),game,'Original inventory entry changed: '+game.id);
console.log(JSON.stringify({passed:true,baseline:baseline.commit,originalGames:100,preservedFiles:Object.keys(baseline.files).length,scope:'Exact source preservation, not browser execution.'}));
