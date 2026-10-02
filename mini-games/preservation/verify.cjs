'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_ROOT = path.resolve(__dirname, '../..');
const MANIFEST_PATH = 'mini-games/preservation/runtime-exceptions.json';
// These pins deliberately do not come from a mutable baseline or manifest.
// A changed manifest cannot silently authorize another path, version or scope.
const PINNED = Object.freeze({
  id: 'arrow-audit-generator-termination',
  path: 'mini-games/puzzle-lab/engines.js',
  beforeSha256: 'd6de5a4d7a8efe01682a384259c780a3fa88ecd75f32ffa5d9eaa46167d0ebcd',
  afterSha256: '8594a9e2f463b49188c8e4050c95fd9510360548d74a5654223b6d43902cae57',
  archivePath: 'mini-games/preservation/historical/puzzle-lab-engines.js',
  archiveSha256: 'd6de5a4d7a8efe01682a384259c780a3fa88ecd75f32ffa5d9eaa46167d0ebcd',
  startMarker: "E['arrow-audit']={init(stage){",
  endMarker: '},render(c)',
  reason: "Bound Arrow Audit's cyclic-orientation generation with a guaranteed triangle, 128 candidates and a valid fallback; preserve all bytes outside its initialization block."
});

const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

function validateRelativePath(file) {
  assert.equal(typeof file, 'string', 'Source path must be a string');
  assert(file.length > 0 && !file.includes('\\') && !file.includes('\0'), 'Invalid source path');
  assert(!path.posix.isAbsolute(file), 'Source path must be relative to the repository');
  assert(file.split('/').every(part => part && part !== '.' && part !== '..'), 'Source path must not traverse directories');
  return file;
}

function validateHash(hash) {
  assert.equal(typeof hash, 'string', 'Expected source hash must be a string');
  assert.match(hash, /^[a-f0-9]{64}$/, 'Expected source hash must be a lowercase SHA-256');
}

function validateManifest(manifest) {
  assert.deepEqual(manifest, {schemaVersion: 1, exceptions: [{...PINNED}]},
    'Only the pinned single Arrow Audit initialization remediation is authorized');
  return PINNED;
}

function splitInit(bytes, label) {
  assert(Buffer.isBuffer(bytes), label + ' source must be bytes');
  const start = Buffer.from(PINNED.startMarker);
  const end = Buffer.from(PINNED.endMarker);
  const startAt = bytes.indexOf(start);
  assert(startAt >= 0, label + ' Arrow Audit init marker missing');
  assert.equal(bytes.indexOf(start, startAt + start.length), -1,
    label + ' Arrow Audit init marker must occur exactly once');
  const bodyAt = startAt + start.length;
  const endAt = bytes.indexOf(end, bodyAt);
  assert(endAt >= bodyAt, label + ' Arrow Audit render boundary missing');
  return {
    prefix: bytes.subarray(0, bodyAt),
    init: bytes.subarray(bodyAt, endAt),
    suffix: bytes.subarray(endAt)
  };
}

function assertInitOnlyChange(beforeBytes, afterBytes) {
  const before = splitInit(beforeBytes, 'Archived');
  const after = splitInit(afterBytes, 'Current');
  assert(before.prefix.equals(after.prefix), 'Bytes before Arrow Audit init changed');
  assert(before.suffix.equals(after.suffix), 'Bytes from Arrow Audit render onward changed');
  assert(!before.init.equals(after.init), 'The pinned remediation must change Arrow Audit init');
  return {
    unchangedPrefixBytes: before.prefix.length,
    unchangedSuffixBytes: before.suffix.length,
    beforeInitBytes: before.init.length,
    afterInitBytes: after.init.length
  };
}

function verifyRemediation(options = {}) {
  const root = options.root || DEFAULT_ROOT;
  const manifest = options.manifest === undefined
    ? JSON.parse(fs.readFileSync(path.join(root, MANIFEST_PATH), 'utf8'))
    : options.manifest;
  validateManifest(manifest);
  const archive = fs.readFileSync(path.join(root, PINNED.archivePath));
  const current = fs.readFileSync(path.join(root, PINNED.path));
  assert.equal(digest(archive), PINNED.archiveSha256, 'Original Arrow Audit archive changed');
  assert.equal(digest(current), PINNED.afterSha256, 'Current Arrow Audit remediation changed');
  return {
    id: PINNED.id,
    path: PINNED.path,
    beforeSha256: PINNED.beforeSha256,
    afterSha256: PINNED.afterSha256,
    archivePath: PINNED.archivePath,
    archiveSha256: PINNED.archiveSha256,
    ...assertInitOnlyChange(archive, current),
    permittedChange: 'Arrow Audit init only; every prefix and suffix byte is identical',
    reason: PINNED.reason
  };
}

function verifyRuntimeFiles(files, options = {}) {
  assert(files && typeof files === 'object' && !Array.isArray(files), 'Baseline files must be a hash map');
  const root = options.root || DEFAULT_ROOT;
  const remediation = verifyRemediation(options);
  let exactFiles = 0;
  const intentionalRemediations = [];
  for (const [file, expected] of Object.entries(files)) {
    validateRelativePath(file);
    validateHash(expected);
    // Check the immutable old pin before considering a direct current match.
    // Replacing a baseline hash with the repaired hash must also fail.
    if (file === PINNED.path) {
      assert.equal(expected, PINNED.beforeSha256, 'Immutable original Arrow Audit baseline hash changed');
      assert.equal(digest(fs.readFileSync(path.join(root, file))), PINNED.afterSha256,
        'Current Arrow Audit remediation changed during preservation verification');
      intentionalRemediations.push(remediation);
    } else {
      assert.equal(digest(fs.readFileSync(path.join(root, file))), expected,
        'Exact baseline source changed: ' + file);
      exactFiles++;
    }
  }
  assert(intentionalRemediations.length <= 1, 'At most one intentional runtime remediation is allowed');
  return {checkedFiles: Object.keys(files).length, exactFiles, intentionalRemediations};
}

function resolveCurrentSource(file, expectedSha256, options = {}) {
  validateRelativePath(file);
  validateHash(expectedSha256);
  const root = options.root || DEFAULT_ROOT;
  const absolutePath = path.join(root, file);
  assert.equal(digest(fs.readFileSync(absolutePath)), expectedSha256,
    'Current audited source changed: ' + file);
  return {absolutePath, resolvedPath: file, sha256: expectedSha256, historicalArchive: false};
}

function resolveHistoricalSource(file, expectedSha256, options = {}) {
  assert([300, 400].includes(options.baseline),
    'Archived source resolution is permitted only for the historical 300/400 audits');
  validateRelativePath(file);
  validateHash(expectedSha256);
  if (file !== PINNED.path) return resolveCurrentSource(file, expectedSha256, options);
  assert.equal(expectedSha256, PINNED.beforeSha256, 'Historical Arrow Audit source must retain its original hash');
  verifyRemediation(options);
  const root = options.root || DEFAULT_ROOT;
  return {
    absolutePath: path.join(root, PINNED.archivePath),
    resolvedPath: PINNED.archivePath,
    sha256: PINNED.archiveSha256,
    historicalArchive: true
  };
}

module.exports = {
  PINNED,
  MANIFEST_PATH,
  validateManifest,
  assertInitOnlyChange,
  verifyRemediation,
  verifyRuntimeFiles,
  resolveHistoricalSource,
  resolveCurrentSource
};

if (require.main === module) {
  console.log(JSON.stringify({
    passed: true,
    intentionalRemediation: verifyRemediation(),
    scope: 'Exact pinned source and archive hashes plus byte-identical text outside Arrow Audit init; not gameplay evidence.'
  }));
}
