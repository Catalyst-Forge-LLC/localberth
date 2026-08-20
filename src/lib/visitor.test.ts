import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isVisitorLease, visitorLeaseRows } from './visitor.js';
import type { BoardRow } from './types.js';

function row(partial: {
	name: string;
	port: number;
	bind: string;
	listening: boolean;
	listenBind?: string;
}): BoardRow {
	const listenBind = partial.listenBind ?? partial.bind;
	return {
		lease: {
			name: partial.name,
			port: partial.port,
			bind: partial.bind,
			protocol: 'tcp',
			kind: 'always',
			notes: '',
			firewall: 'skipped',
			updatedAt: '2026-08-19T12:00:00.000Z'
		},
		observed: partial.listening
			? {
					port: partial.port,
					bind: listenBind,
					pid: 1,
					process: 'node.exe',
					seenAt: '2026-08-19T12:00:00.000Z',
					leaseName: partial.name
				}
			: null,
		listening: partial.listening,
		conflict: false,
		also: []
	};
}

describe('visitorLeaseRows', () => {
	it('keeps named slips whose process is past loopback', () => {
		const rows = [
			row({ name: 'phone', port: 5193, bind: '0.0.0.0', listening: true }),
			row({ name: 'desk', port: 6173, bind: '127.0.0.1', listening: true }),
			row({ name: 'down', port: 5180, bind: '0.0.0.0', listening: false }),
			row({
				name: 'forgetrail-site',
				port: 5195,
				bind: '127.0.0.1',
				listening: true,
				listenBind: '::'
			})
		];
		assert.deepEqual(
			visitorLeaseRows(rows).map((r) => r.lease?.name),
			['phone', 'forgetrail-site']
		);
		assert.equal(isVisitorLease(rows[1]!), false);
	});
});
