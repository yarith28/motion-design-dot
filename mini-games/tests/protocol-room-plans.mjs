import{engines}from'../protocol-room/engines.mjs';
import{storagePlans}from'./protocol-room-storage-plans.mjs';
import{systemsPlans}from'./protocol-room-systems-plans.mjs';
import{networkPlans}from'./protocol-room-network-plans.mjs';
import{executionPlans}from'./protocol-room-execution-plans.mjs';
import{streamPlans}from'./protocol-room-stream-plans.mjs';
import{collaborationPlans}from'./protocol-room-collaboration-plans.mjs';
import{numericPlans}from'./protocol-room-numeric-plans.mjs';
import{systemsInternals as S,privileges}from'../protocol-room/systems.mjs';
import{numericInternals as N}from'../protocol-room/numerics.mjs';
export const stageSeed=(seed,stage)=>(seed+Math.imul(stage+1,0x9e3779b9))>>>0;
export const winPlans={...storagePlans,...systemsPlans,...networkPlans,...executionPlans,...streamPlans,...collaborationPlans,...numericPlans};
export const clone=x=>JSON.parse(JSON.stringify(x));
export function rendered(id,s){const buttons=[],ranges=[];const u={p(){},h(){},pre(){},table(){},group(){},grid(){},canvas(){},button(k,label,disabled=false){buttons.push({k,label,disabled})},range(k,label,opts){ranges.push({k,...opts})}};engines[id].render(u,s);return{buttons,ranges}}
export function replay(id,initial,a){const s=clone(initial);for(const k of a){const r=rendered(id,s),range=r.ranges.find(x=>k.startsWith(x.k+':'));if(range){const n=+k.slice(range.k.length+1);if(n<range.min||n>range.max)throw Error('Invalid range '+id+'/'+k)}else if(!r.buttons.some(b=>b.k===k&&!b.disabled))throw Error('Unavailable action '+id+'/'+k);engines[id].act(s,k);if(s.outcome!=='playing'&&k!==a.at(-1))throw Error('Actions follow terminal '+id+'/'+k)}return s}
export function winPlan(id,s){return winPlans[id](s)}
export function lossPlan(id,initial){const s=clone(initial),a=[],e=engines[id],act=k=>{if(s.outcome!=='playing')return;const r=rendered(id,s);if(!r.buttons.some(x=>x.k===k&&!x.disabled)&&!r.ranges.some(x=>k.startsWith(x.k+':')))throw Error('Disabled negative '+id+'/'+k);a.push(k);e.act(s,k)};
 switch(id){
 case'page-orchard':act('request');act('audit');break;
 case'paired-harbor':act('arrival');act('audit');break;
 case'ring-transfer':act('begin');break;
 case'branch-archive':{act('begin');const leaf=s.requests[0].changes[0][0];act('path:'+(leaf<2?'L':'R')+(leaf%2?'R':'L'));act('change');break;}
 case'safe-advance':for(let round=0;round<100&&s.outcome==='playing';round++){for(let i=0;i<s.max.length;i++)if(S.requestFor(s,i))act('select:'+i);act('bundle')}break;
 case'version-valley':act('read:0');act('refresh:0');act('refresh:0');act('refresh:0');break;
 case'lantern-ring':while(s.outcome==='playing')act('repair:'+privileges(s)[0]);break;
 case'quiet-network':act('execute:0');act('declare');break;
 case'term-tower':act('commit');break;
 case'changing-roads':act('withdraw');act('audit');break;
 case'lease-lighthouse':for(const k of winPlan(id,s).filter(k=>k!=='fence'))act(k);break;
 case'durable-ink':act('append:0:0');act('crash');break;
 case'pipeline-parade':act('issue:3');while(s.jobs[3].state==='running')act('tick');for(let i=0;i<s.program.length;i++){if(s.jobs[i].state==='squashed')continue;if(s.jobs[i].state==='waiting')act('issue:'+i);while(s.jobs[i].state==='running'&&s.outcome==='playing')act('tick');if(i===5)act('resolve');act('retire')}act('audit');break;
 case'delta-garden':act('join');act('join');act('commit');break;
 case'shared-cursors':{const p=winPlan(id,initial),end=p.indexOf('apply'),chunk=p.slice(0,end+1),index=chunk.findIndex(k=>k.startsWith('position-0:')||k==='noop:0');if(chunk[index]==='noop:0')chunk.splice(index,1);else{const old=+chunk[index].split(':')[1];chunk[index]='position-0:'+((old+1)%(initial.docs[0].length+1))}for(const k of chunk)act(k);break;}
 case'echo-seals':act('ready:red');break;
 case'timestamp-current':act('next:0');act('close:0');break;
 case'cancellation-desk':for(const t of initial.terms){act('term:'+t.id);act('plain')}act('finish');break;
 case'bracket-ferry':act('method:newton');act('anchor:lo');act('probe');if(s.outcome==='playing')act('keep-right');break;
 case'pivot-gallery':{act('release:0');act('direction:-1');const rows=N.ratios(s).filter(x=>x.step!==null&&!s.basis.includes(x.index)).sort((a,b)=>N.cmp(b.step,a.step));act('pivot:'+rows[0].index);break;}
 default:throw Error('No negative plan '+id);
 }if(s.outcome!=='loss')throw Error('Negative did not fail '+id+': '+s.note);return a}
