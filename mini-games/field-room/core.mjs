export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const round=(v,n=2)=>Number(v).toFixed(n);
export const rng=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
export const clone=s=>structuredClone(s);
export function base({stage,seed,mode}){return{stage,seed,mode,outcome:'playing',note:'Inspect the field, then choose a control. Physics advances only when the named action says so.',score:0,turn:0}}
export function result(s,won,note,score=0){s.outcome=won?'win':'loss';s.note=note;s.score=Math.max(0,Math.round(score));}
export function budget(s,max){s.turn++;if(s.turn>max){result(s,false,'The action allowance is exhausted. Reset this challenge or begin a fresh campaign.',s.score);return false}return true}
export const buttons=(ui,items)=>{ui.group('Game controls');for(const [a,l,d,p]of items)ui.button(a,l,d||false,p)};
export function canvas(ui,s,draw){ui.canvas('field',600,360,(c)=>{c.fillStyle='#eef1e4';c.fillRect(0,0,600,360);c.lineWidth=2;c.strokeStyle='#315448';c.strokeRect(12,12,576,336);draw(c,s)})}
export function dot(c,x,y,r=8,col='#c87950',label=''){c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.strokeStyle='#315448';c.stroke();if(label)text(c,label,x,y+4,12,'#213d33')}
export function line(c,x,y,X,Y,col='#315448',width=2){c.strokeStyle=col;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.stroke()}
export function rect(c,x,y,w,h,col='#b8ceae'){c.fillStyle=col;c.fillRect(x,y,w,h)}
export function text(c,t,x,y,size=13,col='#213d33'){c.font=`${size}px system-ui`;c.textAlign='center';c.fillStyle=col;c.fillText(String(t),x,y)}
export function arrow(c,x,y,ang,len=35,col='#315448'){const X=x+Math.cos(ang)*len,Y=y+Math.sin(ang)*len;line(c,x,y,X,Y,col,3);line(c,X,Y,X-Math.cos(ang-.5)*10,Y-Math.sin(ang-.5)*10,col,3);line(c,X,Y,X-Math.cos(ang+.5)*10,Y-Math.sin(ang+.5)*10,col,3)}
export function segmentDistance(x,y,ax,ay,bx,by){let vx=bx-ax,vy=by-ay,t=clamp(((x-ax)*vx+(y-ay)*vy)/(vx*vx+vy*vy||1),0,1);return Math.hypot(x-ax-t*vx,y-ay-t*vy)}
export function setNumber(s,a,key,min,max){if(!a.startsWith(key+':'))return false;const v=Number(a.slice(key.length+1));if(Number.isFinite(v))s[key]=clamp(v,min,max);return true}
