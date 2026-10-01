import assert from 'node:assert/strict';
import fs from 'node:fs';
import rank from '../parlour-room/veiled-standard.mjs';
import orders from '../parlour-room/orders-at-dusk.mjs';
const checks=[];
function orderState(){return {seed:731,rng:731,done:false,log:[],units:[{id:0,p:0,pos:6},{id:1,p:0,pos:4},{id:2,p:1,pos:1},{id:3,p:2,pos:3}],owners:[1,-1,1,2,-1,2,0,-1,0],year:1,autumn:false,nextId:4,phase:'orders',selected:null,orders:{0:{type:'move',u:0,to:3},1:{type:'support',u:1,target:0,to:3}},botOrders:{2:{type:'move',u:2,to:4},3:{type:'hold',u:3,to:3}}};}
{
 const s=orderState();orders.move(s,'submit');assert(s.report.some(x=>x.includes('army1:')&&x.endsWith('CUT')));assert.equal(s.units.find(x=>x.id===0).pos,6);checks.push('Attack from outside supported destination cuts support even when attack bounces; supported invasion then fails');
}
{
 const s=orderState();s.units=s.units.filter(x=>x.id!==2);s.botOrders={3:{type:'move',u:3,to:4}};orders.move(s,'submit');assert(s.report.some(x=>x.includes('army1:')&&x.endsWith('holds')));assert.equal(s.units.find(x=>x.id===0).pos,3);checks.push('Attack originating at supported destination preserves support under the stated exception');
}
{
 const s={seed:731,rng:731,log:[],done:false};orders.init(s);const sealed=JSON.stringify(s.botOrders);orders.move(s,'army0');orders.move(s,'ordermove:0:7:');assert.equal(JSON.stringify(s.botOrders),sealed);checks.push('Editing a public human order does not reseal or alter opponents’ committed orders');
}
{
 const base={seed:731,rng:731,log:[],done:false,phase:'play',selected:'I0',quiet:0,units:[{id:'I0',p:1,t:'1',pos:35,live:true,reveal:false,moved:false},{id:'I1',p:1,t:'4',pos:24,live:true,reveal:false,moved:false},{id:'I2',p:1,t:'F',pos:30,live:true,reveal:false,moved:false},{id:'H0',p:2,t:'3',pos:0,live:true,reveal:false,moved:false},{id:'H1',p:2,t:'M',pos:5,live:true,reveal:false,moved:false}]};
 const x=structuredClone(base),y=structuredClone(base);y.units.find(u=>u.id==='I1').t='B';rank.move(x,'m34');rank.move(y,'m34');assert.deepEqual(x.units.filter(u=>u.p===2),y.units.filter(u=>u.p===2));checks.push('Swapping an unrevealed distant human rank for a mine does not change the tested house choice');
}
fs.writeFileSync('mini-games/coverage/independent300/uniqueness-final-two-source-audit.json',JSON.stringify({passed:true,phase:'post-ordinary-source-audit',checks,limits:['Hand-built states test narrow structural properties only, never ordinary win reachability.','Orders uses its stated simplified swap/support rules; no claim of complete Diplomacy rules equivalence.']},null,2)+'\n');console.log(checks);
