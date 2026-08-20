import { isLoopbackBind } from './binds.js';
import { DASHBOARD_NAME, DASHBOARD_PORT } from './reserved.js';
import type { BoardRow } from './types.js';

/** Named slip whose process is listening past loopback — the phone can reach it. */
export function isVisitorLease(row: BoardRow): boolean {
	const bind = row.observed?.bind ?? row.lease?.bind;
	return Boolean(row.listening && row.lease && bind && !isLoopbackBind(bind));
}

/** The board you are already on. */
export function isVisitorSelf(row: BoardRow): boolean {
	return row.lease?.name === DASHBOARD_NAME || row.lease?.port === DASHBOARD_PORT;
}

export function visitorLeaseRows(rows: BoardRow[]): BoardRow[] {
	return rows.filter((row) => isVisitorLease(row) && !isVisitorSelf(row));
}

export type VisitorTileInfo = { name: string; port: number };

export type VisitorSnapshot = {
	hostname: string;
	addresses: string[];
	tiles: VisitorTileInfo[];
};

export function visitorSnapshot(
	rows: BoardRow[],
	machine: { hostname: string; addresses: string[] }
): VisitorSnapshot {
	return {
		hostname: machine.hostname,
		addresses: machine.addresses,
		tiles: visitorLeaseRows(rows).flatMap((row) =>
			row.lease ? [{ name: row.lease.name, port: row.lease.port }] : []
		)
	};
}
