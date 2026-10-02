export const range=n=>Array.from({length:n},(_,i)=>i);
export const sum=a=>a.reduce((n,v)=>n+v,0);
export const clamp=(n,l,h)=>Math.max(l,Math.min(h,n));
export const copy=s=>structuredClone(s);
export function random(s){s.rng=(Math.imul(s.rng,1664525)+1013904223)>>>0;return s.rng/4294967296}
export const pick=(s,a)=>a[Math.floor(random(s)*a.length)];
export function shuffle(s,a){a=a.slice();for(let i=a.length-1;i>0;i--){let j=Math.floor(random(s)*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
export function base(id,{stage=0,seed=1,mode='finite'}={}){let h=2166136261;for(const c of id)h=Math.imul(h^c.charCodeAt(0),16777619);return{id,stage,mode,rng:mode==='finite'?(h+Math.imul(stage+1,123457))>>>0:seed>>>0,outcome:'playing',score:0,note:'Make your first decision.',log:[],turn:0}}
export function log(s,text){s.note=text;s.log.push(text);s.log=s.log.slice(-7)}
export function finish(s,won,text,score=0){s.outcome=won?'win':'loss';s.note=text;s.score=Math.max(0,Math.round(score))}
export function ledger(ui,s,heads,rows){ui.table(heads,rows);if(s.log.length)ui.pre(s.log.join('\n'))}
export function adjust(ui,s,label,keys,max=12){ui.group(label);for(const key of keys){ui.button('less-'+key,'− '+key,s[key]<=0);ui.button('more-'+key,'+ '+key,s[key]>=max)} }
export function amount(ui,action,name,current,min,max){ui.group(name);for(let n=min;n<=max;n++)ui.button(action+n,name+' '+n,false,current===n)}
export const dirs=[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
export const dirNames=['NW','N','NE','W','E','SW','S','SE'];
export const index=(x,y,n=5)=>x>=0&&x<n&&y>=0&&y<n?y*n+x:-1;
export const offset=(p,dx,dy,k=1)=>index(p%5+dx*k,Math.floor(p/5)+dy*k);
export const coord=p=>String.fromCharCode(65+p%5)+(Math.floor(p/5)+1);
export function grid(ui,s,legal=[],extra=()=>'',selected=s.selected){ui.grid(5,'Opposed playing field');for(let p=0;p<25;p++){let v=s.b[p],text=v===1?'●':v===-1?'○':v===2?'◆':v===-2?'◇':v===3?'☄':v===9?'×':'·',b=ui.button('square-'+p,coord(p)+' '+text+extra(p),!legal.includes(p),selected===p);b?.classList?.add(v>0&&v<3?'own':v<0?'opponent':v===9?'blocked':'empty');b?.setAttribute?.('aria-label',coord(p)+': '+(v===1?'your piece':v===-1?'opponent piece':v===2?'your home':v===-2?'opponent home':v===3?'neutral comet':v===9?'rock':'empty')+extra(p))}}
export function rays(b,p){const out=[];for(let d=0;d<8;d++){let[dx,dy]=dirs[d],last=-1;for(let k=1;k<5;k++){let q=offset(p,dx,dy,k);if(q<0||b[q])break;last=q}if(last>=0)out.push({f:p,t:last,d})}return out}
export function material(b,who){return b.filter(v=>v===who).length}
export function turnLimit(s,limit=48){if(s.turn<limit)return false;const a=material(s.b,1),b=material(s.b,-1);finish(s,a>b,`Turn limit: your ${a} pieces, house ${b}. ${a>b?'Your material advantage wins.':'The house holds the field (ties favor its defense).'}`,a*20+s.turn);return true}
export function legalActions(e,s){const actions=[];const noop=()=>{};e.render({p:noop,h:noop,pre:noop,table:noop,group:noop,grid:noop,button:(k,l,d)=>{if(!d&&s.outcome==='playing')actions.push(k);return null}},s);return actions}
