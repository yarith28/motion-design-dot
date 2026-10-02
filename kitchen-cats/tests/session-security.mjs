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
host.receive("peer", { type: "input", sessionId: "wrong", playerId: "peer", x: 1, y: 0 });
host.receive("peer", { type: "input", sessionId: "room", playerId: "peer", x: NaN, y: 0 });
host.receive("peer", { type: "input", sessionId: "room", playerId: "peer", x: 2, y: 0 });
host.receive("peer", { type: "interact", sessionId: "room", playerId: "peer", station: "not-a-station" });
assert.deepEqual(player.input, before);
assert.equal(host.sendInput(NaN, 0), false);
assert.equal(host.sendInteract("not-a-station"), false);

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
  snapshot: { phase: "playing", players: [], stations: [], orders: [] },
});
assert.equal(received, 0);
const valid = host.game.snapshot();
guest.receive("peer", { type: "snapshot", sessionId: "room", snapshot: valid });
assert.equal(received, 1);
guest.receive("other", { type: "snapshot", sessionId: "room", snapshot: valid });
assert.equal(received, 1);

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

host.stop();
guest.stop();
console.log("PASS session security: identity binding, malformed input/snapshot rejection, disconnect/rejoin");
