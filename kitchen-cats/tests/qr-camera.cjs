// Failure-injection regressions use real rendered QR pixels and real decoders.
// They exercise browser lifecycle faults, not physical optics or RTC transport.
const assert = require('node:assert/strict');
const { launchBrowser } = require('./browser-launch.cjs');
(async () => {
  const browser = await launchBrowser();
  let failures = 0;
  try {
    for (const name of ['hidden-preview', 'frame-callback-stall', 'off-center', 'rapid-restart', 'late-permission', 'callback-rejection', 'decoder-rejection', 'decoder-timeout', 'video-readiness']) {
      if (process.env.CAMERA_CASE && process.env.CAMERA_CASE !== name) continue;
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      try {
        await page.goto(process.env.BASE_URL || 'http://127.0.0.1:8000/kitchen-cats/');
        const result = await page.evaluate(async name => {
          const qr = await import('./qr-pairing.js');
          const sleep = ms => new Promise(r => setTimeout(r, ms));
          const until = async condition => {
            const deadline = Date.now() + 6500;
            while (!condition() && Date.now() < deadline) await sleep(50);
          };
          const video = document.createElement('video');
          video.muted = video.playsInline = true;
          if (name === 'hidden-preview') video.hidden = true;
          document.body.append(video);
          const feed = document.createElement('canvas');
          feed.width = 1280; feed.height = 720;
          const ctx = feed.getContext('2d');
          const code = document.createElement('canvas');
          const texts = ['Kitchen Cats camera regression frame one', 'Kitchen Cats camera regression frame two'];
          let index = 0;
          const paint = () => {
            qr.drawQr(code, texts[index], 360);
            ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, feed.width, feed.height);
            // At x=30 the whole QR is visible but outside the old central crop.
            ctx.drawImage(code, name === 'off-center' ? 30 : 460, 180, 360, 360);
          };
          paint();
          const timer = setInterval(paint, 60);
          const streams = [];
          const stream = () => { const s = feed.captureStream(15); streams.push(s); return s; };
          let release;
          let requested = false;
          let constraints;
          Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { configurable: true, value: async c => {
            constraints = c; requested = true;
            if (name === 'late-permission') await new Promise(r => release = r);
            return stream();
          }});
          if (name === 'frame-callback-stall') {
            const original = video.requestVideoFrameCallback?.bind(video);
            let calls = 0;
            video.requestVideoFrameCallback = callback => ++calls === 1 && original ? original(callback) : 999;
          }
          let ready = true;
          if (name === 'video-readiness') {
            const get = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'readyState').get;
            Object.defineProperty(video, 'readyState', { get() { return ready ? get.call(video) : 1; } });
            ready = false;
          }
          const seen = [];
          let callbacks = 0;
          const scanner = new qr.QrCameraScanner(video, text => {
            seen.push(text); callbacks++;
            if (name === 'callback-rejection' && callbacks === 1) return Promise.reject(Error('injected consumer rejection'));
          });
          if (name === 'late-permission') {
            const starting = scanner.start();
            await until(() => requested);
            scanner.stop();
            release();
            await starting.catch(() => {});
            await sleep(400);
            clearInterval(timer);
            return { ended: streams.every(s => s.getTracks().every(t => t.readyState === 'ended')), detached: video.srcObject === null, hidden: video.hidden };
          }
          const start = scanner.start();
          if (name === 'video-readiness') { await sleep(400); ready = true; }
          await start;
          await until(() => seen.includes(texts[0]));
          const first = seen.includes(texts[0]);
          if (name === 'rapid-restart') {
            scanner.stop();
            await scanner.start();
            await sleep(450);
          }
          if (name === 'decoder-rejection' || name === 'decoder-timeout') {
            // Fault the live decoder after a successful real decode. Recovery
            // must obtain the next text from pixels through an independent decoder.
            qr.QrScanner.scanImage = () => name === 'decoder-rejection'
              ? Promise.reject(Error('injected decoder failure')) : new Promise(() => {});
          }
          index = 1; paint();
          await until(() => seen.includes(texts[1]));
          const second = seen.includes(texts[1]);
          const active = video.srcObject?.getVideoTracks()[0]?.readyState === 'live';
          const preview = video.getBoundingClientRect().width > 0 && getComputedStyle(video).opacity !== '0';
          scanner.stop();
          const count = seen.length;
          await sleep(300);
          clearInterval(timer);
          return { first, second, active, preview, quiet: count === seen.length, constraints,
            ended: streams.every(s => s.getTracks().every(t => t.readyState === 'ended')) };
        }, name);
        if (name === 'late-permission') assert.deepEqual(result, { ended: true, detached: true, hidden: true });
        else {
          assert(result.first && result.second && result.active && result.preview && result.quiet && result.ended, JSON.stringify(result));
          assert.equal(result.constraints.audio, false);
          assert(result.constraints.video.facingMode);
        }
        assert.deepEqual(errors, []);
        console.log(`PASS camera ${name}: ${JSON.stringify(result)}`);
      } catch (error) { failures++; console.error(`FAIL camera ${name}: ${error.message}`); }
      finally { await page.close(); }
    }
    if (!process.env.CAMERA_CASE || process.env.CAMERA_CASE === 'progress-retry') {
      const page = await browser.newPage();
      try {
        await page.goto(process.env.BASE_URL || 'http://127.0.0.1:8000/kitchen-cats/');
        await page.locator('#mp-join').click();
        await page.evaluate(async () => {
          const qr = await import('./qr-pairing.js');
          const canvas = document.createElement('canvas');
          // Only incomplete protocol fragments: test saved progress without
          // supplying fabricated signaling or claiming a transport connection.
          const paint = n => qr.drawQr(canvas, `KCQR1|o|${n}/3|12345678|${'YWJj'.repeat(60)}`, 600);
          paint(1);
          const streams = [];
          Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { value: async () => {
            const stream = canvas.captureStream(15); streams.push(stream); return stream;
          }});
          let frame = 1;
          const timer = setInterval(() => paint(frame), 100);
          window.cameraProgressTest = { streams, timer, next() { frame = 2; paint(frame); } };
        });
        await page.locator('#mp-scan').click();
        await page.waitForFunction(() => document.querySelector('#mp-scan-status').textContent.includes('1 of 3 saved'), null, { timeout: 12000 });
        assert(await page.locator('#mp-scan').isEnabled(), 'camera restart must remain usable');
        await page.locator('#mp-scan').click();
        await page.waitForFunction(() => !document.querySelector('#mp-scan').disabled);
        await page.evaluate(() => cameraProgressTest.next());
        await page.waitForFunction(() => document.querySelector('#mp-scan-status').textContent.includes('2 of 3 frames'));
        await page.locator('#mp-cancel').click();
        assert(await page.evaluate(() => {
          clearInterval(cameraProgressTest.timer);
          return cameraProgressTest.streams.every(s => s.getTracks().every(t => t.readyState === 'ended'));
        }));
        console.log('PASS camera progress-retry: duplicate frames show guidance; restart keeps collected frames; cancel ends tracks');
      } catch (error) { failures++; console.error(`FAIL camera progress-retry: ${error.message}`); }
      finally { await page.close(); }
    }
  } finally { await browser.close(); }
  assert.equal(failures, 0, `${failures} camera regressions failed`);
})().catch(e => { console.error(e); process.exitCode = 1; });
