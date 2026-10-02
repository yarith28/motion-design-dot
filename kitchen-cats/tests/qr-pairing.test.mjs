import assert from "node:assert/strict";
import {
  createQrFrames,
  parseQrFrame,
  QrFrameAssembler,
  QR_MAX_RAW_CHARS,
} from "../qr-pairing.js";

const signal = (type, sdp) =>
  JSON.stringify({
    version: 1,
    peerId: "peer-1234",
    sessionId: "session-5678",
    description: { type, sdp },
  });

const candidate = (n) =>
  `a=candidate:${n} 1 udp 2122260223 192.168.1.${20 + n} ${5000 + n} typ host generation 0 ufrag abc${n} network-cost 999`;
const longSdp = [
  "v=0",
  "o=- 1 2 IN IP4 127.0.0.1",
  "s=-",
  "t=0 0",
  "a=group:BUNDLE 0",
  "m=application 9 UDP/DTLS/SCTP webrtc-datachannel",
  "c=IN IP4 0.0.0.0",
  ...Array.from({ length: 12 }, (_, i) => candidate(i + 1)),
  "a=ice-ufrag:abc",
  "a=ice-pwd:abcdefghijklmnopqrstuvwxyz012345",
].join("\r\n");

const frames = createQrFrames(signal("offer", longSdp), "o");
assert(frames.length > 1, "long signaling data must use framed QR payloads");
const first = parseQrFrame(frames[0]);
assert.equal(first.role, "o");
assert.equal(first.index, 1);
assert.equal(first.total, frames.length);
assert.match(frames[0], /^KCQR1\|o\|1\/\d+\|[0-9a-f]{8}\|/);

const assembler = new QrFrameAssembler("o");
let progress;
for (const frame of [
  frames[1],
  frames[0],
  frames[1],
  ...frames.slice(2).reverse(),
])
  progress = assembler.add(frame);
assert.equal(progress.complete, true);
assert.deepEqual(JSON.parse(progress.raw), JSON.parse(signal("offer", longSdp)));

assert.equal(assembler.add(frames[0]).duplicate, true);
assert.throws(() => new QrFrameAssembler("x"), /role/);
assert.throws(() => new QrFrameAssembler("a").add(frames[0]), /guest reply/);
assert.throws(() => parseQrFrame("not-a-kitchen-code"), /not a Kitchen Cats/);

const corrupted = [...frames];
corrupted[0] = corrupted[0].replace(/.$/, corrupted[0].endsWith("A") ? "B" : "A");
const bad = new QrFrameAssembler("o");
for (const frame of corrupted.slice(1)) bad.add(frame);
assert.throws(() => bad.add(corrupted[0]), /checksum|damaged|pairing/i);

assert.throws(
  () => createQrFrames(signal("offer", "v=0\r\na=ice-candidate:x"), "a"),
  /current Kitchen Cats pairing code/,
);
assert.throws(
  () => createQrFrames(signal("offer", "a=candidate:x".repeat(QR_MAX_RAW_CHARS)), "o"),
  /too large/,
);
assert.throws(() => parseQrFrame("KCQR1|o|1/1|00000000|%%%"), /incomplete|damaged/);

console.log(
  "PASS QR protocol: compact versioned offer/answer payloads, CRC, framing, out-of-order/duplicate handling, role/type checks, corruption, and bounds",
);
