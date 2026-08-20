import { isLoopbackBind } from './binds.js';
import type { BoardRow } from './types.js';

/** Listening lease with a non-loopback claim — reachable from LAN / Tailscale. */
export function isVisitorLease(row: BoardRow): boolean {
	return Boolean(row.listening && row.lease && !isLoopbackBind(row.lease.bind));
}

export function visitorLeaseRows(rows: BoardRow[]): BoardRow[] {
	return rows.filter(isVisitorLease);
}
