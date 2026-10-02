import { KitchenGame } from "./game-core.js";
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
    this.game = new KitchenGame(this.now, { solo: false });
    this.game.addPlayer("host", name, avatar);
    this.game.state.phase = "lobby";
    this.game.state.notice = "Pair your friends, then start the shift.";
    this.game.on((s) => this.publish(s));
    this.publish(this.game.snapshot());
    this.timer = setInterval(() => this.game?.tick(0.05), 50);
  }
  join(name = "Guest", avatar = 0) {
    this.stop();
    this.profile = { name, avatar };
  }
  publish(s) {
    this.snapshotCb(s);
    for (const id of this.peers)
      this.transport.send(id, {
        type: "snapshot",
        sessionId: this.sessionId,
        snapshot: s,
      });
  }
  connection(id, status) {
    if (status === "connected") {
      if (this.isHost) {
        if (this.game.state.phase !== "lobby" || this.peers.size >= 3) {
          this.transport.closePeer(id);
          return;
        }
        this.peers.add(id);
        this.game.addPlayer(id, "Guest", 0);
        this.transport.send(id, {
          type: "identity",
          playerId: id,
          sessionId: this.sessionId,
        });
        this.publish(this.game.snapshot());
        this.status("Chef connected");
      } else {
        this.serverPeer = id;
        this.transport.send(id, { type: "hello", ...this.profile });
      }
    } else if (status === "closed") {
      if (this.isHost) {
        this.peers.delete(id);
        this.rate.delete(id);
        this.game?.removePlayer(id);
        this.status("Pairing closed / chef left");
      } else if (this.serverPeer === id) {
        this.serverPeer = null;
        this.status("disconnected");
      } else {
        this.status("Pairing closed. Create a fresh offer and try again.");
      }
    }
  }
  receive(id, m) {
    if (!m || typeof m !== "object") return;
    if (!this.isHost) {
      if (id !== this.serverPeer) return;
      if (m.type === "identity") {
        this.playerId = m.playerId;
        this.sessionId = m.sessionId;
        return;
      }
      if (m.sessionId !== this.sessionId) return;
      if (m.type === "snapshot" && m.snapshot?.players && m.snapshot?.stations)
        this.snapshotCb(m.snapshot);
      if (m.type === "ended") this.status("disconnected");
      return;
    }
    if (!this.peers.has(id)) return;
    if (m.type === "hello") {
      const p = this.game.getPlayer(id);
      p.name = String(m.name || "Guest").slice(0, 16);
      p.avatar =
        Number.isInteger(m.avatar) && m.avatar >= 0 && m.avatar < 4
          ? m.avatar
          : 0;
      this.publish(this.game.snapshot());
      return;
    }
    if (m.sessionId !== this.sessionId || m.playerId !== id) return;
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
    if (m.type === "interact" && typeof m.station === "string")
      this.game.interact(id, m.station);
  }
  sendInput(x, y) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    const magnitude = Math.max(1, Math.hypot(x, y));
    x /= magnitude;
    y /= magnitude;
    if (this.isHost) this.game?.move("host", x, y);
    else if (this.serverPeer)
      this.transport.send(this.serverPeer, {
        type: "input",
        sessionId: this.sessionId,
        playerId: this.playerId,
        x,
        y,
      });
  }
  sendInteract(station) {
    if (this.isHost) this.game?.interact("host", station);
    else if (this.serverPeer)
      this.transport.send(this.serverPeer, {
        type: "interact",
        sessionId: this.sessionId,
        playerId: this.playerId,
        station,
      });
  }
  start() {
    if (this.isHost) this.game.start();
  }
  replay() {
    if (this.isHost) this.game.replay();
  }
  stop() {
    clearInterval(this.timer);
    if (this.isHost)
      for (const id of this.peers)
        this.transport.send(id, { type: "ended", sessionId: this.sessionId });
    this.peers.clear();
    this.serverPeer = null;
    this.transport.close();
    this.game = null;
    this.isHost = false;
    this.sessionId = null;
    this.playerId = null;
    this.rate.clear();
  }
  leave() {
    this.stop();
  }
}
