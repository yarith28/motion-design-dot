import {engines} from '../relation-room/engines.mjs';
import {graphPlans} from './relation-room-graph-plans.mjs';
import {semanticPlans,countBDD} from './relation-room-semantic-plans.mjs';
import {constructionPlans} from './relation-room-construction-plans.mjs';
import {evidencePlans} from './relation-room-evidence-plans.mjs';
export const plans={...graphPlans,...semanticPlans,...constructionPlans,...evidencePlans};
export const stageSeed=(runSeed,stage)=>(runSeed+Math.imul(stage+1,0x9e3779b9))>>>0;
export function initial(id,stage,runSeed=20261002,mode='finite'){return engines[id].init({stage,seed:stageSeed(runSeed,stage),mode})}
export function lossPlan(id,s){
 if(['twin-graph','interval-museum','modal-witness','polygon-passport','hairpin-studio','witness-table'].includes(id))return['check','check','check'];
 if(id==='letter-carries'){const good=plans[id](s).slice(0,-1),lead=s.leading[0];return[...good,'letter:'+lead,'digit:0','check','check','check'];}
 if(id==='heritage-house'){const good=plans[id](s).slice(0,-1),m=structuredClone(s);good.forEach(a=>engines[id].act(m,a));const i=s.values.findIndex((_,i)=>s.known[i]===undefined),wanted=s.traits[i]?0:1;let clicks=0,v=m.values[i];while(v!==wanted){v=(v+2)%4-1;clicks++;}return[...good,...Array.from({length:clicks},()=> 'person:'+i),'check','check','check'];}
 if(id==='invariant-gallery'){if(s.initial.every(([x])=>x<=1)&&s.transitions[0].dx===1){const cap=s.transitions[0].bound,out=['inequality:0'];for(let i=1;i<s.inequalities[0][2];i++)out.push('coefficient:2:-1');out.push('inequality:1');for(let i=cap;i<s.inequalities[1][2];i++)out.push('coefficient:2:-1');return[...out,'check','check','check'];}return['check','check','check'];}
 if(id==='knowledge-circle')return['apply','apply','apply'];
 if(id==='minor-museum')return s.edges.slice(0,s.budget+1).map(([a,b])=>'delete:'+Math.min(a,b)+','+Math.max(a,b));
 if(id==='fill-in-station'){const v=s.vertices.find(v=>s.edges.filter(e=>e.includes(v)).length>s.widthCap);if(v===undefined)throw Error('No destructive first-tier elimination');return['select:'+v,'eliminate'];}
 if(id==='alternating-couriers'){const free=Array.from({length:s.n},(_,i)=>i).find(i=>!s.match.some(([a])=>a===i));return[...Array.from({length:s.budget},()=>['walk:'+free,'cancel']).flat(),'walk:'+free];}
 if(id==='recursive-rings')return Array.from({length:s.budget+1},()=> 'ring:0');
 if(id==='ordered-echo')return [...s.sequence.map(()=> 'next-pulse'),'symbol:'+((s.sequence[0]+1)%s.alphabet)];
 if(id==='posterior-post')return['respond:0'];
 if(id==='heap-foundry'){const invalid=s.heap.some((v,i)=>i&&s.heap[Math.floor((i-1)/2)]>v);return invalid?['extract']:['slot:0','swap:1','extract'];}
 if(id==='diagram-order'){let bad;function search(prefix,rest){if(bad)return;if(!rest.length){if(countBDD(s.table,prefix)>s.budget)bad=prefix;return}for(const v of rest)search([...prefix,v],rest.filter(w=>w!==v))}search([],s.order);if(!bad)throw Error('No over-budget variable order');const order=s.order.slice(),out=[];for(let i=0;i<s.n;i++)while(order.indexOf(bad[i])>i){const j=order.indexOf(bad[i]);out.push('up:'+bad[i]);[order[j-1],order[j]]=[order[j],order[j-1]];}return[...out,'check','check','check'];}
 if(id==='one-lie-archive')return['identify:0'];
 if(id==='turning-council'){const e=engines[id];for(let i=0;i<36;i++)if(!s.board[i])for(let q=0;q<4;q++)for(const d of [-1,1]){const test=structuredClone(s),out=['place:'+i,`rotate:${q}:${d}`];out.forEach(a=>e.act(test,a));if(test.outcome==='loss')return out;}throw Error('No immediate natural tactical loss at this study');}
 throw Error('No loss plan '+id);
}
export function runPlan(id,s,plan){for(const a of plan)engines[id].act(s,a);return s;}
