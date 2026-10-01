export const range=n=>Array.from({length:n},(_,i)=>i);
export const sum=a=>a.reduce((x,y)=>x+y,0);
export const clone=x=>structuredClone(x);
export const a=(code,label,group='Your turn',selected=false)=>({code:String(code),label,group,selected});
export function random(s){s.rng=((s.rng||s.seed)*1664525+1013904223)>>>0;return s.rng/4294967296;}
export function shuffle(s,x){const y=[...x];for(let i=y.length-1;i>0;i--){const j=Math.floor(random(s)*(i+1));[y[i],y[j]]=[y[j],y[i]];}return y;}
export const pick=(s,x)=>x[Math.floor(random(s)*x.length)];
export function finish(s,outcome,note){s.done=true;s.outcome=outcome;s.note=note;}
export function compare(s,p,h,label='Score'){finish(s,p>h?'win':p<h?'loss':'draw',`${label}: you ${p}, house ${h}. ${p>h?'You win.':p<h?'House wins.':'A draw.'}`);}
export const coord=(i,n)=>String.fromCharCode(65+i%n)+(1+Math.floor(i/n));
export const at=(x,y,n)=>x<0||y<0||x>=n||y>=n?-1:y*n+x;
export const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
export const around=(i,n,diagonal=false)=>(diagonal?[...dirs,[1,1],[1,-1],[-1,1],[-1,-1]]:dirs).map(([x,y])=>at(i%n+x,Math.floor(i/n)+y,n)).filter(i=>i>=0);
export function grid(s,n,text,label,action){return {n,cells:range(n*n).map(i=>({text:text(i),label:coord(i,n)+': '+label(i),action:action?.(i)}))};}
export function turnNote(s,n){s.note=n;s.log??=[];s.log.push(n);if(s.log.length>25)s.log.shift();}
export function panelLog(s){return ['Recent turns',(s.log||[]).join('\n')||'No moves yet.'];}
export const endAction=a('end','End turn');
export function best(s,options,score){let m=-Infinity,out=[];for(const o of options){const v=score(o);if(v>m){m=v;out=[o];}else if(v===m)out.push(o);}return pick(s,out);}
