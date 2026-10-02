/* Exact preservation of the user's confirmed 300-game release and unrelated apps. */
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const baseline=require('./fixtures/baseline300.json'),inventory=require('../inventory.json');
assert.equal(baseline.games.length,300);
for(const [file,hash]of Object.entries(baseline.files))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),hash,'300-game baseline or unrelated app changed: '+file);
assert.equal(Object.keys(baseline.previewFiles).length,290,'All original room previews must be preserved');
for(const [file,hash]of Object.entries(baseline.previewFiles))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),hash,'Original game preview changed: '+file);
for(const game of baseline.games)assert.deepEqual(inventory.games.find(g=>g.id===game.id),game,'Baseline inventory entry changed: '+game.id);
console.log(JSON.stringify({passed:true,baseline:baseline.commit,preservedGames:300,preservedFiles:Object.keys(baseline.files).length,preservedPreviews:Object.keys(baseline.previewFiles).length,scope:'Exact runtime/inventory/preview preservation including Kitchen Cats and motion showcase; not gameplay evidence.'}));
