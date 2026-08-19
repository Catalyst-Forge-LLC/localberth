import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { rowDetailFields } from './row-detail.js';
import type { BoardRow } from './server/types.js';

describe('rowDetailFields', () => {
	it('labels lease and process facts', () => {
		const row: BoardRow = {
			lease: {
				name: 'localberth',
				port: 54321,
				bind: '127.0.0.1',
				protocol: 'tcp',
				kind: 'always',
				notes: 'LocalBerth dashboard',
				firewall: 'skipped',
				updatedAt: '2026-08-18T16:03:25.000Z'
			},
			observed: {
				port: 54321,
				bind: '127.0.0.1',
				pid: 18660,
				process: 'node.exe',
				seenAt: '2026-08-19T17:00:00.000Z',
				leaseName: 'localberth'
			},
			listening: true,
			conflict: false
		};
		assert.deepEqual(rowDetailFields(row), [
			{ label: 'Kind', value: 'always' },
			{ label: 'Notes', value: 'LocalBerth dashboard' },
			{ label: 'Claimed', value: '2026-08-18 16:03:25' },
			{ label: 'Firewall', value: 'skipped' },
			{ label: 'Process', value: 'node.exe' },
			{ label: 'PID', value: '18660' }
		]);
	});
});
