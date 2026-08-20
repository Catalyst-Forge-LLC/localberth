import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { rowBindDisplay, rowDetailFields } from './row-detail.js';
import type { BoardRow } from './types.js';

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
			conflict: false,
			also: []
		};
		assert.deepEqual(rowDetailFields(row), [
			{ label: 'Kind', value: 'always' },
			{ label: 'Notes', value: 'LocalBerth dashboard', wide: true },
			{ label: 'Claimed', value: '2026-08-18 16:03:25' },
			{ label: 'Claim', value: '127.0.0.1' },
			{ label: 'Listen', value: '127.0.0.1' },
			{ label: 'Firewall', value: 'skipped' },
			{ label: 'Process', value: 'node.exe' },
			{ label: 'PID', value: '18660' }
		]);
	});

	it('shows the listen bind in the table when Vite is on ::1', () => {
		const row: BoardRow = {
			lease: {
				name: 'catalyst-forge',
				port: 6173,
				bind: '127.0.0.1',
				protocol: 'tcp',
				kind: 'always',
				notes: '',
				firewall: 'skipped',
				updatedAt: '2026-08-19T17:30:02.000Z'
			},
			observed: {
				port: 6173,
				bind: '::1',
				pid: 24436,
				process: 'node.exe',
				seenAt: '2026-08-19T17:40:00.000Z',
				leaseName: 'catalyst-forge'
			},
			listening: true,
			conflict: false,
			also: []
		};
		assert.equal(rowBindDisplay(row), '::1');
		assert.ok(rowDetailFields(row).some((f) => f.label === 'Listen' && f.value === '::1'));
		assert.ok(rowDetailFields(row).some((f) => f.label === 'Claim' && f.value === '127.0.0.1'));
	});

	it('labels Vite --host (::) as 0.0.0.0 in the bind column', () => {
		const row: BoardRow = {
			lease: {
				name: 'engram',
				port: 5193,
				bind: '127.0.0.1',
				protocol: 'tcp',
				kind: 'always',
				notes: '',
				firewall: 'skipped',
				updatedAt: '2026-08-19T17:30:02.000Z'
			},
			observed: {
				port: 5193,
				bind: '::',
				pid: 28552,
				process: 'node.exe',
				seenAt: '2026-08-19T17:40:00.000Z',
				leaseName: 'engram'
			},
			listening: true,
			conflict: true,
			also: []
		};
		assert.equal(rowBindDisplay(row), '0.0.0.0');
		assert.ok(rowDetailFields(row).some((f) => f.label === 'Listen' && f.value === '0.0.0.0'));
		assert.ok(rowDetailFields(row).some((f) => f.label === 'Mismatch' && f.warn));
	});

	it('warns when the process is wider than the claim', () => {
		const row: BoardRow = {
			lease: {
				name: 'foo',
				port: 5193,
				bind: '127.0.0.1',
				protocol: 'tcp',
				kind: 'always',
				notes: '',
				firewall: 'skipped',
				updatedAt: '2026-08-19T17:30:02.000Z'
			},
			observed: {
				port: 5193,
				bind: '0.0.0.0',
				pid: 1,
				process: 'node.exe',
				seenAt: '2026-08-19T17:40:00.000Z',
				leaseName: 'foo'
			},
			listening: true,
			conflict: true,
			also: []
		};
		const mismatch = rowDetailFields(row).find((f) => f.label === 'Mismatch');
		assert.equal(mismatch?.warn, true);
		assert.match(mismatch?.value ?? '', /all interfaces/);
	});
});
