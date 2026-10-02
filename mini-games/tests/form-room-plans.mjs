/* QA-only legal paths derived from public targets and model rules; no shipped answers or browser state injection. */
import{engines}from'../form-room/engines.mjs';
import{floats}from'../form-room/textile.mjs';
import{hull}from'../form-room/core.mjs';
import{triangleEdges,cableError,fourbar,fourbarError}from'../form-room/structure.mjs';
import{pulseDomains}from'../form-room/material.mjs';
import{threadCells,area}from'../form-room/process.mjs';
import{meshSolve,meshError,panelResponse}from'../form-room/equilibrium.mjs';
import{grainWidth}from'../form-room/matter.mjs';
import{resonance}from'../form-room/acoustics.mjs';
const clone=s=>structuredClone(s);
export function run(id,s,actions){for(const a of actions)engines[id].act(s,a);return s;}
export function plan(id,s){
 if(id==='warp-shed'){
  function rowPath(s){if(s.outcome==='win')return[];if(s.outcome!=='playing')return null;
   for(let c=0;c<2;c++)if(s.spools[c])for(let m=0;m<2**s.w;m++){
    const bits=Array.from({length:s.w},(_,x)=>m>>x&1),y=s.row;
    if(!floats(bits,s.cap)||bits.some((b,x)=>(b?s.warp[x]:c)!==s.target[y][x]||!floats([...s.rows.slice(0,y).map(row=>row[x]),b],s.cap)))continue;
    const actions=['weft:'+c,...bits.flatMap((b,x)=>b===s.shed[x]?[]:['lift:'+x]),...Array(s.w).fill('pass')],q=run(id,clone(s),actions),rest=rowPath(q);
    if(rest)return[...actions,...rest];
   }return null;
  }const p=rowPath(s);if(!p)throw Error(id+' no public-target weave');return p;
 }
 if(id==='live-loops'){
  const p=[];for(const row of s.target.slice(1)){for(const node of row)p.push(node.parents.length===0?'Y':node.parents.length===2?'D':node.face===-1?'P':'K');p.push('turn');}p.push('castoff');return p;
 }
 if(id==='corbel-tower'){
  function stack(s,i){if(i===s.stock.length){const q=run(id,clone(s),['crown']);return q.outcome==='win'?['crown']:null;}
   for(const x of[.5,.75,.25,0,1,-.25,-.5,-.75,-1]){const p=['block:'+i,'offset:'+x,'place'],q=run(id,clone(s),p);if(q.outcome!=='playing')continue;const tail=stack(q,i+1);if(tail)return[...p,...tail];}return null;
  }const p=stack(s,0);if(!p)throw Error(id+' no support-safe stack');return p;
 }
 if(id==='rubber-boundary'){const p=[],q=clone(s);while(q.outcome==='playing'){const n=q.observed.length,want=hull([...q.observed,q.arrivals[q.at]]),i=want.indexOf(n),a=['left:'+want[(i+want.length-1)%want.length],'right:'+want[(i+1)%want.length],'rehang'];p.push(...a);run(id,q,a);}if(q.outcome!=='win')throw Error('No tangent path');return p;}
 if(id==='curved-compass')return[[ 'arc:90','turn:90','arc:90'],['arc:90','turn:90','arc:90','turn:90','arc:90'],['arc:60','turn:90','arc:60','turn:-45','arc:90']][Math.min(2,s.stage)].concat('join');
 if(id==='delaunay-bench'){const p=[],q=clone(s);for(let i=0;i<q.limit;i++){const bad=triangleEdges(q).find(e=>e.illegal&&!e.locked&&e.convex);if(!bad)break;const a=['edge:'+bad.key,'flip'];p.push(...a);run(id,q,a);}p.push('certify');if(run(id,q,['certify']).outcome!=='win')throw Error('No bounded incircle repair');return p;}
 if(id==='catenary-yard'){for(const length of s.lengths)for(const leftHeight of s.heights)for(const rightHeight of s.heights)for(let hook=1;hook<=3;hook++){const q={...s,length,leftHeight,rightHeight,hook};if(Array.from({length:s.caseCount},(_,i)=>cableError(q,i)).every(e=>!e))return['length:'+length,'left:'+leftHeight,'right:'+rightHeight,...(s.pendant?['hook:'+hook]:[]),...Array.from({length:s.caseCount},(_,i)=>['case:'+i,'test']).flat()];}throw Error('No cable clearance construction');}
 if(id==='pivot-network'){
  for(const crank of[1,1.5,2])for(const rocker of[2,2.5,3])for(const coupler of[2,2.5,3,3.5])for(const ground of[3,4])for(const alpha of[.25,.5,.75])for(const branch of[-1,1]){
   const q={...s,crank,rocker,coupler,ground,alpha,branch},bs=[];let ok=true;
   for(const target of s.receivers){const b=[-1,1].find(b=>{const x=fourbar(q,target.theta,b);return x&&Math.hypot(x.tool[0]-target.p[0],x.tool[1]-target.p[1])<.015&&!fourbarError(q,target.theta,b);});if(!b){ok=false;break;}bs.push(b);}if(!ok||bs[0]!==branch)continue;
   const p=['crank:'+crank,'rocker:'+rocker,'coupler:'+coupler,'ground:'+ground,'alpha:'+alpha,'branch:'+branch,'lock'];let theta=0,current=branch;
   for(let i=0;i<s.receivers.length;i++){let desired=bs[i];if(fourbar(q,s.receivers[i].theta,current)&&Math.hypot(...fourbar(q,s.receivers[i].theta,current).tool.map((v,j)=>v-s.receivers[i].p[j]))<.015)desired=current;
    if(desired!==current){if(fourbar(q,theta,current).h>1e-6){ok=false;break;}p.push('toggle');current=desired;}
    const target=s.receivers[i].theta;while(theta!==target){const d=target>theta?15:-15;p.push('drive:'+d);theta+=d;}p.push('stamp');
   }if(ok&&run(id,clone(s),p).outcome==='win')return p;
  }throw Error('No branch-continuous linkage path');
 }
 if(id==='remanence-bench'){
  const key=q=>q.spins.join(',')+'|'+q.field.join(','),queue=[{s:clone(s),p:[]}],best=new Map([[key(s),0]]);let head=0;
  while(head<queue.length){const{ s:q,p }=queue[head++];if(q.field.every(v=>v===0)&&q.spins.every((v,i)=>v===q.target[i]))return[...p,'measure'];
   for(let c=0;c<q.coils.length;c++)for(const v of q.pulses){const cost=v*v*(c===0?2:1),heat=q.heat+cost;if(heat>q.heatLimit)continue;const next=clone(q);next.heat=heat;pulseDomains(next,c,v);const k=key(next);if((best.get(k)??Infinity)<=heat)continue;best.set(k,heat);queue.push({s:next,p:[...p,'coil:'+c,'pulse:'+v]});}
  }throw Error('No zero-field coercive history');
 }
 if(id==='solvent-ladder'){
  const low=s.solubility[0]<s.solubility[1]?0:1,high=1-low,first=Math.ceil(s.initialMass[high]/s.solubility[high]*4)/4,p=['packet:'+low,...Array(Math.round((s.volume-first)*4)).fill('evaporate'),'filter'];if(s.entrainment)p.push('wash');p.push('packet:'+high,...Array(Math.round((first-.25)*4)).fill('evaporate'),'filter');if(s.mass.length===3)p.push('wash');p.push('finish');return p;
 }
 if(id==='emulsion-bench'){
  const q=clone(s),p=[],act=a=>{p.push(a);run(id,q,[a]);};
  while((q.oil+.15*8*q.max**(2/3))/(q.oil+q.water)>.59&&q.reserve)act('dilute');
  for(let i=0;i<q.drops.length;i++){
   act('drop:'+i);while(q.drops[i].coat<area(q.drops[i].v)-1e-7)act('coat:2');
   if(q.drops[i].v>q.max+1e-7){const f=q.drops[i].v>2*q.max+1e-7?1/3:.5;act('split:'+f);i--;}
  }
  act('rest');act('rest');act('inspect');if(q.outcome!=='win')throw Error('No safe emulsification history: '+q.note);return p;
 }
 if(id==='thread-portrait'){
  const failed=new Set;function dfs(q){if(q.layers.every((v,i)=>v===q.target[i]))return['certify'];if(!q.stock)return null;const key=q.head+'|'+q.stock+'|'+q.layers.join('')+'|'+q.wraps.join('');if(failed.has(key))return null;failed.add(key);
   for(let i=0;i<q.pegs.length;i++)if(i!==q.head&&q.wraps[i]<q.capacity[i]&&threadCells(q,q.head,i).every(c=>q.layers[c]<q.target[c])){const n=run(id,clone(q),['peg:'+i]);if(n.outcome==='playing'){const tail=dfs(n);if(tail)return['peg:'+i,...tail];}}return null;
  }const p=dfs(s);if(!p)throw Error('No continuous density path');return p;
 }
 if(id==='mesh-form'){
  for(let fixture=0;fixture<s.fixtures.length;fixture++)for(const grip of[6,7,8])for(let x=-4;x<=4;x++)for(let y=-4;y<=4;y++){const q={...s,fixture,grip,dx:x/10,dy:y/10},result=meshSolve(q);if(meshError(q,result)||!s.landmarks.every((i,j)=>Math.hypot(...result.points[i].map((v,k)=>v-s.targets[j][k]))<s.tolerance))continue;const p=['fixture:'+fixture,'grip:'+grip,'lock',...Array(Math.abs(x)).fill('move:dx,'+(Math.sign(x)/10)),...Array(Math.abs(y)).fill('move:dy,'+(Math.sign(y)/10)),'certify'];if(run(id,clone(s),p).outcome==='win')return p;}throw Error('No strain-safe coupled grip path');
 }
 if(id==='fiber-panel'){
  function dfs(slots,used){if(slots.length===s.cards.length){const q={...s,slots};if(!s.loads.every((_,i)=>panelResponse(q,i).every((v,j)=>Math.abs(v-s.target[i][j])<=s.tolerance)))return null;return slots;}for(let i=0;i<s.cards.length;i++)if(!used.includes(i))for(const flip of(Math.abs(s.cards[i].angle)===45?[false,true]:[false])){const p=dfs([...slots,{card:i,flip}],[...used,i]);if(p)return p;}return null;}const slots=dfs([],[]);if(!slots)throw Error('No coupled laminate layup');return[...slots.flatMap((p,i)=>['card:'+p.card,'slot:'+i,'flip:'+(+p.flip),'place']),'bond',...s.loads.flatMap((_,i)=>['case:'+i,'test'])];
 }
 if(id==='gel-window'){const k=Math.min(2,s.stage),edges=k===0?[[0,1],[1,2],[3,4],[4,5]]:k===1?[[0,1],[0,2],[0,3],[3,4],[4,5],[1,2]]:[[0,1],[0,2],[0,3],[0,4],[2,5],[5,6],[1,2],[3,4]],p=edges.flatMap(([a,b])=>['first:'+a,'second:'+b,'join']);if(k===0)for(const n of[0,2,3,5])p.push('first:'+n,'terminate');p.push('certify');return p;}
 if(id==='sieve-cascade'){
  const n=s.apertures,p=['deck:0','screen:'+n[2],'deck:1','screen:'+n[1],'deck:2','screen:'+n[0],'lock'],start=run(id,clone(s),p),queue=[{q:start,p:[]}],seen=new Set;let at=0;
  while(at<queue.length){const{q,p:tail}=queue[at++],key=JSON.stringify([q.contents,q.bridge,q.bins.map(a=>a.map(p=>p.id))]);if(seen.has(key))continue;seen.add(key);if(q.contents.every(a=>!a.length))return[...p,...tail,'certify'];if(q.spent>=q.limit)continue;
   for(let d=0;d<3;d++)if(q.contents[d].length){const grades=new Set(q.contents[d].map(p=>p.grade)),actions=grades.size===1?[['deck:'+d,'bin:'+q.contents[d][0].grade,'discharge']]:[];actions.push(['deck:'+d,'forward'],['deck:'+d,'reverse']);for(const a of actions){const next=run(id,clone(q),a);if(next.outcome==='playing')queue.push({q:next,p:[...tail,...a]});}}
  }throw Error('No bridge-safe separation history');
 }
 if(id==='resonator-rack'){
  const choices=[];for(let i=1;i<s.count-(s.count===4?1:0);i++)choices.push(s.options.map(v=>['cavity:'+i+','+v,q=>q.cavities[i]=v]));for(let i=0;i<s.parents.length;i++)choices.push([0,1,...(i===1?[2]:[])].map(v=>['parent:'+i+','+v,q=>q.parents[i]=v]));for(let i=0;i<s.necks.length;i++)choices.push(s.neckStock.map((_,v)=>['neck:'+i+','+v,q=>q.necks[i]=v]));if(s.count===4)choices.push([1,2,3].map(v=>['output:'+v,q=>q.outputFrom=v]));
  function dfs(q,at,p){if(at===choices.length){if(s.count===4&&new Set(q.necks).size!==3)return null;if(s.freqs.every((w,f)=>{const r=resonance(q,w);return r&&s.outputs.every((i,j)=>r[i].amplitude>=s.bands[f][j].min&&r[i].amplitude<=s.bands[f][j].max);}))return[...p,'lock',...s.freqs.flatMap((_,i)=>['sample:'+i,'measure'])];return null;}for(const[a,edit]of choices[at]){const n=clone(q);edit(n);const p2=dfs(n,at+1,[...p,a]);if(p2)return p2;}return null;}const p=dfs(s,0,[]);if(!p)throw Error('No acoustic topology meets bands');return p;
 }
 if(id==='powder-press'){
  const queue=[{q:clone(s),p:[]}],seen=new Set;let at=0;while(at<queue.length){const{q,p}=queue[at++],u=run(id,clone(q),['unload','eject']);if(u.outcome==='win')return[...p,'unload','eject'];if(p.length>=12)continue;const key=q.peak.map(v=>v.toFixed(5)).join('|')+q.porosity.map(v=>v.toFixed(5)).join('|');if(seen.has(key))continue;seen.add(key);for(const f of[0,1])for(const P of[4,6,8,10]){const a=['face:'+f,'press:'+P],n=run(id,clone(q),a);if(n.outcome==='playing')queue.push({q:n,p:[...p,...a]});}}throw Error('No compaction history');
 }
 if(id==='clay-spindle'){
  const k=Math.min(2,s.stage),p=[];if(k===1)p.push('band:0','pull:1');if(k===2)p.push('band:2','pull:-1');for(let i=0;i<3;i++){if(k===2&&i===2)continue;const ticks=Math.round((s.targetRadius[i]-s.radius[i])*10);p.push('band:'+i,...Array(Math.abs(ticks)).fill('shape:'+(Math.sign(ticks)/10)));}for(const i of s.workRequired)p.push('band:'+i,'inner');if(k===2)p.push('band:2',...Array(5).fill('shape:-0.1'));p.push('gauge');return p;
 }
 if(id==='three-flats'){
  const queue=[{q:clone(s),p:[]}],seen=new Set;let at=0;while(at<queue.length){const{q,p}=queue[at++];if(q.plates.every(p=>Math.max(...p)===Math.min(...p)))return[...p,'gauge'];const key=q.plates.map(p=>p.join(',')).join('|');if(seen.has(key)||q.spent>=q.limit)continue;seen.add(key);for(let a=0;a<3;a++)for(let b=a+1;b<3;b++)for(let r=0;r<4;r++){const move=['first:'+a,'second:'+b,'rotation:'+r,'lap'],n=run(id,clone(q),move);if(n.outcome==='playing')queue.push({q:n,p:[...p,...move]});}}throw Error('No stock-safe three-plate lapping path');
 }
 throw Error('No QA plan for '+id);
}
function rawFailurePlan(id,s){
 if(id==='warp-shed'){for(let c=0;c<2;c++)if(s.spools[c])for(let m=0;m<2**s.w;m++){const p=['weft:'+c,...Array.from({length:s.w},(_,i)=>i).filter(i=>m>>i&1).map(i=>'lift:'+i)],q=run(id,clone(s),p);for(let k=0;k<s.w;k++){p.push('pass');run(id,q,['pass']);if(q.outcome==='loss')return p;}}throw Error('No natural weaving failure');}
 if(id==='live-loops')return['castoff'];
 if(id==='corbel-tower'){const p=[],q=clone(s);for(let i=0;i<s.stock.length;i++){const a=['block:'+i,'offset:1','place'];p.push(...a);run(id,q,a);if(q.outcome==='loss')return p;}p.push('crown');return p;}
 if(id==='rubber-boundary'){for(const a of s.ring)for(const b of s.ring)if(a!==b){const p=['left:'+a,'right:'+b,'rehang'],q=run(id,clone(s),p);if(q.outcome==='loss')return p;}throw Error('No invalid tangent case');}
 if(id==='curved-compass')return Array(Math.floor(s.arcLimit/90)+1).fill('arc:90');
 if(id==='delaunay-bench')return Array(s.limit+1).fill('flip');
 if(id==='catenary-yard')return['length:6.4','left:2.5','right:2.5','test'];
 if(id==='pivot-network')return['crank:1','rocker:2','coupler:2','ground:4','branch:-1','lock',...Array(6).fill('drive:15')];
 if(id==='remanence-bench')return['coil:0',...Array(Math.floor(s.heatLimit/32)+1).fill('pulse:4')];
 if(id==='solvent-ladder')return['packet:1','filter','finish','finish','finish'];
 if(id==='emulsion-bench')return['inspect','inspect','inspect'];
 if(id==='thread-portrait'){for(let i=1;i<s.pegs.length;i++)if(run(id,clone(s),['peg:'+i]).outcome==='loss')return['peg:'+i];return['certify','certify','certify'];}
 if(id==='mesh-form')return['fixture:3','lock'];
 if(id==='fiber-panel'){for(let shift=0;shift<s.cards.length;shift++)for(const flip of[0,1]){const p=[...s.cards.flatMap((_,i)=>['card:'+((i+shift)%s.cards.length),'slot:'+i,'flip:'+flip,'place']),'bond',...s.loads.flatMap((_,i)=>['case:'+i,'test'])];const q=clone(s),actual=[];for(const a of p){actual.push(a);run(id,q,[a]);if(q.outcome==='loss')return actual;}}throw Error('No failing cyclic layup');}
 if(id==='sieve-cascade')return['lock','bin:2','discharge'];
 if(id==='gel-window')return['first:0','terminate','terminate','terminate','terminate','terminate'];
 if(id==='resonator-rack')return['parent:0,-1','lock'];
 if(id==='powder-press')return Array(Math.floor(s.energyLimit/100)+1).fill('press:10');
 if(id==='clay-spindle')return Array(8).fill('shape:0.1');
 if(id==='three-flats')return Array(s.limit+1).fill('lap');
 throw Error('No QA failure for '+id);
}

export function failurePlan(id,s){const q=clone(s),actual=[];for(const a of rawFailurePlan(id,s)){actual.push(a);run(id,q,[a]);if(q.outcome==='loss')return actual;if(q.outcome==='win')throw Error(id+' failure path won');}throw Error(id+' failure path never terminated');}
