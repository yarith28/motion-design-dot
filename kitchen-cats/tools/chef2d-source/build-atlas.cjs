/*
 * Repack the original painterly cat poses into a phone-friendly, aligned atlas.
 * This is a geometry/alpha cleanup pass: it does not redraw any artwork.
 * Run from the repository root: node tools/chef2d-source/build-atlas.cjs
 */
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..', '..');
const sources = {
  cream: path.join(root, 'assets/cream-chef-pose-atlas.png'),
  tabby: path.join(__dirname, 'tabby-dense-original-style.png'),
  gray: path.join(__dirname, 'gray-dense-original-style.png'),
  tuxedo: path.join(__dirname, 'tuxedo-dense-original-style.png'),
};
const safeRows = {
  gray: { 0: 'gray-walk-safe.png', 3: 'gray-celebrate-safe.png' },
  tuxedo: { 0: 'tuxedo-walk-safe.png', 3: 'tuxedo-celebrate-safe.png' },
};
// ImageGen-edited source poses restore ear tips missing in the original dense
// sheet cells. All other original source poses remain intact.
const repairedCells = {
  cream: { 14: 'cream-serve14-repaired.png' },
  tabby: { 13: 'tabby-serve13-repaired.png' },
};
const cell = 320, columns = 4, footY = 311;

function extractCell(raw, width, height, sourceIndex, sourceColumns, sourceRows, index) {
  const col = sourceIndex % sourceColumns, row = Math.floor(sourceIndex / sourceColumns);
  const x0 = Math.round(col * width / sourceColumns), x1 = Math.round((col + 1) * width / sourceColumns);
  const y0 = Math.round(row * height / sourceRows), y1 = Math.round((row + 1) * height / sourceRows);
  const w = x1 - x0, h = y1 - y0;
  const rgba = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    raw.copy(rgba, y * w * 4, ((y0 + y) * width + x0) * 4,
      ((y0 + y) * width + x1) * 4);
  }
  return { rgba, w, h, index };
}

function cleanCell(frame) {
  const { rgba, w, h } = frame;
  const labels = new Int32Array(w * h), comps = [];
  const queue = new Int32Array(w * h);
  for (let pixel = 0; pixel < w * h; pixel++) {
    if (labels[pixel] || rgba[pixel * 4 + 3] < 72) continue;
    const id = comps.length + 1;
    let first = 0, last = 0, left = w, top = h, right = 0, bottom = 0;
    queue[last++] = pixel; labels[pixel] = id;
    while (first < last) {
      const p = queue[first++], x = p % w, y = Math.floor(p / w);
      left = Math.min(left, x); right = Math.max(right, x + 1);
      top = Math.min(top, y); bottom = Math.max(bottom, y + 1);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || xx >= w || yy < 0 || yy >= h) continue;
        const q = yy * w + xx;
        if (!labels[q] && rgba[q * 4 + 3] >= 72) {
          labels[q] = id; queue[last++] = q;
        }
      }
    }
    comps.push({ id, area: last, left, top, right, bottom });
  }
  comps.sort((a, b) => b.area - a.area);
  const main = comps[0];
  if (!main || main.area < 1000) throw new Error(`No cat in source frame ${frame.index}`);
  // Keep substantial disconnected garnish or effects near the character, but
  // drop the scattered semiopaque pixels in the generated/source sheet gutters.
  const keep = new Set([main.id]);
  for (const c of comps.slice(1)) {
    const dx = Math.max(0, main.left - c.right, c.left - main.right);
    const dy = Math.max(0, main.top - c.bottom, c.top - main.bottom);
    // A neighbor frame can spill a tiny tip across an old 4x4 row seam.
    // Such detached components are not part of this character's pose.
    const atSeam = c.left < 3 || c.right > w - 3 || c.top < 3 || c.bottom > h - 3;
    if (c.area >= 45 && dx <= 28 && dy <= 28 && !atSeam) keep.add(c.id);
  }
  const near = new Uint8Array(w * h);
  for (let p = 0; p < w * h; p++) if (keep.has(labels[p])) {
    const x = p % w, y = Math.floor(p / w);
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx >= 0 && xx < w && yy >= 0 && yy < h) near[yy * w + xx] = 1;
    }
  }
  let left = w, top = h, right = 0, bottom = 0;
  for (let p = 0; p < w * h; p++) {
    const a = rgba[p * 4 + 3];
    if (!near[p] || a < 24) {
      rgba.fill(0, p * 4, p * 4 + 4);
      continue;
    }
    if (a >= 48) {
      const x = p % w, y = Math.floor(p / w);
      left = Math.min(left, x); right = Math.max(right, x + 1);
      top = Math.min(top, y); bottom = Math.max(bottom, y + 1);
    }
  }
  if (right <= left || bottom <= top) throw new Error(`Empty cleaned frame ${frame.index}`);
  return { ...frame, bbox: { left, top, right, bottom }, mainArea: main.area, keptComponents: keep.size };
}

async function packCat(cat) {
  const dense = await sharp(sources[cat]).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (dense.info.width !== 1254 || dense.info.height !== 1254) throw new Error(`${cat}: unexpected source size`);
  const overrides = {};
  for (const [row, name] of Object.entries(safeRows[cat] || {}))
    overrides[row] = await sharp(path.join(__dirname, name)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const frames = [];
  for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
    const source = overrides[row] || dense;
    const safe = !!overrides[row];
    frames.push(cleanCell(extractCell(source.data, source.info.width, source.info.height,
      safe ? col : row * 4 + col, safe ? 2 : 4, safe ? 2 : 4, row * 4 + col)));
  }
  // Dense sheets share one subject scale. Safe replacement sheets are larger,
  // so normalize their rows separately to the same visible phone-scale height.
  const rowScale = [];
  for (let row = 0; row < 4; row++) {
    const group = safeRows[cat] ? frames.slice(row * 4, row * 4 + 4) : frames;
    const heights = group.map(f => f.bbox.bottom - f.bbox.top).sort((a, b) => a - b);
    const medianHeight = (heights[Math.floor((heights.length - 1) / 2)] + heights[Math.floor(heights.length / 2)]) / 2;
    const maxWidth = Math.max(...group.map(f => f.bbox.right - f.bbox.left));
    const maxHeight = Math.max(...group.map(f => f.bbox.bottom - f.bbox.top));
    // Leave >=8 transparent source pixels on every side of each shipped cell.
    rowScale[row] = Math.min(300 / medianHeight, 303 / maxHeight, 300 / maxWidth);
  }
  for (const [indexText, name] of Object.entries(repairedCells[cat] || {})) {
    const index = Number(indexText), original = frames[index];
    const originalHeight = original.bbox.bottom - original.bbox.top;
    const targetHeight = Math.round(originalHeight * rowScale[Math.floor(index / 4)]);
    const edit = await sharp(path.join(__dirname, name)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    frames[index] = cleanCell(extractCell(edit.data, edit.info.width, edit.info.height,
      0, 1, 1, index));
    frames[index].targetHeight = targetHeight;
  }
  const overlays = [], metrics = [];
  for (const f of frames) {
    const b = f.bbox;
    const srcW = b.right - b.left, srcH = b.bottom - b.top;
    const scale = f.targetHeight
      ? Math.min(f.targetHeight / srcH, 303 / srcH, 300 / srcW)
      : rowScale[Math.floor(f.index / 4)];
    const targetW = Math.round(srcW * scale), targetH = Math.round(srcH * scale);
    const left = Math.round((cell - targetW) / 2);
    const top = footY - targetH;
    if (left < 0 || top < 0 || left + targetW > cell || top + targetH > cell)
      throw new Error(`${cat} frame ${f.index} won't fit ${JSON.stringify({b,scale,targetW,targetH,left,top})}`);
    const cropped = await sharp(f.rgba, { raw: { width: f.w, height: f.h, channels: 4 } })
      .extract({ left: b.left, top: b.top, width: srcW, height: srcH })
      .resize(targetW, targetH, { kernel: sharp.kernel.lanczos3 })
      .png().toBuffer();
    overlays.push({ input: cropped, left: (f.index % columns) * cell + left,
      top: Math.floor(f.index / columns) * cell + top });
    metrics.push({ frame: f.index, sourceBounds: [b.left,b.top,b.right,b.bottom],
      atlasBounds: [left,top,left+targetW,top+targetH], components: f.keptComponents });
  }
  const out = path.join(root, `assets/chef2d-${cat}-atlas.webp`);
  await sharp({ create: { width: 1280, height: 1280, channels: 4,
    background: {r:0,g:0,b:0,alpha:0} } }).composite(overlays)
    .webp({ lossless: true, effort: 4 }).toFile(out);
  return { cat, sources: [path.relative(root, sources[cat]),
      ...Object.values(safeRows[cat] || {}).map(name => path.relative(root, path.join(__dirname, name))),
      ...Object.values(repairedCells[cat] || {}).map(name => path.relative(root, path.join(__dirname, name)))],
    file: path.relative(root, out),
    bytes: fs.statSync(out).size, rowScale: rowScale.map(n => +n.toFixed(4)), metrics };
}

(async () => {
  const cats = [];
  for (const cat of Object.keys(sources)) cats.push(await packCat(cat));
  const manifest = {
    version: 1,
    note: 'Original 2D Kitchen Cats artwork. Idle/carry use exact tracked portrait PNGs; atlas contains real pose changes.',
    cats: Object.fromEntries(cats.map(c => [c.cat, { portrait: `./assets/cat-${c.cat}.png`,
      atlas: `./${c.file}`, sources: c.sources, bytes: c.bytes, rowScale: c.rowScale,
      frames: c.metrics }])),
    cellWidth: cell, cellHeight: cell, columns, rows: 4,
    footY, drawHeight: 122, portraitDrawHeight: 116,
    poses: {
      idle: { source: 'portrait', frames: [0], frameMs: 0, loop: false },
      walk: { source: 'atlas', frames: [0,1,2,3], frameMs: 125, loop: true },
      chop: { source: 'atlas', frames: [4,5,6,7], frameMs: 125, loop: true },
      stir: { source: 'atlas', frames: [8,9,10,11], frameMs: 125, loop: true },
      carry: { source: 'portrait', frames: [0], frameMs: 0, loop: false },
      carrywalk: { source: 'atlas', frames: [0,1,2,3], frameMs: 125, loop: true },
      celebrate: { source: 'atlas', frames: [12,13,14,15], frameMs: 125, loop: false },
    },
  };
  fs.writeFileSync(path.join(root, 'assets/chef2d-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  for (const c of cats) console.log(`${c.cat}: ${c.bytes} bytes, row scales ${c.rowScale.join(',')}, atlas ${c.file}`);
})().catch(e => { console.error(e); process.exitCode = 1; });
