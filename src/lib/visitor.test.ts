import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isVisitorLease, visitorLeaseRows } from './visitor.js';
import type { BoardRow } from './types.js';

function row(partial: {
	name: string;
	port: number;
	bind: string;
	listening: boolean;
}): BoardRow {
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
					bind: partial.bind === '0.0.0.0' ? '0.0.0.0' : partial.bind,
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
	it('keeps listening non-loopback leases only', () => {
		const rows = [
			row({ name: 'phone', port: 5193, bind: '0.0.0.0', listening: true }),
			row({ name: 'desk', port: 6173, bind: '127.0.0.1', listening: true }),
			row({ name: 'down', port: 5180, bind: '0.0.0.0', listening: false })
		];
		assert.deepEqual(
			visitorLeaseRows(rows).map((r) => r.lease?.name),
			['phone']
		);
		assert.equal(isVisitorLease(rows[1]!), false);
	});
});
