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
        if (!frames.every((frame) => /^KCQR1\|[oa]\|\d+\/\d+\|[0-9a-f]{8}\|/.test(frame)))
          throw Error(`QR ${type} frames contain a non-hex checksum.`);
        const assembler = new qr.QrFrameAssembler(role);
        const canvas = document.createElement("canvas");
        const imageScanner = new qr.QrCameraScanner(
          document.createElement("video"),
          () => {},
        );
        document.body.append(canvas);
        const decoded = [];
        let assembled;
        for (const [frameIndex, frame] of frames.entries()) {
          const rendered = qr.drawQr(canvas, frame);
          const blob = await new Promise((resolve, reject) =>
            canvas.toBlob(
              (value) =>
                value ? resolve(value) : reject(Error("QR PNG export failed.")),
              "image/png",
            ),
          );
          let text;
          try {
            text = await imageScanner.scanImage(
              new File([blob], "kitchen-cats-pairing.png", { type: "image/png" }),
            );
          } catch (error) {
            throw Error(
              `QR image frame ${frameIndex + 1}/${frames.length} could not decode: ${error.message}; ` +
                `dpr=${window.devicePixelRatio}, canvas=${canvas.width}x${canvas.height}, modules=${rendered.modules}, expected=${frame.length}`,
            );
          }
          let mismatch = -1;
          for (let i = 0; i < Math.min(frame.length, text.length); i++) {
            if (frame[i] !== text[i]) {
              mismatch = i;
              break;
            }
          }
          if (mismatch < 0 && frame.length !== text.length) mismatch = Math.min(frame.length, text.length);
          if (mismatch >= 0) {
            throw Error(
              `QR image frame ${frameIndex + 1}/${frames.length} changed at ${mismatch}: ` +
                `dpr=${window.devicePixelRatio}, canvas=${canvas.width}x${canvas.height}, modules=${rendered.modules}, ` +
                `expected=${frame.length}, decoded=${text.length}, expectedChunk=${JSON.stringify(frame.slice(Math.max(0, mismatch - 18), mismatch + 30))}, ` +
                `decodedChunk=${JSON.stringify(text.slice(Math.max(0, mismatch - 18), mismatch + 30))}`,
            );
          }
          decoded.push(text);
          try {
            assembled = assembler.add(text);
          } catch (error) {
            throw Error(
                `QR image frame ${frameIndex + 1}/${frames.length} was not accepted: ${error.message}; ` +
                `dpr=${window.devicePixelRatio}, canvas=${canvas.width}x${canvas.height}, modules=${rendered.modules}, ` +
                `decodedLength=${text.length}, decodedParts=${JSON.stringify(text.trim().split("|").map((part) => part.length))}, ` +
                `decoded=${JSON.stringify(text)}`,
            );
          }
        }
        results[type] = {
          frames: frames.length,
          allDecoded: decoded.length === frames.length,
          raw: JSON.parse(assembled.raw),
        };
        canvas.remove();
      }
      const camera = { supported: typeof HTMLCanvasElement.prototype.captureStream === "function" };
      if (camera.supported) {
        const frame = qr.createQrFrames(makeSignal("offer"), "o")[0];
        const feed = document.createElement("canvas");
        feed.width = 900;
        feed.height = 900;
        const feedContext = feed.getContext("2d");
        feedContext.fillStyle = "#fff";
        feedContext.fillRect(0, 0, feed.width, feed.height);
        const qrCanvas = document.createElement("canvas");
        qr.drawQr(qrCanvas, frame, 500);
        feedContext.drawImage(qrCanvas, 200, 200);
        const video = document.createElement("video");
        video.muted = true;
        video.playsInline = true;
        document.body.append(video);
        const stream = feed.captureStream(15);
        video.srcObject = stream;
        // A real camera advances video frames continuously. Redraw the same
        // rendered pixels so captureStream exercises qr-scanner's continuous
        // requestVideoFrameCallback loop rather than only a one-shot frame.
        const feedTimer = setInterval(() => {
          feedContext.fillStyle = "#fff";
          feedContext.fillRect(0, 0, feed.width, feed.height);
          feedContext.drawImage(qrCanvas, 200, 200);
        }, 100);
        const seen = [];
        const scanner = new qr.QrCameraScanner(video, (text) => seen.push(text));
        await scanner.start();
        const deadline = Date.now() + 5000;
        while (Date.now() < deadline && !seen.includes(frame))
          await new Promise((resolve) => setTimeout(resolve, 100));
        camera.videoBeforeStop = {
          readyState: video.readyState,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          paused: video.paused,
          currentTime: video.currentTime,
          track: stream.getVideoTracks()[0]?.getSettings?.(),
          trackState: stream.getVideoTracks()[0]?.readyState,
        };
        camera.scanRegion = scanner.scanner?._scanRegion;
        try {
          const direct = await qr.QrScanner.scanImage(video, {
            returnDetailedScanResult: true,
            alsoTryWithoutScanRegion: true,
          });
          camera.direct = typeof direct === "string" ? direct : direct.data;
        } catch (error) {
          camera.directError = String(error?.message || error);
        }
        scanner.stop();
        clearInterval(feedTimer);
        camera.decoded = seen.includes(frame);
        camera.samples = seen.length;
        camera.tracksEnded = stream.getTracks().every((track) => track.readyState === "ended");
        camera.scannerStopped = scanner.scanner === null;
        camera.videoAfterStop = {
          readyState: video.readyState,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          paused: video.paused,
          currentTime: video.currentTime,
          track: stream.getVideoTracks()[0]?.getSettings?.(),
        };
        video.remove();
        if (!camera.decoded)
          throw Error(`Camera decoder did not read rendered QR pixels in ${camera.samples} samples: ` +
            `region=${JSON.stringify(camera.scanRegion)}, direct=${JSON.stringify(camera.direct || camera.directError)}, ` +
            `beforeStop=${JSON.stringify(camera.videoBeforeStop)}, afterStop=${JSON.stringify(camera.videoAfterStop)}`);
        if (!camera.tracksEnded || !camera.scannerStopped)
          throw Error("Camera decoder cleanup did not stop the stream and scanner.");
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
      const cleanupStream = document.createElement("canvas").captureStream(1);
      const cleanupTrack = cleanupStream.getTracks()[0];
      const originalStop = cleanupTrack.stop.bind(cleanupTrack);
      cleanupTrack.stop = () => {
        cleanup.tracks++;
        originalStop();
      };
      video.srcObject = cleanupStream;
      scanner.stop();
      return { results, camera, invalidRejected, cleanup };
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
      `PASS QR browser: real encoded-PNG decode roundtrips for offer/answer, long candidate framing, unrelated-code rejection, ` +
        `camera decoder=${evidence.camera.supported ? "rendered stream" : "UNTESTED captureStream unavailable"}, ` +
        "scanner cleanup, cancel/retry UI, zero page errors",
    );
    await c.close();
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
