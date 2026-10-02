import assert from "node:assert/strict";
import { MultiplayerSession } from "../multiplayer-session.js";

class Transport {
  constructor() {
    this.sent = [];
    this.peers = new Set();
    this.onMessage = () => {};
    this.onStatus = () => {};
  }
  send(id, message) {
    this.sent.push({ id, message });
    return true;
  }
  closePeer(id) {
    this.peers.delete(id);
  }
  close() {
    this.peers.clear();
  }
}

const transport = new Transport();
const host = new MultiplayerSession({ transport, now: () => 1000 });
host.startHost("room", "Host", 0);
transport.onStatus("peer", "connected");
assert.equal(host.peers.has("peer"), true);

host.receive("peer", {
  type: "hello",
  sessionId: "room",
  playerId: "peer",
  name: "Guest",
  avatar: 2,
});
assert.equal(host.game.getPlayer("peer").name, "Guest");

const player = host.game.getPlayer("peer");
const before = { x: player.input.x, y: player.input.y };
host.receive("peer", { type: "input", sessionId: "wrong", playerId: "peer", seq: 1, x: 1, y: 0 });
host.receive("peer", { type: "input", sessionId: "room", playerId: "peer", seq: 2, x: NaN, y: 0 });
host.receive("peer", { type: "input", sessionId: "room", playerId: "peer", seq: 3, x: 2, y: 0 });
host.receive("peer", { type: "interact", sessionId: "room", playerId: "peer", seq: 4, station: "not-a-station" });
assert.deepEqual(player.input, before);
assert.equal(host.sendInput(NaN, 0), false);
assert.equal(host.sendInteract("not-a-station"), false);

host.receive("peer", { type: "input", sessionId: "room", playerId: "peer", seq: 5, x: 1, y: 0 });
host.receive("peer", { type: "input", sessionId: "room", playerId: "peer", seq: 4, x: -1, y: 0 });
assert.equal(player.input.x, 1, "older input must not overwrite a newer input");

let received = 0;
const guestTransport = new Transport();
const guest = new MultiplayerSession({ transport: guestTransport, now: () => 1000 });
guest.onSnapshot(() => received++);
guest.join("Guest", 2);
guest.serverPeer = "peer";
guest.sessionId = "room";
guest.playerId = "peer";
guest.receive("peer", {
  type: "snapshot",
  sessionId: "room",
  seq: 1,
  snapshot: { phase: "playing", players: [], stations: [], orders: [] },
});
assert.equal(received, 0);
const valid = host.game.snapshot();
guest.receive("peer", { type: "snapshot", sessionId: "room", seq: 8, snapshot: valid });
assert.equal(received, 1);
guest.receive("peer", { type: "snapshot", sessionId: "room", seq: 7, snapshot: valid });
guest.receive("peer", { type: "snapshot", sessionId: "room", seq: 8, snapshot: valid });
assert.equal(received, 1, "reordered snapshots must be ignored");
guest.receive("other", { type: "snapshot", sessionId: "room", snapshot: valid });
assert.equal(received, 1);

let floodNow = 1000;
const floodTransport = new Transport();
const floodHost = new MultiplayerSession({ transport: floodTransport, now: () => floodNow });
floodHost.startHost("flood", "Host", 0);
floodTransport.onStatus("flood-peer", "connected");
floodHost.start();
const floodPlayer = floodHost.game.getPlayer("flood-peer");
for (let seq = 1; seq <= 45; seq++)
  floodHost.receive("flood-peer", {
    type: "input",
    sessionId: "flood",
    playerId: "flood-peer",
    seq,
    x: seq % 2 ? 1 : -1,
    y: 0,
  });
assert.equal(floodPlayer.input.x, -1, "input flood must stop at the rate limit");
floodNow += 1000;
floodHost.receive("flood-peer", {
  type: "input",
  sessionId: "flood",
  playerId: "flood-peer",
  seq: 46,
  x: 0.25,
  y: 0,
});
assert.equal(floodPlayer.input.x, 0.25, "rate limit must recover after its window");
floodHost.stop();

transport.onStatus("peer", "closed");
assert.equal(host.game.players.has("peer"), false);
transport.onStatus("peer-2", "connected");
host.receive("peer-2", {
  type: "hello",
  sessionId: "room",
  playerId: "peer-2",
  name: "Rejoin",
  avatar: 1,
});
assert.equal(host.game.players.has("peer-2"), true);

host.start();
assert(host.timer, "host ticker must start for an active shift");
host.replay();
assert(host.timer, "replay must retain one active ticker");
host.stop();
assert.equal(host.timer, null, "host stop must clear the ticker");
guest.stop();
console.log("PASS session security: identity binding, malformed/flood/reordered message rejection, ticker cleanup, disconnect/rejoin");
