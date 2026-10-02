const CACHE_STATUS={ready:false,controller:false};
if('serviceWorker' in navigator){
 navigator.serviceWorker.register('./sw.js',{scope:'./'}).then(reg=>{
  const check=()=>{CACHE_STATUS.controller=!!navigator.serviceWorker.controller; CACHE_STATUS.ready=CACHE_STATUS.controller; const el=document.getElementById('connection'); if(el) el.textContent=CACHE_STATUS.ready?'Offline ready':'Preparing offline';};
  check(); navigator.serviceWorker.addEventListener('controllerchange',check);
  navigator.serviceWorker.addEventListener('message',e=>{if(e.data?.type==='CACHE_FAILED'){const el=document.getElementById('connection');if(el)el.textContent='Offline setup failed';} if(e.data?.type==='CACHE_UPDATED'){const el=document.getElementById('connection'); if(el) el.textContent='Update ready · close and reopen';}});
 }).catch(()=>{const el=document.getElementById('connection');if(el)el.textContent='Offline unavailable';});
}
import { KitchenGame } from "./game-core.js";
import { MultiplayerSession } from "./multiplayer-session.js";
import { WebRTCTransport } from "./webrtc-transport.js";
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
const chefImages = CHEFS.map((chef) => {
  const image = new Image();
  image.decoding = "async";
  image.src = chef.src;
  return image;
});

let state, me=0;
const keys = new Set();
let touchPointers = new Map();
let joystickPointer = null;
let muted = localStorage.getItem("kitchen-muted") === "1";
let reducedMotion = localStorage.getItem("kitchen-reduced-motion") === "1";
let selectedAvatar = Math.max(
  0,
  Math.min(CHEFS.length - 1, Number(localStorage.getItem("kitchen-avatar")) || 0),
);
let lastPhase;
let lastServed = 0;
let lastActionTouch = 0;
let audioContext;

function send(v) {
  if (runtimeMode === "solo") {
    if (v.type === "move") offlineGame.move(v.x,v.y);
    if (v.type === "interact") offlineGame.interact(v.station);
    if (v.type === "start") offlineGame.start(v.name || "Chef", v.avatar || 0);
    if (v.type === "stop") offlineGame.stop();
    if (v.type === "replay") offlineGame.start(v.name || "Chef", v.avatar || 0);
    return;
  }
  if (!multiplayer) return;
  if (runtimeMode === "guest") {
    if (v.type === "move") multiplayer.sendInput(v.x,v.y);
    if (v.type === "interact") multiplayer.sendInteract(v.station);
    return;
  }
  if (runtimeMode === "host") {
    if (v.type === "start") multiplayer.start();
    if (v.type === "replay") multiplayer.replay();
  }
}

function toast(message) {
  $("toast").textContent = message;
  $("toast").style.display = "block";
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => ($("toast").style.display = "none"), 3500);
}

function persistPrefs() {
  localStorage.setItem("kitchen-avatar", String(selectedAvatar));
  localStorage.setItem("kitchen-muted", muted ? "1" : "0");
  localStorage.setItem("kitchen-reduced-motion", reducedMotion ? "1" : "0");
}

function updateToggles() {
  $("mute").textContent = muted ? "🔇 Sound" : "🔊 Sound";
  $("motion").textContent = reducedMotion ? "✦ Reduced" : "✨ Motion";
}

function getChef(index) {
  return CHEFS[((Number(index) || 0) % CHEFS.length + CHEFS.length) % CHEFS.length];
}

function renderAvatarPicker() {
  const picker = $("avatar-picker");
  if (!picker) return;
  $("chosen-chef-name").textContent = getChef(selectedAvatar).name;
  picker.replaceChildren(
    ...CHEFS.map((chef, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "avatar-option" + (index === selectedAvatar ? " selected" : "");
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
  offlineGame.on((s)=>{ if(runtimeMode === "solo"){ state=s; me=0; renderUI(); }});
  offlineGame.tickLoop=setInterval(()=>{ if(runtimeMode === "solo") offlineGame.tick(); },50);
  $("connection").textContent="● Offline";
  state=offlineGame.snapshot();
// solo runtime: no lobby/network controls

}


connect();
updateToggles();
const mpTransport = new WebRTCTransport();
const mpSession = new MultiplayerSession({transport: mpTransport, host:false});
multiplayer = mpSession;
mpSession.onSnapshot((s)=>{ if(runtimeMode !== "solo"){ state=s; me=mpSession.playerId || 0; renderUI(); }});
mpSession.onStatus((s)=>{ if(mpStatus) mpStatus.textContent=s; });
const mpStatus=$("mp-status");
let mpPending=false;
const showMpError=(prefix,e)=>{
 mpPending=false;
 runtimeMode="solo";
 mpSession.isHost=false;
 mpStatus.textContent=prefix+": "+(e?.message||String(e));
};
$("mp-host")?.addEventListener("click", async()=>{
 if(mpPending) return;
 mpPending=true;
 try {
  runtimeMode="host"; mpSession.isHost=true;
  const id=crypto.randomUUID(); mpSession.startHost(id);
  mpStatus.textContent="Gathering ICE candidates…";
  const offer=await mpTransport.createOffer(id);
  $("mp-offer").value=offer;
  mpPending=false;
  mpStatus.textContent="Host offer ready with ICE candidates";
 } catch(e){ showMpError("Host offer failed",e); }
});
$("mp-join")?.addEventListener("click",()=>{
 runtimeMode="guest";
 mpSession.isHost=false;
 mpStatus.textContent="Guest mode: paste host offer, then Import pairing";
});
$("mp-import")?.addEventListener("click",async()=>{
 if(mpPending) return;
 mpPending=true;
 try {
  mpStatus.textContent="Processing pairing…";
  if(runtimeMode==="guest") {
    $("mp-answer").value=await mpTransport.acceptOffer($("mp-offer").value);
    mpStatus.textContent="Answer generated. Send answer back to host.";
  } else {
    await mpTransport.acceptAnswer($("mp-answer").value);
    mpStatus.textContent="Host pairing accepted.";
  }
  mpPending=false;
 } catch(e){
  showMpError("Pairing failed",e);
 }
});
$("mp-cancel")?.addEventListener("click",()=>{
 mpPending=false;
 mpTransport.close();
 mpSession.stop("cancelled");
 runtimeMode="solo";
 state=offlineGame.snapshot();
 renderUI();
 mpStatus.textContent="Cancelled";
});
$("mp-copy")?.addEventListener("click",()=>navigator.clipboard?.writeText($("mp-offer").value||$("mp-answer").value));

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

$("mute") && ($("mute").onclick = () => {
  muted = !muted;
  persistPrefs();
  updateToggles();
});

$("motion") && ($("motion").onclick = () => {
  reducedMotion = !reducedMotion;
  persistPrefs();
  updateToggles();
});


$("solo")?.addEventListener("click", () => { runtimeMode="solo"; send({ type: "start", solo: true, name: $("name")?.value, avatar: chosenAvatar() }); });
$("start")?.addEventListener("click", () => send({ type: "start" }));
$("replay")?.addEventListener("click", () => send({ type: "replay" }));

$("leave")?.addEventListener("click", () => {
  stop();
  runtimeMode="solo";
  multiplayer?.leave?.();
  send({ type: "stop" });
  state = offlineGame.snapshot();
  renderUI();
});


function nearest() {
  const player = state?.players.find((entry) => entry.id === me);
  if (!player) return null;
  return state.stations
    .map((station) => ({
      ...station,
      d: Math.hypot(station.x - player.x, station.y - player.y),
    }))
    .sort((a, b) => a.d - b.d)[0];
}

function interact() {
  const station = nearest();
  if (station && station.d <= 110) send({ type: "interact", station: station.id });
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
  if ([
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
  ].includes(event.key)) {
    if (state?.phase === "playing") event.preventDefault();
    keys.add(event.key.toLowerCase());
    if (["e", "E", " "].includes(event.key) && !event.repeat) interact();
  }
});

window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));

function currentTouchDirection() {
  let x = 0, y = 0;
  for (const direction of touchPointers.values()) { x += direction.x; y += direction.y; }
  return {x,y};
}

function setupAnalogStick(){
 const base=$('joystick'), knob=$('stick-knob'); if(!base)return;
 const clear=()=>{joystickPointer=null;knob.style.transform='translate(0,0)';touchPointers.delete('stick');};
 const update=(e)=>{const r=base.getBoundingClientRect();let x=e.clientX-(r.left+r.width/2),y=e.clientY-(r.top+r.height/2);const max=r.width*.38;const len=Math.hypot(x,y);if(len>max){x=x/len*max;y=y/len*max;} const dead=8;if(Math.hypot(x,y)<dead){x=0;y=0;}else{x/=max;y/=max;}touchPointers.set('stick',{x,y});knob.style.transform=`translate(${x*max}px,${y*max}px)`;};
 base.onpointerdown=e=>{e.preventDefault();joystickPointer=e.pointerId;base.setPointerCapture(e.pointerId);update(e);};
 base.onpointermove=e=>{if(e.pointerId===joystickPointer)update(e);};
 ['pointerup','pointercancel','lostpointercapture'].forEach(n=>base.addEventListener(n,e=>{if(e.pointerId===joystickPointer)clear();}));
}
setupAnalogStick();

function stop(){keys.clear();touchPointers.clear();send({type:'move',x:0,y:0});}
window.addEventListener('blur',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});

setInterval(()=>{if(state?.phase==='playing'){const d=currentTouchDirection();send({type:'move',x:d.x+Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft')),y:d.y+Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'))});}},60);

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
    ...state.players.map((player) => {
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
    ...state.orders.map((order) => {
      const item = document.createElement("div");
      item.className = "order";

      const info = document.createElement("div");
      info.className = "order-info";

      const name = document.createElement("strong");
      name.textContent = recipeName(order.recipe);

      const recipe = document.createElement("div");
      recipe.className = "order-recipe";
      recipe.textContent = order.recipe === "tomato" ? "Tomato base" : "Carrot base";

      const steps = document.createElement("small");
      steps.textContent = "Pick vegetable → chop → pot → serve";

      info.append(name, recipe, steps);

      const timer = document.createElement("b");
      timer.textContent = Math.max(0, Math.ceil((order.expires - state.now) / 1000)) + "s";

      item.append(info, timer);
      return item;
    }),
  );
}

function renderUI() {
  document.body.classList.toggle("game-active", state?.phase === "playing");
  const idle = !state || state.phase === "idle";
  $("welcome").hidden = !idle;
  $("game").hidden = idle;
  $("room") && ($("room").textContent = "SOLO");
  $("roomcode-large") && ($("roomcode-large").textContent = "SOLO");
  $("mode").textContent = runtimeMode === "solo" ? "SOLO PRACTICE · 1 CHEF" : runtimeMode.toUpperCase();

  $("lobby") && ($("lobby").hidden = runtimeMode === "solo" || idle);
  $("play").hidden = state.phase !== "playing";
  $("results").hidden = state.phase !== "results";

  const remain = Math.max(0, Math.ceil((state.ends - state.now) / 1000));
  $("clock").textContent =
    state.phase === "lobby"
      ? "2:00"
      : `${Math.floor(remain / 60)}:${String(remain % 60).padStart(2, "0")}`;
  $("score").textContent = state.score;

  renderCrew();
  renderOrders();

  $("start") && ($("start").disabled = false);
  $("hosthint") && ($("hosthint").textContent = "Solo kitchen ready.");

  $("replay") && ($("replay").disabled = state.phase !== "results");
  $("totals").textContent = `${state.score} points · ${state.served} served · ${state.missed} missed`;

  const resultText = resultsCopy(state.score, state.served);
  $("results-title").textContent = resultText.title;
  $("results-note").textContent = resultText.note;

  const myState = state.players.find((player) => player.id === me);
  $("holding").textContent = `PAWS · ${pretty(myState?.held)}`;

  const near = nearest();
  $("action").textContent = near?.d <= 110 ? `E · ${near.label}` : "E · Interact";
  $("notice").textContent = state.notice || "";

  if (lastPhase !== state.phase && state.phase === "playing") {
    $("kitchen").focus({ preventScroll: true });
    $("game").scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }

  if (state.served > lastServed && !muted) beep();
  lastServed = state.served;
  lastPhase = state.phase;
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

function text(ctx, value, x, y, size = 14, color = "#304b3d", align = "center") {
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

const ctx = $("kitchen").getContext("2d");

function drawChefSprite(player) {
  const image = chefImages[((player.avatar ?? player.color ?? 0) % CHEFS.length + CHEFS.length) % CHEFS.length];
  const anchorX = player.x;
  const anchorY = player.y;

  ctx.save();
  ctx.globalAlpha = player.connected ? 1 : 0.45;
  ctx.fillStyle = "rgba(39, 61, 52, 0.12)";
  ctx.beginPath();
  ctx.ellipse(anchorX, anchorY + 32, 28, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  if (player.id === me) {
    ctx.strokeStyle = "#e9a05d";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(anchorX, anchorY + 31, 35, 14, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (image?.complete && image.naturalWidth) {
    const height = 102;
    const width = image.naturalWidth * (height / image.naturalHeight);
    ctx.drawImage(image, anchorX - width / 2, anchorY - height + 34, width, height);
  } else {
    fallbackCat(ctx, anchorX, anchorY, colors[player.color % colors.length], 0.9);
  }

  ctx.globalAlpha = 1;
  text(ctx, player.name + (player.id === me ? " · you" : ""), anchorX, anchorY + 54, 12);
  if (player.held) vegetable(ctx, player.held, anchorX + 28, anchorY + 8, 0.8);
  ctx.restore();
}

function drawKitchen() {
  requestAnimationFrame(drawKitchen);
  if (!state || state.phase !== "playing") return;

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
    rounded(ctx, station.x - 62, station.y - 44, 124, 75, 16, active ? "#ffe3a4" : "#fff9ef");
    if (active) {
      ctx.strokeStyle = "#e69957";
      ctx.lineWidth = 3;
      ctx.strokeRect(station.x - 65, station.y - 47, 130, 81);
    }
    text(ctx, station.label, station.x, station.y + 51, 16, "#3f5a4a");

    if (station.kind === "source") vegetable(ctx, station.id, station.x, station.y - 5, 1.4);

    if (station.kind === "prep") {
      rounded(ctx, station.x - 34, station.y - 25, 68, 40, 8, "#cca97a");
      text(ctx, "╱", station.x + 20, station.y, 24, "#5c473a");
      if (state.prep) vegetable(ctx, state.prep.item, station.x - 12, station.y, 1);
    }

    if (station.kind === "pot") {
      rounded(ctx, station.x - 34, station.y - 24, 68, 46, 12, "#5d7f6c");
      text(ctx, "≈", station.x, station.y - 2, 32, "#f0bd6c");
      if (state.pot) vegetable(ctx, state.pot.item, station.x, station.y - 4, 0.8);
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

    if (station.kind === "bin") text(ctx, "↻", station.x, station.y + 8, 32, "#829175");

    const job = station.kind === "prep" ? state.prep : station.kind === "pot" ? state.pot : null;
    if (job) {
      const progress = Math.min(1, (state.now - job.started) / (job.ready - job.started));
      rounded(ctx, station.x - 43, station.y + 19, 86, 7, 4, "#d5d8c4");
      rounded(ctx, station.x - 43, station.y + 19, 86 * progress, 7, 4, "#67956c");
      text(ctx, progress >= 1 ? "READY" : "working…", station.x, station.y - 51, 11, "#54695c");
    }
  }

  for (const player of [...state.players].sort((a, b) => a.y - b.y)) drawChefSprite(player);
}

drawKitchen();
