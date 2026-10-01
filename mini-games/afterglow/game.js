(() => {
  'use strict';
  const $=id=>document.getElementById(id), E=Afterglow, canvas=$('field'), ctx=canvas.getContext('2d');
  const record=SmallHours.record('small-hours-afterglow-best');
  const pixelRatio=Math.min(2,window.devicePixelRatio||1);canvas.width=560*pixelRatio;canvas.height=660*pixelRatio;ctx.scale(pixelRatio,pixelRatio);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const names=['First light','Paper moon','Daybreak'];
  let mode='ready', resumeMode='aim', garden=0, s=E.create(0), angle=-Math.PI/2, total=0;
  let power=1, orbs=5, saves=1, volleys=0, particles=[], flowers=[], toastTime=0, last=null, accumulator=0;
  let audio=null, sound=false, lastTone=0, pointer=null;
  function tone(frequency=440, duration=.09) {
    if(!sound||!audio||audio.state!=='running'||audio.currentTime-lastTone<.025)return;
    lastTone=audio.currentTime;
    const oscillator=audio.createOscillator(), gain=audio.createGain();
    oscillator.type='sine';oscillator.frequency.setValueAtTime(frequency,audio.currentTime);
    gain.gain.setValueAtTime(.055,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);
    oscillator.connect(gain);gain.connect(audio.destination);oscillator.start();oscillator.stop(audio.currentTime+duration);
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect()};
  }
  async function toggleSound() {
    if(sound){sound=false;if(audio)await audio.suspend().catch(()=>{});}
    else {
      try { const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error('unavailable');audio=audio||new Audio();await audio.resume();sound=true;tone(660,.18); }
      catch {sound=false;$('message').textContent='Sound is unavailable here. The garden plays just as well in silence.';}
    }
    $('sound').textContent=sound?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',String(sound));
  }
  function audioResume(){if(sound&&audio)audio.resume().catch(()=>{})}
  function message(text){$('message').textContent=text}
  function toast(text){$('toast').textContent=text;toastTime=1.4}
  function sync() {
    $('score').textContent=(total+s.score).toLocaleString();$('orbs').textContent=s.orbs;$('power').textContent=`${power} / ${saves}`;
    $('aim').disabled=mode!=='aim';$('launch').disabled=mode!=='aim';$('recall').disabled=mode!=='volley';
    $('pause').disabled=!['aim','volley','paused'].includes(mode);$('pause').textContent=mode==='paused'?'>':'II';
    $('pause').setAttribute('aria-label',mode==='paused'?'Resume game':'Pause game');
    document.querySelectorAll('.journey li').forEach((li,i)=>{li.className=i<garden||mode==='won'?'complete':i===garden?'current':'';li.setAttribute('aria-current',i===garden?'step':'false')});
  }
  function panel(tag,title,copy,button,upgrade=false) {
    $('toast').textContent='';toastTime=0;
    $('veil').hidden=false;$('veil').classList.toggle('upgrade',upgrade);$('panel-tag').textContent=tag;
    $('panel-title').textContent=title;$('panel-copy').textContent=copy;$('choices').hidden=!upgrade;
    $('begin').replaceChildren(document.createTextNode(button));const arrow=document.createElement('span');arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');$('begin').append(arrow);
    $('flower-mark').textContent=mode==='lost'?'☾':'✳\uFE0E';$('panel-foot').textContent=upgrade?'Your choice lasts for the rest of this expedition.':'A new run brings a fresh arrangement.';
    (upgrade?document.querySelector('[data-upgrade]'):$('begin')).focus({preventScroll:true});
  }
  function enterGarden() {
    s=E.create(garden,orbs,power,Math.floor(Math.random()*6));angle=-Math.PI/2;particles=[];flowers=[];accumulator=0;last=null;mode='aim';
    $('veil').hidden=true;$('toast').textContent='';setAngle(angle);sync();message(`${names[garden]}. Clear every pod. Aim, then release your fireflies.`);
  }
  function restart() {
    garden=0;total=0;power=1;orbs=5;saves=1;volleys=0;toastTime=0;audioResume();enterGarden();
  }
  function setAngle(value) {
    angle=Math.max(-Math.PI+.19,Math.min(-.19,value));const degrees=Math.round(-angle*180/Math.PI);
    $('aim').value=degrees;$('degrees').textContent=`${degrees}°`;
  }
  function launch() {
    if(mode!=='aim')return;audioResume();mode='volley';E.launch(s,angle);volleys++;sync();tone(330,.12);message(`Volley ${volleys}. Let the walls do a little work.`);
  }
  function end(won) {
    mode=won?'won':'lost';const final=total+s.score+(won?500+saves*150:0);s.score=final-total;
    const improved=record.save(final);
    panel(won?'Expedition complete / A new dawn':'The garden can wait',won?'You left it brighter.':'Even stars need rest.',`${final.toLocaleString()} light · ${volleys} volleys · ${won?'all three gardens awakened.':`${garden+1} of 3 gardens reached.`} ${improved?'Your brightest expedition yet.':'There is always another way to bounce.'}`,'Begin again');
    sync();message(won?`Expedition complete. ${final} light gathered.`:`Expedition ended. ${final} light gathered.`);tone(won?880:220,.3);
  }
  function settle() {
    if(s.blocks.length===0) {
      orbs=s.orbs;total+=s.score+250;s.score=0;
      if(garden===2){end(true);return}
      mode='upgrade';panel(`Garden ${garden+1} complete / +250 light`,'A little room to grow.',`${names[garden]} is awake. Choose a gift for the path ahead.`,'',true);sync();message('Garden complete. Choose one of three upgrades.');tone(880,.22);return;
    }
    s.blocks.forEach(b=>b.y+=57);
    if(s.blocks.some(b=>b.y+b.h>=565)) {
      if(saves>0){saves--;s.blocks.forEach(b=>b.y-=114);toast('SECOND WIND');message('A rescue pushes the garden back two rows. Make it count.');tone(220,.2)}
      else {end(false);return}
    } else message(`${s.blocks.length} pods left. First firefly home sets your next launch point.`);
    mode='aim';sync();
  }
  function choose(kind) {
    if(mode!=='upgrade')return;
    if(kind==='orbs')orbs+=3;if(kind==='power')power++;if(kind==='saves')saves+=2;
    garden++;enterGarden();$('launch').focus({preventScroll:true});
  }
  function pause() {
    if(mode==='aim'||mode==='volley') {
      resumeMode=mode;mode='paused';panel('Connection on hold','Take a breath.','Your fireflies are right where you left them.','Return to the garden');
      if(audio)audio.suspend().catch(()=>{});sync();message('Paused. Nothing in the garden moves.');
    } else if(mode==='paused') {mode=resumeMode;last=null;accumulator=0;$('veil').hidden=true;audioResume();sync();message('Welcome back. Your expedition continues.');canvas.focus({preventScroll:true})}
  }
  function burst(x,y,kind) {
    if(kind!=='hit')flowers.push({x,y,petals:5+(flowers.length%3),rotation:flowers.length*.7});
    if(reduced.matches)return;
    for(let i=0;i<(kind==='hit'?3:10);i++)particles.push({x,y,vx:(Math.random()-.5)*110,vy:(Math.random()-.5)*110,life:kind==='hit'?.18:.7,color:kind==='seed'?'#d4f35b':'#f4b6a1'});
    if(particles.length>250)particles.splice(0,particles.length-250);
  }
  function roundRect(x,y,w,h,r,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}
  function bloom(x,y,r,rotation,color) {
    ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.fillStyle=color;
    for(let i=0;i<5;i++){ctx.rotate(Math.PI*2/5);ctx.beginPath();ctx.ellipse(0,-r*.58,r*.34,r*.54,0,0,Math.PI*2);ctx.fill()}
    ctx.fillStyle='#34283e';ctx.beginPath();ctx.arc(0,0,r*.2,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function aimGuide() {
    let x=s.origin,y=E.FLOOR-2,vx=Math.cos(angle),vy=Math.sin(angle),steps=0;
    ctx.beginPath();ctx.moveTo(x,y);
    while(steps++<180) {
      x+=vx*5;y+=vy*5;if(x<6||x>554){vx*=-1;x=Math.max(6,Math.min(554,x))}if(y<64)break;
      if(s.blocks.some(b=>x>b.x-6&&x<b.x+b.w+6&&y>b.y-6&&y<b.y+b.h+6))break;
      ctx.lineTo(x,y);
    }
    ctx.setLineDash([3,9]);ctx.strokeStyle='#e5beaf95';ctx.lineWidth=2;ctx.stroke();ctx.setLineDash([]);
    ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fillStyle='#f4b6a1';ctx.fill();
  }
  function draw() {
    ctx.fillStyle=['#252139','#27263c','#30273a'][garden];ctx.fillRect(0,0,560,660);
    for(let i=0;i<40;i++){ctx.fillStyle=i%3?'#c0acd523':'#f4b6a140';ctx.fillRect((i*137+23)%550,(i*83+40)%580,2,2)}
    ctx.strokeStyle='#6a50742e';ctx.lineWidth=1;[85,155,225,295,365,435,505].forEach(x=>{ctx.beginPath();ctx.moveTo(x,75);ctx.lineTo(x,557);ctx.stroke()});
    ctx.fillStyle='#b8a4c7';ctx.font='10px monospace';ctx.textAlign='left';ctx.fillText(`0${garden+1} / ${names[garden].toUpperCase()}`,25,34);ctx.textAlign='right';ctx.fillText(`${s.blocks.length} PODS TO WAKE`,535,34);
    ctx.strokeStyle='#f4b6a173';ctx.setLineDash([5,7]);ctx.beginPath();ctx.moveTo(0,565);ctx.lineTo(560,565);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#a994b3';ctx.font='8px monospace';ctx.textAlign='left';ctx.fillText('KEEP THE SOIL CLEAR',18,579);
    ctx.fillStyle='#40324c';ctx.beginPath();ctx.moveTo(0,648);ctx.bezierCurveTo(120,602,215,669,315,631);ctx.bezierCurveTo(422,594,491,640,560,620);ctx.lineTo(560,660);ctx.lineTo(0,660);ctx.fill();
    flowers.forEach((f,i)=>{const x=(i*67+34)%535;ctx.strokeStyle='#957a9366';ctx.beginPath();ctx.moveTo(x,660);ctx.lineTo(x,640-(i%3)*7);ctx.stroke();bloom(x,637-(i%3)*7,9,f.rotation,'#b590aa')});
    if(mode==='aim')aimGuide();
    for(const b of s.blocks) {
      const color=b.kind==='seed'?'#d4f35b':b.kind==='bloom'?'#f4b6a1':b.hp>2?'#ab97c3':'#d0bed8';
      roundRect(b.x,b.y,b.w,b.h,15,b.flash>0&&!reduced.matches?'#fff1de':color);
      ctx.strokeStyle='#34243d30';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(b.x+31,b.y+26,22,17,0,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle='#30253b';ctx.font='bold 20px monospace';ctx.textAlign='center';
      if(b.kind==='bloom')bloom(b.x+31,b.y+26,18,0,'#55405e');else ctx.fillText(b.kind==='seed'?'+':b.hp,b.x+31,b.y+33);
    }
    for(const b of s.balls) {
      if(!reduced.matches){ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-b.vx*.035,b.y-b.vy*.035);ctx.strokeStyle='#f4b6a15c';ctx.lineWidth=5;ctx.stroke()}
      ctx.beginPath();ctx.arc(b.x,b.y,6,0,Math.PI*2);ctx.fillStyle='#fff2db';ctx.fill();
    }
    if(mode!=='volley'){
      ctx.strokeStyle='#f4b6a1';ctx.lineWidth=2;ctx.beginPath();ctx.arc(s.origin,E.FLOOR,13,Math.PI,0);ctx.stroke();
      ctx.fillStyle='#fff2db';ctx.beginPath();ctx.arc(s.origin,E.FLOOR-3,6,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#e6b9ac';ctx.font='10px monospace';ctx.textAlign='center';ctx.fillText(`×${s.orbs}`,s.origin,E.FLOOR+18);
    }
    particles.forEach(p=>{ctx.globalAlpha=Math.min(1,p.life*2);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,2.5,0,Math.PI*2);ctx.fill()});ctx.globalAlpha=1;
  }
  function frame(now) {
    const dt=last===null?0:Math.min((now-last)/1000,.05);last=now;
    if(mode!=='paused') {
      toastTime-=dt;if(toastTime<=0)$('toast').textContent='';
      particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt});particles=particles.filter(p=>p.life>0);
    }
    if(mode==='volley') {
      accumulator+=dt;
      while(accumulator>=E.STEP&&mode==='volley') {
        E.advance(s,E.STEP);accumulator-=E.STEP;
        s.events.forEach(e=>{burst(e.x,e.y,e.kind);if(e.kind==='extra')toast('+1 FIREFLY');else if(e.kind==='bloom')toast('CHAIN BLOOM');tone(e.kind==='hit'?330+(s.hits%7)*55:660,.1)});
        if(s.done){accumulator=0;settle()}
      }
      sync();
    }
    draw();requestAnimationFrame(frame);
  }
  function aimPointer(event) {
    if(mode!=='aim')return;const rect=canvas.getBoundingClientRect();
    const x=(event.clientX-rect.left)*560/rect.width,y=Math.min(E.FLOOR-45,(event.clientY-rect.top)*660/rect.height);
    setAngle(Math.atan2(y-E.FLOOR,x-s.origin));
  }
  canvas.addEventListener('pointerdown',event=>{if(mode!=='aim'||!event.isPrimary)return;pointer=event.pointerId;canvas.setPointerCapture(pointer);aimPointer(event)});
  canvas.addEventListener('pointermove',event=>{if(event.pointerId===pointer)aimPointer(event)});
  ['pointerup','pointercancel','lostpointercapture'].forEach(name=>canvas.addEventListener(name,()=>{pointer=null}));
  $('aim').addEventListener('input',()=>{if(mode==='aim')setAngle(-Number($('aim').value)*Math.PI/180)});
  $('launch').addEventListener('click',launch);
  $('recall').addEventListener('click',()=>{if(mode==='volley'){E.recall(s);settle()}});
  $('begin').addEventListener('click',()=>{if(mode==='paused')pause();else restart()});
  $('restart').addEventListener('click',restart);$('pause').addEventListener('click',pause);$('sound').addEventListener('click',toggleSound);
  document.querySelectorAll('[data-upgrade]').forEach(button=>button.addEventListener('click',()=>choose(button.dataset.upgrade)));
  document.addEventListener('keydown',event=>{
    if(event.ctrlKey||event.altKey||event.metaKey)return;
    if(['p','escape'].includes(event.key.toLowerCase())&&!event.repeat){event.preventDefault();pause();return}
    if(event.target.tagName==='INPUT'){if(event.code==='Space'){event.preventDefault();if(!event.repeat)launch()}return;}
    if(['ArrowLeft','ArrowRight'].includes(event.key)&&mode==='aim'){event.preventDefault();setAngle(angle+(event.key==='ArrowLeft'?-1:1)*(event.shiftKey?.01:.045))}
    if(event.code==='Space'&&(event.target===canvas||event.target===document.body)){event.preventDefault();if(!event.repeat)launch()}
  });
  const autoPause=()=>{if(mode==='aim'||mode==='volley')pause()};
  window.addEventListener('blur',autoPause);document.addEventListener('visibilitychange',()=>{if(document.hidden)autoPause()});
  sync();draw();requestAnimationFrame(frame);
})();
