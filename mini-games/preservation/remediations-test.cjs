'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const preservation = require('./verify.cjs');

const root = path.resolve(__dirname, '../..');
const {PINNED} = preservation;
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const original = fs.readFileSync(path.join(root, PINNED.archivePath));
const current = fs.readFileSync(path.join(root, PINNED.path));
const manifest = JSON.parse(fs.readFileSync(path.join(root, preservation.MANIFEST_PATH), 'utf8'));
const sourceFiles = [
  PINNED.path, PINNED.archivePath, preservation.MANIFEST_PATH,
  'mini-games/preservation/verify.cjs', 'mini-games/preservation/remediations-test.cjs',
  'mini-games/tests/preservation.cjs',
  ...[200, 300, 400].map(n => 'mini-games/tests/preservation' + n + '.cjs'),
  ...[100, 200, 300, 400].map(n => 'mini-games/tests/fixtures/baseline' + n + '.json')
];
const snapshot = () => Object.fromEntries(sourceFiles.map(file => [file, hash(fs.readFileSync(path.join(root, file)))]));
const sourceBefore = snapshot();
const cases = [];
function positive(name, action) {
  action();
  cases.push({name, kind: 'accept', passed: true});
}
function negative(name, action, message) {
  assert.throws(action, message, 'Must reject: ' + name);
  cases.push({name, kind: 'reject', passed: true});
}
const cloneManifest = () => JSON.parse(JSON.stringify(manifest));
function changed(bytes, at) {
  const result = Buffer.from(bytes);
  result[at] ^= 1;
  return result;
}

positive('Pinned archive and runtime hashes match the held repair', () => {
  assert.equal(hash(original), PINNED.beforeSha256);
  assert.equal(hash(current), PINNED.afterSha256);
  preservation.verifyRemediation({root});
});
positive('Every byte outside Arrow Audit init is identical', () => {
  const scope = preservation.assertInitOnlyChange(original, current);
  assert(scope.unchangedPrefixBytes > 0 && scope.unchangedSuffixBytes > 0);
});

const startAt = current.indexOf(PINNED.startMarker);
const initAt = startAt + Buffer.byteLength(PINNED.startMarker);
const renderAt = current.indexOf(PINNED.endMarker, initAt);
negative('Prefix change outside init', () => preservation.assertInitOnlyChange(original, changed(current, 0)), /before Arrow Audit init changed/);
negative('Render/check suffix change outside init', () => preservation.assertInitOnlyChange(original, changed(current, renderAt + Buffer.byteLength(PINNED.endMarker) + 5)), /render onward changed/);
negative('Trailing unrelated engine bytes changed', () => preservation.assertInitOnlyChange(original, Buffer.concat([current, Buffer.from('\n')])), /render onward changed/);
negative('Missing target marker', () => preservation.assertInitOnlyChange(original, Buffer.from(current.toString().replace(PINNED.startMarker, "E['wrong-game']={init(stage){"))), /init marker missing/);
negative('More than one target registration', () => preservation.assertInitOnlyChange(original, Buffer.concat([current, Buffer.from(PINNED.startMarker)])), /exactly once/);

for (const [name, mutate] of [
  ['Another runtime path', m => {m.exceptions[0].path = 'mini-games/puzzle-lab/room.js';}],
  ['Wrong original hash', m => {m.exceptions[0].beforeSha256 = '0'.repeat(64);}],
  ['Unpinned repaired hash', m => {m.exceptions[0].afterSha256 = '0'.repeat(64);}],
  ['Wrong archive path', m => {m.exceptions[0].archivePath = PINNED.path;}],
  ['Wrong archive hash', m => {m.exceptions[0].archiveSha256 = PINNED.afterSha256;}],
  ['Expanded change boundary', m => {m.exceptions[0].endMarker = 'window.PuzzleEngines';}],
  ['A second exception', m => {m.exceptions.push({...m.exceptions[0], path: 'mini-games/puzzle-lab/room.js'});}],
  ['Removed exception', m => {m.exceptions = [];}],
  ['Unknown manifest schema', m => {m.schemaVersion = 2;}]
]) {
  negative(name, () => {
    const altered = cloneManifest(); mutate(altered);
    preservation.verifyRemediation({root, manifest: altered});
  }, /Only the pinned single/);
}

const scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'arcade-arrow-preservation-'));
function write(file, bytes) {
  const destination = path.join(scratchRoot, file);
  fs.mkdirSync(path.dirname(destination), {recursive: true});
  fs.writeFileSync(destination, bytes);
}
function resetScratch() {
  write(PINNED.path, current);
  write(PINNED.archivePath, original);
  write(preservation.MANIFEST_PATH, JSON.stringify(manifest));
  write('mini-games/unrelated.js', Buffer.from('Unrelated strict baseline.\n'));
}
try {
  resetScratch();
  positive('A genuine single remediation and unrelated exact file', () => {
    const result = preservation.verifyRuntimeFiles({
      [PINNED.path]: PINNED.beforeSha256,
      'mini-games/unrelated.js': hash(Buffer.from('Unrelated strict baseline.\n'))
    }, {root: scratchRoot});
    assert.equal(result.checkedFiles, 2);
    assert.equal(result.exactFiles, 1);
    assert.equal(result.intentionalRemediations.length, 1);
  });
  negative('Changed archive bytes even within init', () => {
    write(PINNED.archivePath, changed(original, original.indexOf(PINNED.startMarker) + Buffer.byteLength(PINNED.startMarker) + 1));
    preservation.verifyRemediation({root: scratchRoot});
  }, /archive changed/);
  resetScratch();
  negative('Different live init is not authorized by scope alone', () => {
    write(PINNED.path, changed(current, initAt + 1));
    preservation.verifyRemediation({root: scratchRoot});
  }, /remediation changed/);
  resetScratch();
  negative('Altered immutable fixture hash replaced with current hash', () => preservation.verifyRuntimeFiles({[PINNED.path]: PINNED.afterSha256}, {root: scratchRoot}), /Immutable original/);
  negative('Altered immutable fixture hash replaced with arbitrary hash', () => preservation.verifyRuntimeFiles({[PINNED.path]: '0'.repeat(64)}, {root: scratchRoot}), /Immutable original/);
  negative('A second changed runtime cannot borrow the exception', () => {
    const beforeHash = hash(fs.readFileSync(path.join(scratchRoot, 'mini-games/unrelated.js')));
    write('mini-games/unrelated.js', Buffer.from('Altered unrelated runtime.\n'));
    preservation.verifyRuntimeFiles({[PINNED.path]: PINNED.beforeSha256, 'mini-games/unrelated.js': beforeHash}, {root: scratchRoot});
  }, /Exact baseline source changed/);
  resetScratch();
  negative('Path traversal in a baseline file map', () => preservation.verifyRuntimeFiles({'../outside.js': '0'.repeat(64)}, {root: scratchRoot}), /traverse/);
} finally {
  fs.rmSync(scratchRoot, {recursive: true, force: true});
}

positive('Historical 300 and 400 audits resolve the original archive only', () => {
  for (const baseline of [300, 400]) {
    const resolved = preservation.resolveHistoricalSource(PINNED.path, PINNED.beforeSha256, {root, baseline});
    assert.equal(resolved.historicalArchive, true);
    assert.equal(resolved.resolvedPath, PINNED.archivePath);
    assert.equal(hash(fs.readFileSync(resolved.absolutePath)), PINNED.beforeSha256);
  }
});
positive('Current 500 audit resolves the repaired live source', () => {
  const resolved = preservation.resolveCurrentSource(PINNED.path, PINNED.afterSha256, {root});
  assert.equal(resolved.historicalArchive, false);
  assert.equal(resolved.resolvedPath, PINNED.path);
});
negative('Current audit cannot resolve the old hash through the archive', () => preservation.resolveCurrentSource(PINNED.path, PINNED.beforeSha256, {root}), /Current audited source changed/);
negative('Historical resolver cannot be invoked for 500', () => preservation.resolveHistoricalSource(PINNED.path, PINNED.beforeSha256, {root, baseline: 500}), /only for the historical 300\/400/);
negative('Historical resolver requires an explicit allowed snapshot', () => preservation.resolveHistoricalSource(PINNED.path, PINNED.beforeSha256, {root}), /only for the historical 300\/400/);
negative('Historical resolver cannot rewrite the original source hash', () => preservation.resolveHistoricalSource(PINNED.path, PINNED.afterSha256, {root, baseline: 300}), /retain its original hash/);

const baselines = [];
for (const size of [200, 300, 400]) {
  positive('Actual immutable ' + size + ' runtime baseline', () => {
    const fixture = JSON.parse(fs.readFileSync(path.join(root, 'mini-games/tests/fixtures/baseline' + size + '.json'), 'utf8'));
    const result = preservation.verifyRuntimeFiles(fixture.files, {root});
    assert.equal(result.intentionalRemediations.length, 1);
    assert.equal(result.exactFiles, result.checkedFiles - 1);
    baselines.push({games: size, checkedFiles: result.checkedFiles, exactFiles: result.exactFiles, intentionalRemediations: 1});
  });
}
const sourceAfter = snapshot();
assert.deepEqual(sourceAfter, sourceBefore, 'Checked sources and immutable baseline fixtures changed during verification');
console.log(JSON.stringify({
  passed: true,
  positiveChecks: cases.filter(c => c.kind === 'accept').length,
  negativeChecks: cases.filter(c => c.kind === 'reject').length,
  cases,
  baselines,
  sourceBefore,
  sourceAfter,
  sourceUnchanged: true,
  scope: 'Pinned one-file init-only preservation remediation, strict other runtime hashes and historical/current source separation; no gameplay or deployment claim.'
}));
