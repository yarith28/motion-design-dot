'use strict';
(async()=>{const games=await fetch('games.json').then(r=>r.json());const id=new URLSearchParams(location.search).get('game')||games[0].id;const meta=games.find(g=>g.id===id)||games[0],engine=K[meta.id];let s=engine.init(),running=false,record=null;const $=id=>document.getElementById(id),canvas=$('board'),ctx=canvas.getContext('2d');document.title=meta.name+' — Small Hours';$('title').textContent=meta.name;$('subtitle').textContent=meta.description;$('keys').textContent=meta.controls;for(const r of meta.rules){const li=document.createElement('li');li.textContent=r;$('rules').append(li)}
try{record=Number(localStorage.getItem('small-hours-kinetic-'+meta.id))||null}catch(e){$('storage').textContent='Local records are unavailable in this browser.'}
const buttons=engine.actions.map((a,i)=>{const b=document.createElement('button');b.dataset.action=a[0];const title=document.createElement('span');title.textContent=a[1];const key=document.createElement('kbd');key.textContent=a[2];b.append(title,key);b.addEventListener('click',()=>act(a[0]));$('inputs').append(b);return b});
const sculptButtons=[];
if(meta.id==='soft-sculpt'){
 $('sculpt-list').hidden=false;$('zoom-board').hidden=false;
 $('zoom-board').onclick=()=>{const expanded=$('board-frame').classList.toggle('enlarged');$('zoom-board').textContent=expanded?'Fit graph to screen':'Enlarge graph';$('zoom-board').setAttribute('aria-pressed',String(expanded))};
 sculptEdges.forEach(([u,v],i)=>{const b=document.createElement('button');b.dataset.bond=String(i);b.addEventListener('click',()=>act('bond'+i));$('sculpt-bonds').append(b);sculptButtons.push(b)});
}
function render(){ctx.clearRect(0,0,600,420);engine.draw(s,ctx);$('telemetry').textContent=engine.read(s);$('description').textContent=engine.describe?engine.describe(s):engine.read(s);canvas.setAttribute('aria-label',meta.name+'. '+engine.read(s)+'. Detailed board description follows the controls.');$('turn').textContent=running?'TURN '+s.t:'READY';$('record').textContent=record?'BEST · '+record+' TURNS':'';$('status').textContent=s.result?(s.result==='won'?'Complete. ':'Try again. ')+s.msg:(!running?'Read the field notes, then start playing.':s.msg||'Choose an action to advance time.');$('status').className=s.result||'';buttons.forEach(b=>b.disabled=!running||!!s.result);$('start').hidden=running;
if(meta.id==='soft-sculpt'){
 $('sculpt-weights').textContent=s.nodes.map((n,i)=>i===0?'Node 0: ceiling hook':`Node ${i}${i===s.protected?' (protected)':''}: mass ${n.m}, arm ${n.x}, ${s.alive.includes(i)?'hanging':'fallen'}`).join(' · ');
 sculptButtons.forEach((b,i)=>{const [u,v]=sculptEdges[i],state=s.cut.includes(i)?'cut':!s.alive.includes(u)||!s.alive.includes(v)?'fallen':'intact';b.textContent=`Bond ${i+1}: ${u}–${v} · ${state}`;b.setAttribute('aria-pressed',String(s.selected===i));b.disabled=!running||!!s.result;});
}
}
function act(a){if(!running||s.result)return;engine.step(s,a);if(!Number.isFinite(s.t))throw new Error('Invalid turn state');if(s.result==='won'&&(!record||s.t<record)){record=s.t;try{localStorage.setItem('small-hours-kinetic-'+meta.id,String(record))}catch(e){$('storage').textContent='The result is yours; local storage could not save it.'}}render()}
function restart(){s=engine.init();running=true;render();canvas.focus()}
$('start').onclick=()=>{running=true;render();canvas.focus()};$('restart').onclick=restart;
document.addEventListener('keydown',e=>{if(e.repeat||e.ctrlKey||e.altKey||e.metaKey)return;if(e.target.matches('button,summary,a')&&(e.key===' '||e.key==='Enter'))return;const a=engine.actions.find(a=>a[2].toLowerCase()===e.key.toLowerCase()||(a[2]==='Space'&&e.key===' '));if(a){e.preventDefault();act(a[0])}});render();document.body.dataset.gameReady='true';document.body.dataset.gameId=meta.id;
})().catch(error=>{document.getElementById('status').textContent='The game could not load. Please reload this page.';console.error(error)});
