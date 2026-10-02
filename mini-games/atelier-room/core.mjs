export const clone=x=>structuredClone(x);
export function rng(seed){let x=seed>>>0;return n=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return n?Math.floor(x/4294967296*n):x/4294967296;}}
export function base(id,opts){return{id,stage:opts.stage,seed:opts.seed,mode:opts.mode,outcome:'playing',note:'Read the visible requirements and plan the whole construction before committing.',score:0,spent:0};}
export function lose(s,n){s.outcome='loss';s.note=n;s.score=0;}
export function win(s,n){s.outcome='win';s.note=n;s.score=Math.max(20,120-s.spent*2);}
export function trial(s,ok,n){if(ok)win(s,n);else{ s.trials=(s.trials||0)+1;s.note=n+' '+(3-s.trials)+' inspections remain.';if(s.trials>=3)lose(s,n+' Three unsuccessful inspections ended this attempt.');}}
export function spend(s,limit,n='The fabrication allowance is exhausted.'){s.spent++;if(s.spent>limit)lose(s,n);return s.outcome==='playing';}
export function canvas(ui,key,draw){ui.canvas(key,560,280,(c,s)=>{c.clearRect(0,0,560,280);c.fillStyle='#f0f0df';c.fillRect(0,0,560,280);c.font='14px system-ui';c.textAlign='center';draw(c,s);});}
export function line(c,a,b,color='#476a61',width=3){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();}
export function dot(c,x,y,r=8,color='#bc774c'){c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
export function label(c,t,x,y,color='#203a34'){c.fillStyle=color;c.fillText(t,x,y);}
export function cellCanvas(ui,s,key,values,width,opts={}){const rows=Math.ceil(values.length/width);canvas(ui,key,c=>{const sz=Math.min(55,220/rows),ox=(560-width*sz)/2,oy=20;values.forEach((v,i)=>{let x=ox+i%width*sz,y=oy+Math.floor(i/width)*sz;c.fillStyle=opts.color?.(v,i)||'#d8e1cd';c.fillRect(x+2,y+2,sz-4,sz-4);label(c,opts.text?.(v,i)??String(v),x+sz/2,y+sz*.6);});});}
export function fixedStage(s){return Math.min(2,s.stage);}
export function nearly(a,b,e=1e-6){return Math.abs(a-b)<e;}
