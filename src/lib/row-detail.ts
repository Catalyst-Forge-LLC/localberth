import { bindRelation } from './server/firewall/names.js';
import type { BoardRow } from './server/types.js';

export type DetailField = { label: string; value: string; wide?: boolean; warn?: boolean };

/** Bind the table should show: the listen address when up, else the claim. */
export function rowBindDisplay(row: BoardRow): string {
	if (row.listening && row.observed?.bind) return row.observed.bind;
	return row.lease?.bind ?? row.observed?.bind ?? '—';
}

export function rowDetailFields(row: BoardRow): DetailField[] {
	const fields: DetailField[] = [];
	if (row.lease) {
		fields.push({ label: 'Kind', value: row.lease.kind });
		if (row.lease.notes) fields.push({ label: 'Notes', value: row.lease.notes, wide: true });
		fields.push({ label: 'Claimed', value: row.lease.updatedAt.slice(0, 19).replace('T', ' ') });
		fields.push({ label: 'Claim', value: row.lease.bind });
	}
	if (row.observed?.bind) {
		fields.push({ label: 'Listen', value: row.observed.bind });
	}
	if (row.lease && row.observed?.bind) {
		const relation = bindRelation(row.lease.bind, row.observed.bind);
		if (relation === 'wider') {
			fields.push({
				label: 'Mismatch',
				value: 'Process is on all interfaces; lease is loopback.',
				wide: true,
				warn: true
			});
		} else if (relation === 'narrower') {
			fields.push({
				label: 'Mismatch',
				value: 'Lease is LAN; process is loopback only.',
				wide: true,
				warn: true
			});
		} else if (relation === 'other') {
			fields.push({
				label: 'Mismatch',
				value: `Listening on ${row.observed.bind}, not ${row.lease.bind}.`,
				wide: true,
				warn: true
			});
		}
	}
	if (row.also.length > 0) {
		fields.push({
			label: 'Also',
			value: row.also
				.map((h) => `${h.bind}${h.pid != null ? ` pid ${h.pid}` : ''}`)
				.join(', '),
			wide: true,
			warn: true
		});
	}
	if (row.lease) fields.push({ label: 'Firewall', value: row.lease.firewall });
	if (row.observed?.process) fields.push({ label: 'Process', value: row.observed.process });
	if (row.observed?.pid != null) fields.push({ label: 'PID', value: String(row.observed.pid) });
	return fields;
}
