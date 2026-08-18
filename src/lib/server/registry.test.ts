import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';

const home = mkdtempSync(join(tmpdir(), 'localberth-test-'));
process.env.LOCALBERTH_HOME = home;

const { resetDb } = await import('./db.js');
const { claim, getLease, release } = await import('./registry.js');

describe('registry sad paths', () => {
	before(() => {
		resetDb();
	});

	after(() => {
		resetDb();
		rmSync(home, { recursive: true, force: true });
	});

	it('rejects invalid names', () => {
		assert.throws(() => getLease('Not Valid'), /invalid name/);
	});

	it('get returns null for a missing lease', () => {
		assert.equal(getLease('missing'), null);
	});

	it('refuses to release the dashboard without --force', () => {
		assert.throws(() => release('localberth'), /refusing to release localberth/);
	});

	it('rejects a second claim on the same port', () => {
		claim({ name: 'alpha', port: 5193, bind: '127.0.0.1' });
		assert.throws(() => claim({ name: 'beta', port: 5193 }), /already leased by alpha/);
	});
});
