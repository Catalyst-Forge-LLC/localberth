import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';

const home = mkdtempSync(join(tmpdir(), 'localberth-test-'));
process.env.LOCALBERTH_HOME = home;

const { resetDb } = await import('./db.js');
const { claim, getLease, release, resolveClaimBind } = await import('./registry.js');

describe('registry sad paths', () => {
	before(() => {
		resetDb();
	});

	after(() => {
		resetDb();
		rmSync(home, { recursive: true, force: true });
	});

	it('defaults bind to loopback; --lan opens all interfaces', () => {
		assert.equal(resolveClaimBind({}), '127.0.0.1');
		assert.equal(resolveClaimBind({ lan: true }), '0.0.0.0');
		assert.equal(resolveClaimBind({ bind: '100.74.12.14' }), '100.74.12.14');
		assert.throws(() => resolveClaimBind({ lan: true, bind: '0.0.0.0' }), /not both/);
		const { lease } = claim({ name: 'private', port: 5180 });
		assert.equal(lease.bind, '127.0.0.1');
		const lan = claim({ name: 'open', port: 5181, lan: true });
		assert.equal(lan.lease.bind, '0.0.0.0');
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

	it('--or-next falls back when the port is leased', () => {
		const { lease, fallbackFrom } = claim({
			name: 'beta',
			port: 5193,
			bind: '127.0.0.1',
			orNext: true
		});
		assert.equal(fallbackFrom, 5193);
		assert.notEqual(lease.port, 5193);
	});

	it('--or-next falls back when the port is listening', () => {
		const { lease, fallbackFrom } = claim({
			name: 'gamma',
			port: 3000,
			bind: '127.0.0.1',
			orNext: true,
			occupied: [3000]
		});
		assert.equal(fallbackFrom, 3000);
		assert.notEqual(lease.port, 3000);
	});

	it('pool allocation skips listening ports', () => {
		const { lease } = claim({ name: 'delta', bind: '127.0.0.1', occupied: [46000] });
		assert.notEqual(lease.port, 46000);
	});

	it('can claim a listening port without --or-next (name what is there)', () => {
		const { lease, fallbackFrom } = claim({
			name: 'echo',
			port: 7777,
			bind: '127.0.0.1',
			occupied: [7777]
		});
		assert.equal(lease.port, 7777);
		assert.equal(fallbackFrom, undefined);
	});
});
