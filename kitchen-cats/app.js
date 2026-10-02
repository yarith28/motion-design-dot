import { KitchenGame } from "./game-core.js";
import { MultiplayerSession } from "./multiplayer-session.js";
import { WebRTCTransport } from "./webrtc-transport.js";
import {
  createQrFrames,
  QrFrameAssembler,
  drawQr,
  QrCameraScanner,
} from "./qr-pairing.js";
import { createPresentationState, resetPresentation, updatePhasePresentation, updatePlayerVisual, updateServeEffect, prepPose, potEffect, burstOffset } from "./presentation-animation.js";
const offlineGame = new KitchenGame();
let runtimeMode = "solo"; // solo | host | guest
let multiplayer = null;
const $ = (id) => document.getElementById(id);
const on = (id, event, fn) => $(id)?.addEventListener(event, fn);

const CHEFS = [
  {
    key: "cream",
    name: "Cream whisker",
    tag: "Wooden spoon",
    src: "./assets/cat-cream.png",
    accent: "#f2b394",
  },
  {
    key: "tabby",
    name: "Sunny tabby",
    tag: "Herb toss",
    src: "./assets/cat-tabby.png",
    accent: "#f0b062",
  },
  {
    key: "gray",
    name: "Pepper chef",
    tag: "Pancake pro",
    src: "./assets/cat-gray.png",
    accent: "#b7c5b9",
  },
  {
    key: "tuxedo",
    name: "Mint tux",
    tag: "Spatula star",
    src: "./assets/cat-tuxedo.png",
    accent: "#98c1b2",
  },
];

const colors = ["#e8aa69", "#a1b9a5", "#c8afd7", "#e7ca69"];
const creamAtlas = new Image();
creamAtlas.decoding = "async";
creamAtlas.src = "./assets/cream-chef-pose-atlas.png";
// Atlas cell metrics are intentionally fixed after inspection. The sprite uses
// one common scale/baseline across frames, never per-frame rescaling.
const CREAM_ATLAS_CELLS = { cols: 4, rows: 4, visibleW: 313, visibleH: 313, height: 102 };

const chefImages = CHEFS.map((chef) => {
  const image = new Image();
  image.decoding = "async";
  image.src = chef.src;
  return image;
});

let state,
  me = "solo";
const keys = new Set();
let touchPointers = new Map();
let joystickPointer = null;
let storageUnavailable = false;
let storageNoticeShown = false;
const readPreference = (key, fallback = "") => {
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    storageUnavailable = true;
    return fallback;
  }
};
const writePreference = (key, value) => {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    storageUnavailable = true;
    return false;
  }
};
const storedAvatar = Number(readPreference("kitchen-avatar", "0"));
let muted = readPreference("kitchen-muted") === "1";
let reducedMotion = readPreference("kitchen-reduced-motion") === "1";
let selectedAvatar = Number.isInteger(storedAvatar)
  ? Math.max(0, Math.min(CHEFS.length - 1, storedAvatar))
  : 0;
let lastPhase;
let lastServed = 0;

let lastActionTouch = 0;
let soloTickLoop = null;
let inputLoop = null;
let animationFrame = 0;
let renderActive = false;
let clearAnalogStick = () => {};
// Presentation-only animation clock. Gameplay/session clocks remain untouched.
const presentation = createPresentationState();
let audioContext;

const makeId = (prefix) => {
  if (typeof globalThis.crypto?.randomUUID === "function")
    return globalThis.crypto.randomUUID();
  const random = Math.random().toString(36).slice(2);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
};

function clearPresentationMotion(){ resetPresentation(presentation, state || {}); lastServed = state?.served || 0; }

function send(v) {
  if (runtimeMode === "solo") {
    if (v.type === "move") offlineGame.move(v.x, v.y);
    if (v.type === "interact") offlineGame.interact(v.station);
    if (v.type === "start") { clearPresentationMotion(); offlineGame.start(v.name || "Chef", v.avatar || 0); }
    if (v.type === "stop") offlineGame.stop();
    if (v.type === "replay") { clearPresentationMotion(); offlineGame.replay(); }
    return;
  }
  if (!multiplayer) return;
  if (runtimeMode === "guest") {
    if (v.type === "move") multiplayer.sendInput(v.x, v.y);
    if (v.type === "interact") multiplayer.sendInteract(v.station);
    return;
  }
  if (runtimeMode === "host") {
    if (v.type === "move") multiplayer.sendInput(v.x, v.y);
    if (v.type === "interact") multiplayer.sendInteract(v.station);
    if (v.type === "start") multiplayer.start();
    if (v.type === "replay") multiplayer.replay();
  }
}

function updateSoloTickLoop() {
  const shouldTick = runtimeMode === "solo" && state?.phase === "playing";
  if (shouldTick && !soloTickLoop) {
    soloTickLoop = setInterval(() => offlineGame.tick(), 50);
  } else if (!shouldTick && soloTickLoop) {
    clearInterval(soloTickLoop);
    soloTickLoop = null;
  }
}

function sendCurrentInput() {
  if (state?.phase !== "playing") return;
  const d = currentTouchDirection();
  send({
    type: "move",
    x:
      d.x +
      Number(keys.has("d") || keys.has("arrowright")) -
      Number(keys.has("a") || keys.has("arrowleft")),
    y:
      d.y +
      Number(keys.has("s") || keys.has("arrowdown")) -
      Number(keys.has("w") || keys.has("arrowup")),
  });
}

function updateInputLoop() {
  const shouldSend = state?.phase === "playing";
  if (shouldSend && !inputLoop) {
    inputLoop = setInterval(sendCurrentInput, 60);
  } else if (!shouldSend && inputLoop) {
    clearInterval(inputLoop);
    inputLoop = null;
  }
}

function toast(message) {
  $("toast").textContent = message;
  $("toast").style.display = "block";
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => ($("toast").style.display = "none"), 3500);
}

creamAtlas.addEventListener("error", () => {
  if (state?.phase === "playing")
    toast("Cream's pose atlas failed to load; showing a fallback chef.");
});
for (const image of chefImages)
  image.addEventListener("error", () => {
    if (state?.phase === "playing") toast("A chef portrait failed to load.");
  });

function persistPrefs() {
  const saved = [
    writePreference("kitchen-avatar", String(selectedAvatar)),
    writePreference("kitchen-muted", muted ? "1" : "0"),
    writePreference("kitchen-reduced-motion", reducedMotion ? "1" : "0"),
  ].every(Boolean);
  if (!saved && !storageNoticeShown) {
    storageNoticeShown = true;
    toast("Preferences could not be saved; this shift still works normally.");
  }
}

function updateToggles() {
  $("mute").textContent = muted ? "🔇 Sound" : "🔊 Sound";
  $("motion").textContent = reducedMotion ? "✦ Reduced" : "✨ Motion";
}

function getChef(index) {
  return CHEFS[
    (((Number(index) || 0) % CHEFS.length) + CHEFS.length) % CHEFS.length
  ];
}

function renderAvatarPicker() {
  const picker = $("avatar-picker");
  if (!picker) return;
  $("chosen-chef-name").textContent = getChef(selectedAvatar).name;
  picker.replaceChildren(
    ...CHEFS.map((chef, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className =
        "avatar-option" + (index === selectedAvatar ? " selected" : "");
      button.setAttribute("role", "radio");
      button.setAttribute("aria-checked", String(index === selectedAvatar));
      button.dataset.avatar = String(index);

      const image = document.createElement("img");
      image.src = chef.src;
      image.alt = "";

      const title = document.createElement("strong");
      title.textContent = chef.name;

      const tag = document.createElement("span");
      tag.textContent = chef.tag;

      button.append(image, title, tag);
      return button;
    }),
  );
}

function connect() {
  offlineGame.on((s) => {
    if (runtimeMode === "solo") {
      state = s;
      me = "solo";
      renderUI();
    }
  });
  $("connection").textContent = "● Offline";
  state = offlineGame.snapshot();
  updateSoloTickLoop();
  updateInputLoop();
  // solo runtime: no lobby/network controls
}

connect();
updateToggles();
const mpTransport = new WebRTCTransport();
const mpSession = new MultiplayerSession({ transport: mpTransport });
multiplayer = mpSession;
const mpStatus = $("mp-status");
const mpFlow = $("mp-flow");
const mpActions = $("mp-actions");
const mpStep = $("mp-step");
const mpInstruction = $("mp-instruction");
const mpQrView = $("mp-qr-view");
const mpQr = $("mp-qr");
const mpQrProgress = $("mp-qr-progress");
const mpCamera = $("mp-camera");
const mpVideo = $("mp-video");
const mpScanStatus = $("mp-scan-status");
const mpScanButton = $("mp-scan");
const mpImagePick = $("mp-image-pick");
const mpImage = $("mp-image");
let mpPending = false,
  pairingGeneration = 0,
  qrFrames = [],
  qrFrameTimer = null,
  qrAssembler = null,
  qrScanRole = null,
  qrScanBusy = false,
  qrPendingDecode = false,
  qrLastError = "";
const qrCamera = new QrCameraScanner(mpVideo, (text) => handleQrText(text));
const profile = () => ({
  name: $("name").value || "Chef",
  avatar: chosenAvatar(),
});
function pairingBusy(busy) {
  mpPending = busy;
  for (const id of ["mp-host", "mp-join", "mp-import", "start"])
    $(id).disabled = busy;
}
function stopQrAnimation() {
  clearInterval(qrFrameTimer);
  qrFrameTimer = null;
  qrFrames = [];
}
function stopQrCamera() {
  qrScanBusy = false;
  qrCamera.stop();
  mpCamera.hidden = true;
  mpScanButton.disabled = false;
  mpScanButton.textContent = "Scan with camera";
}
function stopPairingMedia() {
  stopQrAnimation();
  stopQrCamera();
  qrAssembler = null;
  qrScanRole = null;
}
function resetPairingUi(message = "Idle") {
  stopPairingMedia();
  mpActions.hidden = false;
  mpFlow.hidden = true;
  mpQrView.hidden = true;
  mpScanButton.hidden = false;
  mpImagePick.hidden = false;
  mpQrProgress.textContent = "";
  mpInstruction.textContent = "";
  mpStatus.textContent = message;
}
function setPairingStep(step, instruction) {
  mpActions.hidden = true;
  mpFlow.hidden = false;
  mpStep.textContent = step;
  mpInstruction.textContent = instruction;
}
function showQrFrames(frames, instruction) {
  stopQrCamera();
  qrFrames = frames;
  mpQrView.hidden = false;
  mpInstruction.textContent = instruction;
  let index = 0;
  const render = () => {
    try {
      drawQr(mpQr, qrFrames[index]);
      mpQrProgress.textContent =
        qrFrames.length === 1
          ? "One code · keep it visible"
          : `Animated code · frame ${index + 1} of ${qrFrames.length}`;
    } catch (e) {
      mpStatus.textContent = e.message;
      stopQrAnimation();
      return;
    }
    index = (index + 1) % qrFrames.length;
  };
  render();
  if (qrFrames.length > 1) qrFrameTimer = setInterval(render, 850);
}
function prepareQrScan(role, instruction) {
  stopQrCamera();
  qrScanRole = role;
  qrAssembler = new QrFrameAssembler(role);
  qrLastError = "";
  mpQrView.hidden = true;
  mpCamera.hidden = true;
  mpScanButton.hidden = false;
  mpImagePick.hidden = false;
  mpScanStatus.textContent = "Point the rear camera at the QR code.";
  mpScanButton.textContent = "Scan with camera";
  mpInstruction.textContent = instruction;
}
function showPairingError(prefix, error) {
  stopQrCamera();
  qrAssembler?.reset();
  const message = error?.message || String(error);
  mpStatus.textContent = `${prefix}: ${message} Try again or open Advanced.`;
  mpScanStatus.textContent = "Camera stopped. You can retry, choose an image, or use Advanced.";
}
function cameraErrorMessage(error) {
  if (error?.name === "NotAllowedError" || /permission|denied/i.test(String(error?.message || error)))
    return "Camera permission was denied.";
  if (error?.name === "NotFoundError" || /camera.*(found|available)|not found/i.test(String(error?.message || error)))
    return "No camera is available.";
  return "Camera could not start.";
}
async function startQrCamera() {
  if (!qrAssembler || !qrScanRole || qrScanBusy) return;
  stopQrAnimation();
  qrScanBusy = true;
  mpCamera.hidden = false;
  mpScanButton.disabled = true;
  mpScanButton.textContent = "Camera scanning…";
  mpScanStatus.textContent = "Point the rear camera at the QR code.";
  try {
    await qrCamera.start();
    if (!qrScanBusy) return;
  } catch (e) {
    stopQrCamera();
    mpStatus.textContent = `${cameraErrorMessage(e)} Choose a QR image or open Advanced.`;
    mpScanStatus.textContent = "Camera unavailable. No permission bypass was attempted.";
  }
}
function updateQrProgress(result) {
  if (!result) return;
  mpScanStatus.textContent = result.complete
    ? "Code complete. Finishing pairing…"
    : `Reading code · ${result.received} of ${result.total} frames`;
}
async function handleQrText(text) {
  if (!qrAssembler || !qrScanRole || !qrScanBusy || qrPendingDecode) return;
  qrPendingDecode = true;
  try {
    const result = qrAssembler.add(text);
    updateQrProgress(result);
    if (result.raw) {
      stopQrCamera();
      if (qrScanRole === "o") await acceptOfferText(result.raw);
      else await acceptAnswerText(result.raw);
    }
  } catch (e) {
    const message = e?.message || String(e);
    if (message !== qrLastError) {
      qrLastError = message;
      mpScanStatus.textContent = `${message} Keep scanning or try again.`;
    }
  } finally {
    qrPendingDecode = false;
  }
}
async function scanImageFile(file) {
  if (!qrAssembler || !qrScanRole || !file) return;
  const wasCameraScanning = qrScanBusy;
  try {
    const text = await qrCamera.scanImage(file);
    qrScanBusy = true;
    await handleQrText(text);
  } catch (e) {
    mpStatus.textContent = `${e?.message || "No QR code found."} Choose another image or use Advanced.`;
  } finally {
    if (!wasCameraScanning && !qrAssembler?.complete) qrScanBusy = false;
    mpImage.value = "";
  }
}
function showConnectedPairing() {
  stopPairingMedia();
  mpActions.hidden = true;
  mpFlow.hidden = true;
  mpStatus.textContent = "Connected. The host can start the shift.";
}
async function createHostOffer() {
  if (mpPending) return;
  if (runtimeMode !== "host") {
    returnToSolo();
    runtimeMode = "host";
    const p = profile();
    mpSession.startHost(makeId("session"), p.name, p.avatar);
  }
  const generation = ++pairingGeneration;
  pairingBusy(true);
  try {
    for (const [id, p] of mpTransport.peers)
      if (p.dc?.readyState !== "open") mpTransport.closePeer(id);
    if (mpSession.peers.size >= 3) throw Error("Kitchen full: four chefs maximum.");
    $("mp-offer").value = "";
    $("mp-answer").value = "";
    // Keep a visible cancel path while ICE gathering is pending. A browser
    // can fail before it produces an offer (for example with no usable local
    // candidate), and hiding the flow would strand the player on that tap.
    setPairingStep("Host · 1 of 2", "Preparing a local code…");
    mpQrView.hidden = true;
    mpCamera.hidden = true;
    mpScanButton.hidden = true;
    mpImagePick.hidden = true;
    mpStatus.textContent = "Preparing a local code…";
    const offer = await mpTransport.createOffer(makeId("peer"), mpSession.sessionId);
    if (generation !== pairingGeneration) return;
    $("mp-offer").value = offer;
    const frames = createQrFrames(offer, "o");
    setPairingStep("Host · 1 of 2", "Show this code to the guest. Then scan the guest reply.");
    prepareQrScan("a", "When the guest shows the reply, tap Scan guest reply.");
    showQrFrames(frames, "Show this code to the guest. Then tap Scan guest reply.");
    mpScanButton.textContent = "Scan guest reply";
    mpStatus.textContent = "Host code ready. Two scans are required.";
  } catch (e) {
    if (generation === pairingGeneration) {
      showPairingError("Host setup failed", e);
      // No offer exists yet, so return to the two primary actions for a clean
      // retry. During the next attempt setPairingStep keeps Cancel visible.
      mpActions.hidden = false;
      mpFlow.hidden = true;
    }
  } finally {
    if (generation === pairingGeneration) pairingBusy(false);
  }
}
async function acceptOfferText(offer) {
  if (mpPending || runtimeMode !== "guest") return;
  const generation = ++pairingGeneration;
  pairingBusy(true);
  try {
    mpStatus.textContent = "Reading host code…";
    mpTransport.close();
    $("mp-offer").value = offer;
    const answer = await mpTransport.acceptOffer(offer);
    if (generation !== pairingGeneration) return;
    $("mp-answer").value = answer;
    const frames = createQrFrames(answer, "a");
    setPairingStep("Guest · 2 of 2", "Show this reply code to the host. Keep this screen open while they scan it.");
    showQrFrames(frames, "Show this reply code to the host. Keep this screen open while they scan it.");
    mpScanButton.hidden = true;
    mpImagePick.hidden = true;
    mpStatus.textContent = "Reply ready. The host must scan this code.";
  } catch (e) {
    if (generation === pairingGeneration) showPairingError("Host code failed", e);
  } finally {
    if (generation === pairingGeneration) pairingBusy(false);
  }
}
async function acceptAnswerText(answer) {
  if (mpPending || runtimeMode !== "host") return;
  const generation = ++pairingGeneration;
  pairingBusy(true);
  try {
    $("mp-answer").value = answer;
    mpStatus.textContent = "Reading guest reply…";
    await mpTransport.acceptAnswer(answer);
    if (generation === pairingGeneration) {
      stopPairingMedia();
      mpStatus.textContent = "Reply accepted. Connecting…";
    }
  } catch (e) {
    if (generation === pairingGeneration) showPairingError("Guest reply failed", e);
  } finally {
    if (generation === pairingGeneration) pairingBusy(false);
  }
}
function returnToSolo(message = "Cancelled") {
  pairingGeneration++;
  stopPairingMedia();
  pairingBusy(false);
  stop();
  runtimeMode = "solo";
  mpSession.stop();
  offlineGame.stop();
  me = "solo";
  state = offlineGame.snapshot();
  $("mp-offer").value = "";
  $("mp-answer").value = "";
  resetPairingUi(message);
  renderUI();
}
mpSession.onSnapshot((s) => {
  if (runtimeMode !== "solo") {
    state = s;
    me = mpSession.playerId;
    renderUI();
  }
});
mpSession.onStatus((s) => {
  if (s === "disconnected") {
    returnToSolo("Host disconnected. Start solo or pair again.");
    toast("Host disconnected.");
  } else if (s === "Chef connected" || s === "connected") {
    showConnectedPairing();
  } else mpStatus.textContent = s;
});
$("mp-host").addEventListener("click", createHostOffer);
$("mp-join").addEventListener("click", () => {
  returnToSolo();
  runtimeMode = "guest";
  const p = profile();
  mpSession.join(p.name, p.avatar);
  setPairingStep("Guest · 1 of 2", "Tap Scan with camera, then point it at the host code.");
  prepareQrScan("o", "Tap Scan with camera, then point it at the host code.");
  mpStatus.textContent = "Ready to scan the host code.";
});
$("mp-import").addEventListener("click", async () => {
  if (mpPending) return;
  if (runtimeMode === "solo") {
    mpStatus.textContent = "Choose Host game or Join game first.";
    return;
  }
  if (runtimeMode === "guest") await acceptOfferText($("mp-offer").value);
  else await acceptAnswerText($("mp-answer").value);
});
$("mp-cancel").addEventListener("click", () => returnToSolo());
mpScanButton.addEventListener("click", () => {
  if (qrScanBusy) stopQrCamera();
  else startQrCamera();
});
$("mp-stop-scan").addEventListener("click", () => stopQrCamera());
mpImagePick.addEventListener("click", () => mpImage.click());
mpImage.addEventListener("change", () => scanImageFile(mpImage.files?.[0]));
$("mp-copy").addEventListener("click", async () => {
  const el = $(runtimeMode === "guest" ? "mp-answer" : "mp-offer");
  if (!el.value) {
    mpStatus.textContent = "Generate pairing text first.";
    return;
  }
  try {
    await navigator.clipboard.writeText(el.value);
    mpStatus.textContent = "Pairing text copied. The other phone still needs to use it.";
  } catch {
    el.focus();
    el.select();
    mpStatus.textContent = "Select and copy the pairing text manually, then use it under Advanced.";
  }
});

renderAvatarPicker();

function chosenAvatar() {
  return selectedAvatar;
}

$("avatar-picker")?.addEventListener("click", (event) => {
  const option = event.target.closest(".avatar-option");
  if (!option) return;
  selectedAvatar = Number(option.dataset.avatar) || 0;
  persistPrefs();
  renderAvatarPicker();
});

$("mute") &&
  ($("mute").onclick = () => {
    muted = !muted;
    persistPrefs();
    updateToggles();
  });

$("motion") &&
  ($("motion").onclick = () => {
    reducedMotion = !reducedMotion;
    persistPrefs();
    updateToggles();
  });

$("solo")?.addEventListener("click", () => {
  returnToSolo();
  runtimeMode = "solo";
  send({
    type: "start",
    solo: true,
    name: $("name")?.value,
    avatar: chosenAvatar(),
  });
});
$("start")?.addEventListener("click", () => send({ type: "start" }));
$("replay")?.addEventListener("click", () => send({ type: "replay" }));

$("leave").addEventListener("click", () => { clearPresentationMotion(); returnToSolo("Kitchen closed."); });

function nearest() {
  const player = state?.players?.find((entry) => entry.id === me);
  if (!player) return null;
  return (state.stations || [])
    .map((station) => ({
      ...station,
      d: Math.hypot(station.x - player.x, station.y - player.y),
    }))
    .sort((a, b) => a.d - b.d)[0];
}

function interact() {
  const station = nearest();
  if (station && station.d <= 110)
    send({ type: "interact", station: station.id });
  else toast("Walk closer to a station, then interact.");
}

$("action").addEventListener("pointerdown", (event) => {
  unlockAudio();
  if (event.pointerType === "mouse") return;
  event.preventDefault();
  lastActionTouch = Date.now();
  interact();
});

$("action").addEventListener("click", () => {
  unlockAudio();
  if (Date.now() - lastActionTouch < 400) return;
  interact();
});

window.addEventListener("keydown", (event) => {
  unlockAudio();
  if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
  if (
    [
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      " ",
      "w",
      "a",
      "s",
      "d",
      "e",
      "E",
    ].includes(event.key)
  ) {
    if (state?.phase === "playing") event.preventDefault();
    keys.add(event.key.toLowerCase());
    if (["e", "E", " "].includes(event.key) && !event.repeat) interact();
  }
});

window.addEventListener("keyup", (event) =>
  keys.delete(event.key.toLowerCase()),
);

function currentTouchDirection() {
  let x = 0,
    y = 0;
  for (const direction of touchPointers.values()) {
    x += direction.x;
    y += direction.y;
  }
  return { x, y };
}

function setupAnalogStick() {
  const base = $("joystick"),
    knob = $("stick-knob");
  if (!base) return;
  const clear = () => {
    if (joystickPointer !== null) {
      try {
        base.releasePointerCapture(joystickPointer);
      } catch {}
    }
    joystickPointer = null;
    knob.style.transform = "translate(0,0)";
    touchPointers.delete("stick");
  };
  clearAnalogStick = clear;
  const update = (e) => {
    const r = base.getBoundingClientRect();
    let x = e.clientX - (r.left + r.width / 2),
      y = e.clientY - (r.top + r.height / 2);
    const max = r.width * 0.38;
    const len = Math.hypot(x, y);
    if (len > max) {
      x = (x / len) * max;
      y = (y / len) * max;
    }
    const dead = 8;
    if (Math.hypot(x, y) < dead) {
      x = 0;
      y = 0;
    } else {
      x /= max;
      y /= max;
    }
    touchPointers.set("stick", { x, y });
    knob.style.transform = `translate(${x * max}px,${y * max}px)`;
  };
  base.onpointerdown = (e) => {
    e.preventDefault();
    if (joystickPointer !== null) return;
    joystickPointer = e.pointerId;
    base.setPointerCapture(e.pointerId);
    update(e);
  };
  base.onpointermove = (e) => {
    if (e.pointerId === joystickPointer) update(e);
  };
  ["pointerup", "pointercancel", "lostpointercapture"].forEach((n) =>
    base.addEventListener(n, (e) => {
      if (e.pointerId === joystickPointer) clear();
    }),
  );
}
setupAnalogStick();

function stop() {
  keys.clear();
  touchPointers.clear();
  clearAnalogStick();
  send({ type: "move", x: 0, y: 0 });
}
window.addEventListener("blur", stop);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopQrCamera();
    stop();
    if (runtimeMode === "host" && state?.phase === "playing")
      returnToSolo("Host went into the background. Pair again to play.");
  } else {
    syncRenderLoop();
  }
});
window.addEventListener("orientationchange", () => {
  stopQrCamera();
  stop();
  toast("Controls paused while the screen rotates.");
});
window.addEventListener("pagehide", () => {
  stopPairingMedia();
  stop();
  mpSession?.stop();
});

const pretty = (held) => (held ? held.replaceAll("-", " ") : "Empty paws");

function recipeName(recipe) {
  return recipe === "tomato" ? "Tomato soup" : "Carrot soup";
}

function resultsCopy(score, served) {
  if (served >= 5 || score >= 500) {
    return {
      title: "Service superstar.",
      note: "The whole kitchen was humming. That was a lovely little rush.",
    };
  }
  if (served >= 2 || score >= 200) {
    return {
      title: "Pawsitively delicious.",
      note: "Strong teamwork. A few more orders and this place gets a line out the door.",
    };
  }
  return {
    title: "A cozy shift complete.",
    note: "Every good kitchen warms up one round at a time. Reset and go again.",
  };
}

function renderCrew() {
  $("crew").replaceChildren(
    ...(Array.isArray(state?.players) ? state.players : []).map((player) => {
      const card = document.createElement("div");
      card.className = "crewcat";
      if (player.id === me) card.classList.add("self");
      if (!player.connected) card.classList.add("disconnected");

      const image = document.createElement("img");
      image.src = getChef(player.avatar).src;
      image.alt = "";

      const badge = document.createElement("span");
      badge.className = "host-badge";
      badge.textContent = player.id === state.host ? "HOST" : "CHEF";

      const name = document.createElement("strong");
      name.textContent = `${player.name}${player.id === me ? " (you)" : ""}`;

      const status = document.createElement("small");
      status.textContent = player.connected
        ? `${getChef(player.avatar).name} · ready`
        : `${getChef(player.avatar).name} · reconnecting`;

      card.append(image, badge, name, status);
      return card;
    }),
  );
}

function renderOrders() {
  $("orders").replaceChildren(
    ...(Array.isArray(state?.orders) ? state.orders : []).map((order) => {
      const item = document.createElement("div");
      item.className = "order";

      const info = document.createElement("div");
      info.className = "order-info";

      const name = document.createElement("strong");
      name.textContent = recipeName(order.recipe);

      const recipe = document.createElement("div");
      recipe.className = "order-recipe";
      recipe.textContent =
        order.recipe === "tomato" ? "Tomato base" : "Carrot base";

      const steps = document.createElement("small");
      steps.textContent = "Pick vegetable → chop → pot → serve";

      info.append(name, recipe, steps);

      const timer = document.createElement("b");
      timer.textContent =
        Math.max(0, Math.ceil((order.expires - state.now) / 1000)) + "s";

      item.append(info, timer);
      return item;
    }),
  );
}

function renderUI() {
  if (!state) return;
  document.body.classList.toggle("game-active", state?.phase === "playing");
  const idle = !state || state.phase === "idle";
  $("welcome").hidden = !idle;
  $("game").hidden = idle;
  $("room").textContent = runtimeMode === "solo" ? "SOLO" : "LOCAL KITCHEN";
  $("roomcode-large") && ($("roomcode-large").textContent = "SOLO");
  $("mode").textContent =
    runtimeMode === "solo"
      ? "SOLO PRACTICE · 1 CHEF"
      : runtimeMode.toUpperCase();

  $("lobby").hidden = state.phase !== "lobby";
  const paired =
    (runtimeMode === "host" && mpSession.peers.size > 0) ||
    (runtimeMode === "guest" && !!mpSession.serverPeer);
  $("experimental-mp").hidden = !idle && (state.phase !== "lobby" || paired);
  $("mp-join").hidden = runtimeMode === "host";
  $("mp-host").textContent =
    runtimeMode === "host" ? "Offer for another chef" : "Host game";
  $("play").hidden = state.phase !== "playing";
  $("results").hidden = state.phase !== "results";

  const remain = Math.max(0, Math.ceil((state.ends - state.now) / 1000));
  $("clock").textContent =
    state.phase === "lobby"
      ? "1:30"
      : `${Math.floor(remain / 60)}:${String(remain % 60).padStart(2, "0")}`;
  $("score").textContent = state.score;

  renderCrew();
  renderOrders();

  $("start").hidden = runtimeMode !== "host";
  $("start").disabled = mpPending;
  $("hosthint").textContent =
    runtimeMode === "guest"
      ? "Waiting for the host to start."
      : "Pair friends, then start a 90-second shift.";

  $("replay").disabled = state.phase !== "results" || runtimeMode === "guest";
  $("replay").textContent =
    runtimeMode === "guest" ? "Waiting for host to replay…" : "Another shift →";
  $("totals").textContent =
    `${state.score} points · ${state.served} served · ${state.missed} missed`;

  const resultText = resultsCopy(state.score, state.served);
  $("results-title").textContent = resultText.title;
  $("results-note").textContent = resultText.note;

  const myState = state.players.find((player) => player.id === me);
  $("holding").textContent = `PAWS · ${pretty(myState?.held)}`;

  const near = nearest();
  $("action").textContent =
    near?.d <= 110 ? `E · ${near.label}` : "E · Interact";
  $("action").setAttribute(
    "aria-label",
    near?.d <= 110 ? `Interact with ${near.label}` : "Interact with nearest station",
  );
  $("notice").textContent = state.notice || "";

  if (lastPhase !== state.phase) { updatePhasePresentation(presentation, state); }

  if (lastPhase !== state.phase && state.phase === "playing") {
    window.scrollTo(0, 0);
    $("kitchen").focus({ preventScroll: true });
    $("game").scrollIntoView({
      behavior: "instant",
      block: "start",
    });
  }

  if (state.served > lastServed && !muted) beep();
  lastServed = state.served;
  lastPhase = state.phase;
  updateSoloTickLoop();
  updateInputLoop();
  syncRenderLoop();
}

function unlockAudio() {
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    audioContext ??= new Audio();
    if (audioContext.state === "suspended") audioContext.resume();
  } catch {}
}

function beep() {
  try {
    const audio = audioContext;
    if (!audio || audio.state !== "running") return;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.frequency.setValueAtTime(660, audio.currentTime);
    oscillator.frequency.setValueAtTime(880, audio.currentTime + 0.1);
    gain.gain.setValueAtTime(0.05, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.3);
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.3);
  } catch {}
}

function rounded(ctx, x, y, width, height, radius, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();
}

function text(
  ctx,
  value,
  x,
  y,
  size = 14,
  color = "#304b3d",
  align = "center",
) {
  ctx.fillStyle = color;
  ctx.font = `700 ${size}px Arial`;
  ctx.textAlign = align;
  ctx.fillText(value, x, y);
}

function fallbackCat(ctx, x, y, color, scale = 1, hat = true) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#263f3420";
  ctx.beginPath();
  ctx.ellipse(0, 29, 27, 9, 0, 0, 7);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(20, 15);
  ctx.quadraticCurveTo(45, 18, 33, -2);
  ctx.stroke();
  rounded(ctx, -21, -5, 42, 38, 15, color);
  rounded(ctx, -16, 8, 32, 22, 8, "#faf2dd");
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-25, -12);
  ctx.lineTo(-25, -45);
  ctx.lineTo(-8, -31);
  ctx.lineTo(10, -31);
  ctx.lineTo(26, -45);
  ctx.lineTo(26, -9);
  ctx.arc(0, -13, 26, 0, Math.PI);
  ctx.fill();
  rounded(ctx, -26, -30, 52, 39, 16, color);
  ctx.fillStyle = "#624a3c";
  for (const dx of [-10, 10]) {
    ctx.beginPath();
    ctx.ellipse(dx, -13, 2.4, 3.2, 0, 0, 7);
    ctx.fill();
  }
  text(ctx, "ω", 0, 0, 15, "#624a3c");
  ctx.strokeStyle = "#624a3c";
  ctx.lineWidth = 1.5;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * 16, -7);
    ctx.lineTo(side * 33, -10);
    ctx.moveTo(side * 16, -2);
    ctx.lineTo(side * 31, 0);
    ctx.stroke();
  }
  if (hat) {
    rounded(ctx, -18, -47, 36, 17, 5, "#fffdf4");
    for (const dx of [-12, 0, 12]) {
      ctx.fillStyle = "#fffdf4";
      ctx.beginPath();
      ctx.arc(dx, -49, 10, 0, 7);
      ctx.fill();
    }
  }
  ctx.restore();
}

function vegetable(ctx, item, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  if (item?.startsWith("soup")) {
    rounded(ctx, -18, -7, 36, 20, 8, "#fffcf0");
    ctx.fillStyle = item.includes("tomato") ? "#d86c42" : "#edae4b";
    ctx.beginPath();
    ctx.ellipse(0, -6, 17, 7, 0, 0, 7);
    ctx.fill();
    text(ctx, "~", 0, -15, 18, "#95a08d");
  } else if (item?.includes("carrot")) {
    ctx.fillStyle = "#eb9b43";
    ctx.beginPath();
    ctx.moveTo(-9, -11);
    ctx.lineTo(12, -8);
    ctx.lineTo(-6, 17);
    ctx.fill();
    text(ctx, "✦", 4, -12, 20, "#5c8b54");
  } else {
    ctx.fillStyle = "#d8664e";
    ctx.beginPath();
    ctx.arc(0, 2, 13, 0, 7);
    ctx.fill();
    text(ctx, "✦", 0, -6, 20, "#5c8b54");
  }
  if (item?.startsWith("chopped")) text(ctx, "≋", 0, 8, 22, "#fff4d3");
  ctx.restore();
}

const canvas = $("kitchen");
const ctx = canvas?.getContext("2d");
if (!ctx) $("connection").textContent = "Canvas unavailable in this browser";

function drawChefSprite(player) {
  const now = performance.now();
  const near = (kind) => (state?.stations || []).some(s =>
    s.kind === kind && Math.hypot(player.x - s.x, player.y - s.y) <= 110);
  const visual = updatePlayerVisual(presentation, player, {
    now,
    reducedMotion,
    nearPrep: near("prep"),
    nearPot: near("pot"),
    prepActive: !!state?.prep && state.now < state.prep.ready,
    potActive: !!state?.pot && state.now < state.pot.ready,
    celebrate: now < (presentation.serveBurstUntil || 0)
  });
  const bob = visual.bob || 0;
  const tilt = visual.tilt || 0;
  const anchorX = player.x, anchorY = player.y;
  const isCream = player.avatar === 0 || (player.avatar == null && player.color === 0);

  ctx.save();
  ctx.translate(anchorX, anchorY + bob);
  ctx.rotate(tilt);
  ctx.translate(-anchorX, -anchorY);
  ctx.globalAlpha = player.connected ? 1 : .45;
  ctx.fillStyle = "rgba(39,61,52,.12)";
  ctx.beginPath(); ctx.ellipse(anchorX, anchorY+32, 28, 9, 0, 0, Math.PI*2); ctx.fill();

  // Preserve the local-player selection ring from r6.
  if (player.id === me) {
    ctx.strokeStyle = "#e9a05d";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(anchorX, anchorY + 31, 35, 14, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (isCream && creamAtlas.complete && creamAtlas.naturalWidth) {
    const { cols, rows, visibleW, visibleH, height } = CREAM_ATLAS_CELLS;
    const cw = creamAtlas.naturalWidth / cols;
    const ch = creamAtlas.naturalHeight / rows;
    const dh = height;
    const dw = visibleW * (height / visibleH);
    ctx.drawImage(creamAtlas, visual.frame*cw, visual.row*ch, cw, ch,
      anchorX-dw/2, anchorY-dh+34, dw, dh);
  } else {
    const image=chefImages[(((player.avatar ?? player.color ?? 0)%CHEFS.length)+CHEFS.length)%CHEFS.length];
    if(image?.complete && image.naturalWidth){
      const height=102, width=image.naturalWidth*(height/image.naturalHeight);
      ctx.drawImage(image,anchorX-width/2,anchorY-height+34,width,height);
    } else {
      const colorIndex = Number.isInteger(player.color) ? player.color : player.avatar;
      fallbackCat(
        ctx,
        anchorX,
        anchorY,
        colors[((colorIndex || 0) % colors.length + colors.length) % colors.length],
        .9,
      );
    }
  }
  ctx.globalAlpha=1;
  text(ctx,player.name+(player.id===me?" · you":""),anchorX,anchorY+54,12);
  if(player.held) vegetable(ctx,player.held,anchorX+28,anchorY+8,.8);
  ctx.restore();
}

function drawKitchenFrame() {
  if (!renderActive || !ctx || !state || state.phase !== "playing" || document.hidden) {
    renderActive = false;
    animationFrame = 0;
    return;
  }

  ctx.clearRect(0, 0, 800, 620);

  const gradient = ctx.createLinearGradient(0, 0, 0, 620);
  gradient.addColorStop(0, "#f5f0e6");
  gradient.addColorStop(1, "#e9efdd");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 800, 620);

  for (let y = 155; y < 490; y += 42) {
    for (let x = 0; x < 800; x += 42) {
      ctx.fillStyle = ((x / 42 + y / 42) | 0) % 2 ? "#e4ead4" : "#eef2e3";
      ctx.fillRect(x, y, 41, 41);
    }
  }

  rounded(ctx, 15, 20, 770, 121, 20, "#abc2af");
  rounded(ctx, 15, 480, 770, 125, 20, "#abc2af");
  rounded(ctx, 40, 40, 165, 54, 16, "#fff8ed");
  text(ctx, "KITCHEN CATS", 123, 73, 18, "#d2764f");
  text(ctx, "cozy local shift", 684, 73, 12, "#f8fbf1");

  const near = nearest();
  for (const station of state.stations) {
    const active = near?.id === station.id && near.d <= 110;
    rounded(
      ctx,
      station.x - 62,
      station.y - 44,
      124,
      75,
      16,
      active ? "#ffe3a4" : "#fff9ef",
    );
    if (active) {
      ctx.strokeStyle = "#e69957";
      ctx.lineWidth = 3;
      ctx.strokeRect(station.x - 65, station.y - 47, 130, 81);
    }
    text(ctx, station.label, station.x, station.y + 51, 16, "#3f5a4a");

    if (station.kind === "source")
      vegetable(ctx, station.id, station.x, station.y - 5, 1.4);

    if (station.kind === "prep") {
      rounded(ctx, station.x - 34, station.y - 25, 68, 40, 8, "#cca97a");
      const knife = prepPose(performance.now(), reducedMotion);
      ctx.save();
      ctx.translate(station.x + 20, station.y);
      ctx.rotate(reducedMotion || !state.prep || state.now >= state.prep.ready ? 0 : [-.45,-.15,.25,.55][knife]);
      text(ctx, "╱", 0, 0, 24, "#5c473a");
      ctx.restore();
      if (state.prep)
        vegetable(ctx, state.prep.item, station.x - 12, station.y, 1);
    }

    if (station.kind === "pot") {
      rounded(ctx, station.x - 34, station.y - 24, 68, 46, 12, "#5d7f6c");
      text(ctx, "≈", station.x, station.y - 2, 32, "#f0bd6c");
      if (state.pot)
        vegetable(ctx, state.pot.item, station.x, station.y - 4, 0.8);
      const potFx = potEffect(performance.now(), !!state.pot, reducedMotion);
      if (potFx.active) {
        text(ctx, potFx.frame % 2 ? "~" : "≈", station.x - 16, station.y - 36 - potFx.frame * 3, 18, "#95a08d");
        text(ctx, "•", station.x + 10, station.y - 28 - potFx.frame * 2, 12, "#95a08d");
      }
    }

    if (station.kind === "pass") {
      rounded(ctx, station.x - 36, station.y - 18, 72, 36, 12, "#efe7cf");
      text(ctx, "↔", station.x, station.y + 4, 28, "#7e8f77");
      if (state.pass) vegetable(ctx, state.pass, station.x, station.y - 6, 1.2);
    }

    if (station.kind === "serve") {
      text(ctx, "ORDER UP", station.x, station.y - 5, 16, "#c26f4c");
      text(ctx, "✦", station.x, station.y + 17, 22, "#edb66a");
    }

    if (station.kind === "bin")
      text(ctx, "↻", station.x, station.y + 8, 32, "#829175");

    const job =
      station.kind === "prep"
        ? state.prep
        : station.kind === "pot"
          ? state.pot
          : null;
    if (job) {
      const progress = Math.min(
        1,
        (state.now - job.started) / (job.ready - job.started),
      );
      rounded(ctx, station.x - 43, station.y + 19, 86, 7, 4, "#d5d8c4");
      rounded(
        ctx,
        station.x - 43,
        station.y + 19,
        86 * progress,
        7,
        4,
        "#67956c",
      );
      text(
        ctx,
        progress >= 1 ? "READY" : "working…",
        station.x,
        station.y - 51,
        11,
        "#54695c",
      );
    }
  }

  const serveFx = updateServeEffect(presentation, state.served || 0, performance.now(), reducedMotion);
  if (serveFx.active) { for (let i=0;i<8;i++){ const b=burstOffset(i,serveFx.age,reducedMotion); text(ctx,"✦",650+b.x,180+b.y,18,"#edb66a"); } }

  for (const player of [...state.players].sort((a, b) => a.y - b.y))
    drawChefSprite(player);

  animationFrame = requestAnimationFrame(drawKitchenFrame);
}

function syncRenderLoop() {
  const shouldRender = Boolean(ctx && state?.phase === "playing" && !document.hidden);
  if (shouldRender && !renderActive) {
    renderActive = true;
    animationFrame = requestAnimationFrame(drawKitchenFrame);
  } else if (!shouldRender && renderActive) {
    renderActive = false;
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  }
}

syncRenderLoop();

renderUI();
// Cache setup is successful only after a completely installed worker controls us.
const offlineStatus = $("connection");
if ("serviceWorker" in navigator) {
  offlineStatus.textContent = "Preparing offline…";
  navigator.serviceWorker
    .register("./sw.js", { scope: "./" })
    .then((reg) => {
      const update = () => {
        offlineStatus.textContent = reg.waiting
          ? "Update downloaded · close all Kitchen Cats tabs to apply"
          : navigator.serviceWorker.controller
            ? "Offline ready"
            : "Preparing offline…";
      };
      const watch = (worker) => {
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (worker.state === "redundant" && !reg.waiting)
            offlineStatus.textContent = navigator.serviceWorker.controller
              ? "Offline ready · update failed; retry online"
              : "Offline setup failed · reload online to retry";
          else update();
        });
      };
      watch(reg.installing);
      reg.addEventListener("updatefound", () => watch(reg.installing));
      navigator.serviceWorker.addEventListener("controllerchange", update);
      update();
    })
    .catch(
      () =>
        (offlineStatus.textContent =
          "Offline unavailable · reload online to retry"),
    );
} else
  offlineStatus.textContent =
    "Offline installation unavailable in this browser";
