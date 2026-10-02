export const range=n=>Array.from({length:n},(_,i)=>i);
export const sum=a=>a.reduce((n,v)=>n+v,0);
export const letter=i=>String.fromCharCode(65+i);
export function rng(seed){let x=seed>>>0;return()=>{x+=0x6d2b79f5;let t=x;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
export function shuffle(items,r){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
export const pick=(a,r)=>a[Math.floor(r()*a.length)];
export const clone=s=>JSON.parse(JSON.stringify(s));
export const edge=(a,b)=>a<b?[a,b]:[b,a];
export const key=(a,b)=>edge(a,b).join(',');
export const hasEdge=(edges,a,b)=>edges.some(([x,y])=>x===Math.min(a,b)&&y===Math.max(a,b));
export function uniqueEdges(edges){return [...new Map(edges.filter(([a,b])=>a!==b).map(([a,b])=>[key(a,b),edge(a,b)])).values()].sort((a,b)=>a[0]-b[0]||a[1]-b[1])}
export function base(extra){return{outcome:'playing',note:'Read the public relation, then construct and certify your solution.',score:0,edits:0,errors:0,...extra}}
export function win(s,note){s.outcome='win';s.note=note;s.score=1000+Math.max(0,500-s.edits*3-s.errors*80)}
export function lose(s,note){s.outcome='loss';s.score=0;s.note=note+' Reset this study or undo to try another plan.'}
export function audit(s,error,note='The full relation holds. Study complete.'){if(!error){win(s,note);return}if(++s.errors>=3)lose(s,error+' Three failed certifications used the review allowance.');else s.note=error+` Reviews remaining: ${3-s.errors}.`}
export function spent(s,note){s.edits++;if(s.edits>s.budget)lose(s,`The ${s.budget}-move allowance is exhausted.`);else s.note=note}
export function graph(ui,id,vertices,edges,{labels=vertices.map(letter),marks=[],selected=[],directed=false,colors=[],bipartite=false}={}){
 ui.canvas(id,620,330,ctx=>{
  ctx.fillStyle='#f2f5ec';ctx.fillRect(0,0,620,330);
  const n=vertices.length,pos=vertices.map((v,i)=>bipartite?[i<n/2?130:490,45+(i%(n/2))*250/Math.max(1,n/2-1)]:[310+240*Math.cos(i*2*Math.PI/n-Math.PI/2),165+120*Math.sin(i*2*Math.PI/n-Math.PI/2)]);
  ctx.lineWidth=2;for(const [a,b]of edges){const x=vertices.indexOf(a),y=vertices.indexOf(b);if(x<0||y<0)continue;ctx.strokeStyle='#718579';ctx.beginPath();ctx.moveTo(...pos[x]);ctx.lineTo(...pos[y]);ctx.stroke();if(directed){const [px,py]=pos[x],[qx,qy]=pos[y],ang=Math.atan2(qy-py,qx-px),tx=qx-24*Math.cos(ang),ty=qy-24*Math.sin(ang);ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(tx-10*Math.cos(ang-.5),ty-10*Math.sin(ang-.5));ctx.moveTo(tx,ty);ctx.lineTo(tx-10*Math.cos(ang+.5),ty-10*Math.sin(ang+.5));ctx.stroke()}}
  for(let i=0;i<n;i++){const[x,y]=pos[i];ctx.fillStyle=selected.includes(vertices[i])?'#e7c174':colors[i]||'#dfe9da';ctx.strokeStyle='#345448';ctx.lineWidth=selected.includes(vertices[i])?4:2;ctx.beginPath();ctx.arc(x,y,23,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#203f33';ctx.font='bold 15px system-ui';ctx.textAlign='center';ctx.fillText(labels[i],x,y+5);if(marks[i]!==undefined){ctx.font='12px system-ui';ctx.fillText(marks[i],x,y+40)}}
 });
}
export function matrix(ui,labels,relation){ui.table(['',...labels],labels.map((l,i)=>[l,...labels.map((_,j)=>i===j?'—':relation(i,j)?'●':'·')]))}
export function certify(ui,label='Certify full relation'){ui.group('Review');ui.button('check',label)}
export function integer(ui,action,label,value,min,max){ui.group(label);ui.button(action+':-1','−',value<=min);ui.p(String(value));ui.button(action+':1','+',value>=max)}
