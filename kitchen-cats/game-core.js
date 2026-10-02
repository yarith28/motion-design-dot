// Shared deterministic rules for offline solo and the authoritative LAN host.
export const stations = [
  { id: "tomato", label: "Tomato", x: 110, y: 95, kind: "source" },
  { id: "carrot", label: "Carrot", x: 280, y: 95, kind: "source" },
  { id: "prep", label: "Chop", x: 460, y: 95, kind: "prep" },
  { id: "pot", label: "Pot", x: 690, y: 95, kind: "pot" },
  { id: "pass", label: "Counter", x: 400, y: 370, kind: "pass" },
  { id: "serve", label: "Serve", x: 690, y: 540, kind: "serve" },
  { id: "bin", label: "Bin", x: 110, y: 540, kind: "bin" },
];
export const SHIFT_MS = 90000;
export const MAX_PLAYERS = 4;
export const MAX_NAME_LENGTH = 16;
const MAX_PLAYER_ID_LENGTH = 80;
const input = (x, y) => {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return { x: 0, y: 0 };
  const n = Math.max(1, Math.hypot(x, y));
  return { x: x / n, y: y / n };
};
const cleanName = (name) =>
  String(name ?? "Chef").trim().slice(0, MAX_NAME_LENGTH) || "Chef";
const cleanAvatar = (avatar) =>
  Number.isInteger(avatar) && avatar >= 0 && avatar < 4 ? avatar : 0;
const spawn = (i) => ({
  x: 250 + i * 55,
  y: 250,
  held: null,
  input: { x: 0, y: 0 },
});
// Counter rectangle expanded by the chef's collision radius.
const blocked = (x, y) => x > 320 && x < 480 && y > 308 && y < 419;
export class KitchenGame {
  constructor(clock = () => Date.now(), { solo = true } = {}) {
    this.clock = clock;
    this.listeners = [];
    this.players = new Map();
    this.hostId = null;
    this.state = this.cleanState();
    if (solo) this.addPlayer("solo", "Chef", 0);
  }
  cleanState() {
    return {
      phase: "idle",
      ends: 0,
      score: 0,
      served: 0,
      missed: 0,
      next: 0,
      orders: [],
      prep: null,
      pot: null,
      pass: null,
      notice: "Choose a mode to start the kitchen.",
    };
  }
  on(fn) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((f) => f !== fn);
    };
  }
  emit() {
    const s = this.snapshot();
    this.listeners.forEach((f) => f(s));
  }
  addPlayer(id, name = "Chef", avatar = 0) {
    if (
      typeof id !== "string" ||
      id.length === 0 ||
      id.length > MAX_PLAYER_ID_LENGTH ||
      this.players.size >= MAX_PLAYERS ||
      this.players.has(id)
    )
      return false;
    this.players.set(id, {
      id,
      name: cleanName(name),
      avatar: cleanAvatar(avatar),
      ...spawn(this.players.size),
      connected: true,
    });
    this.hostId ??= id;
    this.emit();
    return true;
  }
  removePlayer(id) {
    if (!this.players.delete(id)) return false;
    if (this.hostId === id)
      this.hostId = this.players.keys().next().value ?? null;
    this.emit();
    return true;
  }
  getPlayer(id) {
    return this.players.get(id);
  }
  resetPlayers() {
    let i = 0;
    for (const p of this.players.values()) Object.assign(p, spawn(i++));
  }
  start(name, avatar) {
    const p = this.players.get("solo");
    if (p) {
      if (name !== undefined) p.name = cleanName(name);
      if (avatar !== undefined) p.avatar = cleanAvatar(avatar);
    }
    this.resetPlayers();
    this.state = {
      ...this.cleanState(),
      phase: "playing",
      ends: this.clock() + SHIFT_MS,
      notice: "Aprons on! Let’s make soup.",
    };
    this.addOrder();
    this.addOrder();
    this.emit();
  }
  replay() {
    this.start();
  }
  stop() {
    this.resetPlayers();
    this.state = this.cleanState();
    this.emit();
  }
  snapshot() {
    return JSON.parse(
      JSON.stringify({
        ...this.state,
        code: "LOCAL",
        host: this.hostId,
        solo: this.players.size === 1,
        now: this.clock(),
        players: [...this.players.values()],
        stations,
      }),
    );
  }
  addOrder() {
    this.state.orders.push({
      id: String(this.state.next),
      recipe: ["tomato", "carrot"][this.state.next++ % 2],
      expires: this.clock() + 30000,
    });
  }
  move(id, x, y) {
    if (arguments.length < 3) {
      y = x;
      x = id;
      id = "solo";
    }
    const p = this.getPlayer(id);
    if (!p || !Number.isFinite(x) || !Number.isFinite(y)) return false;
    p.input = input(x, y);
    p.lastInput = this.clock();
    return true;
  }
  tick(dt = 0.05) {
    const now = this.clock();
    if (this.state.phase !== "playing") return;
    if (now >= this.state.ends) {
      this.state.phase = "results";
      for (const p of this.players.values()) p.input = { x: 0, y: 0 };
      this.emit();
      return;
    }
    const elapsed = Number.isFinite(dt) && dt >= 0 ? Math.min(dt, 0.25) : 0.05;
    for (const p of this.players.values()) {
      if (now - (p.lastInput ?? now) > 500) p.input = { x: 0, y: 0 };
      // Small substeps prevent tunnelling during irregular host frames.
      const steps = Math.max(1, Math.ceil(elapsed / 0.025));
      for (let i = 0; i < steps; i++) {
        const x = Math.max(
          40,
          Math.min(760, p.x + (p.input.x * 190 * elapsed) / steps),
        );
        if (!blocked(x, p.y)) p.x = x;
        const y = Math.max(
          175,
          Math.min(465, p.y + (p.input.y * 190 * elapsed) / steps),
        );
        if (!blocked(p.x, y)) p.y = y;
      }
    }
    const expired = this.state.orders.filter((o) => o.expires <= now).length;
    if (expired) {
      this.state.missed += expired;
      this.state.score = Math.max(0, this.state.score - expired * 20);
      this.state.orders = this.state.orders.filter((o) => o.expires > now);
      for (let i = 0; i < expired; i++) this.addOrder();
    }
    this.emit();
  }
  interact(id, stationId) {
    if (stationId === undefined) {
      stationId = id;
      id = "solo";
    }
    if (this.state.phase !== "playing" || this.clock() >= this.state.ends)
      return false;
    const p = this.getPlayer(id),
      s = stations.find((s) => s.id === stationId),
      n = this.clock();
    if (!p || !s || Math.hypot(p.x - s.x, p.y - s.y) > 110) return false;
    if (s.kind === "source") {
      if (p.held) return false;
      p.held = s.id;
    }
    if (s.kind === "prep" || s.kind === "pot") {
      const key = s.kind,
        job = this.state[key];
      if (job) {
        if (n < job.ready || p.held) return false;
        p.held = job.item;
        this.state[key] = null;
      } else {
        if (
          key === "prep"
            ? !["tomato", "carrot"].includes(p.held)
            : !p.held?.startsWith("chopped-")
        )
          return false;
        this.state[key] = {
          item:
            key === "prep"
              ? "chopped-" + p.held
              : p.held.replace("chopped-", "soup-"),
          started: n,
          ready: n + (key === "prep" ? 3000 : 5000),
        };
        p.held = null;
      }
    }
    if (s.kind === "pass")
      [p.held, this.state.pass] = [this.state.pass, p.held];
    if (s.kind === "bin") p.held = null;
    if (s.kind === "serve") {
      const i = this.state.orders.findIndex(
        (o) => "soup-" + o.recipe === p.held && o.expires > n,
      );
      if (i < 0) return false;
      this.state.score += 100;
      this.state.served++;
      this.state.orders.splice(i, 1);
      this.addOrder();
      p.held = null;
    }
    this.emit();
    return true;
  }
}
