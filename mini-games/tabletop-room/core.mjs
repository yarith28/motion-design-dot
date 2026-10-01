export const range=n=>Array.from({length:n},(_,i)=>i);
export function random(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;}
export function shuffle(s,a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(random(s)*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export const deck=(r=13)=>range(r*4).map(i=>({r:i%r+1,u:Math.floor(i/r)}));
export const card=c=>`${({1:'A',11:'J',12:'Q',13:'K'})[c.r]||c.r}${['♠','♥','♣','♦'][c.u]}`;
export const rank=c=>c.r===1?14:c.r;
export const value=c=>Math.min(c.r,10);
export const sum=a=>a.reduce((a,b)=>a+b,0);
export const a=(code,label,group='Actions',selected=false)=>({code:String(code),label,group,selected});
export function finish(s,outcome,note){s.done=true;s.outcome=outcome;s.note=note;}
export const compare=(s,y,h,label='Score')=>finish(s,y>h?'win':y<h?'loss':'draw',`${label}: you ${y} · house ${h}.`);
export function draw(s,key='hand',n=1){while(n--&&s.deck.length)s[key].push(s.deck.pop());}
export function poker(cs){const rs=cs.map(c=>cs.length===3?c.r:rank(c)).sort((a,b)=>a-b),counts=Object.values(cs.reduce((o,c)=>(o[c.r]=(o[c.r]||0)+1,o),{})).sort((a,b)=>b-a);const flush=cs.every(c=>c.u===cs[0].u),straight=new Set(rs).size===cs.length&&(rs.at(-1)-rs[0]===cs.length-1||(cs.length===5&&rs.join()==='2,3,4,5,14'));if(cs.length===3)return (flush&&straight?5:counts[0]===3?4:flush?3:straight?2:1)*100+sum(rs);const tier=flush&&straight?8:counts[0]===4?7:counts[0]===3&&counts[1]===2?6:flush?5:straight?4:counts[0]===3?3:counts[0]===2&&counts[1]===2?2:counts[0]===2?1:0;return tier;}
export const pokerName=['High card','Pair','Two pair','Three of a kind','Straight','Flush','Full house','Four of a kind','Straight flush'];
export const handActions=(s,group='Your hand')=>s.hand.map((c,i)=>a('c'+i,card(c),group,(s.sel||[]).includes(i)));
export function toggle(s,i){s.sel.includes(i)?s.sel.splice(s.sel.indexOf(i),1):s.sel.push(i);}
export const textCards=cs=>cs.map(card).join(' · ')||'—';
