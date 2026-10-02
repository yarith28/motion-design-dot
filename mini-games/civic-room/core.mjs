export const range=n=>Array.from({length:n},(_,i)=>i);
export const sum=a=>a.reduce((v,n)=>v+n,0);
export const copy=s=>structuredClone(s);
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function random(s){s.rng=(Math.imul(s.rng,1664525)+1013904223)>>>0;return s.rng/4294967296}
export const pick=(s,a)=>a[Math.floor(random(s)*a.length)];
export function shuffle(s,a){a=a.slice();for(let i=a.length-1;i>0;i--){let j=Math.floor(random(s)*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
export function base(id,{stage=0,seed=1,mode='finite'}={}){let h=2166136261;for(const c of id)h=Math.imul(h^c.charCodeAt(0),16777619);return{id,stage,mode,rng:mode==='finite'?(h+Math.imul(stage+1,123457))>>>0:seed>>>0,outcome:'playing',score:0,note:'Choose your first action.',log:[],turn:0,selected:null}}
export function finish(s,won,note,score=0){s.outcome=won?'win':'loss';s.note=note;s.score=Math.max(0,Math.round(score))}
export function log(s,note){s.note=note;s.log.push(note);s.log=s.log.slice(-6)}
export function choose(s,a,value){let scored=a.map(m=>({m,v:value(m)})),best=Math.max(...scored.map(x=>x.v)),ties=scored.filter(x=>x.v===best);return ties.length?ties[Math.floor(random(s)*ties.length)].m:null}
export const dirs=[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
export const orth=[[0,-1],[-1,0],[1,0],[0,1]];
export const coord=(p,n)=>String.fromCharCode(65+p%n)+(Math.floor(p/n)+1);
export function offset(p,dx,dy,n=5,rows=n,k=1){let x=p%n+dx*k,y=Math.floor(p/n)+dy*k;return x>=0&&x<n&&y>=0&&y<rows?y*n+x:-1}
export function cellFace(b,coordinate,piece,who=0){if(!b?.ownerDocument)return;b.classList.add('civic-cell');if(who===1)b.classList.add('own');if(who===-1)b.classList.add('opponent');let c=b.ownerDocument.createElement('span'),p=b.ownerDocument.createElement('span');c.className='cell-coordinate';c.textContent=coordinate;p.className='cell-piece';p.textContent=piece;b.replaceChildren(c,p)}
export function board(ui,s,{n=s.n,rows=s.rows||n,legal=[],label='Playing field',text=p=>s.b[p]===1?'●':s.b[p]===-1?'○':'·',action=p=>'square-'+p,detail=p=>coord(p,n),owner=p=>{let v=s.b[p];return typeof v==='object'?v?.who:v===1?1:v===-1?-1:0},selected=s.selected}={}){ui.grid(n,label);for(let p=0;p<n*rows;p++){let b=ui.button(action(p),coord(p,n)+' '+text(p),!legal.includes(p),selected===p);b?.setAttribute?.('aria-label',detail(p));cellFace(b,coord(p,n),text(p),owner(p))}}
export function actions(e,s){const a=[],noop=()=>{};e.render({p:noop,h:noop,pre:noop,table:noop,group:noop,grid:noop,button:(k,l,d)=>{if(!d&&s.outcome==='playing')a.push(k);return null}},s);return a}
export function history(ui,s){if(s.log.length)ui.pre(s.log.join('\n'))}
export const hex=[];for(let r=-2;r<=2;r++)for(let q=-2;q<=2;q++)if(Math.abs(q+r)<=2)hex.push([q,r]);
export const hexDirs=[[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]];
export const hexIndex=(q,r)=>hex.findIndex(([x,y])=>x===q&&y===r);
export const hexLabel=p=>'('+hex[p].join(', ')+')';
export function hexBoard(ui,s,legal=[],text=p=>s.b[p],label='Hex playing field'){ui.grid(5,label);for(let y=0;y<5;y++)for(let x=0;x<5;x++){let p=hexIndex(x-2,y-2);if(p<0){let b=ui.button('outside-'+x+'-'+y,' ',true);b?.classList?.add('off-field');continue}let b=ui.button('square-'+p,hexLabel(p)+' '+text(p),!legal.includes(p),s.selected===p);b?.setAttribute?.('aria-label',hexLabel(p)+': '+text(p));cellFace(b,hexLabel(p),text(p),s.b[p]?.who||0)}}
