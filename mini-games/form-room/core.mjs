export const clone=x=>structuredClone(x),range=n=>Array.from({length:n},(_,i)=>i),sum=a=>a.reduce((v,x)=>v+x,0),near=(a,b,e=1e-7)=>Math.abs(a-b)<=e;
export function rng(seed){let x=seed>>>0;return n=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return n?Math.floor(x/4294967296*n):x/4294967296;};}
export function base(id,o){return{id,stage:o.stage,seed:o.seed,mode:o.mode,outcome:'playing',score:0,spent:0,note:'Read the visible construction and material limits before committing.'};}
export const level=s=>Math.min(2,s.stage);
export function lose(s,n){s.outcome='loss';s.score=0;s.note=n;}
export function win(s,n){s.outcome='win';s.score=Math.max(20,160-s.spent*2);s.note=n;}
export function spend(s,n=s.limit,message='The construction allowance is exhausted.'){s.spent++;if(s.spent>n)lose(s,message);return s.outcome==='playing';}
export function trial(s,ok,n){if(ok)return win(s,n);s.trials=(s.trials||0)+1;s.note=n+' '+(3-s.trials)+' inspections remain.';if(s.trials>=3)lose(s,n+' Three failed inspections ended this attempt.');}
export function canvas(ui,key,draw){ui.canvas(key,560,300,c=>{c.clearRect(0,0,560,300);c.fillStyle='#f2f0e2';c.fillRect(0,0,560,300);c.font='14px system-ui';c.textAlign='center';draw(c);});}
export function line(c,a,b,color='#53796b',width=3){c.beginPath();c.strokeStyle=color;c.lineWidth=width;c.moveTo(...a);c.lineTo(...b);c.stroke();}
export function label(c,t,x,y,color='#243d35'){c.fillStyle=color;c.fillText(String(t),x,y);}
export function dot(c,x,y,r=7,color='#ab7550'){c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
export function solve(A,b){const n=b.length,M=A.map((r,i)=>[...r,b[i]]);for(let k=0;k<n;k++){let p=k;for(let i=k+1;i<n;i++)if(Math.abs(M[i][k])>Math.abs(M[p][k]))p=i;if(Math.abs(M[p][k])<1e-10)return null;[M[p],M[k]]=[M[k],M[p]];const v=M[k][k];for(let j=k;j<=n;j++)M[k][j]/=v;for(let i=0;i<n;i++)if(i!==k){const f=M[i][k];for(let j=k;j<=n;j++)M[i][j]-=f*M[k][j];}}return M.map(r=>r[n]);}
export const orient=(A,B,C)=>(B[0]-A[0])*(C[1]-A[1])-(B[1]-A[1])*(C[0]-A[0]);
export function hull(points){const a=points.map((p,i)=>({p,i})).sort((a,b)=>a.p[0]-b.p[0]||a.p[1]-b.p[1]);if(a.length<3)return a.map(a=>a.i);const half=xs=>{const q=[];for(const p of xs){while(q.length>1&&orient(q.at(-2).p,q.at(-1).p,p.p)<=1e-9)q.pop();q.push(p);}return q;},l=half(a),u=half([...a].reverse());return [...l.slice(0,-1),...u.slice(0,-1)].map(a=>a.i);}
export function inside(p,poly){return poly.every((A,i)=>orient(A,poly[(i+1)%poly.length],p)>=-1e-7);}
export function distSegment(p,A,B){const dx=B[0]-A[0],dy=B[1]-A[1],t=Math.max(0,Math.min(1,((p[0]-A[0])*dx+(p[1]-A[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(p[0]-A[0]-t*dx,p[1]-A[1]-t*dy);}
export const vadd=(a,b)=>a.map((v,i)=>v+b[i]),vscale=(a,k)=>a.map(v=>v*k),vdot=(a,b)=>sum(a.map((v,i)=>v*b[i])),vcross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const norm=a=>Math.sqrt(vdot(a,a)),unit=a=>vscale(a,1/norm(a));
