// Rule regressions use authored states. These are NOT ordinary-play evidence.
import assert from 'node:assert/strict';
import {pipsPlans,pipsApply} from '../parlour-room/homeward-pips.mjs';
import {menagerieLegal,menagerieApply,menagerieFrozen} from '../parlour-room/four-step-menagerie.mjs';
import {bannerLegal,bannerApply,bannerCheck} from '../parlour-room/returned-banner.mjs';
import {hiveLegal,hiveApply,hiveOutcome} from '../parlour-room/living-perimeter.mjs';
let p={b:[0,-2,0,0,0,0,0,0,0,0,0,6],bar:[1,0],off:[0,5]};
assert(pipsPlans(p,1,[1,2]).every(z=>z.path[0].from===-1));
p={b:[0,0,0,0,0,0,0,0,0,0,0,1],bar:[0,0],off:[6,7]};assert(pipsPlans(p,1,[1,2]).every(z=>z.path.length===1&&z.path[0].die===2));
p={b:[0,0,0,0,0,0,0,0,0,1,0,1],bar:[0,0],off:[5,7]};assert(pipsPlans(p,1,[6]).every(z=>z.path[0].from===9));
let b=[{id:'a',side:1,type:'C',p:7},{id:'b',side:1,type:'E',p:8},{id:'c',side:2,type:'M',p:13},{id:'r',side:1,type:'R',p:30},{id:'R',side:2,type:'R',p:5}];assert(!menagerieFrozen(b,b[0]));const r=menagerieApply(b,{kind:'step',id:'b',from:8,to:9});assert(!r.b.some(u=>u.id==='a'));assert(r.events.length===1);assert(menagerieFrozen(b.filter(u=>u.id!=='b'),b[0]));assert(!menagerieLegal(b,1,1).some(m=>m.kind!=='step'));assert(!menagerieLegal(b,1).some(m=>m.id==='r'&&m.to===36));
const hand=()=>Object.fromEntries(['P','S','G','B','R'].map(t=>[t,0]));let s={b:[{side:1,type:'K',p:24},{side:2,type:'K',p:4},{side:1,type:'R',p:10},{side:2,type:'S',prom:true,p:5},{side:1,type:'P',p:16}],hands:[hand(),hand()]};s.hands[0].P=1;let moves=bannerLegal(s,1);assert(!moves.some(m=>m.drop&&m.type==='P'&&(m.to<5||m.to%5===1)));const capture=moves.find(m=>m.from===10&&m.to===5);const after=bannerApply(s,1,capture);assert.equal(after.hands[0].S,1);assert(!after.b.some(u=>u.side===2&&u.type==='S'));assert(!bannerCheck(s,1));
s={b:{'0,0':[{side:1,type:'Q'}],'1,0':[{side:1,type:'A'}],'2,0':[{side:2,type:'Q'}]},reserve:[{Q:0,A:1,B:2,H:2},{Q:0,A:2,B:2,H:2}],turns:[3,3]};assert(!hiveLegal(s,1).some(m=>m.from==='1,0'));assert(hiveLegal(s,1).filter(m=>m.type).every(m=>!['1,0','1,1','2,-1','3,-1','3,0','2,1'].includes(m.to)));s.b['0,0'].push({side:2,type:'B'});assert(!hiveLegal(s,1).some(m=>m.from==='0,0'));assert.equal(hiveOutcome(s),null);
s={b:{'0,0':[{side:1,type:'Q'}],'1,0':[{side:1,type:'H'}],'2,0':[{side:2,type:'Q'}]},reserve:[{Q:0,A:2,B:2,H:1},{Q:0,A:2,B:2,H:2}],turns:[2,1]};
// The grasshopper is a bridge here and cannot jump away despite a valid line.
assert(!hiveLegal(s,1).some(m=>m.from==='1,0'));
s={b:{'0,0':[{side:1,type:'A'}],'1,0':[{side:2,type:'Q'}]},reserve:[{Q:1,A:1,B:2,H:2},{Q:0,A:2,B:2,H:2}],turns:[3,1]};assert(hiveLegal(s,1).every(m=>m.type==='Q'));
s={b:[{side:1,type:'K',p:22},{side:2,type:'K',p:0},{side:2,type:'R',p:2}],hands:[hand(),hand()]};s.hands[0].G=1;assert(bannerCheck(s,1));assert(bannerLegal(s,1).some(m=>m.drop&&m.to===12));assert(!bannerLegal(s,1).some(m=>m.drop&&m.to===11));
s={b:{'0,0':[{side:1,type:'Q'},{side:2,type:'B'}],'1,0':[{side:2,type:'Q'}]},reserve:[{Q:0,A:2,B:2,H:2},{Q:0,A:2,B:1,H:2}],turns:[1,2]};assert(!hiveLegal(s,1).some(m=>m.type));
console.log('B02–B05 authored rule regressions passed; not ordinary-play evidence.');
