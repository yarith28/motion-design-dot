import assert from "node:assert/strict";
import { KitchenGame } from "../game-core.js";
import { MultiplayerSession } from "../multiplayer-session.js";
let now = 1000;
const g = new KitchenGame(() => now);
assert.equal(g.addPlayer("solo", "Duplicate", 0), false);
assert.equal(g.addPlayer("", "Bad", 0), false);
g.start("Miso", 3);
const p = g.getPlayer("solo");
const at = (x, y, station) => {
  p.x = x;
  p.y = y;
  return g.interact(station);
};
assert(at(280, 175, "carrot"));
assert(at(460, 175, "prep"));
assert.equal(g.state.prep.started, now);
assert(!g.interact("prep"));
now += 3000;
assert(g.interact("prep"));
assert(at(690, 175, "pot"));
now += 5000;
assert(g.interact("pot"));
assert(at(690, 465, "serve"));
assert.equal(g.state.score, 100);
assert.equal(g.state.served, 1);
assert(at(110, 175, "tomato"));
assert(at(460, 175, "prep"));
now += 3000;
assert(g.interact("prep"));
assert(at(690, 175, "pot"));
now += 5000;
assert(g.interact("pot"));
assert(at(690, 465, "serve"));
assert.equal(g.state.score, 200);
assert.equal(g.state.served, 2);
g.move(0.1, 0);
assert.equal(p.input.x, 0.1);
assert.equal(g.move(Number.NaN, 0), false);
assert.equal(g.move(0, Number.POSITIVE_INFINITY), false);
g.move(1, 1);
assert(Math.abs(Math.hypot(p.input.x, p.input.y) - 1) < 1e-10);
p.x = 400;
p.y = 280;
g.move(0, 1);
g.tick(1);
assert(p.y <= 308);
p.x = 300;
p.y = 360;
g.move(1, 0);
g.tick(1);
assert(p.x <= 320);
g.tick(Number.POSITIVE_INFINITY);
now += 31000;
g.tick();
assert.equal(g.state.missed, 2);
assert.equal(g.state.score, 160);
assert.equal(g.state.orders.length, 2);
p.held = "tomato";
g.replay();
assert.equal(p.held, null);
assert.equal(p.x, 250);
assert.equal(p.y, 250);
assert.equal(p.name, "Miso");
assert.equal(p.avatar, 3);
assert.equal(g.state.score, 0);
now += 90000;
g.tick();
assert.equal(g.state.phase, "results");
assert(!at(280, 175, "carrot"));
g.stop();
assert.equal(g.state.phase, "idle");
// Paired in-memory transports test session contracts, NOT WebRTC or phone support.
class Wire {
  constructor() {
    this.other = null;
  }
  send(id, m) {
    queueMicrotask(() => this.other?.onMessage(id, structuredClone(m)));
    return true;
  }
  close() {}
  closePeer() {}
}
const ht = new Wire(),
  gt = new Wire();
ht.other = gt;
gt.other = ht;
const host = new MultiplayerSession({ transport: ht, now: () => now }),
  guest = new MultiplayerSession({ transport: gt, now: () => now });
let snap;
guest.onSnapshot((s) => (snap = s));
host.startHost("test", "Host", 2);
guest.join("Guest", 1);
ht.onStatus("peer", "connected");
gt.onStatus("peer", "connected");
await new Promise((r) => setImmediate(r));
assert.equal(guest.playerId, "peer");
assert.equal(snap.players.length, 2);
assert.equal(snap.host, "host");
assert.equal(snap.players[1].name, "Guest");
host.start();
await new Promise((r) => setImmediate(r));
assert.equal(snap.phase, "playing");
assert(snap.ends > now);
guest.sendInput(0.25, 0);
await new Promise((r) => setImmediate(r));
assert.equal(host.game.getPlayer("peer").input.x, 0.25);
host.sendInput(-0.5, 0);
assert.equal(host.game.getPlayer("host").input.x, -0.5);
const gp = host.game.getPlayer("peer");
gp.x = 280;
gp.y = 175;
guest.sendInteract("carrot");
await new Promise((r) => setImmediate(r));
assert.equal(snap.players[1].held, "carrot");
now += 90000;
host.game.tick();
await new Promise((r) => setImmediate(r));
assert.equal(snap.phase, "results");
host.replay();
await new Promise((r) => setImmediate(r));
assert.equal(snap.phase, "playing");
assert.equal(snap.players[1].held, null);
ht.onStatus("peer", "closed");
assert.equal(host.game.players.size, 1);
host.stop();
guest.stop();
assert.equal(host.game, null);
console.log(
  "PASS core: cooking, score, expiry, results, reset, analog, collision; session contracts: identity, host/guest input, snapshots, replay, disconnect (in-memory only)",
);
