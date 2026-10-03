import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG, STATIONS, createGame, startGame, tick, interact, movePlayer, updateNearest, pauseGame, resumeGame, recipeFor, starsFor } from '../src/core.js';

const advance = (game, seconds, input) => { for (let i = 0; i < Math.ceil(seconds * 60); i++) tick(game, 1 / 60, input); };
function at(game, id) { const s = STATIONS.find(s => s.id === id); game.player.x = s.kind === 'serve' ? s.x - s.w / 2 - CONFIG.radius - 0.04 : s.x; game.player.z = s.kind === 'serve' ? s.z : s.z + s.d / 2 + CONFIG.radius + 0.04; updateNearest(game); assert.equal(game.nearest, id); }
function newShift(options) { const game = createGame(options); startGame(game); return game; }
function prepare(game, ingredient) { at(game, ingredient); assert.equal(interact(game), true); at(game, 'board'); assert.equal(interact(game), true); advance(game, 2.1); assert.equal(game.stations.board.item.prepared, true); assert.equal(interact(game), true); assert.equal(game.hand.prepared, true); }
function makeSoup(game, ingredients, stove = 'stove-a') { for (const ingredient of ingredients) { prepare(game, ingredient); at(game, stove); assert.equal(interact(game), true); } advance(game, 5.1); assert.equal(game.stations[stove].status, 'ready'); at(game, 'plates'); interact(game); at(game, stove); interact(game); }

test('complete ingredient → prep → cook → plate → serve loop consumes exactly the matching order', () => {
  const game = newShift(); makeSoup(game, ['tomato']); assert.deepEqual(game.hand, { kind: 'plate', recipe: 'tomato' }); assert.equal(game.stations['stove-a'].status, 'empty'); at(game, 'serve'); assert.equal(interact(game), true); assert.equal(game.hand, null); assert.equal(game.served, 1); assert.ok(game.score >= 100 && game.score <= 140); assert.ok(game.orders.every(o => o.recipe !== 'tomato'));
});
test('garden soup requires both ingredients and adding the second resets cooking', () => {
  const game = newShift(); prepare(game, 'tomato'); at(game, 'stove-a'); interact(game); advance(game, 1.3); prepare(game, 'mushroom'); at(game, 'stove-a'); interact(game); assert.equal(game.stations['stove-a'].cook, 0); assert.equal(recipeFor(game.stations['stove-a'].ingredients), 'garden'); advance(game, 5.1); at(game, 'plates'); interact(game); at(game, 'stove-a'); interact(game); assert.equal(game.hand.recipe, 'garden'); game.orders = [{ id: 50, recipe: 'garden', remaining: 60, patience: 95 }]; at(game, 'serve'); interact(game); assert.equal(game.served, 1);
});
test('raw vegetables cannot cook; empty plates cannot serve; wrong soup is retained with feedback', () => {
  const game = newShift(); at(game, 'tomato'); interact(game); at(game, 'stove-a'); assert.equal(interact(game), false); assert.equal(game.hand.type, 'tomato'); assert.equal(game.stations['stove-a'].status, 'empty'); at(game, 'trash'); interact(game); at(game, 'plates'); interact(game); at(game, 'serve'); assert.equal(interact(game), false); assert.equal(game.hand.recipe, null); game.hand = { kind: 'plate', recipe: 'garden' }; game.score = 20; assert.equal(interact(game), false); assert.equal(game.hand.recipe, 'garden'); assert.equal(game.score, 15); assert.equal(game.mistakes, 1); assert.equal(game.served, 0);
});
test('moving away interrupts chopping, resumes with an action, and middle counters preserve items', () => {
  const game = newShift(); at(game, 'tomato'); interact(game); at(game, 'board'); interact(game); advance(game, 0.7); const progress = game.stations.board.item.chop; movePlayer(game, 0, 1, 0.1); advance(game, 3); assert.equal(game.stations.board.item.prepared, false); assert.equal(game.stations.board.item.chop, progress); at(game, 'board'); interact(game); advance(game, 1.5); interact(game); at(game, 'counter-a'); interact(game); assert.equal(game.hand, null); assert.equal(game.stations['counter-a'].item.prepared, true); interact(game); assert.equal(game.hand.type, 'tomato');
});
test('ready pot burns after its grace period and can be cleared without losing a held item', () => {
  const game = newShift(); prepare(game, 'tomato'); at(game, 'stove-a'); interact(game); advance(game, CONFIG.cookTime + CONFIG.burnTime + 0.2); assert.equal(game.stations['stove-a'].status, 'burnt'); assert.equal(game.burnt, 1); at(game, 'plates'); interact(game); at(game, 'stove-a'); interact(game); assert.equal(game.stations['stove-a'].status, 'empty'); assert.equal(game.hand.kind, 'plate');
});
test('order expiry resets combo and applies bounded score loss; at most two active tickets', () => {
  const game = newShift(); game.combo = 3; game.score = 10; advance(game, 81); assert.ok(game.missed >= 1); assert.equal(game.combo, 0); assert.equal(game.score, 0); assert.ok(game.orders.length <= 2); assert.ok(game.feedback); for (const o of game.orders) assert.ok(o.remaining > 0);
});
test('pause freezes shift, prep, pots and orders, and focus-safe resume completes a full shift', () => {
  const game = newShift(); prepare(game, 'tomato'); at(game, 'stove-a'); interact(game); pauseGame(game); const snapshot = structuredClone(game); advance(game, 200, { x: 1 }); assert.deepEqual(game, snapshot); resumeGame(game); advance(game, 190); assert.equal(game.phase, 'results'); assert.equal(game.time, 0); const done = structuredClone(game); advance(game, 1); interact(game); assert.deepEqual(game, done);
});
test('replay resets every lifecycle field, stations, hand, score and duration', () => {
  const game = newShift({ duration: 12 }); game.score = 400; game.served = 3; game.burnt = 2; game.hand = { kind: 'plate', recipe: 'garden' }; advance(game, 13); assert.equal(game.phase, 'results'); startGame(game); assert.equal(game.phase, 'playing'); assert.equal(game.time, 12); assert.equal(game.score, 0); assert.equal(game.served, 0); assert.equal(game.burnt, 0); assert.equal(game.hand, null); assert.equal(game.orders.length, 1); assert.equal(game.orders[0].recipe, 'tomato'); assert.ok(Object.values(game.stations).every(s => !s.item && !s.ingredients.length && s.status === 'empty'));
});
test('every station has a reachable interaction point and player movement cannot tunnel through solid counters', () => {
  const game = newShift(); for (const station of STATIONS) at(game, station.id); game.player.x = 0; game.player.z = -0.1; movePlayer(game, 0, 1, 2); assert.ok(game.player.z <= 1.25 - 0.95 / 2 - CONFIG.radius + 0.001); game.player.x = -4.5; game.player.z = -0.1; movePlayer(game, 0, -1, 2); assert.ok(game.player.z >= -2.75 + 1.45 / 2 + CONFIG.radius - 0.001); movePlayer(game, -1, 0, 10); assert.ok(game.player.x >= -5.55); assert.equal(recipeFor(['tomato', 'tomato']), null);
});
test('difficulty and star thresholds remain achievable in a three minute single player shift', () => {
  assert.equal(starsFor(199), 0); assert.equal(starsFor(200), 1); assert.equal(starsFor(500), 2); assert.equal(starsFor(800), 3); const game = newShift(); assert.equal(game.duration, 180); assert.ok(game.orders.every(o => o.recipe !== 'garden')); game.served = 2; advance(game, 56); assert.ok(game.orders.length <= 2); assert.ok(game.orders.every(o => o.patience >= 80));
});
