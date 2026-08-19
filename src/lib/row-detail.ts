import type { BoardRow } from './server/types.js';

export type DetailField = { label: string; value: string };

export function rowDetailFields(row: BoardRow): DetailField[] {
	const fields: DetailField[] = [];
	if (row.lease) {
		fields.push({ label: 'Kind', value: row.lease.kind });
		if (row.lease.notes) fields.push({ label: 'Notes', value: row.lease.notes });
		fields.push({ label: 'Claimed', value: row.lease.updatedAt.slice(0, 19).replace('T', ' ') });
		fields.push({ label: 'Firewall', value: row.lease.firewall });
	}
	if (row.observed?.process) fields.push({ label: 'Process', value: row.observed.process });
	if (row.observed?.pid != null) fields.push({ label: 'PID', value: String(row.observed.pid) });
	return fields;
}
