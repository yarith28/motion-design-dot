import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CONFIG, RECIPES, STATIONS, recipeFor } from './core.js';

const palette = { mint: '#87b5a3', mintDark: '#668e7d', cream: '#fff4d9', wood: '#e5bd85', woodDark: '#bc9566', coral: '#e98260', dark: '#344d49', steel: '#bdcbc4', white: '#fffaf0', tomato: '#e77550', leaf: '#7d9b58', mushroom: '#c3a184' };
const mats = new Map(), geometries = new Map();
function mat(color, roughness = 0.7, metalness = 0) {
  const key = color + roughness + metalness;
  if (!mats.has(key)) mats.set(key, new THREE.MeshStandardMaterial({ color, roughness, metalness }));
  return mats.get(key);
}
function box(parent, w, h, d, color, x = 0, y = 0, z = 0, radius = 0.06) {
  const key = [w, h, d, radius].join(',');
  if (!geometries.has(key)) geometries.set(key, new RoundedBoxGeometry(w, h, d, 2, Math.min(radius, w / 3, h / 3, d / 3)));
  const mesh = new THREE.Mesh(geometries.get(key), mat(color));
  mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
function sphere(parent, radius, color, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) {
  const key = 'sphere' + radius;
  if (!geometries.has(key)) geometries.set(key, new THREE.SphereGeometry(radius, 12, 8));
  const mesh = new THREE.Mesh(geometries.get(key), mat(color)); mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz);
  mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
function cylinder(parent, top, bottom, height, color, x = 0, y = 0, z = 0, segments = 20) {
  const key = ['cylinder', top, bottom, height, segments].join(',');
  if (!geometries.has(key)) geometries.set(key, new THREE.CylinderGeometry(top, bottom, height, segments));
  const mesh = new THREE.Mesh(geometries.get(key), mat(color)); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
function torus(parent, radius, tube, color, x = 0, y = 0, z = 0, flat = true) {
  const key = ['torus', radius, tube].join(',');
  if (!geometries.has(key)) geometries.set(key, new THREE.TorusGeometry(radius, tube, 8, 28));
  const mesh = new THREE.Mesh(geometries.get(key), mat(color)); mesh.position.set(x, y, z); if (flat) mesh.rotation.x = Math.PI / 2;
  mesh.castShadow = true; parent.add(mesh); return mesh;
}
function group(parent, x = 0, y = 0, z = 0) { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; }
function tomato(parent, x = 0, y = 0, z = 0, scale = 1) {
  const g = group(parent, x, y, z); g.scale.setScalar(scale);
  sphere(g, 0.23, palette.tomato, 0, 0.2, 0, 1.05, 0.9, 1);
  for (let i = 0; i < 5; i++) { const leaf = box(g, 0.08, 0.028, 0.2, palette.leaf, 0, 0.41, 0, 0.015); leaf.rotation.y = i * Math.PI * 2 / 5; leaf.position.x = Math.sin(leaf.rotation.y) * 0.065; leaf.position.z = Math.cos(leaf.rotation.y) * 0.065; }
  cylinder(g, 0.025, 0.027, 0.1, '#6c8751', 0, 0.45, 0, 8); return g;
}
function mushroom(parent, x = 0, y = 0, z = 0, scale = 1) {
  const g = group(parent, x, y, z); g.scale.setScalar(scale);
  cylinder(g, 0.09, 0.12, 0.28, '#f2dfbe', 0, 0.17, 0, 12);
  sphere(g, 0.25, palette.mushroom, 0, 0.33, 0, 1.1, 0.65, 1.1);
  sphere(g, 0.036, '#dfc6aa', -0.08, 0.475, 0.025, 1.5, 0.3, 1.5); return g;
}
function plate(parent, recipe = null, x = 0, y = 0, z = 0) {
  const g = group(parent, x, y, z);
  cylinder(g, 0.38, 0.31, 0.06, palette.white, 0, 0.045);
  torus(g, 0.335, 0.036, '#e7e4cc', 0, 0.08);
  if (recipe) {
    cylinder(g, 0.29, 0.22, 0.19, palette.white, 0, 0.16);
    torus(g, 0.28, 0.027, palette.white, 0, 0.26);
    cylinder(g, 0.252, 0.252, 0.02, RECIPES[recipe].color, 0, 0.235);
    for (let i = 0; i < 3; i++) { const leaf = box(g, 0.08, 0.019, 0.045, '#7d9d61', Math.cos(i * 2.1) * 0.1, 0.253, Math.sin(i * 2.1) * 0.1, 0.01); leaf.rotation.y = i; }
  } return g;
}
function itemModel(item) {
  const g = new THREE.Group();
  if (item.kind === 'plate') plate(g, item.recipe);
  else if (!item.prepared) (item.type === 'tomato' ? tomato : mushroom)(g);
  else {
    cylinder(g, 0.3, 0.27, 0.05, palette.wood, 0, 0.028);
    for (let i = 0; i < 6; i++) {
      const a = i * 2.4;
      box(g, 0.11, 0.085, 0.115, item.type === 'tomato' ? palette.tomato : '#e4ccb0', Math.cos(a) * (i % 2 ? 0.17 : 0.08), 0.09, Math.sin(a) * 0.16, 0.02);
    }
  } return g;
}
function knife(parent, x = 0, y = 0, z = 0) {
  const g = group(parent, x, y, z);
  box(g, 0.09, 0.08, 0.27, palette.dark, 0, 0, 0.14, 0.03);
  box(g, 0.025, 0.16, 0.39, '#d4e0d9', 0, 0.025, -0.18, 0.009); return g;
}
function pot(parent) {
  const g = group(parent, 0, 1.3);
  g.userData.dynamic = true;
  cylinder(g, 0.46, 0.39, 0.42, palette.dark, 0, 0.15);
  torus(g, 0.435, 0.043, '#b9cac1', 0, 0.38);
  box(g, 0.2, 0.08, 0.21, '#58756b', -0.51, 0.19, 0); box(g, 0.2, 0.08, 0.21, '#58756b', 0.51, 0.19, 0);
  const liquid = cylinder(g, 0.395, 0.395, 0.03, '#df9465', 0, 0.31); liquid.material = mat('#df9465').clone(); liquid.visible = false;
  const bubbles = [], steam = [];
  for (let i = 0; i < 4; i++) {
    const b = sphere(g, 0.038, '#f5c894', Math.cos(i * 2) * 0.23, 0.34, Math.sin(i * 2) * 0.23); b.visible = false; bubbles.push(b);
    const s = sphere(g, 0.11, '#fff5df', 0, 0.7, 0, 1, 1.3, 1); s.material = new THREE.MeshBasicMaterial({ color: '#fff5df', transparent: true, opacity: 0.27, depthWrite: false }); s.castShadow = false; s.visible = false; steam.push(s);
  }
  const indicator = sphere(parent, 0.065, '#aab9a3', 0.51, 1.16, 0.59); indicator.material = mat('#aab9a3').clone();
  indicator.userData.dynamic = true;
  return { g, liquid, bubbles, steam, indicator };
}
function chef(parent) {
  const root = group(parent), body = group(root, 0, 0.02), arms = [], legs = [];
  cylinder(body, 0.29, 0.36, 0.54, palette.white, 0, 0.64);
  sphere(body, 0.33, palette.white, 0, 0.56, 0, 1, 1.15, 0.85);
  box(body, 0.49, 0.41, 0.16, palette.coral, 0, 0.6, 0.27, 0.08);
  box(body, 0.23, 0.14, 0.04, '#f3a276', 0, 0.52, 0.36, 0.035);
  cylinder(body, 0.31, 0.31, 0.075, '#e8946b', 0, 0.76);
  const head = group(body, 0, 1.0);
  sphere(head, 0.33, '#f1caa1', 0, 0, 0, 1, 0.94, 0.91);
  sphere(head, 0.086, '#edb793', -0.34, -0.035, 0, 0.6, 1, 0.85); sphere(head, 0.086, '#edb793', 0.34, -0.035, 0, 0.6, 1, 0.85);
  sphere(head, 0.034, '#3b4641', -0.12, 0.035, 0.272, 1, 1.2, 0.6); sphere(head, 0.034, '#3b4641', 0.12, 0.035, 0.272, 1, 1.2, 0.6);
  sphere(head, 0.064, '#edb18d', 0, -0.045, 0.297, 1, 0.8, 0.7);
  sphere(head, 0.064, '#eab09c', -0.2, -0.07, 0.23, 1, 0.5, 0.35); sphere(head, 0.064, '#eab09c', 0.2, -0.07, 0.23, 1, 0.5, 0.35);
  const smile = torus(head, 0.06, 0.009, '#975f49', 0, -0.077, 0.279, false); smile.scale.y = 0.6; smile.rotation.z = Math.PI;
  cylinder(head, 0.32, 0.32, 0.105, palette.mint, 0, 0.25);
  cylinder(head, 0.29, 0.29, 0.18, palette.white, 0, 0.38);
  sphere(head, 0.24, palette.white, 0, 0.49, 0, 1.2, 0.82, 1);
  sphere(head, 0.18, palette.white, -0.19, 0.47, 0.02); sphere(head, 0.18, palette.white, 0.19, 0.48, 0.02); sphere(head, 0.18, palette.white, 0, 0.49, -0.14);
  for (let sign of [-1, 1]) {
    const arm = group(body, sign * 0.33, 0.79, 0); arm.rotation.z = sign * 0.2;
    cylinder(arm, 0.095, 0.1, 0.29, palette.white, 0, -0.14);
    sphere(arm, 0.106, '#f1caa1', 0, -0.31, 0); arms.push(arm);
    const leg = group(root, sign * 0.16, 0.27, 0);
    cylinder(leg, 0.075, 0.08, 0.24, '#557b70', 0, -0.06);
    box(leg, 0.19, 0.13, 0.29, '#3f5550', 0, -0.2, 0.055, 0.06); legs.push(leg);
  }
  const carried = group(body, 0, 0.68, 0.62);
  const ring = torus(root, 0.37, 0.025, '#f1c879', 0, 0.012); ring.material = new THREE.MeshBasicMaterial({ color: '#f7d692', transparent: true, opacity: 0.7 }); ring.castShadow = false;
  return { root, body, head, arms, legs, carried };
}
function plant(parent, x, y, z, scale = 1) {
  const g = group(parent, x, y, z); g.scale.setScalar(scale);
  cylinder(g, 0.18, 0.12, 0.28, '#d88a68', 0, 0.14);
  cylinder(g, 0.03, 0.03, 0.4, '#7a975b', 0, 0.36, 0, 8);
  for (let i = 0; i < 4; i++) { const a = i * 1.8; const leaf = sphere(g, 0.13, i % 2 ? '#90ae71' : '#729761', Math.sin(a) * 0.12, 0.35 + i * 0.07, Math.cos(a) * 0.12, 0.5, 1.6, 0.65); leaf.rotation.z = Math.sin(a) * 0.65; }
}
function labelTexture(text, color = '#fef3d8', bg = '#668f7d') {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128;
  const ctx = canvas.getContext('2d'); ctx.fillStyle = bg; ctx.fillRect(0, 0, 512, 128); ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold 68px Trebuchet MS, sans-serif'; ctx.fillText(text, 256, 67);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}
export class Kitchen {
  constructor(canvas, { reducedMotion = false } = {}) {
    this.reducedMotion = reducedMotion; this.time = 0; this.lastHand = ''; this.stationItems = new Map(); this.pots = new Map(); this.labels = new Map();
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    const gl = this.renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info');
    this.graphicsDevice = debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    this.softwareRendering = /swiftshader|llvmpipe|software|Microsoft Basic Render/i.test(this.graphicsDevice);
    this.renderer.setPixelRatio(this.softwareRendering ? 0.85 : Math.min(window.devicePixelRatio || 1, window.innerHeight < 500 ? 1.25 : 1.5));
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = this.softwareRendering ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap; this.renderer.shadowMap.autoUpdate = false; this.shadowElapsed = 1;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace; this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1;
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color('#a7ccbf');
    this.camera = new THREE.OrthographicCamera(-8, 8, 5, -5, 0.1, 60); this.camera.position.set(0, 13.5, 14); this.camera.lookAt(0, 0.3, 0);
    this.scene.add(new THREE.HemisphereLight('#fff7e2', '#699c8a', 2));
    const sun = new THREE.DirectionalLight('#fff1ce', 2.8); sun.position.set(-5, 12, 8); sun.castShadow = true; sun.shadow.mapSize.set(this.softwareRendering ? 512 : 1024, this.softwareRendering ? 512 : 1024); sun.shadow.camera.left = -9; sun.shadow.camera.right = 9; sun.shadow.camera.top = 9; sun.shadow.camera.bottom = -9; sun.shadow.camera.near = 1; sun.shadow.camera.far = 32; sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.03; this.scene.add(sun);
    this.scene.add(new THREE.AmbientLight('#fff2da', 0.35));
    this.world = new THREE.Group(); this.scene.add(this.world);
    this.buildRoom(); this.buildStations(); this.batchStaticModels(); this.chef = chef(this.world); this.chef.root.scale.setScalar(1.12);
    this.highlight = box(this.world, 1.65, 0.045, 1.55, '#f5c281', 0, 1.205, 0, 0.07); this.highlight.material = new THREE.MeshBasicMaterial({ color: '#f4c88d', transparent: true, opacity: 0.46 }); this.highlight.castShadow = false; this.highlight.visible = false;
    this.confetti = [];
    for (let i = 0; i < 14; i++) { const m = box(this.world, 0.055, 0.018, 0.12, [palette.coral, '#f1c965', palette.white, '#759c7c'][i % 4]); m.visible = false; m.castShadow = false; this.confetti.push(m); }
    this.celebration = 0;
    this.resize();
  }
  buildRoom() {
    const w = this.world;
    box(w, 12.15, 0.4, 8.6, '#e0ba86', 0, -0.25, 0, 0.18);
    box(w, 11.95, 0.12, 8.35, '#e5e1c5', 0, -0.005, 0, 0.05);
    const geometry = new THREE.BoxGeometry(0.98, 0.025, 0.98), matrix = new THREE.Matrix4();
    for (const [parity, color] of [[0, '#f5edd5'], [1, '#e3e6ce']]) {
      const tiles = new THREE.InstancedMesh(geometry, mat(color), 48); let index = 0;
      for (let x = 0; x < 12; x++) for (let z = 0; z < 8; z++) if ((x + z) % 2 === parity) { matrix.makeTranslation(x - 5.5, 0.075, z - 3.5); tiles.setMatrixAt(index++, matrix); }
      tiles.receiveShadow = true; w.add(tiles);
    }
    box(w, 12.1, 0.32, 0.18, '#8aaa89', 0, 0.12, 4.18, 0.06);
    box(w, 0.18, 0.35, 8.1, '#8aaa89', -6, 0.15, 0, 0.06); box(w, 0.18, 0.35, 8.1, '#8aaa89', 6, 0.15, 0, 0.06);
    box(w, 12.1, 2.65, 0.25, '#e8d9ae', 0, 1.3, -4.12, 0.08);
    box(w, 12.15, 0.14, 0.35, '#bfbb8e', 0, 2.64, -4.11, 0.04);
    box(w, 12, 0.12, 0.35, '#8fa586', 0, 0.16, -3.96, 0.03);
    for (const x of [-3.55, 3.55]) {
      box(w, 2.55, 1.48, 0.12, '#709b85', x, 1.78, -3.94, 0.12);
      box(w, 2.35, 1.29, 0.13, '#bad9c9', x, 1.8, -3.84, 0.08);
      box(w, 2.45, 0.09, 0.18, '#fff1d6', x, 1.77, -3.73, 0.025);
      box(w, 0.09, 1.37, 0.18, '#fff1d6', x, 1.77, -3.73, 0.025);
      box(w, 2.68, 0.11, 0.38, '#e0bb82', x, 1.04, -3.78, 0.04);
      for (let j = 0; j < 3; j++) sphere(w, 0.24, j % 2 ? '#a3bf94' : '#95b889', x + (j - 1) * 0.6, 1.24, -3.71, 1.5, 0.8, 0.5);
    }
    const sign = box(w, 3.18, 0.76, 0.13, '#668f7d', 0, 2.21, -3.86, 0.11);
    const signFace = new THREE.Mesh(new THREE.PlaneGeometry(2.92, 0.68), new THREE.MeshBasicMaterial({ map: labelTexture('lunch club') })); signFace.position.set(0, 2.21, -3.781); w.add(signFace);
    box(w, 3.3, 0.08, 0.15, '#f0ce98', 0, 1.79, -3.75);
    plant(w, -5.42, 1.02, -3.53, 0.8); plant(w, 5.48, 1.02, -3.52, 0.9);
    const awning = group(w, 0, 2.96, -3.85); awning.rotation.x = -0.15;
    for (let i = 0; i < 16; i++) box(awning, 0.765, 0.08, 0.83, i % 2 ? '#f8edd2' : '#e79472', (i - 7.5) * 0.76, 0, 0.16, 0.025);
    for (const x of [-5.76, 5.76]) cylinder(w, 0.07, 0.07, 2.5, '#95aa86', x, 1.34, -3.82, 12);
    box(w, 0.9, 0.1, 0.8, '#d5ba8b', 5.18, 0.18, 2.63, 0.08); plant(w, 5.18, 0.25, 2.63, 1.5);
    box(w, 0.9, 0.1, 0.8, '#d5ba8b', -5.18, 0.18, 2.63, 0.08); plant(w, -5.18, 0.25, 2.63, 1.3);
    const matRug = box(w, 2.5, 0.018, 0.75, '#dfac80', 0, 0.11, 3.12, 0.1); matRug.castShadow = false;
    for (let i = 0; i < 5; i++) { const m = box(w, 0.025, 0.022, 0.55, '#f1cea0', (i - 2) * 0.45, 0.124, 3.12, 0.003); m.castShadow = false; }
  }
  buildStations() {
    for (const s of STATIONS) {
      const g = group(this.world, s.x, 0, s.z);
      if (s.kind === 'trash') {
        cylinder(g, 0.4, 0.33, 0.88, '#8aa177', 0, 0.53, 0, 16);
        torus(g, 0.4, 0.05, '#5f7e60', 0, 0.98); cylinder(g, 0.31, 0.31, 0.035, '#45624e', 0, 0.94);
        box(g, 0.35, 0.28, 0.05, '#c2d2a5', 0, 0.57, 0.34, 0.06);
        const leaf = sphere(g, 0.09, '#5f7e60', 0, 0.6, 0.38, 0.6, 1.3, 0.1); leaf.rotation.z = -0.5;
      } else {
        box(g, s.w - 0.1, 0.82, s.d - 0.08, s.kind === 'serve' ? '#e99068' : palette.mint, 0, 0.6, 0, 0.08);
        box(g, s.w + 0.04, 0.17, s.d + 0.05, palette.cream, 0, 1.08, 0, 0.07);
        box(g, s.w - 0.16, 0.09, s.d - 0.15, palette.mintDark, 0, 0.18, 0, 0.035);
        if (s.kind !== 'counter') {
          box(g, s.w - 0.25, 0.45, 0.04, s.kind === 'serve' ? '#efaa7b' : '#96bbaa', 0, 0.58, s.d / 2 - 0.024, 0.04);
          box(g, 0.27, 0.045, 0.065, '#d9d4ad', 0, 0.77, s.d / 2 + 0.01, 0.018);
        }
      }
      if (s.kind === 'supply') {
        box(g, 1.22, 0.075, 1.04, palette.woodDark, 0, 1.2);
        box(g, 1.28, 0.23, 0.07, palette.wood, 0, 1.31, -0.52); box(g, 1.28, 0.18, 0.07, palette.wood, 0, 1.29, 0.52);
        box(g, 0.07, 0.23, 1.1, palette.wood, -0.62, 1.31); box(g, 0.07, 0.23, 1.1, palette.wood, 0.62, 1.31);
        for (let i = 0; i < 4; i++) (s.ingredient === 'tomato' ? tomato : mushroom)(g, (i % 2 - 0.5) * 0.55, 1.24, (Math.floor(i / 2) - 0.5) * 0.5, 0.95);
      } else if (s.kind === 'board') {
        box(g, 1.18, 0.07, 0.87, palette.wood, 0, 1.215, 0, 0.09);
        cylinder(g, 0.025, 0.025, 0.012, '#a2855f', -0.48, 1.256, -0.28, 8);
        this.knife = knife(g, 0.42, 1.33, 0.1); this.knife.rotation.y = -0.15; this.knife.userData.dynamic = true;
      } else if (s.kind === 'stove') {
        box(g, 1.27, 0.07, 1.14, '#b3c4bb', 0, 1.215, 0, 0.07);
        torus(g, 0.52, 0.055, '#5d7669', 0, 1.265);
        for (const x of [-0.4, 0.4]) cylinder(g, 0.06, 0.06, 0.05, palette.dark, x, 1.29, 0.43, 12);
        this.pots.set(s.id, pot(g));
        box(g, 0.68, 0.39, 0.05, '#527e70', 0, 0.58, s.d / 2 + 0.03, 0.06);
        box(g, 0.53, 0.24, 0.03, '#3f655d', 0, 0.56, s.d / 2 + 0.061, 0.04);
      } else if (s.kind === 'plates') {
        for (let i = 0; i < 5; i++) plate(g, null, 0, 1.2 + i * 0.07);
        const spoon = box(g, 0.035, 0.035, 0.52, '#82988b', 0.49, 1.24, 0.06, 0.01); spoon.rotation.y = 0.15; sphere(g, 0.075, '#82988b', 0.45, 1.245, -0.23, 0.7, 0.2, 1.2);
      } else if (s.kind === 'serve') {
        box(g, 0.82, 0.04, 1.14, '#dfc391', 0, 1.195, 0, 0.05);
        const tray = plate(g, null, 0, 1.22, -0.19); tray.scale.setScalar(0.7);
        cylinder(g, 0.09, 0.14, 0.1, '#bcaa7a', 0, 1.26, 0.42); sphere(g, 0.11, '#f0ce81', 0, 1.33, 0.42, 1, 0.6, 1);
        box(g, 0.23, 0.08, 0.32, '#5f8978', 0.35, 1.24, -0.5, 0.02);
      }
      const anchor = group(g, 0, 1.29, 0); this.stationItems.set(s.id, { anchor, key: '' });
      const label = document.createElement('div'); label.className = 'station-label'; document.getElementById('station-labels').append(label); this.labels.set(s.id, label);
    }
  }
  batchStaticModels() {
    this.world.updateMatrixWorld(true);
    const batches = new Map(), originals = [];
    this.world.traverse(object => {
      if (!object.isMesh || object.isInstancedMesh) return;
      for (let p = object; p && p !== this.world; p = p.parent) if (p.userData.dynamic) return;
      const key = object.material.uuid + ':' + object.castShadow + ':' + object.receiveShadow;
      if (!batches.has(key)) batches.set(key, { geometries: [], material: object.material, cast: object.castShadow, receive: object.receiveShadow });
      const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
      geometry.applyMatrix4(object.matrixWorld); batches.get(key).geometries.push(geometry); originals.push(object);
    });
    for (const batch of batches.values()) {
      const geometry = mergeGeometries(batch.geometries, false);
      if (!geometry) throw new Error('Could not batch original kitchen geometry');
      const mesh = new THREE.Mesh(geometry, batch.material); mesh.castShadow = batch.cast; mesh.receiveShadow = batch.receive; this.world.add(mesh);
      for (const source of batch.geometries) source.dispose();
    }
    for (const object of originals) object.removeFromParent();
  }
  resize() {
    const width = window.innerWidth, height = window.innerHeight, aspect = width / height;
    this.renderer.setSize(width, height, false); this.width = width; this.height = height;
    const vertical = Math.max(height < 500 ? 9.25 : 9.65, 13.7 / aspect);
    this.camera.left = -vertical * aspect / 2; this.camera.right = vertical * aspect / 2; this.camera.top = vertical / 2; this.camera.bottom = -vertical / 2;
    this.camera.updateProjectionMatrix();
  }
  update(game, dt) {
    this.time += Math.min(dt, 0.05); const t = this.time, c = this.chef;
    if (this.lastPhase !== game.phase) { this.shadowElapsed = 1; this.lastPhase = game.phase; }
    const home = game.phase === 'home';
    this.world.position.x = home && this.width > this.height ? 2.5 : 0;
    this.world.position.y = home && this.width < this.height ? -2.8 : 0;
    c.root.position.set(home ? 0.5 : game.player.x, 0.09, home ? 2.35 : game.player.z);
    let target = home ? 0.08 : game.player.angle;
    const diff = Math.atan2(Math.sin(target - c.root.rotation.y), Math.cos(target - c.root.rotation.y)); c.root.rotation.y += diff * Math.min(1, dt * 14);
    const walking = game.phase === 'playing' && game.player.moving;
    const stride = !this.reducedMotion && walking ? Math.sin(t * 15) : 0;
    c.legs[0].rotation.x = stride * 0.65; c.legs[1].rotation.x = -stride * 0.65;
    c.body.position.y = 0.02 + (!this.reducedMotion ? walking ? Math.abs(stride) * 0.045 : Math.sin(t * 2.5) * 0.012 : 0);
    const chopping = game.phase === 'playing' && game.chopping;
    c.arms.forEach((arm, i) => { arm.rotation.x = game.hand ? -0.95 : chopping ? -0.65 + Math.sin(t * 18 + i) * 0.38 : stride * (i === 0 ? 0.5 : -0.5); });
    if (this.knife) { this.knife.position.y = 1.33 + (chopping && !this.reducedMotion ? Math.max(0, Math.sin(t * 18)) * 0.27 : 0); this.knife.rotation.x = chopping ? Math.sin(t * 18) * 0.3 : 0; }
    const handKey = game.hand ? [game.hand.kind, game.hand.type, game.hand.prepared, game.hand.recipe].join(':') : '';
    if (handKey !== this.lastHand) { c.carried.clear(); if (game.hand) c.carried.add(itemModel(game.hand)); this.lastHand = handKey; }
    for (const s of STATIONS) {
      const state = game.stations[s.id], item = state.item, target = this.stationItems.get(s.id);
      const key = item ? [item.kind, item.type, item.prepared, item.recipe].join(':') : '';
      if (key !== target.key) { target.anchor.clear(); if (item) target.anchor.add(itemModel(item)); target.key = key; }
      if (s.kind === 'stove') {
        const pot = this.pots.get(s.id), occupied = state.ingredients.length > 0;
        pot.liquid.visible = occupied;
        if (occupied) pot.liquid.material.color.set(state.status === 'burnt' ? '#67594a' : RECIPES[recipeFor(state.ingredients)]?.color || '#df9465');
        pot.indicator.material.color.set(state.status === 'ready' ? '#a6cd70' : state.status === 'burnt' ? '#ed7550' : state.status === 'cooking' ? '#efc461' : '#aab9a3');
        pot.indicator.material.emissive.set(state.status === 'ready' ? '#4f681b' : '#000000'); pot.indicator.material.emissiveIntensity = state.status === 'ready' ? 0.25 : 0;
        pot.bubbles.forEach((bubble, i) => { bubble.visible = state.status === 'cooking' && !this.reducedMotion; bubble.scale.setScalar(0.65 + Math.sin(t * 5 + i * 1.6) * 0.35); });
        pot.steam.forEach((steam, i) => {
          steam.visible = ['cooking', 'ready', 'burnt'].includes(state.status) && !this.reducedMotion;
          const phase = (t * 0.65 + i / 4) % 1; steam.position.set(Math.sin(t * 2 + i) * 0.13, 0.45 + phase * 0.85, Math.cos(i * 2) * 0.12); steam.scale.setScalar(0.5 + phase); steam.material.opacity = Math.sin(phase * Math.PI) * (state.status === 'burnt' ? 0.5 : 0.27); steam.material.color.set(state.status === 'burnt' ? '#645f50' : '#fff5df');
        });
      }
    }
    const nearest = STATIONS.find(s => s.id === game.nearest);
    this.highlight.visible = game.phase === 'playing' && Boolean(nearest) && nearest.kind !== 'trash';
    if (nearest) { this.highlight.position.set(nearest.x, 1.178, nearest.z); this.highlight.scale.set(nearest.w / 1.65, 1, nearest.d / 1.55); }
    if (this.celebration > 0) this.celebration -= dt;
    this.confetti.forEach((m, i) => {
      m.visible = this.celebration > 0 && !this.reducedMotion;
      if (m.visible) { const age = 1.6 - this.celebration; const a = i * 2.399; m.position.set(game.player.x + Math.cos(a) * age * 1.2, 1.1 + Math.sin(age * Math.PI / 1.6) * (1.3 + i % 3 * 0.3), game.player.z + Math.sin(a) * age * 0.8); m.rotation.set(age * 5, a, age * 3); }
    });
    this.world.updateMatrixWorld(true);
    this.updateLabels(game);
    this.shadowElapsed += dt;
    if (this.shadowElapsed > 0.1) { this.renderer.shadowMap.needsUpdate = true; this.shadowElapsed = 0; }
    this.renderer.render(this.scene, this.camera);
  }
  updateLabels(game) {
    const short = { tomato: 'Tomato', mushroom: 'Mushroom', board: 'Chop', 'stove-a': 'Pot 1', 'stove-b': 'Pot 2', plates: 'Plates', serve: 'Serve →', trash: 'Compost', 'counter-a': 'Set down', 'counter-b': 'Set down' };
    const point = new THREE.Vector3();
    for (const s of STATIONS) {
      const label = this.labels.get(s.id), state = game.stations[s.id];
      point.set(s.x + this.world.position.x, (s.kind === 'stove' ? 2.06 : s.kind === 'supply' ? 1.83 : 1.64) + this.world.position.y, s.z).project(this.camera);
      label.style.left = (point.x * 0.5 + 0.5) * this.width + 'px'; label.style.top = (-point.y * 0.5 + 0.5) * this.height + 'px';
      let text = short[s.id], progress = null;
      if (s.kind === 'board' && state.item && !state.item.prepared) { text = 'Chopping'; progress = (state.item.chop || 0) / CONFIG.chopTime; }
      if (s.kind === 'board' && state.item?.prepared) text = 'Chopped ✓';
      if (s.kind === 'stove' && state.status === 'cooking') { text = 'Simmering'; progress = state.cook / CONFIG.cookTime; }
      if (s.kind === 'stove' && state.status === 'ready') { text = 'Ready ✓'; progress = 1 - state.readyAge / CONFIG.burnTime; }
      if (s.kind === 'stove' && state.status === 'burnt') text = 'Burnt! Clear';
      const html = text + (progress !== null ? '<span class="station-progress"><i style="width:' + Math.round(progress * 100) + '%"></i></span>' : '');
      if (label.innerHTML !== html) label.innerHTML = html;
      label.className = 'station-label' + (game.nearest === s.id ? ' focused' : '') + (progress !== null ? ' progress' : '') + (state.status === 'ready' || state.item?.prepared ? ' ready' : '') + (state.status === 'burnt' ? ' burnt' : '');
      label.style.display = game.phase === 'home' || (s.kind === 'counter' && game.nearest !== s.id && !state.item) ? 'none' : '';
    }
  }
  celebrate() { this.celebration = 1.6; }
  project(x, z, y = 0.1) { const p = new THREE.Vector3(x, y, z).project(this.camera); return { x: (p.x * 0.5 + 0.5) * this.width, y: (-p.y * 0.5 + 0.5) * this.height }; }
  info() { return { threeRevision: THREE.REVISION, camera: this.camera.type, meshes: this.renderer.info.render.calls, triangles: this.renderer.info.render.triangles, width: this.width, height: this.height, context: Boolean(this.renderer.getContext()), renderer: this.graphicsDevice, softwareRendering: this.softwareRendering, pixelRatio: this.renderer.getPixelRatio() }; }
}
