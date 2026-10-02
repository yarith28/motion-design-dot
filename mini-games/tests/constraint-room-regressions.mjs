/* Pure-model rule isolation complements, and never substitutes for, the native UI wins. */
import assert from 'node:assert/strict';
import {engines} from '../constraint-room/engines.mjs';
import {plan} from './constraint-room-solvers.mjs';
const range=n=>Array.from({length:n},(_,i)=>i),base=extra=>({outcome:'playing',note:'',score:0,edits:0,...extra});
export function runRegressions(){const cases=[];function check(id,state,expected,pattern){engines[id].act(state,'check');assert.equal(state.outcome,expected,id+' '+state.note);if(pattern)assert.match(state.note,pattern);cases.push({id,assertion:pattern?.source||'alternate valid public constraint solution accepted',outcome:expected})}
check('lamp-ward',base({n:3,walls:[],clues:{},cells:[1,1,1,0,0,0,0,0,0]}),'loss',/sees another lamp/);
check('star-charter',base({n:4,regions:range(16).map(i=>Math.floor(i/4)),cells:range(16).map(i=>[0,6,9,15].includes(i)?1:0)}),'loss',/touches another star/);
check('magnet-ledger',base({n:2,h:2,slots:[[0,1],[2,3]],values:[1,1],plus:{rows:[1,1],cols:[2,0]},minus:{rows:[1,1],cols:[0,2]}}),'loss',/Equal poles touch/);
check('region-census',base({n:2,max:6,givens:{},cells:[2,2,2,2]}),'loss',/labeled 2 but has 4/);
check('region-census',base({n:2,max:6,givens:{},cells:[4,4,4,4]}),'win');
check('mosaic-ring',base({n:3,clues:{4:[4]},cells:[1,1,1,0,0,1,0,0,0]}),'win');
check('mosaic-ring',base({n:3,clues:{4:[1,1,1,1]},cells:[1,0,1,0,0,0,1,0,1]}),'loss',/one connected mosaic/);
for(const dark of [4,8])check('sight-garden',base({n:3,clues:{0:5},cells:range(9).map(i=>i===dark?1:0)}),'win');
check('sight-garden',base({n:3,clues:{0:5},cells:range(9).map(i=>[4,5].includes(i)?1:0)}),'loss',/cannot share an edge/);
check('diagonal-grove',base({n:2,clues:{},cells:[0,1,1,0]}),'loss',/closed cycle/);
check('diagonal-grove',base({n:2,clues:{},cells:[0,0,0,0]}),'win');
const thermo=base({n:2,tubes:[[0,1,3],[2]],lengths:[0,0],rows:[2,0],cols:[1,1]});engines['thermometer-hall'].act(thermo,'tube:0:2');assert.deepEqual(thermo.lengths,[2,0]);check('thermometer-hall',thermo,'win');
const compass=base({n:4,hubs:[[0,3],[3,3]],arms:[[0,0,0,0],[0,0,0,0]],selected:0});engines['compass-estate'].act(compass,'cell:2');engines['compass-estate'].act(compass,'hub:1');engines['compass-estate'].act(compass,'cell:1');assert.deepEqual(compass.arms,[[0,2,0,0],[0,0,0,0]]);assert.match(compass.note,/cross another estate/);cases.push({id:'compass-estate',assertion:'overlapping straight ray is refused without changing arms',outcome:'playing'});
check('fleet-blueprint',base({n:3,fleet:[1,1],fixed:{},rows:[1,1,0],cols:[1,1,0],cells:range(9).map(i=>[0,4].includes(i)?1:0)}),'loss',/touch diagonally/);
const n=4,nodes=[0,1,4,5,10,11,14,15],cycles=[[0,1],[1,5],[5,4],[4,0],[10,11],[11,15],[15,14],[14,10]],clues=Object.fromEntries(range(16).filter(i=>!nodes.includes(i)).map(i=>[i,{d:0,want:0}]));check('shade-detour',base({n,clues,edges:cycles,links:cycles.map(()=>1),cells:Array(16).fill(0)}),'loss',/more than one loop/);
check('quiet-rooms',base({n:3,count:3,regions:range(9).map(i=>i%3),quotas:[0,0,0],cells:Array(9).fill(0)}),'loss',/more than two rooms/);
const samePieces=[0,1,2,3,4,9,14,19],region=range(25).map(i=>[4,9,14,19].includes(i)?1:0);check('four-forms',base({n:5,count:2,regions:region,cells:range(25).map(i=>samePieces.includes(i)?1:0)}),'loss',/same tetromino shape/);
check('domino-register',base({n:2,h:2,values:[0,0,0,0],joined:[1,0,3,2]}),'loss',/used twice/);
const euler=engines['once-through'].init({stage:0,seed:0x13579,mode:'finite'}),before=structuredClone(euler);engines['once-through'].act(euler,'node:'+euler.at);assert.deepEqual(euler.used,before.used);assert.equal(euler.at,before.at);cases.push({id:'once-through',assertion:'current-station action cannot consume a bridge',outcome:'playing'});
const cyclic=engines['cyclic-courtyard'].init({stage:0,seed:42,mode:'finite'}),original=[...cyclic.cells];engines['cyclic-courtyard'].act(cyclic,'shift:row:0:1');assert.deepEqual(cyclic.cells.slice(0,3),[original[2],original[0],original[1]]);assert.deepEqual(cyclic.cells.slice(3),original.slice(3));cases.push({id:'cyclic-courtyard',assertion:'row shift wraps endpoint and preserves other rows',outcome:'playing'});
const seam=engines['seam-quilt'].init({stage:0,seed:33,mode:'finite'});engines['seam-quilt'].act(seam,'tile:0');engines['seam-quilt'].act(seam,'cell:0');engines['seam-quilt'].act(seam,'cell:1');assert.deepEqual(seam.placed,[-1,0,-1,-1]);cases.push({id:'seam-quilt',assertion:'a placed tile moves without creating a duplicate',outcome:'playing'});
check('exclusive-print',base({n:2,target:[1,1,0,0],budget:2,plates:[[0,1],[0]],chosen:[1,1]}),'loss',/has 2 coats; needs 1/);
check('window-tally',base({n:3,clues:{0:1},cells:[1,0,0,0,0,0,0,0,0]}),'win');
check('window-tally',base({n:3,clues:{0:4},cells:[1,1,0,1,1,0,0,0,0]}),'win');
check('weighted-weft',base({n:2,rows:[1,2],cols:[1,2],cells:[1,0,0,1]}),'win');
check('weighted-weft',base({n:2,rows:[1,1],cols:[1,1],cells:[1,0,0,1]}),'loss',/weighted sum is 2/);
// Construction invariants: paired slots, rooted tube paths, connected regions and long-stage bounded dimensions.
for(const id of Object.keys(engines))for(let k=0;k<100;k++){const s=engines[id].init({stage:k%3===0?100000:k%3,seed:(0x45933+Math.imul(k,0x71c31527))>>>0,mode:'endless'});assert.ok(s.n>=2&&s.n<=8);if(id==='thermometer-hall'){assert.equal(new Set(s.tubes.flat()).size,s.n*s.n);for(const tube of s.tubes)for(let i=1;i<tube.length;i++){const a=tube[i-1],b=tube[i];assert.equal(Math.abs(a%s.n-b%s.n)+Math.abs(Math.floor(a/s.n)-Math.floor(b/s.n)),1)}}if(id==='magnet-ledger'){assert.equal(new Set(s.slots.flat()).size,s.n*s.h);for(const[a,b]of s.slots)assert.equal(Math.abs(a%s.n-b%s.n)+Math.abs(Math.floor(a/s.n)-Math.floor(b/s.n)),1)}assert.equal(Object.hasOwn(s,'answer'),false);assert.equal(Object.hasOwn(s,'solution'),false)}
assert.equal(new Set(cases.map(c=>c.id)).size,20);return{passed:true,cases,generationSamples:2000,limits:['Rule-isolation fixtures mutate only pure model objects, never browser state.','The UI suite separately executes all finite and optional-mode wins and recoverable losses.','Two alternate Sight Garden masks with identical public clues are explicitly accepted; uniqueness is not assumed.']}}
