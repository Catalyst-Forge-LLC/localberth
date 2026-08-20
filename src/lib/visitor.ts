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
	const shown = rows.filter(isVisitorLease);
	const apps = shown.filter((row) => !isVisitorSelf(row));
	const self = shown.filter(isVisitorSelf);
	return [...apps, ...self];
}
