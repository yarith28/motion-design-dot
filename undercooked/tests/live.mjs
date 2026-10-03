import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

const repo = 'yarith28/motion-design-dot';
const commit = process.env.GITHUB_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const base = 'https://yarith28.github.io/motion-design-dot/undercooked/';
const headers = { Accept: 'application/vnd.github+json' };
if (process.env.GITHUB_TOKEN) headers.Authorization = 'Bearer ' + process.env.GITHUB_TOKEN;
const release = JSON.parse(await readFile(new URL('../assets/release.json', import.meta.url), 'utf8'));
const evidence = { commit, base, assets: {}, pages: null, verifiedAt: null };
let last = 'Waiting for Pages';
const deadline = Date.now() + 12 * 60 * 1000;
while (Date.now() < deadline) {
  try {
    const response = await fetch('https://api.github.com/repos/' + repo + '/actions/runs?head_sha=' + commit + '&per_page=50', { headers, signal: AbortSignal.timeout(20000) });
    assert.ok(response.ok, 'Actions API HTTP ' + response.status);
    const data = await response.json();
    const run = data.workflow_runs.find(r => r.head_sha === commit && (r.name === 'pages build and deployment' || r.path?.includes('pages-build-deployment')));
    assert.ok(run, 'Pages workflow for exact commit not visible yet');
    assert.equal(run.status, 'completed', 'Exact Pages workflow is ' + run.status);
    assert.equal(run.conclusion, 'success', 'Exact Pages workflow concluded ' + run.conclusion);
    evidence.pages = { id: run.id, head_sha: run.head_sha, conclusion: run.conclusion, url: run.html_url };
    for (const [asset, expected] of Object.entries(release.assets)) {
      const live = await fetch(new URL(asset + '?release=' + commit, base), { cache: 'no-store', signal: AbortSignal.timeout(20000) });
      assert.ok(live.ok, asset + ': HTTP ' + live.status);
      const bytes = new Uint8Array(await live.arrayBuffer());
      const actual = createHash('sha256').update(bytes).digest('hex');
      assert.equal(actual, expected, asset + ': published bytes differ');
      evidence.assets[asset] = { sha256: actual, bytes: bytes.length };
    }
    evidence.verifiedAt = new Date().toISOString();
    await mkdir(new URL('../test-results/', import.meta.url), { recursive: true });
    await writeFile(new URL('../test-results/live-assets.json', import.meta.url), JSON.stringify(evidence, null, 2) + '\n');
    console.log(JSON.stringify(evidence, null, 2));
    process.exit(0);
  } catch (error) { last = error.message; console.log('Waiting for exact live release: ' + last); }
  await new Promise(resolve => setTimeout(resolve, 10000));
}
throw new Error('Live verification timed out: ' + last);
