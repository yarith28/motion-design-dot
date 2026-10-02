export function random(seed){let x=seed>>>0||1;return{next(){x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296},int(n){return Math.floor(this.next()*n)},shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=this.int(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}}}
export const base=()=>({outcome:'playing',note:'Read the challenge and choose a control. Restart begins a fresh campaign; finite studies also offer Undo and Reset.',score:0,errors:0});
export function win(s,note,value=100){s.outcome='win';s.note=note;s.score=Math.max(0,Math.round(value))}
export function lose(s,note){s.outcome='loss';s.note=note;s.score=0}
export function reject(s,note){s.errors++;s.note=note+' Review credits remaining: '+(3-s.errors)+'.';if(s.errors>=3)lose(s,'The three review credits are spent. '+note)}
export const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export const sum=a=>a.reduce((x,y)=>x+y,0);
export const mod=(x,p)=>(x%p+p)%p;
export const uniq=a=>[...new Set(a)];
export const toggle=(a,x)=>a.includes(x)?a.filter(y=>y!==x):[...a,x];
export const cap=s=>Math.min(2,s);
export function graph(ui,key,labels,edges,active=[],marked=[]){ui.canvas(key,600,260,(ctx)=>{ctx.clearRect(0,0,600,260);const n=labels.length,pts=labels.map((_,i)=>[300+215*Math.cos(2*Math.PI*i/n-Math.PI/2),130+96*Math.sin(2*Math.PI*i/n-Math.PI/2)]);ctx.font='15px system-ui';ctx.textAlign='center';for(const e of edges){const[a,b,label]=e,[x,y]=pts[a],[u,v]=pts[b],ang=Math.atan2(v-y,u-x);ctx.strokeStyle='#78908d';ctx.lineWidth=2;ctx.beginPath();if(a===b){ctx.arc(x+16,y-15,20,0,Math.PI*1.8);ctx.stroke()}else{ctx.moveTo(x+22*Math.cos(ang),y+22*Math.sin(ang));ctx.lineTo(u-25*Math.cos(ang),v-25*Math.sin(ang));ctx.stroke();ctx.fillStyle='#78908d';ctx.beginPath();ctx.moveTo(u-22*Math.cos(ang),v-22*Math.sin(ang));ctx.lineTo(u-35*Math.cos(ang-.3),v-35*Math.sin(ang-.3));ctx.lineTo(u-35*Math.cos(ang+.3),v-35*Math.sin(ang+.3));ctx.closePath();ctx.fill()}if(label!==undefined){ctx.fillStyle='#1f3036';ctx.fillRect((x+u)/2-14,(y+v)/2-11,28,22);ctx.fillStyle='#ecddbe';ctx.fillText(String(label),(x+u)/2,(y+v)/2+5)}}pts.forEach(([x,y],i)=>{ctx.beginPath();ctx.arc(x,y,22,0,Math.PI*2);ctx.fillStyle=active.includes(i)?'#e8bd80':marked.includes(i)?'#bbd8cf':'#344b50';ctx.fill();ctx.strokeStyle='#dce6db';ctx.lineWidth=marked.includes(i)?4:1;ctx.stroke();ctx.fillStyle=active.includes(i)||marked.includes(i)?'#152b30':'#f1efe5';ctx.fillText(String(labels[i]),x,y+5)})})}
export function cards(ui,label,items,selected,action,disabled=()=>false){ui.grid(Math.min(4,items.length),label,{compact:true});items.forEach((x,i)=>ui.button(action+'-'+i,x,disabled(i),selected.includes(i)))}
export function history(ui,a){if(a.length){ui.h('Your record');ui.table(['Step','Action / evidence'],a.map((x,i)=>[i+1,x]))}}
