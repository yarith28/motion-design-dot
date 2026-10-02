import assert from "node:assert/strict";
import {
  createPresentationState,
  updatePlayerVisual,
  updateServeEffect,
  resetPresentation,
  prepPose,
  potEffect,
} from "../presentation-animation.js";

const s = createPresentationState();
const p = { id: 1, x: 0, y: 0 };

updatePlayerVisual(s, p, { now: 0 });
assert.equal(updatePlayerVisual(s, p, { now: 100 }).moving, false);

resetPresentation(s, { served: 2, phase: "playing" });
updateServeEffect(s, 1, 100);
assert.equal(s.serveBurstUntil, 0);
updateServeEffect(s, 3, 100);
assert.ok(s.serveBurstUntil > 100);

assert.notEqual(prepPose(0), prepPose(125));
assert.equal(potEffect(1, false).active, false);
console.log("PASS visual r6 contract");
