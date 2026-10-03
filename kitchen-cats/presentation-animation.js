// Presentation state stays separate from the authoritative kitchen clock.
export function createPresentationState() {
  return {
    players: new Map(), serveBaseline: 0, serveBurstUntil: 0,
    serveBurstStart: 0, serveBurstId: 0, localCelebrateUntil: 0, phase: null,
  };
}

export function resetPresentation(state, snapshot = {}) {
  state.players.clear();
  state.serveBaseline = snapshot.served ?? 0;
  state.serveBurstUntil = 0;
  state.serveBurstStart = 0;
  state.serveBurstId = 0;
  state.localCelebrateUntil = 0;
  state.phase = snapshot.phase ?? null;
}

export function updatePhasePresentation(state, snapshot) {
  if (state.phase === snapshot.phase) return false;
  resetPresentation(state, snapshot);
  return true;
}

export function updatePlayerVisual(state, player, context = {}) {
  const now = context.now ?? 0;
  const reduced = !!context.reducedMotion;
  const prev = state.players.get(player.id);
  const moved = !!prev && Math.hypot(player.x - prev.x, player.y - prev.y) > .25;
  const lastMovedAt = moved ? now : (prev?.lastMovedAt ?? -Infinity);
  const recent = now - lastMovedAt < 200;
  let row = 0, mode = "idle";
  if (context.celebrate) { row = 3; mode = "celebrate"; }
  else if (context.nearPrep && context.prepActive && !recent && !player.held) { row = 1; mode = "chop"; }
  else if (context.nearPot && context.potActive && !recent && !player.held) { row = 2; mode = "stir"; }
  else if (recent) mode = player.held ? "carrywalk" : "walk";
  else if (player.held) mode = "carry";

  // Each new pose begins on its first frame instead of the global clock's frame.
  const modeEnteredAt = prev?.mode === mode && prev?.reduced === reduced
    ? prev.modeEnteredAt : now;
  state.players.set(player.id, { x: player.x, y: player.y, lastMovedAt, mode, modeEnteredAt, reduced });
  const elapsed = Math.max(0, now - modeEnteredAt);
  const frame = reduced || mode === "idle" || mode === "carry" ? 0
    : mode === "celebrate" ? Math.min(3, Math.floor(elapsed / 125))
      : Math.floor(elapsed / 125) % 4;
  // The illustrated pose cells carry the action. Keep the image's foot anchor
  // fixed; rotating or bobbing the whole cell moves planted paws off the floor.
  const bob = 0;
  const tilt = 0;
  return { row, frame, mode, moving: recent, bob, tilt, elapsed };
}

// Pose timing lives in the art manifest so every chef uses the same animation
// grammar. Mode entry resets the clock; nonlooping celebrations hold their last
// drawing instead of wrapping into an unrelated pose.
export function selectChefPose(poses, mode, elapsed, reduced = false) {
  const pose = poses?.[mode] ?? poses?.idle;
  if (!pose) return null;
  const frames = pose.frames?.length ? pose.frames : [0];
  const tick = reduced || !pose.frameMs
    ? 0
    : Math.floor(Math.max(0, elapsed) / pose.frameMs);
  const index = pose.loop ? tick % frames.length : Math.min(tick, frames.length - 1);
  return { source: pose.source, frame: frames[index] };
}

export function updateServeEffect(state, served, now, reduced = false) {
  if (served < state.serveBaseline) {
    state.serveBaseline = served;
    state.serveBurstUntil = 0;
    state.serveBurstStart = 0;
  }
  if (served > state.serveBaseline) {
    state.serveBaseline = served;
    state.serveBurstStart = now;
    state.serveBurstUntil = now + 700;
    state.serveBurstId++;
  }
  return {
    active: !reduced && now < state.serveBurstUntil,
    id: state.serveBurstId, age: now - state.serveBurstStart,
  };
}

export function prepPose(time, reduced = false) {
  return reduced ? 0 : Math.floor(time / 125) % 4;
}

export function potEffect(time, active, reduced = false) {
  return { active: active && !reduced, frame: reduced ? 0 : Math.floor(time / 125) % 4 };
}

export function burstOffset(index, age, reduced = false) {
  if (reduced) return { x: 0, y: 0, a: 1 };
  const progress = Math.min(1, Math.max(0, age / 700));
  const angle = (-165 + index * 33) * Math.PI / 180;
  return {
    x: Math.cos(angle) * (16 + progress * 62),
    y: Math.sin(angle) * (12 + progress * 42) - progress * 18,
    a: 1 - progress,
  };
}
