export const range=n=>Array.from({length:n},(_,i)=>i);
export const sum=a=>a.reduce((s,x)=>s+x,0);
export const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function rng(seed){let x=seed>>>0;return()=>{x+=0x6d2b79f5;let t=x;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296}}
export function shuffle(a,r){a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
export const adj=(i,n,h=n)=>[...(i>=n?[i-n]:[]),...(i<n*(h-1)?[i+n]:[]),...(i%n?[i-1]:[]),...(i%n<n-1?[i+1]:[])];
export const near=(i,n,h=n)=>range(n*h).filter(j=>j!==i&&Math.abs(i%n-j%n)<=1&&Math.abs(Math.floor(i/n)-Math.floor(j/n))<=1);
export function components(cells,n,h=n){const remaining=new Set(cells),out=[];while(remaining.size){const q=[remaining.values().next().value];remaining.delete(q[0]);for(let k=0;k<q.length;k++)for(const j of adj(q[k],n,h))if(remaining.delete(j))q.push(j);out.push(q)}return out}
export const connected=(cells,n,h=n)=>cells.length>0&&components(cells,n,h).length===1;
export const squares=n=>range(n*n).filter(i=>i%n<n-1&&Math.floor(i/n)<n-1).map(i=>[i,i+1,i+n,i+n+1]);
export function base(extra){return{outcome:'playing',note:'Choose a cell, make a plan, then Check the study.',score:0,edits:0,...extra}}
export function finish(s,error){if(error){s.outcome='loss';s.note=error+' Undo the check or Reset this study to keep working.';s.score=0}else{s.outcome='win';s.note=`Every condition fits. Study complete in ${s.edits} edits.`;s.score=1000+Math.max(0,400-s.edits*3)}}
export const cycle=(s,i,values=[-1,1,0])=>{s.cells[i]=values[(values.indexOf(s.cells[i])+1)%values.length];s.edits++;s.note=`Cell ${i+1}: ${s.cells[i]<0?'unknown':s.cells[i]?'filled':'empty'}.`};
export function cell(ui,s,i,text,opts={}){const b=ui.button('cell:'+i,text,opts.fixed||false,opts.selected);b.classList.add('puzzle-cell');b.dataset.cell=i;b.setAttribute('aria-label',opts.label||`Row ${Math.floor(i/s.n)+1}, column ${i%s.n+1}: ${text}`);if(opts.dark)b.classList.add('dark');if(opts.fixed)b.classList.add('fixed');if(opts.region!==undefined){b.dataset.region=opts.region;b.style.backgroundColor=['#e1ead8','#eaded6','#dedeea','#d6e7e5','#eee6c8','#e4d9e4','#d9e4e9','#e1e1c9'][opts.region%8];b.style.color='#203b34'}return b}
export function markedGrid(ui,s,clues={}){ui.grid(s.n,'Editable puzzle grid');s.cells.forEach((v,i)=>cell(ui,s,i,clues[i]!==undefined?String(clues[i]):v<0?'·':v?'■':'×',{fixed:clues[i]!==undefined,dark:v===1,label:`Row ${Math.floor(i/s.n)+1} column ${i%s.n+1}, ${clues[i]!==undefined?'fixed clue '+clues[i]:v<0?'unknown':v?'filled':'empty'}`}))}
export function checkButton(ui){ui.group('Study validation');ui.button('check','Check study')}
export function sight(i,n,blocked){const seen=[i];for(const[d,ok]of [[-n,j=>j>=0],[n,j=>j<n*n],[-1,j=>j>=0&&Math.floor(j/n)===Math.floor(i/n)],[1,j=>j<n*n&&Math.floor(j/n)===Math.floor(i/n)]])for(let j=i+d;ok(j)&&!blocked.includes(j);j+=d)seen.push(j);return seen}
export function transform(i,n,t){let x=i%n,y=Math.floor(i/n);if(t>=4)x=n-1-x;for(let k=0;k<t%4;k++)[x,y]=[n-1-y,x];return y*n+x}
export function ring(i,n){const x=i%n,y=Math.floor(i/n);return [[-1,-1],[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0]].map(([dx,dy])=>x+dx>=0&&x+dx<n&&y+dy>=0&&y+dy<n?(y+dy)*n+x+dx:-1)}
export function ringRuns(a){if(a.every(Boolean))return[8];if(!a.some(Boolean))return[0];const start=a.indexOf(0),out=[];let count=0;for(let k=1;k<=8;k++){if(a[(start+k)%8])count++;else if(count){out.push(count);count=0}}return out.sort((a,b)=>a-b)}
