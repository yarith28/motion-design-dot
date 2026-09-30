(() => {
  'use strict';
  const $ = id => document.getElementById(id), NS = 'http://www.w3.org/2000/svg';
  const record = SmallHours.record('small-hours-sky-stack-best');
  let state, floors, score, top, slab, direction, last = null, raf;
  const colors = ['#ee927c','#f4b38d','#e9c994','#9fc1b3'];
  function block(parent,x,y,width,fill) {
    const g=document.createElementNS(NS,'g');
    for(const [color,stroke] of [[fill,'#244752'],['url(#windows)','none']]) {
      const r=document.createElementNS(NS,'rect');
      Object.entries({x,y,width,height:24,fill:color,stroke,'stroke-width':1.4,rx:1}).forEach(([k,v])=>r.setAttribute(k,v));g.append(r);
    }
    parent.append(g);return g;
  }
  function draw(){ $('moving').replaceChildren();if(slab)block($('moving'),slab.x,402-floors*24,slab.w,colors[floors%4]); }
  function stats(){ $('floors').textContent=`${floors} / 12`;$('width').textContent=`${Math.round(top.w/160*100)}%`;$('score').textContent=score; }
  function reset(){ cancelAnimationFrame(raf);last=null;state='ready';floors=0;score=0;top={x:120,w:160};slab=null;$('tower').replaceChildren();block($('tower'),120,426,160,'#7aadaf');$('debris').replaceChildren();$('result').hidden=true;$('curtain').hidden=false;$('curtain-label').textContent='A TINY LANDMARK, BY YOU';$('curtain-title').textContent='Meet the skyline.';$('curtain-copy').textContent='Twelve floors. One steady hand.';$('action').disabled=false;$('action').textContent='Start building ↗';$('pause').disabled=true;$('pause').textContent='Pause';$('message').textContent='Line up the moving slab, then drop. Keep a little sky beneath you.';stats();draw(); }
  function spawn(){direction=floors%2? -1:1;slab={x:direction===1?12:388-top.w,w:top.w};draw();}
  function tick(now){if(state!=='playing')return;const dt=last===null?0:Math.min((now-last)/1000,.05);last=now;slab.x+=direction*(95+floors*9)*dt;const max=388-slab.w;if(slab.x>max){slab.x=max-(slab.x-max);direction=-1;}if(slab.x<12){slab.x=24-slab.x;direction=1;}draw();raf=requestAnimationFrame(tick);}
  function start(){state='playing';$('curtain').hidden=true;$('action').textContent='Drop floor ↓';$('pause').disabled=false;spawn();last=null;raf=requestAnimationFrame(tick);}
  function finish(won){state='ended';cancelAnimationFrame(raf);last=null;$('pause').disabled=true;$('action').disabled=true;$('result').hidden=false;$('result-title').textContent=won?'A landmark, all yours.':'A beautiful near-miss.';$('result-copy').textContent=`${floors} floors built · ${score} points. ${won?'The skyline has a new addition. Can you build it wider next time?':'A fresh foundation is waiting. Aim for the middle and find your rhythm.'}`;$('message').textContent=won?'Skyline reached! Twelve floors standing tall.':'No overlap. Your build ends here.';record.save(score);$('again').focus({preventScroll:true});}
  function drop(){if(state==='ready'){start();return;}if(state!=='playing')return;const delta=slab.x-top.x;const left=Math.max(slab.x,top.x),right=Math.min(slab.x+slab.w,top.x+top.w);if(right<=left){finish(false);return;}const perfect=Math.abs(delta)<=6;let width=right-left,x=left;
    $('debris').replaceChildren();if(perfect){width=Math.min(160,top.w+8);x=top.x+(top.w-width)/2;score+=150;}else{score+=Math.round(width/160*100);const cut=document.createElementNS(NS,'rect');Object.entries({x:delta<0?slab.x:right,y:402-floors*24,width:Math.abs(delta),height:24,fill:colors[floors%4]}).forEach(([k,v])=>cut.setAttribute(k,v));$('debris').append(cut);}
    // The foundation sits at y426; each newly placed floor rises one level.
    block($('tower'),x,402-floors*24,width,colors[floors%4]);top={x,w:width};floors++;stats();$('message').textContent=perfect?`Perfect fit! +150 points · ${floors} of 12 floors.`:`Trimmed ${Math.round(Math.abs(delta))} pixels. ${floors} of 12 floors — keep building.`;if(floors===12){slab=null;draw();finish(true);}else spawn();
  }
  function pause(){if(state==='playing'){state='paused';cancelAnimationFrame(raf);last=null;$('curtain').hidden=false;$('curtain-label').textContent='TAKE A BREATHER';$('curtain-title').textContent='Sky on hold.';$('curtain-copy').textContent='Your tower will be right here.';$('pause').textContent='Resume';$('action').disabled=true;$('message').textContent='Paused. Press Resume or P to keep building.';}else if(state==='paused'){state='playing';$('curtain').hidden=true;$('pause').textContent='Pause';$('action').disabled=false;last=null;raf=requestAnimationFrame(tick);$('message').textContent='Back to the skyline. Drop when the edges align.';}}
  $('action').addEventListener('click',drop);$('pause').addEventListener('click',pause);$('restart').addEventListener('click',reset);$('again').addEventListener('click',()=>{reset();start();$('action').focus({preventScroll:true});});
  document.addEventListener('keydown',e=>{if(e.repeat||e.altKey||e.ctrlKey||e.metaKey)return;if(e.code==='KeyP'||e.code==='Escape'){e.preventDefault();pause();}else if(e.code==='Space'&&!e.target.closest('button,a,input,select,textarea')){e.preventDefault();drop();}});
  window.addEventListener('blur',()=>{if(state==='playing')pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')pause();});reset();
})();
