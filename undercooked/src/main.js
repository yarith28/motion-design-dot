import { createGame, startGame, tick, interact, actionLabel, pauseGame, resumeGame, takeEvents, handName, RECIPES, starsFor } from './core.js';
import { Kitchen } from './kitchen.js';

const $ = (id) => document.getElementById(id);
const game = createGame({ seed: 2804 });
const keys = new Set(), joystick = { x: 0, z: 0, id: null };
const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
let kitchen, helpOpen = false, lastPhase = '', lastOrders = '', lastToast = '', lastHand = '', audioContext, lastFrame = performance.now(), muted = false, best = 0, actionPointer = null;
try { muted = localStorage.getItem('undercooked-muted') === 'true'; best = Number(localStorage.getItem('undercooked-best')) || 0; } catch {}
function save(key, value) { try { localStorage.setItem(key, String(value)); } catch {} }
function sound(type) {
  if (muted || !audioContext) return;
  if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
  const notes = { pickup: [420], chop: [250], cook: [310, 420], plate: [480, 600], ready: [660, 880], serve: [523, 659, 784], clear: [320], burn: [180, 140], miss: [220, 170], finish: [523, 659, 784, 1046] }[type];
  if (!notes) return;
  notes.forEach((hz, i) => {
    const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
    const at = audioContext.currentTime + i * 0.09; oscillator.type = 'sine'; oscillator.frequency.value = hz; gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(0.08, at + 0.008); gain.gain.exponentialRampToValueAtTime(0.001, at + 0.14); oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); }; oscillator.start(at); oscillator.stop(at + 0.16);
  });
}
function enableAudio() { if (!audioContext) { try { const Audio = window.AudioContext || window.webkitAudioContext; if (Audio) audioContext = new Audio(); } catch {} } }
function muteUI() { $('mute').textContent = muted ? '♪̸' : '♫'; $('mute').setAttribute('aria-label', muted ? 'Unmute sound' : 'Mute sound'); $('mute').setAttribute('aria-pressed', String(muted)); }
function clearInput() { keys.clear(); joystick.x = 0; joystick.z = 0; joystick.id = null; actionPointer = null; $('stick').style.transform = ''; $('action').classList.remove('active'); }
function start() { if (!kitchen) return; clearInput(); helpOpen = false; enableAudio(); startGame(game); syncUI(); }
function pause() { if (game.phase !== 'playing') return; clearInput(); pauseGame(game); syncUI(); }
function resume() { clearInput(); resumeGame(game); lastFrame = performance.now(); syncUI(); }
function act() { if (game.phase !== 'playing') return; enableAudio(); interact(game); syncUI(); }

const icons = {
  tomato: '<svg class="food-icon" viewBox="0 0 28 28" aria-hidden="true"><path d="M24 16c0 7-20 9-20 0C4 3 24 3 24 16" fill="#e67e56"/><path d="m14 8-7-2 5-1 2-4 2 4 5 1-7 2" fill="#829a5e"/><path d="M8 13c-2 3-1 5 1 6" stroke="#f4bd89" fill="none" stroke-width="2" stroke-linecap="round"/></svg>',
  mushroom: '<svg class="food-icon" viewBox="0 0 28 28" aria-hidden="true"><path d="m10 14-2 10h12l-2-10" fill="#eddbbc"/><path d="M3 16C1 1 27 1 25 16Z" fill="#b89a7f"/><ellipse cx="10" cy="9" rx="3" ry="2" fill="#d6bea0"/></svg>',
  soup: '<svg class="food-icon" viewBox="0 0 28 28" aria-hidden="true"><ellipse cx="14" cy="23" rx="13" ry="3" fill="#e8dfc4"/><path d="M3 12h22c0 14-22 14-22 0" fill="#f5ead3"/><ellipse cx="14" cy="12" rx="11" ry="4" fill="#e79467"/><path d="m11 11 4 3 4-4" stroke="#819e65" fill="none" stroke-width="2"/><path d="M11 7c-4-4 5-3 1-6M18 7c-4-4 5-3 1-6" stroke="#acb292" fill="none" stroke-linecap="round"/></svg>'
};
function ordersUI() {
  const signature = game.orders.map(o => o.id).join(',');
  if (signature !== lastOrders) {
    $('orders').innerHTML = game.orders.length ? game.orders.map(o => '<div class="order-card" data-order="' + o.id + '" aria-label="' + RECIPES[o.recipe].name + '"><div class="order-title">' + RECIPES[o.recipe].short + ' soup <span class="order-id">#' + o.id + '</span></div><div class="recipe-icons">' + RECIPES[o.recipe].ingredients.map(i => icons[i]).join('<span class="plus">+</span>') + '<span class="arrow">→</span>' + icons.soup + '</div><div class="order-time"><span></span></div></div>').join('') : '<div class="empty-ticket">Next ticket on its way…</div>';
    lastOrders = signature;
  }
  for (const order of game.orders) { const el = $('orders').querySelector('[data-order="' + order.id + '"]'); if (!el) continue; el.querySelector('.order-time span').style.width = Math.max(0, order.remaining / order.patience * 100) + '%'; el.classList.toggle('urgent', order.remaining < 20); }
}
function syncUI() {
  const phase = game.phase;
  if (phase !== lastPhase) {
    $('app').className = 'phase-' + phase;
    if (phase === 'results') {
      const oldBest = best; best = Math.max(best, game.score); save('undercooked-best', best);
      $('final-score').textContent = game.score; $('served-count').textContent = game.served; $('missed-count').textContent = game.missed; $('burnt-count').textContent = game.burnt;
      const stars = starsFor(game.score); $('stars').innerHTML = [0, 1, 2].map(i => '<span class="' + (i < stars ? 'earned' : '') + '">★</span>').join(''); $('stars').setAttribute('aria-label', stars + ' of 3 stars');
      $('results-title').textContent = stars >= 3 ? 'You’re a soup star!' : stars >= 1 ? 'Lovely lunch, chef.' : 'A good first simmer.';
      $('results-message').textContent = stars >= 3 ? 'The lunch club will be back for seconds.' : stars >= 1 ? 'Every bowl is a little victory.' : 'Fresh pots. Fresh chances. Try another shift!';
      $('best-result').textContent = game.score > oldBest ? 'New kitchen best!' : 'Kitchen best: ' + best;
    }
    lastPhase = phase;
  }
  $('home').hidden = phase !== 'home' || helpOpen; $('hud').hidden = phase === 'home' || phase === 'results';
  $('pause-screen').hidden = phase !== 'paused' || helpOpen; $('results').hidden = phase !== 'results' || helpOpen; $('help-screen').hidden = !helpOpen;
  $('best-home').textContent = best > 0 ? 'Kitchen best: ' + best : '';
  $('timer').textContent = Math.floor(Math.ceil(game.time) / 60) + ':' + String(Math.ceil(game.time) % 60).padStart(2, '0'); $('score').textContent = game.score;
  $('timer').style.color = game.time < 30 ? '#bc543c' : '';
  const label = actionLabel(game); $('action-text').textContent = label;
  $('action').setAttribute('aria-label', label + ' (E or Space)');
  $('action-icon').innerHTML = game.nearest?.startsWith('stove') ? '<svg viewBox="0 0 28 28"><path d="M5 14h18v6c0 6-18 6-18 0Z M8 9c-5-5 5-3 1-7 M18 9c-5-5 5-3 1-7 M2 17h3 M23 17h3"/></svg>' : game.nearest === 'serve' ? '<svg viewBox="0 0 28 28"><path d="m5 14 6 6L23 7"/></svg>' : '<svg viewBox="0 0 28 28"><path d="M14 4v20 M6 16l8 8 8-8 M5 7h4 M19 7h4"/></svg>';
  const stationNames = { tomato: 'Tomato crate', mushroom: 'Mushroom crate', board: 'Chopping board', 'stove-a': 'Left pot', 'stove-b': 'Right pot', plates: 'Clean plates', serve: 'Serving hatch', trash: 'Compost', 'counter-a': 'Kitchen counter', 'counter-b': 'Kitchen counter' };
  $('nearby').textContent = stationNames[game.nearest] || 'Find a counter';
  const holding = handName(game.hand); if (holding !== lastHand) { $('holding').textContent = holding; lastHand = holding; }
  let guide = '';
  if (game.served === 0 && game.phase === 'playing') {
    const pot = ['stove-a', 'stove-b'].map(id => game.stations[id]).find(s => s.ingredients.length);
    guide = game.hand?.recipe ? 'Take your soup to the serving hatch →' : game.hand?.kind === 'plate' ? 'Fill your plate at a green ready pot.' : game.hand?.prepared ? 'Add chopped veg to a pot.' : game.hand ? 'Bring the vegetable to Chop.' : game.stations.board.item?.prepared ? 'Pick up the chopped vegetable.' : game.stations.board.item ? 'Stay at the board to finish chopping.' : pot ? 'Get a clean plate while the soup simmers.' : 'Take a tomato from the left crate.';
  }
  const text = game.feedback?.text || guide; if (text !== lastToast) { $('toast').textContent = text; lastToast = text; }
  $('toast').classList.toggle('visible', Boolean(text)); $('toast').dataset.type = game.feedback?.type || '';
  ordersUI();
  for (const event of takeEvents(game)) { sound(event.type); if (event.type === 'serve') kitchen?.celebrate(); }
}

$('start').addEventListener('click', start); $('replay').addEventListener('click', start); $('restart-pause').addEventListener('click', start);
$('pause').addEventListener('click', pause); $('resume').addEventListener('click', resume);
$('home-button').addEventListener('click', () => { clearInput(); game.phase = 'home'; syncUI(); });
for (const id of ['help', 'help-pause']) $(id).addEventListener('click', () => { if (game.phase === 'playing') pause(); helpOpen = true; syncUI(); });
$('help-close').addEventListener('click', () => { helpOpen = false; syncUI(); });
$('mute').addEventListener('click', () => { muted = !muted; save('undercooked-muted', muted); enableAudio(); muteUI(); });
$('reload').addEventListener('click', () => location.reload());
$('fullscreen').hidden = !document.fullscreenEnabled;
$('fullscreen').addEventListener('click', async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await $('app').requestFullscreen(); } catch {} });
document.addEventListener('fullscreenchange', () => { $('fullscreen').setAttribute('aria-label', document.fullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen'); kitchen?.resize(); });
window.addEventListener('resize', () => kitchen?.resize());
motionQuery.addEventListener?.('change', (e) => { if (kitchen) kitchen.reducedMotion = e.matches; });

const movementKeys = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
document.addEventListener('keydown', (e) => {
  if (e.code === 'Escape') { e.preventDefault(); if (helpOpen) { helpOpen = false; syncUI(); } else if (game.phase === 'playing') pause(); else if (game.phase === 'paused') resume(); return; }
  if (game.phase !== 'playing' || helpOpen) return;
  if (movementKeys.has(e.code)) { e.preventDefault(); keys.add(e.code); }
  if (e.code === 'KeyE' || e.code === 'Space') { e.preventDefault(); if (!e.repeat) act(); }
});
document.addEventListener('keyup', (e) => { if (movementKeys.has(e.code)) { keys.delete(e.code); e.preventDefault(); } });
window.addEventListener('blur', pause); document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
function stickMove(e) {
  const rect = $('joystick').getBoundingClientRect(); const radius = rect.width * 0.29;
  let x = e.clientX - rect.left - rect.width / 2, y = e.clientY - rect.top - rect.height / 2;
  const length = Math.hypot(x, y); if (length > radius) { x *= radius / length; y *= radius / length; }
  joystick.x = Math.abs(x) < 3 ? 0 : x / radius; joystick.z = Math.abs(y) < 3 ? 0 : y / radius;
  $('stick').style.transform = 'translate(' + x + 'px,' + y + 'px)';
}
$('joystick').addEventListener('pointerdown', e => { if (game.phase !== 'playing' || joystick.id !== null) return; e.preventDefault(); joystick.id = e.pointerId; $('joystick').setPointerCapture(e.pointerId); stickMove(e); });
$('joystick').addEventListener('pointermove', e => { if (e.pointerId === joystick.id) { e.preventDefault(); stickMove(e); } });
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) $('joystick').addEventListener(type, e => { if (e.pointerId === joystick.id) { joystick.id = null; joystick.x = joystick.z = 0; $('stick').style.transform = ''; } });
$('action').addEventListener('pointerdown', e => { if (game.phase !== 'playing' || actionPointer !== null) return; e.preventDefault(); actionPointer = e.pointerId; $('action').setPointerCapture(e.pointerId); $('action').classList.add('active'); act(); });
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) $('action').addEventListener(type, e => { if (e.pointerId === actionPointer) { actionPointer = null; $('action').classList.remove('active'); } });
$('action').addEventListener('click', e => { if (e.detail === 0) act(); });

muteUI();
try {
  kitchen = new Kitchen($('game'), { reducedMotion: motionQuery.matches });
  $('loading').hidden = true; syncUI();
  $('game').addEventListener('webglcontextlost', (e) => { e.preventDefault(); pause(); $('unsupported').hidden = false; $('unsupported').querySelector('h2').textContent = 'The 3D kitchen took a break.'; $('unsupported').querySelector('p').textContent = 'Reload to start a fresh shift. Your best score is saved.'; });
  const frameTimes = [];
  window.__UNDERCOOKED__ = Object.freeze({ version: '1.0.0', getState: () => structuredClone({ ...game, events: [] }), renderInfo: () => ({ ...kitchen.info(), averageFrameMs: frameTimes.length ? frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length : 0 }), project: (x, z, y) => kitchen.project(x, z, y), input: () => ({ keys: [...keys], joystick: { ...joystick } }) });
  let uiElapsed = 0;
  function frame(now) {
    const rawDt = (now - lastFrame) / 1000, dt = Math.min(Math.max(rawDt, 0), 0.25); lastFrame = now;
    frameTimes.push(rawDt * 1000); if (frameTimes.length > 120) frameTimes.shift();
    let x = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0) + joystick.x;
    let z = (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) - (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) + joystick.z;
    const steps = Math.max(1, Math.ceil(dt / 0.05));
    for (let i = 0; i < steps; i++) tick(game, dt / steps, { x, z });
    kitchen.update(game, dt);
    uiElapsed += dt; if (uiElapsed > 0.075 || game.phase !== lastPhase) { syncUI(); uiElapsed = 0; }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
} catch (error) {
  console.error('Undercooked could not start WebGL:', error); $('loading').hidden = true; $('unsupported').hidden = false; $('home').hidden = true;
}
