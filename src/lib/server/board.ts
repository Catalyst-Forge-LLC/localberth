import { scanListeners } from './observe.js';
import { listLeases } from './registry.js';
import { isSystemPort } from './system-ports.js';
import type { BoardRow, Lease, Observed } from './types.js';

export type Board = {
	leaseRows: BoardRow[];
	observedRows: BoardRow[];
	hiddenSystem: number;
	leases: Lease[];
	observed: Observed[];
};

export async function getBoard(opts: { showSystem?: boolean } = {}): Promise<Board> {
	const showSystem = Boolean(opts.showSystem);
	const leases = listLeases();
	const observed = await scanListeners();
	const byPort = new Map<number, Observed[]>();
	for (const row of observed) {
		const list = byPort.get(row.port) ?? [];
		list.push(row);
		byPort.set(row.port, list);
	}

	const used = new Set<string>();
	const leaseRows: BoardRow[] = [];

	for (const lease of leases) {
		const hits = byPort.get(lease.port) ?? [];
		const match =
			hits.find((h) => h.bind === lease.bind || lease.bind === '0.0.0.0' || h.bind === '0.0.0.0') ??
			hits[0] ??
			null;
		if (match) used.add(`${match.bind}:${match.port}:${match.pid ?? ''}`);
		leaseRows.push({
			lease,
			observed: match,
			listening: Boolean(match),
			conflict: false
		});
	}

	const observedRows: BoardRow[] = [];
	let hiddenSystem = 0;
	for (const row of observed) {
		const key = `${row.bind}:${row.port}:${row.pid ?? ''}`;
		if (used.has(key)) continue;
		if (row.leaseName) continue;
		if (!showSystem && isSystemPort(row.port)) {
			hiddenSystem += 1;
			continue;
		}
		observedRows.push({
			lease: null,
			observed: row,
			listening: true,
			conflict: false
		});
	}

	return { leaseRows, observedRows, hiddenSystem, leases, observed };
}
