import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { renderPfAnchor } from './darwin.js';
import { firewalldRich } from './linux.js';
import { isElevated, needsElevation, resetElevatedCache } from './run.js';
import {
	bindRelation,
	bindsOverlap,
	isLoopbackBind,
	normalizeBind,
	ruleName,
	scopedBind,
	shouldOpenInbound
} from './names.js';

describe('firewall names', () => {
	it('names rules LocalBerth <name> <port>', () => {
		assert.equal(ruleName({ name: 'fizzbuzz', port: 5193 }), 'LocalBerth fizzbuzz 5193');
	});

	it('skips inbound for loopback binds', () => {
		assert.equal(isLoopbackBind('127.0.0.1'), true);
		assert.equal(shouldOpenInbound({ bind: '127.0.0.1' }), false);
		assert.equal(shouldOpenInbound({ bind: '0.0.0.0' }), true);
		assert.equal(shouldOpenInbound({ bind: '100.74.12.14' }), true);
	});

	it('treats IPv4 and IPv6 loopback as the same slip', () => {
		assert.equal(bindsOverlap('127.0.0.1', '::1'), true);
		assert.equal(bindsOverlap('127.0.0.1', '192.168.1.10'), false);
		assert.equal(normalizeBind('::ffff:127.0.0.1'), '127.0.0.1');
		assert.equal(isLoopbackBind('::ffff:127.0.0.1'), true);
		assert.equal(bindRelation('127.0.0.1', '::1'), 'equivalent');
		assert.equal(bindRelation('127.0.0.1', '0.0.0.0'), 'wider');
		assert.equal(bindRelation('0.0.0.0', '127.0.0.1'), 'narrower');
	});

	it('scopes Tailscale/LAN binds and leaves 0.0.0.0 open', () => {
		assert.equal(scopedBind('0.0.0.0'), null);
		assert.equal(scopedBind('100.74.12.14'), '100.74.12.14');
	});
});

describe('pf anchor', () => {
	it('emits only inbound ports', () => {
		const text = renderPfAnchor([
			{ name: 'localberth', port: 54321, bind: '127.0.0.1' } as never,
			{ name: 'fizzbuzz', port: 5193, bind: '0.0.0.0' } as never
		]);
		assert.match(text, /port 5193/);
		assert.doesNotMatch(text, /54321/);
	});
});

describe('elevation', () => {
	it('classifies access-denied text as needs elevation', () => {
		assert.equal(
			needsElevation({ ok: false, code: 1, stdout: '', stderr: 'The requested operation requires elevation.' }),
			true
		);
	});

	it('isElevated returns a boolean and does not throw', async () => {
		resetElevatedCache();
		const v = await isElevated();
		assert.equal(typeof v, 'boolean');
	});
});

describe('firewalld rich rule', () => {
	it('comments with the LocalBerth rule name', () => {
		const rich = firewalldRich({
			name: 'fizzbuzz',
			port: 5193,
			bind: '0.0.0.0',
			protocol: 'tcp',
			kind: 'always',
			notes: '',
			firewall: 'wanted',
			updatedAt: ''
		});
		assert.match(rich, /comment="LocalBerth fizzbuzz 5193"/);
		assert.match(rich, /port="5193"/);
	});
});
