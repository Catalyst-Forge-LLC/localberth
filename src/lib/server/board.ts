import { scanListeners } from './observe.js';
import { listLeases } from './registry.js';
import type { BoardRow, Lease, Observed } from './types.js';

export type Board = {
	rows: BoardRow[];
	leases: Lease[];
	observed: Observed[];
};

export async function getBoard(): Promise<Board> {
	const leases = listLeases();
	const observed = await scanListeners();
	const byPort = new Map<number, Observed[]>();
	for (const row of observed) {
		const list = byPort.get(row.port) ?? [];
		list.push(row);
		byPort.set(row.port, list);
	}

	const used = new Set<string>();
	const rows: BoardRow[] = [];

	for (const lease of leases) {
		const hits = byPort.get(lease.port) ?? [];
		const match =
			hits.find((h) => h.bind === lease.bind || lease.bind === '0.0.0.0' || h.bind === '0.0.0.0') ??
			hits[0] ??
			null;
		if (match) used.add(`${match.bind}:${match.port}:${match.pid ?? ''}`);
		rows.push({
			lease,
			observed: match,
			listening: Boolean(match),
			conflict: false
		});
	}

	for (const row of observed) {
		const key = `${row.bind}:${row.port}:${row.pid ?? ''}`;
		if (used.has(key)) continue;
		if (row.leaseName) continue;
		rows.push({
			lease: null,
			observed: row,
			listening: true,
			conflict: false
		});
	}

	return { rows, leases, observed };
}
