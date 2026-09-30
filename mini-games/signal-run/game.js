(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const canvas = $('game'), ctx = canvas.getContext('2d');
  const lanes = [120, 360, 600], playerY = 510, duration = 60;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let state = 'ready', lane = 1, score = 0, health = 3, streak = 0, elapsed = 0;
  let objects = [], particles = [], spawnIn = .5, lastFrame = 0, invincible = 0, feedbackFor = 0, best = 0;
  let storageAvailable = true;
  try { const saved = Number(localStorage.getItem('small-hours-signal-best')); best = Number.isFinite(saved) ? Math.max(0, saved) : 0; }
  catch { storageAvailable = false; }
  function recordUI() { $('best').textContent = best.toLocaleString(); $('storage-note').textContent = storageAvailable ? 'Saved on this browser.' : 'Storage unavailable. Best kept for this visit.'; }
  function updateUI() {
    $('score').textContent = score.toLocaleString(); $('time').innerHTML = `${Math.ceil(Math.max(0, duration - elapsed))}<span>s</span>`;
    $('health').textContent = Array.from({length:3}, (_, i) => i < health ? '●' : '○').join(' ');
    $('health').setAttribute('aria-label', `${health} shields`);
    $('combo').textContent = `Streak / ${Math.min(5, 1 + Math.floor(streak / 3))}×`;
    document.querySelectorAll('[data-lane]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.lane) === lane)));
  }
  function say(message) { $('announcement').textContent = message; }
  function flash(message) { $('feedback').textContent = message; feedbackFor = 1; }
  function start() {
    state = 'playing'; lane = 1; score = 0; health = 3; streak = 0; elapsed = 0;
    objects = []; particles = []; spawnIn = .5; invincible = 0; feedbackFor = 0;
    $('feedback').textContent = ''; $('overlay').hidden = true; $('pause').disabled = false; $('restart').disabled = false;
    $('pause').innerHTML = 'Pause <kbd>P</kbd>'; updateUI(); say('Run started. Three shields.'); $('pause').focus({preventScroll:true});
  }
  function overlay(title, copy, button, overline) {
    $('overlay-title').textContent = title; $('overlay-copy').textContent = copy; $('start').replaceChildren(document.createTextNode(button)); const arrow = document.createElement('span'); arrow.textContent = '↗'; arrow.setAttribute('aria-hidden', 'true'); $('start').append(arrow);
    $('overline').textContent = overline; $('overlay-hint').textContent = '← → / A D to switch • or tap a lane';
    $('overlay').hidden = false; $('start').focus({preventScroll:true});
  }
  function pause() {
    if (state === 'playing') { state = 'paused'; overlay('Take a breath.', 'Your run is right where you left it.', 'Resume run', 'Connection on hold'); $('pause').innerHTML = 'Resume <kbd>P</kbd>'; say('Paused.'); }
    else if (state === 'paused') { state = 'playing'; $('overlay').hidden = true; $('pause').innerHTML = 'Pause <kbd>P</kbd>'; $('pause').focus({preventScroll:true}); say('Run resumed.'); }
  }
  function end(won) {
    state = 'ended'; const newBest = score > best;
    if (newBest) { best = score; try { localStorage.setItem('small-hours-signal-best', String(best)); } catch { storageAvailable = false; } recordUI(); }
    $('pause').disabled = true; $('feedback').textContent = '';
    overlay(won ? 'Signal delivered.' : 'Connection lost.', `${score.toLocaleString()} points · ${Math.floor(elapsed)} seconds. ${won ? 'A full minute of flow. Beautifully done.' : 'A fresh frequency is one more run away.'}`, 'Play again', newBest ? 'New personal best' : won ? 'Run complete / 60 seconds' : 'Out of shields');
    say(`${won ? 'Run complete' : 'Game over'}. ${score} points.${newBest ? ' New personal best.' : ''}`);
  }
  function selectLane(value) { if(state !== 'playing') return; lane = Math.max(0, Math.min(2, value)); updateUI(); }
  $('start').addEventListener('click', () => state === 'paused' ? pause() : start());
  $('restart').addEventListener('click', start); $('pause').addEventListener('click', pause);
  document.querySelectorAll('[data-lane]').forEach(button => button.addEventListener('click', () => selectLane(Number(button.dataset.lane))));
  canvas.addEventListener('pointerdown', event => { const rect = canvas.getBoundingClientRect(); selectLane(Math.floor((event.clientX - rect.left) / rect.width * 3)); });
  document.addEventListener('keydown', event => {
    const key = event.key.toLowerCase();
    if (['arrowleft','arrowright','a','d'].includes(key) && state === 'playing') { event.preventDefault(); selectLane(lane + (['arrowleft','a'].includes(key) ? -1 : 1)); }
    if (['p','escape'].includes(key) && !event.repeat) { event.preventDefault(); pause(); }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'playing') pause(); });
  window.addEventListener('blur', () => { if (state === 'playing') pause(); });
  function spawn() {
    const safe = Math.floor(Math.random() * 3);
    objects.push({lane:safe, y:-45, kind:'signal', resolved:false});
    const blocked = [0,1,2].filter(n => n !== safe);
    if (elapsed < 14 || Math.random() < .3) blocked.splice(Math.floor(Math.random()*2),1);
    blocked.forEach(n => objects.push({lane:n, y:-45, kind:'static', resolved:false}));
  }
  function burst(x, color) {
    if (reducedMotion.matches) return;
    for(let i=0;i<10;i++) particles.push({x,y:playerY,vx:(Math.random()-.5)*180,vy:(Math.random()-.5)*180,life:.45,color});
  }
  function tick(dt) {
    elapsed = Math.min(duration, elapsed + dt); invincible = Math.max(0, invincible-dt);
    feedbackFor -= dt; if(feedbackFor <= 0) $('feedback').textContent = '';
    spawnIn -= dt;
    if(spawnIn <= 0) { spawn(); spawnIn = 1.05 - .3 * elapsed / duration; }
    const speed = 235 + elapsed * 2.6;
    for (const object of objects) {
      object.y += speed * dt;
      if (!object.resolved && object.y >= playerY) {
        object.resolved = true;
        if(object.lane !== lane) { if(object.kind === 'signal') { streak = 0; flash('MISSED SIGNAL / STREAK RESET'); } continue; }
        if(object.kind === 'signal') { const multiplier = Math.min(5, 1 + Math.floor(streak/3)); score += 100 * multiplier; streak++; burst(lanes[lane], '#d4f35b'); flash(`+${100*multiplier} / CONNECTED`); }
        else if(invincible <= 0) { health--; streak = 0; invincible = .7; burst(lanes[lane], '#fc754b'); flash('STATIC / −1 SHIELD'); say(`${health} shields remaining.`); if(health <= 0) { updateUI(); end(false); return; } }
      }
    }
    objects = objects.filter(object => object.y < 670);
    particles.forEach(p => { p.x += p.vx*dt; p.y += p.vy*dt; p.life -= dt; }); particles = particles.filter(p => p.life>0);
    updateUI(); if(elapsed >= duration) end(true);
  }
  function rounded(x,y,w,h,r,fill) { ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x,y,w,h,r); ctx.fill(); }
  function draw() {
    ctx.fillStyle = '#293226'; ctx.fillRect(0,0,720,600);
    ctx.fillStyle = '#303b2a'; ctx.fillRect(lane*240,0,240,600);
    ctx.strokeStyle = '#556042'; ctx.lineWidth = 1;
    [240,480].forEach(x=>{ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,600);ctx.stroke()});
    ctx.setLineDash([8,20]); ctx.strokeStyle = '#455139';
    const offset = reducedMotion.matches ? 0 : elapsed*75%28;
    lanes.forEach(x=>{ctx.beginPath();ctx.moveTo(x,-28+offset);ctx.lineTo(x,600);ctx.stroke()}); ctx.setLineDash([]);
    ctx.strokeStyle = '#728447'; ctx.beginPath();ctx.moveTo(0,playerY+45);ctx.lineTo(720,playerY+45);ctx.stroke();
    ctx.font = '11px monospace';ctx.textAlign='center';ctx.fillStyle='#b6c39d';lanes.forEach((x,i)=>ctx.fillText(`0${i+1}`,x,585));
    for(const object of objects) {
      if(object.resolved) continue;
      const x = lanes[object.lane], y = object.y;
      if(object.kind === 'signal') {
        ctx.fillStyle='#d4f35b'; ctx.beginPath();ctx.arc(x,y,26,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#20271f';ctx.beginPath();ctx.moveTo(x,y-16);ctx.lineTo(x+5,y-5);ctx.lineTo(x+16,y);ctx.lineTo(x+5,y+5);ctx.lineTo(x,y+16);ctx.lineTo(x-5,y+5);ctx.lineTo(x-16,y);ctx.lineTo(x-5,y-5);ctx.closePath();ctx.fill();
      } else { rounded(x-31,y-27,62,54,10,'#fc754b');ctx.strokeStyle='#20271f';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x-9,y-9);ctx.lineTo(x+9,y+9);ctx.moveTo(x+9,y-9);ctx.lineTo(x-9,y+9);ctx.stroke(); }
    }
    const x=lanes[lane];
    if(invincible>0) { ctx.strokeStyle='#fc754b';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,playerY,43,0,Math.PI*2);ctx.stroke(); }
    rounded(x-28,playerY-29,56,58,13,'#f1f0e8');ctx.strokeStyle='#20271f';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x,playerY+13);ctx.lineTo(x,playerY-12);ctx.moveTo(x-10,playerY-2);ctx.lineTo(x,playerY-12);ctx.lineTo(x+10,playerY-2);ctx.stroke();
    particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life/.45);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,5,5)});ctx.globalAlpha=1;
  }
  function frame(now) { const dt = Math.min((now-lastFrame)/1000,.05);lastFrame=now;if(state==='playing')tick(dt);draw();requestAnimationFrame(frame); }
  recordUI(); updateUI(); requestAnimationFrame(frame);
})();
