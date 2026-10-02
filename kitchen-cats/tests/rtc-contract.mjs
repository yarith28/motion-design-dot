import assert from "node:assert/strict";
import { WebRTCTransport } from "../webrtc-transport.js";

const transport = new WebRTCTransport();
const offer = JSON.stringify({
  version: 1,
  peerId: "peer",
  sessionId: "room",
  description: { type: "offer", sdp: "v=0\na=candidate:local" },
});
assert.deepEqual(transport.parse(offer, "offer").description.type, "offer");
assert.throws(
  () => transport.parse(offer.replace("a=candidate:local", "a=mid:0"), "offer"),
  /Paste a current offer/,
);
assert.throws(() => transport.parse("not-json", "answer"), /Invalid pairing JSON/);
assert.throws(
  () =>
    transport.parse(
      JSON.stringify({
        version: 1,
        peerId: "peer",
        sessionId: "room",
        description: { type: "answer", sdp: "v=0\na=candidate:local" },
      }),
      "offer",
    ),
  /Paste a current offer/,
);
assert.equal(transport.send("missing", { type: "snapshot" }), false);
console.log("PASS RTC contract: candidate requirement, type/JSON validation, closed-peer send");
