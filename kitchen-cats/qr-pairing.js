import QrScanner from "./vendor/qr-scanner.min.js";

export const QR_PREFIX = "KCQR1";
export const QR_MAX_FRAMES = 120;
// Keep a generous quiet-zone/module-size margin on the phone-sized canvas.
// The previous 320-character frames were technically valid but too dense for
// some browser decoders at the rendered 280px size.
export const QR_FRAME_CHARS = 240;
export const QR_MAX_RAW_CHARS = 20000;

const SAFE_TOKEN = /^[A-Za-z0-9._:~-]{1,80}$/;
const BASE64URL = /^[A-Za-z0-9_-]+$/;
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let i = 0; i < 8; i++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

const typeForRole = (role) => (role === "o" ? "offer" : role === "a" ? "answer" : null);

function crc32(value) {
  let crc = 0xffffffff;
  for (let i = 0; i < value.length; i++)
    crc = CRC_TABLE[(crc ^ value.charCodeAt(i)) & 0xff] ^ (crc >>> 8);
  return ((crc ^ 0xffffffff) >>> 0).toString(16).padStart(8, "0");
}

function base64UrlEncode(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const encoded =
    typeof btoa === "function"
      ? btoa(binary)
      : Buffer.from(bytes).toString("base64");
  return encoded.replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function base64UrlDecode(value) {
  if (typeof value !== "string" || !BASE64URL.test(value))
    throw Error("Invalid QR payload.");
  const padded = value.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - (value.length % 4)) % 4);
  let binary;
  if (typeof atob === "function") binary = atob(padded);
  else binary = Buffer.from(padded, "base64").toString("binary");
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function validateSignal(raw, expectedType) {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > QR_MAX_RAW_CHARS)
    throw Error("Pairing data is too large for QR. Use Advanced text.");
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    throw Error("This is not a Kitchen Cats pairing code.");
  }
  const sdp = value?.description?.sdp;
  if (
    value?.version !== 1 ||
    !SAFE_TOKEN.test(value.peerId || "") ||
    !SAFE_TOKEN.test(value.sessionId || "") ||
    value.description?.type !== expectedType ||
    typeof sdp !== "string" ||
    sdp.length === 0 ||
    sdp.length > QR_MAX_RAW_CHARS ||
    !sdp.includes("a=candidate:")
  )
    throw Error("This is not a current Kitchen Cats pairing code.");
  return {
    version: 1,
    peerId: value.peerId,
    sessionId: value.sessionId,
    description: { type: expectedType, sdp },
  };
}

function compactPayload(signal) {
  return base64UrlEncode(
    JSON.stringify({
      v: 1,
      p: signal.peerId,
      s: signal.sessionId,
      t: signal.description.type,
      d: signal.description.sdp,
    }),
  );
}

function expandPayload(body, role) {
  let value;
  try {
    value = JSON.parse(base64UrlDecode(body));
  } catch {
    throw Error("QR payload is damaged. Scan all frames again.");
  }
  const expectedType = typeForRole(role);
  if (
    value?.v !== 1 ||
    !expectedType ||
    value.t !== expectedType ||
    !SAFE_TOKEN.test(value.p || "") ||
    !SAFE_TOKEN.test(value.s || "") ||
    typeof value.d !== "string" ||
    value.d.length === 0 ||
    value.d.length > QR_MAX_RAW_CHARS ||
    !value.d.includes("a=candidate:")
  )
    throw Error("This QR code is not a current Kitchen Cats pairing code.");
  return JSON.stringify({
    version: 1,
    peerId: value.p,
    sessionId: value.s,
    description: { type: expectedType, sdp: value.d },
  });
}

export function createQrFrames(raw, role) {
  const expectedType = typeForRole(role);
  const signal = validateSignal(raw, expectedType);
  const body = compactPayload(signal);
  const total = Math.ceil(body.length / QR_FRAME_CHARS);
  if (total < 1 || total > QR_MAX_FRAMES)
    throw Error("Pairing data is too large for QR. Use Advanced text.");
  const checksum = crc32(body);
  return Array.from({ length: total }, (_, index) => {
    const chunk = body.slice(index * QR_FRAME_CHARS, (index + 1) * QR_FRAME_CHARS);
    return `${QR_PREFIX}|${role}|${index + 1}/${total}|${checksum}|${chunk}`;
  });
}

export function parseQrFrame(text) {
  if (typeof text !== "string" || text.length > 1200)
    throw Error("That QR code is too large for Kitchen Cats.");
  const parts = text.trim().split("|");
  if (parts.length !== 5 || parts[0] !== QR_PREFIX)
    throw Error("That is not a Kitchen Cats pairing code.");
  const role = parts[1];
  const match = /^(\d+)\/(\d+)$/.exec(parts[2]);
  const checksum = parts[3];
  const chunk = parts[4];
  if (
    !typeForRole(role) ||
    !match ||
    !/^[0-9a-f]{8}$/.test(checksum) ||
    !BASE64URL.test(chunk) ||
    chunk.length > QR_FRAME_CHARS
  )
    throw Error("That QR code is incomplete or damaged.");
  const index = Number(match[1]);
  const total = Number(match[2]);
  if (
    !Number.isSafeInteger(index) ||
    !Number.isSafeInteger(total) ||
    total < 1 ||
    total > QR_MAX_FRAMES ||
    index < 1 ||
    index > total
  )
    throw Error("That QR frame number is invalid.");
  return { role, index, total, checksum, chunk };
}

export class QrFrameAssembler {
  constructor(role) {
    if (!typeForRole(role)) throw Error("Invalid QR pairing role.");
    this.role = role;
    this.reset();
  }
  reset() {
    this.total = null;
    this.checksum = null;
    this.frames = new Map();
    this.complete = false;
  }
  add(text) {
    const frame = parseQrFrame(text);
    if (frame.role !== this.role)
      throw Error(this.role === "o" ? "Scan the host code here." : "Scan the guest reply here.");
    if (this.complete) return { duplicate: true, received: this.total, total: this.total };
    if (this.total === null) {
      this.total = frame.total;
      this.checksum = frame.checksum;
    }
    if (frame.total !== this.total || frame.checksum !== this.checksum)
      throw Error("This QR belongs to a different pairing. Start again.");
    const previous = this.frames.get(frame.index);
    if (previous !== undefined) {
      if (previous !== frame.chunk) throw Error("A QR frame changed. Start scanning again.");
      return { duplicate: true, received: this.frames.size, total: this.total };
    }
    this.frames.set(frame.index, frame.chunk);
    const result = { duplicate: false, received: this.frames.size, total: this.total };
    if (this.frames.size !== this.total) return result;
    const body = Array.from({ length: this.total }, (_, i) => this.frames.get(i + 1)).join("");
    if (crc32(body) !== this.checksum) {
      this.reset();
      throw Error("QR checksum failed. Start scanning again.");
    }
    result.raw = expandPayload(body, this.role);
    result.complete = true;
    this.complete = true;
    return result;
  }
}

export function drawQr(canvas, text, size = 320) {
  if (!canvas || typeof globalThis.qrcode !== "function")
    throw Error("QR display is unavailable. Use Advanced text.");
  const qr = globalThis.qrcode(0, "M");
  qr.addData(text);
  qr.make();
  const modules = qr.getModuleCount();
  const quiet = 4;
  const cells = modules + quiet * 2;
  const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
  canvas.width = Math.round(size * dpr);
  canvas.height = Math.round(size * dpr);
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Render on the physical pixel grid. This avoids fractional transformed
  // edges on devices whose DPR is not an integer, while leaving extra quiet
  // zone when the QR does not divide evenly into the square canvas.
  const cell = Math.max(1, Math.floor(Math.min(canvas.width, canvas.height) / cells));
  const offsetX = Math.floor((canvas.width - modules * cell) / 2);
  const offsetY = Math.floor((canvas.height - modules * cell) / 2);
  ctx.fillStyle = "#111";
  for (let row = 0; row < modules; row++) {
    for (let col = 0; col < modules; col++) {
      if (qr.isDark(row, col))
        ctx.fillRect(offsetX + col * cell, offsetY + row * cell, cell, cell);
    }
  }
  canvas.setAttribute("aria-label", `Kitchen Cats pairing code, ${text.startsWith(`${QR_PREFIX}|o|`) ? "host offer" : "guest reply"}`);
  return { modules, size };
}

export class QrCameraScanner {
  constructor(video, onFrame) {
    this.video = video;
    this.onFrame = onFrame;
    this.scanner = null;
  }
  async start() {
    // A pre-attached stream is also useful for browser regression coverage:
    // qr-scanner still decodes its video frames, while production starts with
    // no stream and lets qr-scanner request the rear camera. If a scanner is
    // already active, stop it before replacing the camera session.
    if (this.scanner) this.stop();
    this.scanner = new QrScanner(
      this.video,
      (result) => this.onFrame(typeof result === "string" ? result : result.data),
      {
        preferredCamera: "environment",
        maxScansPerSecond: 12,
        returnDetailedScanResult: true,
      },
    );
    try {
      await this.scanner.start();
      this.video.hidden = false;
    } catch (error) {
      this.stop();
      throw error;
    }
  }
  stop() {
    this.scanner?.stop();
    this.scanner?.destroy();
    this.scanner = null;
    const stream = this.video?.srcObject;
    stream?.getTracks?.().forEach((track) => track.stop());
    if (this.video) {
      this.video.srcObject = null;
      this.video.hidden = true;
    }
  }
  async scanImage(file) {
    if (!file) throw Error("Choose a QR image first.");
    // jsQR is used for imported images because it consumes the decoded pixel
    // buffer directly and behaves consistently in Chromium, WebKit, and
    // Safari-like image paths. The live camera keeps qr-scanner's tested
    // worker/permission lifecycle below.
    if (typeof globalThis.jsQR === "function") {
      const url = URL.createObjectURL(file);
      try {
        const image = new Image();
        await new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = () => reject(Error("The QR image could not be read."));
          image.src = url;
        });
        if (!image.naturalWidth || !image.naturalHeight)
          throw Error("The QR image could not be read.");
        const pixels = image.naturalWidth * image.naturalHeight;
        if (pixels > 16_000_000)
          throw Error("That QR image is too large.");
        const maxSide = 1200;
        const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext("2d", { willReadFrequently: true });
        context.imageSmoothingEnabled = false;
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const result = globalThis.jsQR(
          context.getImageData(0, 0, canvas.width, canvas.height).data,
          canvas.width,
          canvas.height,
          { inversionAttempts: "attemptBoth" },
        );
        if (!result?.data) throw Error("No QR code found.");
        return result.data;
      } finally {
        URL.revokeObjectURL(url);
      }
    }
    const result = await QrScanner.scanImage(file, {
      returnDetailedScanResult: true,
      alsoTryWithoutScanRegion: true,
    });
    return typeof result === "string" ? result : result.data;
  }
}

export { QrScanner };
