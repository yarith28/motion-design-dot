import assert from "node:assert/strict";
import {
  burstOffset,
  createPresentationState,
  potEffect,
  prepPose,
  resetPresentation,
  selectChefPose,
  updateServeEffect,
  updatePlayerVisual,
} from "../presentation-animation.js";

const p = { id: 1, x: 0, y: 0 };
const s = createPresentationState();

// Idle is a held frame, including at animation-clock boundaries.
for (const now of [0, 125, 250]) {
  const idle = updatePlayerVisual(s, p, { now });
  assert.equal(idle.mode, "idle");
  assert.equal(idle.row, 0);
  assert.equal(idle.frame, 0);
}

// Movement owns the walk row for 200ms after the last movement sample.
const walk = updatePlayerVisual(s, { id: 1, x: 10, y: 0 }, { now: 100 });
assert.equal(walk.mode, "walk");
assert.equal(walk.row, 0);
assert.equal(walk.frame, 0);
assert.equal(updatePlayerVisual(s, { id: 1, x: 10, y: 0 }, { now: 240 }).frame, 1);
assert.equal(updatePlayerVisual(s, { id: 1, x: 10, y: 0 }, { now: 299 }).mode, "walk");
assert.equal(updatePlayerVisual(s, { id: 1, x: 10, y: 0 }, { now: 300 }).mode, "idle");
assert.equal(
  updatePlayerVisual(s, { id: 1, x: 10, y: 0, held: "tomato" }, { now: 301 }).mode,
  "carry",
);
assert.equal(
  updatePlayerVisual(s, { id: 1, x: 20, y: 0, held: "tomato" }, { now: 302 }).mode,
  "carrywalk",
);

// Work rows require proximity, an unfinished job, and a stationary chef.
resetPresentation(s, {});
assert.equal(
  updatePlayerVisual(s, p, { now: 300, nearPrep: true, prepActive: true }).row,
  1,
);
assert.equal(
  updatePlayerVisual(s, p, { now: 450, nearPrep: true, prepActive: true }).frame,
  1,
);
assert.equal(
  updatePlayerVisual(s, p, { now: 460, nearPot: true, potActive: true }).row,
  2,
);
assert.equal(
  updatePlayerVisual(s, p, { now: 460, nearPot: true, potActive: true }).frame,
  0,
);
assert.equal(
  updatePlayerVisual(s, p, { now: 300, nearPrep: true, prepActive: true, celebrate: true }).row,
  3,
);

// Reduced motion keeps every selected pose on frame zero and suppresses effects.
for (const now of [0, 125, 250, 500, 1000]) {
  assert.equal(
    updatePlayerVisual(s, p, {
      now,
      reducedMotion: true,
      nearPrep: true,
      prepActive: true,
      nearPot: true,
      potActive: true,
      celebrate: true,
    }).frame,
    0,
  );
  assert.equal(prepPose(now, true), 0);
  assert.equal(updatePlayerVisual(s, p, { now, reducedMotion: true }).bob, 0);
  assert.deepEqual(potEffect(now, true, true), { active: false, frame: 0 });
  assert.deepEqual(burstOffset(3, now, true), { x: 0, y: 0, a: 1 });
}
assert.equal(updateServeEffect(s, 1, 100, true).active, false);
assert(burstOffset(2, 350).a < burstOffset(2, 0).a);

// Art timing is tied to time in the current pose, not the wall clock. Idle and
// reduced motion never cycle, while a serve pose completes once and holds.
const poses = {
  idle: { source: "portrait", frames: [0], frameMs: 0, loop: false },
  walk: { source: "atlas", frames: [0, 1, 2, 3], frameMs: 125, loop: true },
  celebrate: { source: "atlas", frames: [12, 13, 14, 15], frameMs: 125, loop: false },
};
assert.deepEqual(selectChefPose(poses, "idle", 900), { source: "portrait", frame: 0 });
assert.deepEqual(selectChefPose(poses, "walk", 0), { source: "atlas", frame: 0 });
assert.deepEqual(selectChefPose(poses, "walk", 375), { source: "atlas", frame: 3 });
assert.deepEqual(selectChefPose(poses, "walk", 500), { source: "atlas", frame: 0 });
assert.deepEqual(selectChefPose(poses, "walk", 375, true), { source: "atlas", frame: 0 });
assert.deepEqual(selectChefPose(poses, "celebrate", 900), { source: "atlas", frame: 15 });

resetPresentation(s, { served: 0, phase: "playing" });
assert.equal(s.players.size, 0);
console.log("PASS cream animation conditions");
