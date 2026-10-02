import fs from'node:fs';
import{engines}from'../civic-room/engines.mjs';
import{copy,actions,sum}from'../civic-room/core.mjs';
import{contactMoves,triadMoves,triadCounts,courtMoves}from'../civic-room/contact-and-stacks.mjs';
import{colorMoves,raceMove}from'../civic-room/forced-races.mjs';
import{loopMoves,pairLine,pairThreats,pairCaptures}from'../civic-room/lines-and-loops.mjs';
import{millMoves,millVictims,mills}from'../civic-room/mill-graph.mjs';
import{mirrorTurns,mirrorAttack}from'../civic-room/licensed-boards.mjs';
import{vaultMoves,vaultFree,sockets}from'../civic-room/supported-vault.mjs';
import{brimMoves,brimRows}from'../civic-room/row-reserves.mjs';
import{linkedPairs,linkedResult}from'../civic-room/linked-marks.mjs';
import{columnScore}from'../civic-room/card-tables.mjs';
import{supplyMoves,supplyRelays,supplied}from'../civic-room/supply-front.mjs';
import{taxResponse,clubResponse,poolResponse,networkResponse,bonusResponse}from'../civic-room/incentive-economies.mjs';
const RUN_SEED=731;
const stageSeed=n=>(RUN_SEED+Math.imul(n+1,0x9e3779b9))>>>0;
export function turnOptions(e,s){let ms=[];
 if(s.id==='last-contact')ms=contactMoves(s,1).map(m=>['square-'+m.f,'square-'+m.t]);
 if(s.id==='crossing-court')ms=courtMoves(s,1).map(m=>['square-'+m.f,'square-'+m.t]);
 if(s.id==='chromatic-command')ms=colorMoves(s,1).map(m=>['square-'+m.f,'square-'+m.t]);
 if(s.id==='chromatic-command'&&!ms.length)ms=[['pass']];
 if(s.id==='outward-and-home')ms=[0,1,2,3,4].filter(i=>raceMove(s,1,i)).map(i=>['run-'+i]);
 if(s.id==='looping-guard')ms=loopMoves(s,1).map(m=>['square-'+m.f,`move-${m.f}-${m.t}-${m.kind}-${m.d}`]);
 if(s.id==='pair-breaker')ms=actions(e,s).map(k=>[k]);
 if(s.id==='triad-and-tower'){
  for(let m of triadMoves(s,1,s.phase==='second')){let path=['square-'+m.f,`move-${m.f}-${m.t}-${m.kind}`],q=replay(e,s,path);if(q.outcome!=='playing'||q.phase==='first'){ms.push(path);continue}ms.push([...path,'finish-turn']);for(let n of triadMoves(q,1,true))ms.push([...path,'square-'+n.f,`move-${n.f}-${n.t}-${n.kind}`])}
 }
 if(s.id==='mill-and-flight'){for(let m of millMoves(s,1)){let p=m.f<0?['place-'+m.t]:['select-'+m.f,`move-${m.f}-${m.t}`],q=replay(e,s,p);if(q.phase==='capture'&&q.outcome==='playing')for(let t of millVictims(q,1))ms.push([...p,'take-'+t]);else ms.push(p)}}
 if(s.id==='mirrored-offensive')ms=mirrorTurns(s,1).sort((a,b)=>b.m.captured-a.m.captured||s.boards[b.m.b].filter(v=>v===-1).length-s.boards[a.m.b].filter(v=>v===-1).length).slice(0,40).map(({p,m})=>[`select-${p.b}-${p.f}`,`pass-${p.b}-${p.f}-${p.t}`,`select-${m.b}-${m.f}`,`attack-${m.b}-${m.f}-${m.t}`]);
 if(s.id==='marble-vault'){for(let m of vaultMoves(s,1)){let p=m.f<0?['place-'+m.t]:['select-'+m.f,`promote-${m.f}-${m.t}`],q=replay(e,s,p);if(q.phase!=='reclaim'||q.outcome!=='playing'){ms.push(p);continue}ms.push([...p,'keep']);for(let t of Array.from({length:30},(_,i)=>i).filter(t=>q.b[t]===1&&vaultFree(q,t))){let r=replay(e,q,['reclaim-'+t]);if(r.phase==='reclaim'){ms.push([...p,'reclaim-'+t,'keep']);for(let u of Array.from({length:30},(_,i)=>i).filter(u=>r.b[u]===1&&vaultFree(r,u)))ms.push([...p,'reclaim-'+t,'reclaim-'+u])}else ms.push([...p,'reclaim-'+t])}}}
 if(s.id==='double-written')ms=s.phase==='collapse'?actions(e,s).map(k=>[k]):linkedPairs(s).map(m=>['square-'+m.a,'square-'+m.b]);
 if(s.id==='brimline-reserves'){for(let m of brimMoves(s,1)){let p=['insert-'+m.i],q=replay(e,s,p),todo=[{p,q}];while(todo.length){let{p,q}=todo.pop();if(q.outcome!=='playing'||q.phase==='insert'){ms.push(p);continue}ms.push([...p,'finish']);for(let r of brimRows(q,1)){let k='row-'+r.i;todo.push({p:[...p,k],q:replay(e,q,[k])})}}}}
 if(s.id==='last-defense')ms=actions(e,s).map(k=>[k]);
 if(s.id==='covered-columns')ms=s.phase==='draw'?actions(e,s).filter(k=>k==='draw'||k==='discard').flatMap(k=>{let q=replay(e,s,[k]);return actions(e,q).map(n=>[k,n])}):actions(e,s).map(k=>[k]);
 if(s.id==='capital-lines')ms=supplyMoves(s,1).map(m=>['square-'+m.f,'square-'+m.t]).concat(supplyRelays(s,1).map(t=>['relay-'+t]));
 if(s.id==='bracket-and-effort')for(let a of[0,1,2,3])for(let b of[0,1,2,3])for(let c of[0,1,2,3]){let p=[`rate-0-${a}`,`rate-1-${b}`,`rate-2-${c}`],q=replay(e,s,p);if(actions(e,q).includes('close'))ms.push([...p,'close'])}
 if(s.id==='club-tariff')for(let f of s.turn?[s.fee]:[0,1,2,3,4,5,6])for(let p of[0,1,2,3,4,5,6])ms.push([...(s.turn?[]:['fee-'+f]),'price-'+p,'open']);
 if(s.id==='pooling-desk')for(let p of[0,1,2,3,4,5,6])for(let d of[0,1,2,3])ms.push(['premium-'+p,'deductible-'+d,'quote']);
 if(s.id==='network-tipping')for(let i of[0,1,2])for(let u of[0,1,2,3])ms.push(['invest-'+i,'subsidy-'+u,'launch']);
 if(s.id==='bonus-and-burden')for(let b of[0,1,2,3])for(let q of[0,1,2,3])for(let m of[0,1,2])for(let a of s.audits?[0,1]:[0])ms.push(['base-'+b,'quantity-'+q,'metric-'+m,'audit-'+a,'contract']);
 return ms;
}
export function replay(e,s,path){let q=copy(s);for(let k of path){if(!actions(e,q).includes(k))throw Error(q.id+' illegal plan '+k+': '+q.note);e.act(q,k)}return q}
export function value(s){if(s.outcome==='win')return 100000+s.score;if(s.outcome==='loss')return-100000;
 if(s.id==='last-contact')return contactMoves(s,1).length*20-contactMoves(s,-1).length*18;
 if(s.id==='triad-and-tower')return Math.min(...triadCounts(s,1))*50-Math.min(...triadCounts(s,-1))*50+(s.captured[0]-s.captured[1])*10+triadMoves(s,1).length-triadMoves(s,-1).length;
 if(s.id==='crossing-court')return(s.captures[0]-s.captures[1])*60+Math.max(0,...courtMoves(s,1).map(m=>m.captured))*25-Math.max(0,...courtMoves(s,-1).map(m=>m.captured))*15-s.turn*.1;
 if(s.id==='chromatic-command')return Math.max(...s.b.flatMap((v,p)=>v?.who===1?[(4-Math.floor(p/5))*15]:[]))-Math.max(...s.b.flatMap((v,p)=>v?.who===-1?[Math.floor(p/5)*15]:[]))+colorMoves(s,1).length;
 if(s.id==='outward-and-home'){let progress=r=>r.done?32:r.back?12-r.p:r.p;return sum(s.runners[0].map(progress))*5-sum(s.runners[1].map(progress))*4;}
 if(s.id==='looping-guard')return(s.b.filter(v=>v===1).length-s.b.filter(v=>v===-1).length)*100+loopMoves(s,1).filter(m=>m.kind==='capture').length*30-loopMoves(s,-1).filter(m=>m.kind==='capture').length*25-s.turn*.2;
 if(s.id==='pair-breaker')return(s.pairs[0]-s.pairs[1])*50+pairThreats(s,1).length*35-pairThreats(s,-1).length*40;
 if(s.id==='mill-and-flight')return(s.captured[0]-s.captured[1])*100+(mills.filter(a=>a.every(p=>s.b[p]===1)).length-mills.filter(a=>a.every(p=>s.b[p]===-1)).length)*25+millMoves(s,1).length*.2;
 if(s.id==='mirrored-offensive')return(s.captured[0]-s.captured[1])*100-Math.min(...s.boards.map(b=>b.filter(v=>v===-1).length))*25+Math.min(...s.boards.map(b=>b.filter(v=>v===1).length))*20;
 if(s.id==='marble-vault')return(s.reserve[0]-s.reserve[1])*10+s.b.reduce((n,v,p)=>n+v*sockets[p].l*25,0);
 if(s.id==='brimline-reserves')return(s.reserve[0]-s.reserve[1])*50+(s.captured[0]-s.captured[1])*35+brimRows(s,1).length*30-brimRows(s,-1).length*25;
 if(s.id==='double-written')return s.b.reduce((n,v)=>n+(v?.who||0)*5,0);
 if(s.id==='last-defense')return(s.hands[1].length-s.hands[0].length)*30+s.hands[0].reduce((n,c)=>n+(Math.floor(c/6)===s.trump?5:0),0);
 if(s.id==='covered-columns')return(columnScore(s.cards[1])-columnScore(s.cards[0]))*20+s.revealed[0].filter(Boolean).length;
 if(s.id==='capital-lines'){let reach=supplied(s,1);return s.b.reduce((n,v,p)=>n+(v===1?60-Math.abs(p%5-2)*5-Math.floor(p/5)*5+(reach.has(p)?10:-20):v===-1?-60:0),0)+(s.captured[0]-s.captured[1])*20;}
 if(s.id==='bracket-and-effort')return Math.min(s.incomes,s.goal)*2+s.cash*3+s.workers.reduce((n,w)=>n+w.wage*4,0);
 if(s.id==='club-tariff')return Math.min(s.visits,18)*10+Math.min(s.members.length,5)*25+s.cash;
 if(s.id==='pooling-desk')return Math.min(s.enrolled,9)*10+Math.min(s.covered,24)*5+s.cash;
 if(s.id==='network-tipping')return s.adopters.reduce((a,b)=>a+b,0)*35+s.cash*2+s.quality*15;
 if(s.id==='bonus-and-burden')return Math.min(s.real,16)*20+s.cash+s.practice*20;
 return s.score;
}
const key=s=>JSON.stringify([s.b,s.phase,s.captured,s.captures,s.pairs,s.last,s.forced,s.passes,s.cash,s.workers,s.incomes,s.changeLeft,s.lastRates,s.members,s.visits,s.enrolled,s.covered,s.adopters,s.quality,s.rival,s.real,s.delivered,s.practice,s.audits,s.runners,s.territory,s.age,s.relays,s.attrition,s.hands,s.deck,s.table,s.cards,s.revealed,s.discard,s.held,s.closer,s.edges,s.pending,s.left,s.boards,s.vector,s.reserve,s.repeats,s.rng,s.turn]);
export async function plan(id,stage=0,seed=1,mode='finite',{width=40,depth=64}={}){let e=engines[id],start=e.init({stage,seed,mode}),beam=[{s:start,path:[]}],seen=new Set([key(start)]);for(let turn=0;turn<depth;turn++){let next=[];for(let{ s,path }of beam)for(let ks of turnOptions(e,s)){let q=replay(e,s,ks),p=[...path,...ks];if(q.outcome==='win')return p;if(q.outcome==='loss')continue;let h=key(q);if(seen.has(h))continue;seen.add(h);next.push({s:q,path:p,v:value(q)})}next.sort((a,b)=>b.v-a.v);beam=next.slice(0,width);if(!beam.length)break;if(turn%8===7)await new Promise(r=>setTimeout(r,0))}throw Error(id+' no winning plan stage'+stage+' '+mode)}
export function lossPlan(id,stage=0,seed=1,mode='finite',{width=20,depth=64}={}){let e=engines[id],beam=[{s:e.init({stage,seed,mode}),path:[]}],seen=new Set();for(let turn=0;turn<depth;turn++){let next=[];for(let{ s,path }of beam)for(let ks of turnOptions(e,s)){let q=replay(e,s,ks),p=[...path,...ks];if(q.outcome==='loss')return p;if(q.outcome==='win')continue;let h=key(q);if(seen.has(h))continue;seen.add(h);next.push({s:q,path:p,v:value(q)})}next.sort((a,b)=>a.v-b.v);beam=next.slice(0,width);if(!beam.length)break}throw Error(id+' no natural loss')}
if(process.argv[1]===new URL(import.meta.url).pathname){let file=new URL('./civic-room-paths.json',import.meta.url),v=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):{};for(let id of(process.argv.slice(2).length?process.argv.slice(2):Object.keys(engines))){v[id]||=[];for(let stage=0;stage<3;stage++){let p=await plan(id,stage);let current=JSON.parse(fs.readFileSync(file));current[id]||=[];current[id][stage]=p;fs.writeFileSync(file,JSON.stringify(current,null,2)+'\n');console.log(id+' finite'+stage+' actions'+p.length)}}}
export{RUN_SEED,stageSeed};
