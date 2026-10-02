export function random(seed){let x=seed>>>0||1;return{next(){x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296},int(n){return Math.floor(this.next()*n)},shuffle(a){a=a.slice();for(let i=a.length-1;i;i--){const j=this.int(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}}}
export const base=()=>({outcome:'playing',note:'Compare the visible constraints before acting. Restart starts the campaign again; finite studies also allow Undo and Reset.',score:0});
export const level=stage=>Math.min(2,stage);
export const sum=a=>a.reduce((x,y)=>x+y,0);
export const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export const mod=(x,n)=>(x%n+n)%n;
export function win(s,note,score=100){s.outcome='win';s.note=note;s.score=Math.max(1,Math.round(score))}
export function lose(s,note){s.outcome='loss';s.note=note;s.score=0}
export function cards(ui,label,items,selected,prefix,disabled=()=>false){ui.grid(Math.min(4,items.length)||1,label,{compact:true});items.forEach((x,i)=>ui.button(prefix+i,x,disabled(i),selected===i))}
export function record(ui,log){if(log.length){ui.h('Action record');ui.table(['Step','What changed'],log.slice(-8).map((x,i)=>[Math.max(1,log.length-7)+i,x]))}}
export function nodes(ui,key,labels,edges,{active=[],marked=[]}={}){ui.canvas(key,600,300,ctx=>{ctx.clearRect(0,0,600,300);const pts=labels.map((_,i)=>[300+215*Math.cos(2*Math.PI*i/labels.length-Math.PI/2),150+108*Math.sin(2*Math.PI*i/labels.length-Math.PI/2)]);ctx.font='14px system-ui';ctx.textAlign='center';for(const[a,b,label]of edges){const[x,y]=pts[a],[u,v]=pts[b],ang=Math.atan2(v-y,u-x);ctx.strokeStyle='#78908d';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+25*Math.cos(ang),y+25*Math.sin(ang));ctx.lineTo(u-27*Math.cos(ang),v-27*Math.sin(ang));ctx.stroke();if(label!==undefined){ctx.fillStyle='#fffdf5';ctx.fillRect((x+u)/2-20,(y+v)/2-10,40,20);ctx.fillStyle='#294a42';ctx.fillText(String(label),(x+u)/2,(y+v)/2+5)}}pts.forEach(([x,y],i)=>{ctx.fillStyle=active.includes(i)?'#b98258':marked.includes(i)?'#b8ceb6':'#294a42';ctx.beginPath();ctx.arc(x,y,25,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fffdf5';ctx.fillText(String(labels[i]),x,y+5)})})}
export function spend(s,n,message){s.used+=n;s.note=message;if(s.used>s.budget)lose(s,'The action allowance is exhausted. '+message)}
