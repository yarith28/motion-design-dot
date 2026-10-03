import { build } from 'esbuild';
import { mkdir, writeFile, readFile, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
await mkdir('assets', { recursive: true });
await copyFile('node_modules/three/LICENSE', 'assets/THREE-LICENSE.txt');
await build({ entryPoints: ['src/main.js'], bundle: true, format: 'esm', target: ['es2020'], minify: true, outfile: 'assets/game.js', legalComments: 'eof' });
// Canonicalize whitespace preserved inside bundled GLSL templates.
await writeFile('assets/game.js', (await readFile('assets/game.js', 'utf8')).replace(/[\t ]+$/gm, ''));
const files = ['index.html', 'style.css', 'assets/game.js', 'assets/icon.svg', 'assets/THREE-LICENSE.txt'];
const hashes = {};
for (const path of files) hashes[path] = createHash('sha256').update(await readFile(path)).digest('hex');
await writeFile('assets/release.json', JSON.stringify({ version: '1.0.0', three: '0.170.0', assets: hashes }, null, 2) + '\n');
console.log('Bundled Undercooked with local Three.js 0.170.0.');
