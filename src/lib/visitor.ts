import { isLoopbackBind } from './binds.js';
import type { BoardRow } from './types.js';

/** Named slip whose process is listening past loopback — the phone can reach it. */
export function isVisitorLease(row: BoardRow): boolean {
	const bind = row.observed?.bind ?? row.lease?.bind;
	return Boolean(row.listening && row.lease && bind && !isLoopbackBind(bind));
}

export function visitorLeaseRows(rows: BoardRow[]): BoardRow[] {
	return rows.filter(isVisitorLease);
}
