(() => {
  'use strict';
  const $ = id => document.getElementById(id), TAU = Math.PI * 2;
  const record = SmallHours.record('small-hours-pocket-orbit-best');
  let state = 'ready', beforePause = 'playing', angle = 0, target = 0, width = .8;
  let round = 0, score = 0, misses = 0, results = [], wait = 0, last = null;
  const normalize = n => (n % TAU + TAU) % TAU;
  const distance = (a, b) => Math.abs(Math.atan2(Math.sin(a-b), Math.cos(a-b)));
  const point = (a, r = 146) => [200 + Math.cos(a) * r, 200 + Math.sin(a) * r];
  function draw() {
    const a = point(target - width/2), b = point(target + width/2);
    $('target-arc').setAttribute('d', `M${a} A146 146 0 0 1 ${b}`);
    $('target-center').setAttribute('d', `M${point(target, 132)} L${point(target, 160)}`);
    const p = point(angle); $('courier').setAttribute('transform', `translate(${p})`);
  }
  function stats() {
    $('score').textContent = score; $('round').textContent = `${round + 1} / 8`; $('lives').textContent = `${3-misses} / 3`;
    $('round-dots').innerHTML = Array.from({length:8}, (_, i) => `<span class="${results[i] || ''}" aria-label="Orbit ${i+1}: ${results[i] || 'pending'}">${results[i] === 'hit' ? '✓' : results[i] === 'miss' ? '×' : i+1}</span>`).join('');
  }
  function actionLabel(text) {
    $('action').replaceChildren(document.createTextNode(text));
    const arrow = document.createElement('span'); arrow.textContent = '↗'; arrow.setAttribute('aria-hidden','true'); $('action').append(arrow);
  }
  function next() {
    state = 'playing'; width = .8 - round * .04;
    target = Math.random() * TAU; angle = normalize(target - 2.2);
    $('dial-label').textContent = `ORBIT ${round+1} / 8`; $('dial-value').textContent = 'LOCK IN'; $('direction').textContent = 'Clockwise / find the notch';
    $('message').textContent = 'Stop inside the lime arc. Aim for its center notch.';
    $('action').disabled = false; actionLabel('Lock orbit'); stats(); draw();
    if (document.activeElement === $('dial-value')) $('action').focus({preventScroll:true});
  }
  function start() {
    round = score = misses = 0; results = []; wait = 0; last = null;
    $('result').hidden = true; $('pause').disabled = false; $('pause').textContent = 'Pause'; next();
  }
  function end() {
    state = 'ended'; const improved = record.save(score);
    $('result-title').textContent = misses === 3 ? 'Out of orbit.' : 'Perfectly in your orbit.';
    $('result-copy').textContent = `${score} points · ${results.filter(n=>n==='hit').length} successful locks. ${improved ? 'A new personal best.' : 'One more little moment?'}`;
    $('result').hidden = false; $('pause').disabled = true; $('action').disabled = true;
    $('dial-label').textContent = 'RUN COMPLETE'; $('dial-value').textContent = score; $('direction').textContent = 'A little timing goes a long way.';
    $('message').textContent = `${misses === 3 ? 'Three misses. Run ended.' : 'Eight orbits complete.'} ${score} points.`;
    $('again').focus({preventScroll:true});
  }
  function lock() {
    if (state === 'ready') { start(); return; }
    if (state !== 'playing') return;
    const offset = distance(angle, target), hit = offset <= width/2;
    const earned = hit ? Math.round(40 + 60 * (1 - offset / (width/2))) : 0;
    if (hit) { score += earned; results.push('hit'); } else { misses++; results.push('miss'); }
    $('dial-label').textContent = hit ? earned >= 90 ? 'BEAUTIFUL TIMING' : 'CONNECTION MADE' : 'A LITTLE OFF';
    $('dial-value').textContent = hit ? `+${earned}` : 'MISSED';
    $('message').textContent = hit ? `${earned >= 90 ? 'Perfect lock!' : 'Connected!'} ${earned} points.` : `Missed the arc. ${3-misses} chances left.`;
    $('action').disabled = true; stats(); state = 'between'; wait = .75;
  }
  function pause() {
    if (state === 'playing' || state === 'between') {
      beforePause = state; state = 'paused'; $('pause').textContent = 'Resume'; $('action').disabled = true;
      $('dial-value').textContent = 'PAUSED'; $('message').textContent = 'Take your time. Your orbit is safely paused.';
    } else if (state === 'paused') {
      state = beforePause; last = null; $('pause').textContent = 'Pause'; $('action').disabled = state !== 'playing';
      $('dial-value').textContent = state === 'playing' ? 'LOCK IN' : results.at(-1) === 'hit' ? 'LOCKED' : 'MISSED';
      $('message').textContent = 'Back in orbit. Find your moment.';
      // A resumed feedback interval has no enabled action yet. Keep Space away
      // from Pause, then restore action focus when the next orbit is ready.
      if (state === 'playing') $('action').focus({preventScroll:true});
      else { $('dial-value').tabIndex = -1; $('dial-value').focus({preventScroll:true}); }
    }
  }
  function frame(now) {
    const dt = last === null ? 0 : Math.min(.05, (now-last)/1000); last = now;
    if (state === 'playing') { angle = normalize(angle + dt * (1.8 + round*.14)); draw(); }
    if (state === 'between') {
      wait -= dt;
      if (wait <= 0) { if (misses >= 3 || round === 7) end(); else { round++; next(); } }
    }
    requestAnimationFrame(frame);
  }
  // Timing responds on contact, not on release; keyboard/assistive clicks still work.
  $('action').addEventListener('pointerdown', event => {
    if (event.button !== 0 || $('action').disabled) return;
    event.preventDefault(); $('action').focus({preventScroll:true}); lock();
  });
  // Some Chromium versions emit detail=0 for touch clicks after pointerdown.
  // Touch/pen input was already handled on contact. Keep zero-detail mouse
  // compatibility clicks available for keyboard and assistive activation.
  $('action').addEventListener('click', event => { if (event.detail === 0 && !['touch', 'pen'].includes(event.pointerType)) lock(); });
  $('pause').addEventListener('click', pause);
  $('restart').addEventListener('click', () => { start(); $('action').focus({preventScroll:true}); });
  $('again').addEventListener('click', () => { start(); $('action').focus({preventScroll:true}); });
  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.code === 'Space' && (!event.target.closest('button,a') || event.target === $('action'))) {
      event.preventDefault(); if (!event.repeat) lock();
    }
    if (['p','escape'].includes(event.key.toLowerCase()) && !event.repeat) { event.preventDefault(); pause(); }
  });
  const backgroundPause = () => { if (state === 'playing' || state === 'between') pause(); };
  window.addEventListener('blur', backgroundPause);
  document.addEventListener('visibilitychange', () => { if (document.hidden) backgroundPause(); });
  target = -Math.PI/2; angle = Math.PI*.65; stats(); draw(); requestAnimationFrame(frame);
})();
