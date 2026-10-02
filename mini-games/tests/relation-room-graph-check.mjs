import assert from 'node:assert/strict';
import {graphEngines,contractGraph,eliminationStep,flipAugment,heapError,isomorphismError} from '../relation-room/graphs.mjs';
import {graphPlans} from './relation-room-graph-plans.mjs';
const cases=[];
for(const[id,e]of Object.entries(graphEngines))for(const seed of [0,1,20261002,4294967295,937182,728391])for(const stage of [0,1,2,7,100,100000]){
 const mode=stage<3?'finite':'endless',s=e.init({seed,stage,mode}),plan=graphPlans[id](s);for(const a of plan)e.act(s,a);assert.equal(s.outcome,'win',id+' '+seed+' stage'+stage);assert(Number.isFinite(s.score)&&s.score>0);cases.push({id,seed,stage,mode,actions:plan.length});
}
const minor=graphEngines['minor-museum'].init({seed:20261002,stage:0,mode:'finite'});assert.match(contractGraph(minor,0,1),/protected|adjacent/);const t=eliminationStep([0,1,2],[[0,1],[0,2]],0);assert.deepEqual(t.added,[[1,2]]);assert.deepEqual(t.edges,[[1,2]]);const m={n:2,match:[[0,1]],path:[1,3,0,2]};assert.equal(flipAugment(m),null);assert.deepEqual(m.match,[[0,0],[1,1]]);assert.match(heapError([3,1]),/Parent/);assert.equal(heapError([1,3,2]),null);assert.match(isomorphismError({n:3,mapping:[0,1,2],leftMarks:[0,0,0],rightMarks:[0,0,0],left:[[0,1]],right:[[0,1],[1,2]]}),/unwanted/);
console.log(JSON.stringify({passed:true,scope:'Independent public-field legal plans, six dispersed seeds and stages0/1/2/7/100/100000 for five graph engines; model-only, no browser completion claim.',cases:cases.length,regressions:6}));
