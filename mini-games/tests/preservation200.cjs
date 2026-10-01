const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const baseline=require('./fixtures/baseline200.json'),inventory=require('../inventory.json');
for(const [file,hash] of Object.entries(baseline.files))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),hash,'Remediated baseline changed: '+file);
assert.equal(baseline.games.length,200);
for(const game of baseline.games)assert.deepEqual(inventory.games.find(g=>g.id===game.id),game,'Remediated inventory changed: '+game.id);
console.log(JSON.stringify({passed:true,baseline:baseline.commit,preservedGames:200,preservedFiles:Object.keys(baseline.files).length,scope:'Exact source preservation; not gameplay evidence'}));
