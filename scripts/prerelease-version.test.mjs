import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
    parseVersionsJson,
    assertBaseNotPublished,
    computeNextRcVersion,
} from './prerelease-version.mjs';

test('parseVersionsJson handles a JSON array', () => {
    assert.deepEqual(parseVersionsJson('["1.0.0","1.0.1"]'), ['1.0.0', '1.0.1']);
});

test('parseVersionsJson wraps a single bare string (npm one-version form)', () => {
    assert.deepEqual(parseVersionsJson('"1.0.0"'), ['1.0.0']);
});

test('parseVersionsJson returns [] for empty/blank input', () => {
    assert.deepEqual(parseVersionsJson(''), []);
    assert.deepEqual(parseVersionsJson('   '), []);
});

test('computeNextRcVersion starts at rc.1 when no rc exists for the base', () => {
    assert.equal(computeNextRcVersion('2.0.2', ['2.0.0', '2.0.1']), '2.0.2-rc.1');
});

test('computeNextRcVersion increments the highest existing rc', () => {
    assert.equal(computeNextRcVersion('2.0.2', ['2.0.2-rc.1', '2.0.2-rc.2']), '2.0.2-rc.3');
});

test('computeNextRcVersion compares numerically, not lexically (rc.10 > rc.9)', () => {
    assert.equal(computeNextRcVersion('2.0.2', ['2.0.2-rc.9', '2.0.2-rc.10']), '2.0.2-rc.11');
});

test('computeNextRcVersion ignores rc of other base versions', () => {
    assert.equal(computeNextRcVersion('2.0.2', ['2.0.1-rc.5', '1.9.9-rc.99']), '2.0.2-rc.1');
});

test('computeNextRcVersion ignores malformed rc suffixes', () => {
    assert.equal(computeNextRcVersion('2.0.2', ['2.0.2-rc.abc', '2.0.2-rc.']), '2.0.2-rc.1');
});

test('assertBaseNotPublished throws when the base version is already published', () => {
    assert.throws(() => assertBaseNotPublished('2.0.1', ['2.0.0', '2.0.1']), /already published/);
});

test('assertBaseNotPublished passes when the base version is unpublished', () => {
    assert.doesNotThrow(() => assertBaseNotPublished('2.0.2', ['2.0.0', '2.0.1']));
});
