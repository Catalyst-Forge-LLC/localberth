import { visitorLeaseRows, visitorSnapshot, type VisitorSnapshot, type VisitorTileInfo } from '../visitor.js';
import type { BoardRow } from '../types.js';
import { peekHttp, shortPeekTitle } from './http-peek.js';

/** Same as visitorSnapshot, plus a loopback peek for title and icon. */
export async function visitorFeed(
	rows: BoardRow[],
	machine: { hostname: string; addresses: string[] }
): Promise<VisitorSnapshot> {
	const base = visitorSnapshot(rows, machine);
	const peeked = await Promise.all(
		visitorLeaseRows(rows).map(async (row): Promise<VisitorTileInfo | null> => {
			if (!row.lease) return null;
			const peek = await peekHttp(row.lease.port);
			return {
				name: row.lease.name,
				port: row.lease.port,
				title: shortPeekTitle(peek.title),
				icon: peek.iconHref ?? null
			};
		})
	);
	return { ...base, tiles: peeked.filter((tile): tile is VisitorTileInfo => tile !== null) };
}
