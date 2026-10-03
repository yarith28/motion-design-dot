import { KitchenGame } from "./game-core.js";
import { MultiplayerSession } from "./multiplayer-session.js";
import { WebRTCTransport } from "./webrtc-transport.js";
import {
  createQrFrames,
  QrFrameAssembler,
  drawQr,
  QrCameraScanner,
} from "./qr-pairing.js";
import { createPresentationState, resetPresentation, updatePhasePresentation, updatePlayerVisual, updateServeEffect, burstOffset, selectChefPose } from "./presentation-animation.js";
const offlineGame = new KitchenGame();
let runtimeMode = "solo"; // solo | host | guest
let multiplayer = null;
const $ = (id) => document.getElementById(id);
const on = (id, event, fn) => $(id)?.addEventListener(event, fn);
const setOfflineStatus = (message) => {
  $("connection").textContent = message;
  $("home-connection").textContent = message;
};

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
const chefImages = CHEFS.map((chef) => {
  const image = new Image();
  image.decoding = "async";
  image.src = chef.src;
  return image;
});
// Exact original portrait alpha bottoms keep idle/carry and atlas poses on the
// same floor line; portraits also remain the fallback during atlas loading.
const portraitFootY = [475 / 482, 473 / 487, 471 / 485, 462 / 482];

const loadArt = (path) => {
  const image = new Image();
  image.decoding = "async";
  image.src = path;
  return image;
};
const chefPoseAtlases = CHEFS.map(() => null);
let chefPoseManifest = null;
fetch("./assets/chef2d-manifest.json")
  .then((response) => {
    if (!response.ok) throw Error(`Chef pose manifest: ${response.status}`);
    return response.json();
  })
  .then((manifest) => {
    chefPoseManifest = manifest;
    CHEFS.forEach((chef, index) => {
      const atlasPath = manifest.cats?.[chef.key]?.atlas;
      if (atlasPath) chefPoseAtlases[index] = loadArt(atlasPath);
    });
  })
  .catch(() => { /* Exact original portraits remain playable offline. */ });
const sceneArt = {
  room: loadArt("./assets/world-3d/room-1000x470@2x.png"),
  stations: loadArt("./assets/world-3d/station-atlas.png"),
  foods: loadArt("./assets/world-3d/food-atlas.png"),
  marker: loadArt("./assets/world-3d/local-marker.png"),
  halo: loadArt("./assets/ui-3d/effect-station-halo.png"),
  steam: loadArt("./assets/ui-3d/effect-steam.png"),
  sparkle: loadArt("./assets/ui-3d/effect-sparkle.png"),
  progressTrack: loadArt("./assets/ui-3d/progress-track.png"),
  progressFill: loadArt("./assets/ui-3d/progress-fill-gold.png"),
  progressReady: loadArt("./assets/ui-3d/progress-fill-sage.png"),
  badge: loadArt("./assets/ui-3d/status-badge.png"),
};
let sceneManifest = null;
fetch("./assets/world-3d/manifest.json")
  .then((response) => {
    if (!response.ok) throw Error(`World art manifest: ${response.status}`);
    return response.json();
  })
  .then((manifest) => { sceneManifest = manifest; })
  .catch(() => toast("Kitchen artwork could not load. Reload while online."));

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
const systemMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
const savedMotion = readPreference("kitchen-reduced-motion", "");
let reducedMotion = savedMotion === "" ? !!systemMotion?.matches : savedMotion === "1";
let selectedAvatar = Number.isInteger(storedAvatar)
  ? Math.max(0, Math.min(CHEFS.length - 1, storedAvatar))
  : 0;
let lastPhase;
let lastServed = 0;
let playingNoticeUntil = 0;

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
  $("mute").dataset.muted = String(muted);
  $("motion").dataset.reduced = String(reducedMotion);
  $("mute").setAttribute("aria-label", muted ? "Unmute sound" : "Mute sound");
  $("motion").setAttribute("aria-label", reducedMotion ? "Enable motion" : "Reduce motion");
}

const gameShell = $("game");
const fullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement;
const requestGameFullscreen = gameShell.requestFullscreen || gameShell.webkitRequestFullscreen;
const exitDocumentFullscreen = document.exitFullscreen || document.webkitExitFullscreen;
const canFullscreen = !!requestGameFullscreen && !!exitDocumentFullscreen &&
  document.fullscreenEnabled !== false && document.webkitFullscreenEnabled !== false;

function updateFullscreenControl() {
  const button = $("fullscreen");
  const active = fullscreenElement() === gameShell;
  const toastElement = $("toast");
  if (active && toastElement.parentElement !== gameShell) gameShell.append(toastElement);
  else if (!active && toastElement.parentElement !== document.body) document.body.append(toastElement);
  button.disabled = !canFullscreen;
  button.textContent = active ? "↙" : "⛶";
  button.setAttribute("aria-pressed", String(active));
  const label = !canFullscreen
    ? "Fullscreen unavailable in this browser; rotate for a larger kitchen"
    : active ? "Exit fullscreen" : "Enter fullscreen";
  button.setAttribute("aria-label", label);
  button.title = label;
  $("fullscreen-note").textContent = !canFullscreen
    ? "Fullscreen unavailable in this browser. Rotate to landscape for a larger kitchen."
    : active ? "Fullscreen on" : "Fullscreen off";
}

async function exitGameFullscreen() {
  if (fullscreenElement() !== gameShell || !exitDocumentFullscreen) return;
  try { await Promise.resolve(exitDocumentFullscreen.call(document)); }
  catch { /* The browser may already have exited on visibility change. */ }
  updateFullscreenControl();
}

on("fullscreen", "click", async () => {
  if (!canFullscreen) {
    toast("Fullscreen is unavailable here. Rotate to landscape for a larger kitchen.");
    return;
  }
  try {
    if (fullscreenElement() === gameShell) await exitGameFullscreen();
    else await Promise.resolve(requestGameFullscreen.call(gameShell, { navigationUI: "hide" }));
  } catch {
    toast("Fullscreen could not start in this browser.");
  }
  updateFullscreenControl();
});
for (const event of ["fullscreenchange", "webkitfullscreenchange", "fullscreenerror", "webkitfullscreenerror"])
  document.addEventListener(event, updateFullscreenControl);
updateFullscreenControl();

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
      button.setAttribute("aria-label", chef.name);
      button.dataset.avatar = String(index);

      const image = document.createElement("img");
      image.src = chef.src;
      image.alt = "";

      const title = document.createElement("strong");
      title.textContent = chef.name.split(" ")[0];

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
  setOfflineStatus("● Offline");
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
  qrLastError = "",
  qrProgressTimer = null,
  qrLastProgress = 0,
  qrCameraAttempt = 0;
const qrCamera = new QrCameraScanner(mpVideo, (text) => handleQrText(text), (state) => {
  if (!qrScanBusy) return;
  if (state === "ended") {
    stopQrCamera();
    mpScanStatus.textContent = "Camera stopped. Tap Scan to resume; saved frames are kept.";
  } else if (state === "waiting") {
    mpScanStatus.textContent = "Waiting for camera… Tap Restart camera if needed.";
  }
});
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
  qrCameraAttempt++;
  clearInterval(qrProgressTimer);
  qrProgressTimer = null;
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
  const attempt = ++qrCameraAttempt;
  qrScanBusy = true;
  qrLastProgress = Date.now();
  mpCamera.hidden = false;
  mpScanButton.disabled = true;
  mpScanButton.textContent = "Camera scanning…";
  mpScanStatus.textContent = "Point the rear camera at the QR code.";
  try {
    await qrCamera.start();
    if (!qrScanBusy || attempt !== qrCameraAttempt) return;
    mpScanButton.disabled = false;
    mpScanButton.textContent = "Restart camera";
    qrProgressTimer = setInterval(() => {
      if (Date.now() - qrLastProgress < 6000) return;
      const count = qrAssembler?.frames.size || 0;
      const progress = count ? `${count} of ${qrAssembler.total} saved. ` : "";
      mpScanStatus.textContent = `${progress}Keep the whole code visible. Move closer or tap Restart camera.`;
    }, 1000);
  } catch (e) {
    if (attempt !== qrCameraAttempt) return;
    stopQrCamera();
    mpStatus.textContent = `${cameraErrorMessage(e)} Choose a QR image or open Advanced.`;
    mpScanStatus.textContent = "Camera unavailable. No permission bypass was attempted.";
  }
}
function updateQrProgress(result) {
  if (!result || result.duplicate) return;
  qrLastProgress = Date.now();
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
  void exitGameFullscreen();
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
  startQrCamera();
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
for (const [homeId, pairingId] of [
  ["home-host", "mp-host"],
  ["home-join", "mp-join"],
]) {
  on(homeId, "click", () => {
    $(pairingId)?.click();
    $("experimental-mp")?.scrollIntoView({ block: "start" });
  });
}
document.querySelector(".help-link")?.addEventListener("click", () => {
  $("how").open = true;
});
systemMotion?.addEventListener?.("change", (event) => {
  if (readPreference("kitchen-reduced-motion", "") !== "") return;
  reducedMotion = event.matches;
  updateToggles();
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
  if (station && station.d <= 110) {
    const beforeServe = state.served || 0;
    send({ type: "interact", station: station.id });
    // Solo and host interactions resolve synchronously. The guest snapshot has
    // no serving actor, so never attribute a remote serve to this local chef.
    if (runtimeMode !== "guest" && station.id === "serve" &&
      (state?.served || 0) > beforeServe)
      presentation.localCelebrateUntil = performance.now() + 700;
  } else toast("Walk closer to a station, then interact.");
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
      item.className = `order ${order.recipe}`;
      item.classList.toggle("urgent", order.expires - state.now <= 10000);
      item.style.setProperty("--time-ratio",
        `${Math.max(0, Math.min(100, (order.expires - state.now) / 300))}%`);

      const info = document.createElement("div");
      info.className = "order-info";

      const name = document.createElement("strong");
      name.textContent = recipeName(order.recipe);
      const icon = document.createElement("span");
      icon.className = `order-icon soup-${order.recipe}`;
      icon.setAttribute("aria-hidden", "true");

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

      item.append(icon, info, timer);
      return item;
    }),
  );
}

function renderUI() {
  if (!state) return;
  document.body.classList.toggle("game-active", state?.phase === "playing");
  document.body.classList.toggle("game-results", state?.phase === "results");
  const idle = !state || state.phase === "idle";
  $("fullscreen").hidden = idle || (state.phase !== "playing" && fullscreenElement() !== gameShell);
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
  $("clock").classList.toggle("time-urgent", state.phase === "playing" && remain <= 20);
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
  if (lastPhase !== state.phase && state.phase === "playing")
    playingNoticeUntil = performance.now() + 2800;
  $("notice").textContent = state.notice || "";
  $("notice").dataset.visible = String(state.phase === "playing" &&
    !!state.notice && performance.now() < playingNoticeUntil);

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

const canvas = $("kitchen");
const ctx = canvas?.getContext("2d");
if (!ctx) setOfflineStatus("Canvas unavailable in this browser");
const kitchenY = (worldY) => 87 + worldY * .56;
// The counter sockets use the room's station projection. Chef feet travel on
// the narrower walkable floor lane in front of those counters.
const chefY = (worldY) => 125 + worldY * .405;
const artReady = (image) => image?.complete && image.naturalWidth > 0;
function drawArt(image, x, y, width, height) {
  if (artReady(image)) ctx.drawImage(image, x, y, width, height);
}
function drawFood(item, x, y, size = 34) {
  const crop = sceneManifest?.foods?.[item];
  if (!crop || !artReady(sceneArt.foods)) return;
  ctx.drawImage(sceneArt.foods, crop.x, crop.y, crop.w, crop.h,
    x - size / 2, y - size / 2, size, size);
}
function drawStationArt(name, x, y) {
  const crop = sceneManifest?.stations?.[name];
  if (!crop || !artReady(sceneArt.stations)) return;
  ctx.drawImage(sceneArt.stations, crop.x, crop.y, crop.w, crop.h,
    x - 60, y - 45, 120, 90);
}
function drawBadge(label, x, y, width = 75) {
  drawArt(sceneArt.badge, x - width / 2, y - 12, width, 26);
  ctx.save();
  ctx.shadowColor = "#fff9e7";
  ctx.shadowBlur = 2;
  text(ctx, label, x, y + 5, 12, "#284b3a");
  ctx.restore();
}
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
    // A global snapshot alone cannot identify the server; only locally
    // confirmed interactions set this chef-specific presentation timer.
    celebrate: player.id === me && now < presentation.localCelebrateUntil,
  });
  // Atlas cells have transparent side gutters; this keeps visible ears and
  // utensils inside the world even when a chef reaches its boundary.
  const anchorX = Math.max(58, Math.min(742, player.x));
  const anchorY = chefY(player.y);
  const avatarIndex = (((player.avatar ?? player.color ?? 0) % CHEFS.length) + CHEFS.length) % CHEFS.length;

  ctx.save();
  ctx.globalAlpha = player.connected ? 1 : .45;
  // The rendered medallion and contact shadow stay fixed on the floor.
  if (player.id === me) {
    drawArt(sceneArt.marker, anchorX - 60, anchorY + 1, 120, 60);
  } else {
    ctx.fillStyle = "rgba(29, 49, 35, .28)";
    ctx.beginPath();
    ctx.ellipse(anchorX, anchorY + 31, 26, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const pose = selectChefPose(chefPoseManifest?.poses, visual.mode, visual.elapsed, reducedMotion);
  const atlas = chefPoseAtlases[avatarIndex];
  const cellWidth = chefPoseManifest?.cellWidth;
  const cellHeight = chefPoseManifest?.cellHeight;
  if (pose?.source === "atlas" && artReady(atlas) && cellWidth && cellHeight) {
    const columns = chefPoseManifest.columns;
    const frame = pose.frame;
    const sx = (frame % columns) * cellWidth;
    const sy = Math.floor(frame / columns) * cellHeight;
    const height = chefPoseManifest.drawHeight || 116;
    const width = height * cellWidth / cellHeight;
    const top = anchorY + 31 - (chefPoseManifest.footY / cellHeight) * height;
    ctx.drawImage(atlas, sx, sy, cellWidth, cellHeight,
      anchorX - width / 2, top, width, height);
  } else if (artReady(chefImages[avatarIndex])) {
    const image = chefImages[avatarIndex];
    const height = 116, width = image.naturalWidth * (height / image.naturalHeight);
    const top = anchorY + 31 - portraitFootY[avatarIndex] * height;
    ctx.drawImage(image, anchorX - width / 2, top, width, height);
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
  ctx.globalAlpha=1;
  const nameLabel = player.name + (player.id === me ? " · you" : "");
  const labelSize = nameLabel.length > 14 ? 11 : 13;
  ctx.font = `700 ${labelSize}px Arial`;
  const labelWidth = Math.min(150, Math.ceil(ctx.measureText(nameLabel).width) + 16);
  const labelX = Math.max(5, Math.min(795 - labelWidth, anchorX - labelWidth / 2));
  drawArt(sceneArt.badge, labelX, anchorY + 37, labelWidth, 24);
  text(ctx, nameLabel, labelX + labelWidth / 2, anchorY + 54, labelSize, "#294d3c");
  if(player.held) {
    // Put the item beside the pose, where other cooks can read it without
    // covering the original cat's face. Flip at the left world boundary.
    const heldX = anchorX - 103 < 4 ? anchorX + 58 : anchorX - 103;
    drawArt(sceneArt.badge, heldX, anchorY - 46, 48, 42);
    drawFood(player.held, heldX + 24, anchorY - 25, 50);
  }
  ctx.restore();
}

function fitKitchenCanvas() {
  const box = canvas.getBoundingClientRect();
  const ratio = Math.max(.2, box.width / Math.max(1, box.height));
  const width = Math.max(800, Math.round(470 * ratio));
  const height = Math.max(470, Math.round(width / ratio));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  return { width, height, x: (width - 800) / 2, y: (height - 470) / 2 };
}

function drawRoom(view) {
  if (!artReady(sceneArt.room)) return;
  const room = sceneArt.room;
  ctx.drawImage(room, -100, 0, 1000, 470);
  // Extend the rendered side wall into wider landscape viewports without
  // stretching the playable center or moving any gameplay station.
  const left = -view.x, right = view.width - view.x;
  if (left < -100)
    ctx.drawImage(room, 0, 0, 24, 940, left, 0, -100 - left, 470);
  if (right > 900)
    ctx.drawImage(room, 1976, 0, 24, 940, 900, 0, right - 900, 470);
}

function stationPose(station) {
  if (station.kind === "source") return `station-${station.id}`;
  if (station.kind === "prep")
    return !state.prep ? "station-prep-idle"
      : state.now < state.prep.ready ? "station-prep-working" : "station-prep-ready";
  if (station.kind === "pot") {
    if (!state.pot) return "station-pot-idle";
    const kind = state.pot.item.includes("tomato") ? "tomato" : "carrot";
    return `station-pot-${state.now < state.pot.ready ? "working" : "ready"}-${kind}`;
  }
  return `station-${station.kind}`;
}

function drawJobProgress(job, x, y) {
  const ratio = Math.max(0, Math.min(1,
    (state.now - job.started) / Math.max(1, job.ready - job.started)));
  drawArt(sceneArt.progressTrack, x - 45, y + 48, 90, 13);
  const fill = ratio >= 1 ? sceneArt.progressReady : sceneArt.progressFill;
  if (artReady(fill) && ratio > 0) {
    const sourceWidth = fill.naturalWidth * ratio;
    ctx.drawImage(fill, 0, 0, sourceWidth, fill.naturalHeight,
      x - 43, y + 50, 86 * ratio, 9);
  }
  drawBadge(ratio >= 1 ? "READY" : `${Math.round(ratio * 100)}%`, x, y - 48, 66);
}

function drawKitchenFrame() {
  if (!renderActive || !ctx || !state || state.phase !== "playing" || document.hidden) {
    renderActive = false;
    animationFrame = 0;
    return;
  }

  const now = performance.now();
  const view = fitKitchenCanvas();
  ctx.clearRect(0, 0, view.width, view.height);
  ctx.save();
  ctx.translate(view.x, view.y);
  drawRoom(view);

  const near = nearest();
  for (const station of state.stations) {
    const x = station.x, y = kitchenY(station.y);
    const active = near?.id === station.id && near.d <= 110;
    if (active) drawArt(sceneArt.halo, x - 65, y - 48, 130, 96);
    drawStationArt(stationPose(station), x, y);

    if (station.kind === "prep" && state.prep) {
      const kind = state.prep.item.includes("tomato") ? "tomato" : "carrot";
      drawFood(state.now < state.prep.ready ? kind : `chopped-${kind}`,
        x - 11, y - 10, 29);
    }
    if (station.kind === "pass" && state.pass) drawFood(state.pass, x, y - 7, 36);

    const job = station.kind === "prep" ? state.prep
      : station.kind === "pot" ? state.pot : null;
    if (job) drawJobProgress(job, x, y);
    else drawBadge(station.label.toUpperCase(),
      x + (station.id === "carrot" ? 45 : 0), y + 48,
      Math.max(62, station.label.length * 9 + 18));

    if (station.kind === "pot" && state.pot && !reducedMotion && artReady(sceneArt.steam)) {
      const phase = Math.max(0, (state.now - state.pot.started) / 900) % 1;
      ctx.save();
      ctx.globalAlpha = .36 + .26 * (1 - phase);
      ctx.drawImage(sceneArt.steam, x - 21, y - 62 - phase * 12, 42, 47);
      ctx.restore();
    }
  }

  for (const player of [...state.players].sort((a, b) => a.y - b.y))
    drawChefSprite(player);

  // Serving is a global snapshot event: no chef is falsely credited with it.
  const serveFx = updateServeEffect(presentation, state.served || 0, now, reducedMotion);
  if (serveFx.active) {
    const x = 690, y = kitchenY(540) - 36;
    for (let i = 0; i < 7; i++) {
      const burst = burstOffset(i, serveFx.age);
      ctx.save();
      ctx.globalAlpha = burst.a;
      drawArt(sceneArt.sparkle, x + burst.x - 15, y + burst.y - 15, 30, 30);
      ctx.restore();
    }
    drawBadge("+100 SERVED!", 589, y - 41, 120);
  }

  ctx.restore();
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
if ("serviceWorker" in navigator) {
  setOfflineStatus("Preparing offline…");
  navigator.serviceWorker
    .register("./sw.js", { scope: "./" })
    .then((reg) => {
      const update = () => {
        setOfflineStatus(reg.waiting
          ? "Update downloaded · close all Kitchen Cats tabs to apply"
          : navigator.serviceWorker.controller
            ? "Offline ready"
            : "Preparing offline…");
      };
      const watch = (worker) => {
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (worker.state === "redundant" && !reg.waiting)
            setOfflineStatus(navigator.serviceWorker.controller
              ? "Offline ready · update failed; retry online"
              : "Offline setup failed · reload online to retry");
          else update();
        });
      };
      watch(reg.installing);
      reg.addEventListener("updatefound", () => watch(reg.installing));
      navigator.serviceWorker.addEventListener("controllerchange", update);
      update();
    })
    .catch(
      () => setOfflineStatus("Offline unavailable · reload online to retry"),
    );
} else
  setOfflineStatus("Offline installation unavailable in this browser");
