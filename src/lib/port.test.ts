import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';

const home = mkdtempSync(join(tmpdir(), 'localberth-port-'));
process.env.LOCALBERTH_HOME = home;

const { resetDb } = await import('./server/db.js');
const { claim } = await import('./server/registry.js');
const { localberthListen, localberthPort } = await import('./port.js');

describe('localberthListen', () => {
	before(() => {
		resetDb();
	});

	after(() => {
		resetDb();
		rmSync(home, { recursive: true, force: true });
	});

	it('returns host and port from the lease', () => {
		claim({ name: 'foo', port: 6173 });
		assert.deepEqual(localberthListen('foo', 5173), { host: '127.0.0.1', port: 6173 });
		assert.equal(localberthPort('foo', 5173), 6173);
	});

	it('falls back to loopback when the name is missing', () => {
		assert.deepEqual(localberthListen('missing', 5173), { host: '127.0.0.1', port: 5173 });
	});
});
