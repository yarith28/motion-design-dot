import { KitchenGame, MAX_NAME_LENGTH, stations } from "./game-core.js";

const stationIds = new Set(stations.map((station) => station.id));
const recipes = new Set(["tomato", "carrot"]);
const heldItems = new Set([
  null,
  "tomato",
  "carrot",
  "chopped-tomato",
  "chopped-carrot",
  "soup-tomato",
  "soup-carrot",
]);
const phases = new Set(["idle", "lobby", "playing", "results"]);
const validToken = (value) =>
  typeof value === "string" && value.length > 0 && value.length <= 80;
const profileValue = (name, avatar) => ({
  name: String(name ?? "Chef").trim().slice(0, MAX_NAME_LENGTH) || "Chef",
  avatar: Number.isInteger(avatar) && avatar >= 0 && avatar < 4 ? avatar : 0,
});
const validPlayer = (player) =>
  player &&
  validToken(player.id) &&
  typeof player.name === "string" &&
  player.name.length > 0 &&
  player.name.length <= MAX_NAME_LENGTH &&
  Number.isInteger(player.avatar) &&
  player.avatar >= 0 &&
  player.avatar < 4 &&
  Number.isFinite(player.x) &&
  player.x >= 40 &&
  player.x <= 760 &&
  Number.isFinite(player.y) &&
  player.y >= 175 &&
  player.y <= 465 &&
  heldItems.has(player.held) &&
  player.input &&
  Number.isFinite(player.input.x) &&
  Number.isFinite(player.input.y) &&
  Math.abs(player.input.x) <= 1 &&
  Math.abs(player.input.y) <= 1 &&
  typeof player.connected === "boolean";
const validJob = (job) =>
  job === null ||
  (job &&
    heldItems.has(job.item) &&
    Number.isFinite(job.started) &&
    Number.isFinite(job.ready) &&
    job.ready >= job.started);
const validSnapshot = (snapshot) => {
  if (!snapshot || typeof snapshot !== "object") return false;
  if (!phases.has(snapshot.phase)) return false;
  if (!Number.isFinite(snapshot.ends) || !Number.isFinite(snapshot.now))
    return false;
  if (!Number.isInteger(snapshot.score) || !Number.isInteger(snapshot.served))
    return false;
  if (
    !Number.isInteger(snapshot.missed) ||
    snapshot.score < 0 ||
    snapshot.served < 0 ||
    snapshot.missed < 0
  )
    return false;
  if (
    !Array.isArray(snapshot.players) ||
    snapshot.players.length === 0 ||
    snapshot.players.length > 4
  )
    return false;
  if (!snapshot.players.every(validPlayer)) return false;
  if (!validToken(snapshot.host) || typeof snapshot.solo !== "boolean")
    return false;
  if (!snapshot.players.some((player) => player.id === snapshot.host)) return false;
  if (snapshot.solo !== (snapshot.players.length === 1)) return false;
  if (
    !Array.isArray(snapshot.stations) ||
    snapshot.stations.length !== stations.length ||
    snapshot.stations.some((station, index) => {
      const expected = stations[index];
      return (
        station.id !== expected.id ||
        station.label !== expected.label ||
        station.kind !== expected.kind ||
        station.x !== expected.x ||
        station.y !== expected.y
      );
    })
  )
    return false;
  if (!Array.isArray(snapshot.orders) || snapshot.orders.length > 32)
    return false;
  if (
    snapshot.orders.some(
      (order) =>
        !order ||
        typeof order.id !== "string" ||
        order.id.length > 80 ||
        !recipes.has(order.recipe) ||
        !Number.isFinite(order.expires),
    )
  )
    return false;
  return validJob(snapshot.prep) && validJob(snapshot.pot) && heldItems.has(snapshot.pass);
};
const copySnapshot = (snapshot) => {
  try {
    return structuredClone(snapshot);
  } catch {
    return JSON.parse(JSON.stringify(snapshot));
  }
};

export class MultiplayerSession {
  constructor({ transport, now = () => Date.now() } = {}) {
    this.transport = transport;
    this.now = now;
    this.snapshotCb = () => {};
    this.statusCb = () => {};
    this.peers = new Set();
    this.rate = new Map();
    this.isHost = false;
    this.game = null;
    this.playerId = null;
    this.sessionId = null;
    this.serverPeer = null;
    this.profile = null;
    this.timer = null;
    this.stopping = false;
    this.helloSent = false;
    transport.onMessage = (id, m) => this.receive(id, m);
    transport.onStatus = (id, s) => this.connection(id, s);
  }
  onSnapshot(cb) {
    this.snapshotCb = cb;
  }
  onStatus(cb) {
    this.statusCb = cb;
  }
  status(s) {
    this.statusCb(s);
  }
  startHost(sessionId, name = "Host", avatar = 0) {
    this.stop();
    this.isHost = true;
    this.sessionId = sessionId;
    this.playerId = "host";
    this.profile = profileValue(name, avatar);
    this.game = new KitchenGame(this.now, { solo: false });
    this.game.addPlayer("host", this.profile.name, this.profile.avatar);
    this.game.state.phase = "lobby";
    this.game.state.notice = "Pair your friends, then start the shift.";
    this.game.on((s) => this.publish(s));
    this.publish(this.game.snapshot());
  }
  join(name = "Guest", avatar = 0) {
    this.stop();
    this.profile = profileValue(name, avatar);
  }
  publish(s) {
    this.snapshotCb(s);
    for (const id of this.peers) {
      this.safeSend(id, {
        type: "snapshot",
        sessionId: this.sessionId,
        snapshot: s,
      });
    }
  }
  safeSend(id, message) {
    try {
      return this.transport.send(id, message) !== false;
    } catch {
      this.transport.closePeer?.(id);
      return false;
    }
  }
  connection(id, status) {
    if (this.stopping) return;
    if (status === "connected") {
      if (this.isHost) {
        if (!this.game || !validToken(id)) return;
        if (this.peers.has(id)) return;
        if (this.game.state.phase !== "lobby" || this.peers.size >= 3) {
          this.transport.closePeer(id);
          return;
        }
        this.peers.add(id);
        this.game.addPlayer(id, "Guest", 0);
        this.safeSend(id, {
          type: "identity",
          playerId: id,
          sessionId: this.sessionId,
        });
        this.publish(this.game.snapshot());
        this.status("Chef connected");
      } else {
        this.serverPeer = id;
        if (this.sessionId) this.sendHello();
      }
    } else if (status === "closed") {
      if (this.isHost) {
        this.peers.delete(id);
        this.rate.delete(id);
        if (this.game?.removePlayer(id)) this.publish(this.game.snapshot());
        this.status("Pairing closed / chef left");
      } else if (this.serverPeer === id) {
        this.serverPeer = null;
        this.helloSent = false;
        this.status("disconnected");
      } else {
        this.status("Pairing closed. Create a fresh offer and try again.");
      }
    }
  }
  receive(id, m) {
    if (!m || typeof m !== "object" || !validToken(id)) return;
    if (!this.isHost) {
      if (id !== this.serverPeer) return;
      if (m.type === "identity") {
        if (!validToken(m.playerId) || !validToken(m.sessionId)) return;
        this.playerId = m.playerId;
        this.sessionId = m.sessionId;
        this.sendHello();
        return;
      }
      if (m.sessionId !== this.sessionId) return;
      if (m.type === "snapshot" && validSnapshot(m.snapshot))
        this.snapshotCb(copySnapshot(m.snapshot));
      if (m.type === "ended") this.status("disconnected");
      return;
    }
    if (!this.peers.has(id)) return;
    if (m.type === "hello") {
      if (
        !this.game ||
        this.game.state.phase !== "lobby" ||
        m.sessionId !== this.sessionId ||
        m.playerId !== id ||
        typeof m.name !== "string" ||
        m.name.length > MAX_NAME_LENGTH ||
        !Number.isInteger(m.avatar) ||
        m.avatar < 0 ||
        m.avatar >= 4
      )
        return;
      const p = this.game.getPlayer(id);
      if (!p) return;
      p.name = String(m.name).trim().slice(0, MAX_NAME_LENGTH) || "Guest";
      p.avatar = m.avatar;
      this.publish(this.game.snapshot());
      return;
    }
    if (!this.game || m.sessionId !== this.sessionId || m.playerId !== id)
      return;
    const now = this.now();
    let r = this.rate.get(id);
    if (!r || now - r.t >= 1000) r = { t: now, n: 0 };
    this.rate.set(id, r);
    if (++r.n > 40) return;
    if (
      m.type === "input" &&
      Number.isFinite(m.x) &&
      Number.isFinite(m.y) &&
      Math.abs(m.x) <= 1 &&
      Math.abs(m.y) <= 1
    )
      this.game.move(id, m.x, m.y);
    if (
      m.type === "interact" &&
      typeof m.station === "string" &&
      stationIds.has(m.station)
    )
      this.game.interact(id, m.station);
  }
  sendHello() {
    if (
      this.helloSent ||
      !this.serverPeer ||
      !this.sessionId ||
      !this.playerId ||
      !this.profile
    )
      return false;
    try {
      this.helloSent = this.transport.send(this.serverPeer, {
        type: "hello",
        sessionId: this.sessionId,
        playerId: this.playerId,
        ...this.profile,
      }) !== false;
    } catch {
      this.helloSent = false;
      this.transport.closePeer?.(this.serverPeer);
    }
    return this.helloSent;
  }
  sendInput(x, y) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
    const magnitude = Math.max(1, Math.hypot(x, y));
    x /= magnitude;
    y /= magnitude;
    if (this.isHost) return !!this.game?.move("host", x, y);
    if (this.serverPeer && this.sessionId && this.playerId)
      return this.transport.send(this.serverPeer, {
        type: "input",
        sessionId: this.sessionId,
        playerId: this.playerId,
        x,
        y,
      });
    return false;
  }
  sendInteract(station) {
    if (!stationIds.has(station)) return false;
    if (this.isHost) return !!this.game?.interact("host", station);
    if (this.serverPeer && this.sessionId && this.playerId)
      return this.transport.send(this.serverPeer, {
        type: "interact",
        sessionId: this.sessionId,
        playerId: this.playerId,
        station,
      });
    return false;
  }
  start() {
    if (this.isHost && this.game) {
      this.game.start();
      this.startTicker();
    }
  }
  replay() {
    if (this.isHost && this.game) {
      this.game.replay();
      this.startTicker();
    }
  }
  startTicker() {
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (!this.game) return;
      this.game.tick(0.05);
      if (this.game.state.phase !== "playing") {
        clearInterval(this.timer);
        this.timer = null;
      }
    }, 50);
  }
  stop() {
    this.stopping = true;
    clearInterval(this.timer);
    this.timer = null;
    if (this.isHost)
      for (const id of this.peers)
        this.safeSend(id, { type: "ended", sessionId: this.sessionId });
    this.peers.clear();
    this.serverPeer = null;
    this.transport.close();
    this.game = null;
    this.isHost = false;
    this.sessionId = null;
    this.playerId = null;
    this.profile = null;
    this.helloSent = false;
    this.rate.clear();
    this.stopping = false;
  }
  leave() {
    this.stop();
  }
}
