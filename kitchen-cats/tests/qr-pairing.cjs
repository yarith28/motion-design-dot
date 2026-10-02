const assert = require("node:assert/strict");
const { launchBrowser } = require("./browser-launch.cjs");
const base = process.env.BASE_URL || "http://127.0.0.1:8000/kitchen-cats/";

(async () => {
  const b = await launchBrowser();
  try {
    const c = await b.newContext({
      viewport: { width: 844, height: 700 },
      isMobile: true,
      hasTouch: true,
    });
    const p = await c.newPage();
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(base);
    const evidence = await p.evaluate(async () => {
      const qr = await import("./qr-pairing.js");
      const makeSignal = (type) =>
        JSON.stringify({
          version: 1,
          peerId: "peer-qr-1234",
          sessionId: "session-qr-5678",
          description: {
            type,
            sdp: [
              "v=0",
              "o=- 1 2 IN IP4 127.0.0.1",
              "s=-",
              "t=0 0",
              "a=group:BUNDLE 0",
              "m=application 9 UDP/DTLS/SCTP webrtc-datachannel",
              "c=IN IP4 0.0.0.0",
              ...Array.from(
                { length: 10 },
                (_, i) =>
                  `a=candidate:${i + 1} 1 udp 2122260223 192.168.1.${20 + i} ${5000 + i} typ host generation 0 ufrag abc${i} network-cost 999`,
              ),
              "a=ice-ufrag:abcdef",
              "a=ice-pwd:abcdefghijklmnopqrstuvwxyz012345",
            ].join("\\r\\n"),
          },
        });
      const results = {};
      for (const [type, role] of [
        ["offer", "o"],
        ["answer", "a"],
      ]) {
        const frames = qr.createQrFrames(makeSignal(type), role);
        const assembler = new qr.QrFrameAssembler(role);
        const canvas = document.createElement("canvas");
        document.body.append(canvas);
        const decoded = [];
        let assembled;
        for (const frame of frames) {
          qr.drawQr(canvas, frame);
          const scanned = await qr.QrScanner.scanImage(canvas, {
            returnDetailedScanResult: true,
          });
          const text = typeof scanned === "string" ? scanned : scanned.data;
          decoded.push(text);
          assembled = assembler.add(text);
        }
        results[type] = {
          frames: frames.length,
          allDecoded: decoded.length === frames.length,
          raw: JSON.parse(assembled.raw),
        };
        canvas.remove();
      }
      const invalid = new qr.QrFrameAssembler("o");
      let invalidRejected = false;
      try {
        invalid.add("unrelated barcode");
      } catch {
        invalidRejected = true;
      }
      const cleanup = { stopped: 0, destroyed: 0, tracks: 0 };
      const video = document.createElement("video");
      const scanner = new qr.QrCameraScanner(video, () => {});
      scanner.scanner = {
        stop: () => cleanup.stopped++,
        destroy: () => cleanup.destroyed++,
      };
      video.srcObject = { getTracks: () => [{ stop: () => cleanup.tracks++ }] };
      scanner.stop();
      return { results, invalidRejected, cleanup };
    });
    assert(evidence.results.offer.allDecoded);
    assert(evidence.results.answer.allDecoded);
    assert.equal(evidence.results.offer.raw.description.type, "offer");
    assert.equal(evidence.results.answer.raw.description.type, "answer");
    assert(evidence.results.offer.raw.description.sdp.includes("a=candidate:"));
    assert(evidence.results.answer.raw.description.sdp.includes("a=candidate:"));
    assert(evidence.invalidRejected);
    assert.deepEqual(evidence.cleanup, { stopped: 1, destroyed: 1, tracks: 1 });
    assert.deepEqual(errors, []);

    await p.locator("#mp-join").click();
    assert(await p.locator("#mp-flow").isVisible());
    assert.match(await p.locator("#mp-step").innerText(), /Guest · 1 of 2/);
    await p.locator("#mp-cancel").click();
    assert(await p.locator("#mp-actions").isVisible());
    await p.locator("#mp-join").click();
    assert(await p.locator("#mp-scan").isVisible());
    await p.locator("#mp-cancel").click();
    assert(await p.locator("#mp-flow").isHidden());
    assert.deepEqual(errors, []);
    console.log(
      "PASS QR browser: real encoded-canvas decode roundtrips for offer/answer, long candidate framing, unrelated-code rejection, scanner track cleanup, cancel/retry UI, zero page errors",
    );
    await c.close();
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
