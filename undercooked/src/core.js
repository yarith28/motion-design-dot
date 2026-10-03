export const CONFIG = Object.freeze({ duration: 180, speed: 3.4, radius: 0.28, chopTime: 2.0, cookTime: 5, burnTime: 17, reach: 1.65 });
export const RECIPES = Object.freeze({
  tomato: { name: 'Tomato soup', short: 'Tomato', ingredients: ['tomato'], color: '#ec7658' },
  mushroom: { name: 'Mushroom soup', short: 'Mushroom', ingredients: ['mushroom'], color: '#d4b08a' },
  garden: { name: 'Garden soup', short: 'Garden', ingredients: ['mushroom', 'tomato'], color: '#df9465' }
});
export const STATIONS = Object.freeze([
  { id: 'tomato', kind: 'supply', ingredient: 'tomato', name: 'Tomatoes', x: -4.5, z: -2.75, w: 1.55, d: 1.45 },
  { id: 'mushroom', kind: 'supply', ingredient: 'mushroom', name: 'Mushrooms', x: -2.7, z: -2.75, w: 1.55, d: 1.45 },
  { id: 'board', kind: 'board', name: 'Chopping board', x: -0.9, z: -2.75, w: 1.55, d: 1.45 },
  { id: 'stove-a', kind: 'stove', name: 'Left pot', x: 0.9, z: -2.75, w: 1.55, d: 1.45 },
  { id: 'stove-b', kind: 'stove', name: 'Right pot', x: 2.7, z: -2.75, w: 1.55, d: 1.45 },
  { id: 'plates', kind: 'plates', name: 'Clean plates', x: 4.5, z: -2.75, w: 1.55, d: 1.45 },
  { id: 'serve', kind: 'serve', name: 'Serve here', x: 5.05, z: 0.15, w: 1.35, d: 1.75 },
  { id: 'trash', kind: 'trash', name: 'Compost', x: -5.05, z: 0.15, w: 1.1, d: 1.35 },
  { id: 'counter-a', kind: 'counter', name: 'Counter', x: -0.9, z: 1.25, w: 1.55, d: 0.95 },
  { id: 'counter-b', kind: 'counter', name: 'Counter', x: 0.9, z: 1.25, w: 1.55, d: 0.95 }
]);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const copy = (v) => v ? structuredClone(v) : null;
export function recipeFor(ingredients) {
  const key = [...ingredients].sort().join(',');
  return Object.keys(RECIPES).find(id => RECIPES[id].ingredients.join(',') === key) || null;
}
export function createGame({ duration = CONFIG.duration, seed = 1 } = {}) {
  return {
    phase: 'home', duration, time: duration, elapsed: 0, seed: seed >>> 0, nextId: 1,
    player: { x: 0, z: -0.1, angle: Math.PI, moving: false }, hand: null,
    stations: Object.fromEntries(STATIONS.map(s => [s.id, { item: null, ingredients: [], cook: 0, readyAge: 0, status: 'empty' }])),
    orders: [], served: 0, missed: 0, burnt: 0, mistakes: 0, score: 0, combo: 0,
    nextOrder: 8, chopping: false, nearest: null, feedback: null, events: [], lastRecipe: 'tomato'
  };
}
function random(game) { game.seed = (Math.imul(game.seed, 1664525) + 1013904223) >>> 0; return game.seed / 4294967296; }
function order(game, recipe = null) {
  const options = game.served >= 2 || game.elapsed > 55 ? ['tomato', 'mushroom', 'garden'] : ['tomato', 'mushroom'];
  const id = recipe || options[Math.floor(random(game) * options.length)];
  const patience = id === 'garden' ? 95 : 80;
  game.orders.push({ id: game.nextId++, recipe: id, remaining: patience, patience });
  game.lastRecipe = id;
}
export function startGame(game) {
  const fresh = createGame({ duration: game.duration, seed: game.seed });
  Object.keys(game).forEach(key => delete game[key]);
  Object.assign(game, fresh, { phase: 'playing' });
  order(game, 'tomato');
  say(game, 'A little rush! Make the first tomato soup.', 'welcome');
  updateNearest(game);
}
export function pauseGame(game) { if (game.phase === 'playing') { game.phase = 'paused'; game.chopping = false; game.player.moving = false; } }
export function resumeGame(game) { if (game.phase === 'paused') game.phase = 'playing'; }
function say(game, text, type = 'info') { game.feedback = { text, type, ttl: 3.2 }; game.events.push({ type, text }); }
export function takeEvents(game) { return game.events.splice(0); }
function blocked(x, z) {
  const r = CONFIG.radius;
  return STATIONS.some(s => x > s.x - s.w / 2 - r && x < s.x + s.w / 2 + r && z > s.z - s.d / 2 - r && z < s.z + s.d / 2 + r);
}
export function movePlayer(game, dx, dz, dt) {
  if (game.phase !== 'playing') return;
  const length = Math.hypot(dx, dz);
  game.player.moving = length > 0.08;
  if (!game.player.moving) return;
  dx /= Math.max(1, length); dz /= Math.max(1, length);
  game.player.angle = Math.atan2(dx, dz);
  game.chopping = false;
  const steps = Math.max(1, Math.ceil(CONFIG.speed * dt / 0.12));
  for (let i = 0; i < steps; i++) {
    const x = clamp(game.player.x + dx * CONFIG.speed * dt / steps, -5.55, 5.55);
    const z = clamp(game.player.z + dz * CONFIG.speed * dt / steps, -3.65, 3.5);
    if (!blocked(x, game.player.z)) game.player.x = x;
    if (!blocked(game.player.x, z)) game.player.z = z;
  }
  updateNearest(game);
}
export function updateNearest(game) {
  let best = null, bestDistance = CONFIG.reach;
  for (const s of STATIONS) {
    const distance = Math.hypot(game.player.x - s.x, game.player.z - s.z);
    if (distance < bestDistance) { best = s.id; bestDistance = distance; }
  }
  game.nearest = best;
  return best;
}
export function actionLabel(game) {
  const def = STATIONS.find(s => s.id === game.nearest);
  if (!def) return game.hand ? 'Carry' : 'Move closer';
  const station = game.stations[def.id], hand = game.hand;
  if (def.kind === 'supply') return hand ? 'Hands full' : 'Take ' + (def.ingredient === 'tomato' ? 'tomato' : 'mushroom');
  if (def.kind === 'board') return hand ? (hand.kind === 'ingredient' && !hand.prepared ? 'Chop' : 'Set down') : station.item ? (station.item.prepared ? 'Take chopped' : 'Chop') : 'Chopping board';
  if (def.kind === 'stove') {
    if (station.status === 'burnt') return 'Clear burnt pot';
    if (hand?.kind === 'plate' && !hand.recipe) return station.status === 'ready' ? 'Fill plate' : 'Still cooking';
    if (hand?.kind === 'ingredient') return hand.prepared ? 'Add to pot' : 'Chop first';
    return station.status === 'ready' ? 'Bring a plate' : station.status === 'cooking' ? 'Simmering…' : 'Add chopped veg';
  }
  if (def.kind === 'plates') return hand ? 'Hands full' : 'Take plate';
  if (def.kind === 'serve') return hand?.recipe ? 'Serve soup' : 'Bring soup';
  if (def.kind === 'trash') return hand ? 'Discard' : 'Compost';
  return hand ? 'Set down' : station.item ? 'Pick up' : 'Counter';
}
export function interact(game) {
  if (game.phase !== 'playing') return false;
  updateNearest(game);
  const def = STATIONS.find(s => s.id === game.nearest);
  if (!def) { say(game, 'Get closer to a counter.'); return false; }
  const station = game.stations[def.id], hand = game.hand;
  game.player.angle = Math.atan2(def.x - game.player.x, def.z - game.player.z);
  const fail = (text) => { say(game, text, 'hint'); return false; };
  if (def.kind === 'supply') {
    if (hand) return fail('Set your item on a counter first.');
    game.hand = { kind: 'ingredient', type: def.ingredient, prepared: false }; say(game, 'Take it to the chopping board.', 'pickup');
  } else if (def.kind === 'board') {
    if (hand) {
      if (station.item) return fail('The board is full.');
      if (hand.kind !== 'ingredient') return fail('Only vegetables go on the board.');
      station.item = hand; game.hand = null; station.item.chop = station.item.prepared ? CONFIG.chopTime : 0;
      game.chopping = !station.item.prepared; say(game, game.chopping ? 'Chopping! Stay here for a moment.' : 'Ready for the pot.', 'chop');
    } else if (station.item) {
      if (!station.item.prepared) { game.chopping = true; say(game, 'Chopping! Stay here for a moment.', 'chop'); }
      else { game.hand = station.item; station.item = null; game.chopping = false; say(game, 'Add it to an empty pot.', 'pickup'); }
    } else return fail('Bring a tomato or mushroom here.');
  } else if (def.kind === 'stove') {
    if (station.status === 'burnt') { station.ingredients = []; station.cook = 0; station.readyAge = 0; station.status = 'empty'; say(game, 'Pot clean. A fresh start!', 'clear'); }
    else if (hand?.kind === 'ingredient') {
      if (!hand.prepared) return fail('Chop the vegetable first.');
      if (station.ingredients.includes(hand.type)) return fail('One of each vegetable is plenty.');
      if (station.ingredients.length >= 2) return fail('This pot is full.');
      station.ingredients.push(hand.type); station.cook = 0; station.readyAge = 0; station.status = 'cooking'; game.hand = null;
      say(game, 'Simmering… get a plate while it cooks.', 'cook');
    } else if (hand?.kind === 'plate' && !hand.recipe) {
      if (station.status !== 'ready') return fail(station.status === 'cooking' ? 'Wait for the green ready light.' : 'Add chopped vegetables to the pot.');
      game.hand = { kind: 'plate', recipe: recipeFor(station.ingredients) };
      station.ingredients = []; station.cook = 0; station.readyAge = 0; station.status = 'empty'; say(game, 'Soup’s up! Take it to the serving hatch.', 'plate');
    } else return fail(station.status === 'ready' ? 'Take a clean plate, then fill it here.' : 'Add a chopped vegetable to cook.');
  } else if (def.kind === 'plates') {
    if (hand) return fail('Set your item down first.');
    game.hand = { kind: 'plate', recipe: null }; say(game, 'Fill your plate at a ready pot.', 'pickup');
  } else if (def.kind === 'serve') {
    if (!hand?.recipe) return fail('Bring a plate of soup to serve.');
    const index = game.orders.findIndex(o => o.recipe === hand.recipe);
    if (index < 0) { game.mistakes++; game.combo = 0; game.score = Math.max(0, game.score - 5); return fail('No matching ticket! Keep the soup for later.'); }
    const ticket = game.orders[index];
    const tip = Math.round(40 * ticket.remaining / ticket.patience);
    const points = 100 + tip + Math.min(game.combo, 4) * 10;
    game.score += points; game.served++; game.combo++; game.orders.splice(index, 1); game.hand = null;
    game.nextOrder = Math.min(game.nextOrder, 3);
    say(game, '+' + points + ' · Delicious! ' + (game.combo > 1 ? game.combo + ' in a row!' : 'First bowl served!'), 'serve');
  } else if (def.kind === 'trash') {
    if (!hand) return fail('Discard unwanted items here.');
    game.hand = null; say(game, 'Composted. Let’s make something fresh.', 'clear');
  } else {
    if (hand && station.item) return fail('This counter is full.');
    if (hand) { station.item = hand; game.hand = null; }
    else if (station.item) { game.hand = station.item; station.item = null; }
    else return fail('You can leave an item here.');
    say(game, game.hand ? 'Picked up.' : 'Saved for later.', 'pickup');
  }
  return true;
}
export function tick(game, dt, input = { x: 0, z: 0 }) {
  if (game.phase !== 'playing') return;
  dt = Math.min(Math.max(0, dt), 0.1);
  game.elapsed += dt; game.time = Math.max(0, game.duration - game.elapsed);
  if (game.feedback) { game.feedback.ttl -= dt; if (game.feedback.ttl <= 0) game.feedback = null; }
  movePlayer(game, input.x || 0, input.z || 0, dt);
  updateNearest(game);
  const board = game.stations.board;
  if (game.chopping && game.nearest === 'board' && !game.player.moving && board.item && !board.item.prepared) {
    board.item.chop = Math.min(CONFIG.chopTime, (board.item.chop || 0) + dt);
    if (board.item.chop >= CONFIG.chopTime) { board.item.prepared = true; game.chopping = false; say(game, 'Chopped! Pick it up for the pot.', 'ready'); }
  }
  for (const def of STATIONS.filter(s => s.kind === 'stove')) {
    const s = game.stations[def.id];
    if (s.status === 'cooking') {
      s.cook = Math.min(CONFIG.cookTime, s.cook + dt);
      if (s.cook >= CONFIG.cookTime) { s.status = 'ready'; say(game, 'Soup ready! Fill a clean plate.', 'ready'); }
    } else if (s.status === 'ready') {
      s.readyAge += dt;
      if (s.readyAge >= CONFIG.burnTime) { s.status = 'burnt'; game.burnt++; game.combo = 0; say(game, 'Oops, burnt soup! Clear the pot to try again.', 'burn'); }
    }
  }
  for (let i = game.orders.length - 1; i >= 0; i--) {
    game.orders[i].remaining -= dt;
    if (game.orders[i].remaining <= 0) { game.orders.splice(i, 1); game.missed++; game.combo = 0; game.score = Math.max(0, game.score - 15); say(game, 'A ticket timed out. The next one is yours!', 'miss'); game.nextOrder = Math.min(game.nextOrder, 3); }
  }
  game.nextOrder -= dt;
  if (game.nextOrder <= 0 && game.time > 20 && game.orders.length < 2) { order(game); game.nextOrder = 18; }
  if (game.time <= 0) { game.phase = 'results'; game.player.moving = false; game.chopping = false; say(game, 'Shift complete!', 'finish'); }
}
export function starsFor(score) { return score >= 800 ? 3 : score >= 500 ? 2 : score >= 200 ? 1 : 0; }
export function handName(hand) { return !hand ? 'Empty hands' : hand.kind === 'ingredient' ? (hand.prepared ? 'Chopped ' : '') + hand.type : hand.recipe ? RECIPES[hand.recipe].name : 'Clean plate'; }
