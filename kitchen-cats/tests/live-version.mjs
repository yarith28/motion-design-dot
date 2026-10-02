// Run from the exact release checkout after browser gates. Compare every
// precached product file with Pages; a successful deployment alone isn't proof
// that a CDN or service worker is serving this build.
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const base = process.env.BASE_URL || 'https://yarith28.github.io/motion-design-dot/kitchen-cats/';
const sw = await readFile(new URL('sw.js', root), 'utf8');
const version = /const VERSION = "([^"]+)"/.exec(sw)[1];
const assets = [...sw.match(/const ASSETS = \[([\s\S]*?)\];/)[1].matchAll(/"(\.\/[^"\n]*)"/g)].map(m => m[1]);
assets.push('./sw.js');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const expected = await Promise.all(assets.map(async path => ({
  path, hash: digest(await readFile(new URL(path === './' ? 'index.html' : path, root))),
})));
const deadline = Date.now() + 300000;
let mismatches;
do {
  mismatches = (await Promise.all(expected.map(async ({ path, hash }) => {
    const url = new URL(path, base);
    url.searchParams.set('verify', process.env.GITHUB_SHA || version);
    try {
      const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
      if (!response.ok) return `${path}: HTTP ${response.status}`;
      return digest(Buffer.from(await response.arrayBuffer())) === hash ? null : `${path}: content mismatch`;
    } catch (error) { return `${path}: ${error.message}`; }
  }))).filter(Boolean);
  if (!mismatches.length) break;
  console.log(`Waiting for Pages: ${mismatches.join(', ')}`);
  if (Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 10000));
} while (Date.now() < deadline);
if (mismatches.length) throw Error(`Deployed files differ from ${fileURLToPath(root)}: ${mismatches.join(', ')}`);
console.log(`PASS deployed ${version}: ${assets.length} product files match checkout ${process.env.GITHUB_SHA || '(local)'} byte-for-byte at ${base}`);
