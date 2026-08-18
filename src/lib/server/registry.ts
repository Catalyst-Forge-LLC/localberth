import { getDb } from './db.js';
import { DASHBOARD_NAME, DASHBOARD_PORT } from './paths.js';
import type { FirewallStatus, Lease, LeaseKind } from './types.js';

const NAME_RE = /^[a-z0-9][a-z0-9-]*$/;
const ALWAYS_POOL = { lo: 46000, hi: 46999 };
const EPHEMERAL_POOL = { lo: 47000, hi: 47999 };

type LeaseRow = {
	name: string;
	port: number;
	bind: string;
	protocol: 'tcp';
	kind: LeaseKind;
	notes: string;
	firewall: FirewallStatus;
	updated_at: string;
};

function rowToLease(row: LeaseRow): Lease {
	return {
		name: row.name,
		port: row.port,
		bind: row.bind,
		protocol: row.protocol,
		kind: row.kind,
		notes: row.notes,
		firewall: row.firewall,
		updatedAt: row.updated_at
	};
}

export function assertName(name: string): string {
	const n = name.trim().toLowerCase();
	if (!NAME_RE.test(n)) {
		throw new Error(`invalid name "${name}" — use lowercase letters, numbers, and hyphens`);
	}
	return n;
}

export function assertPort(port: number): number {
	if (!Number.isInteger(port) || port < 1 || port > 65535) {
		throw new Error(`invalid port ${port}`);
	}
	return port;
}

export function getLease(name: string): Lease | null {
	const row = getDb()
		.prepare('SELECT * FROM leases WHERE name = ?')
		.get(assertName(name)) as LeaseRow | undefined;
	return row ? rowToLease(row) : null;
}

export function listLeases(): Lease[] {
	const rows = getDb()
		.prepare('SELECT * FROM leases ORDER BY name')
		.all() as LeaseRow[];
	return rows.map(rowToLease);
}

export function leaseByPort(port: number): Lease | null {
	const row = getDb()
		.prepare('SELECT * FROM leases WHERE port = ?')
		.get(port) as LeaseRow | undefined;
	return row ? rowToLease(row) : null;
}

export function setFirewall(name: string, firewall: FirewallStatus): void {
	getDb()
		.prepare('UPDATE leases SET firewall = ?, updated_at = ? WHERE name = ?')
		.run(firewall, new Date().toISOString(), assertName(name));
}

function nextFreePort(kind: LeaseKind, taken: Set<number>): number {
	const pool = kind === 'ephemeral' ? EPHEMERAL_POOL : ALWAYS_POOL;
	for (let p = pool.lo; p <= pool.hi; p++) {
		if (p === DASHBOARD_PORT) continue;
		if (!taken.has(p)) return p;
	}
	throw new Error(`no free ports left in the ${kind} pool (${pool.lo}–${pool.hi})`);
}

export type ClaimInput = {
	name: string;
	port?: number;
	bind?: string;
	ephemeral?: boolean;
	notes?: string;
};

export type ClaimResult = {
	lease: Lease;
	previous: Lease | null;
};

export function claim(input: ClaimInput): ClaimResult {
	const name = assertName(input.name);
	const kind: LeaseKind = input.ephemeral ? 'ephemeral' : 'always';
	const bind = (input.bind ?? (kind === 'ephemeral' ? '127.0.0.1' : '0.0.0.0')).trim();
	const notes = input.notes?.trim() ?? '';
	const db = getDb();
	const previous = getLease(name);

	const taken = new Set(listLeases().filter((l) => l.name !== name).map((l) => l.port));
	const port = input.port !== undefined ? assertPort(input.port) : nextFreePort(kind, taken);

	if (taken.has(port)) {
		const owner = leaseByPort(port);
		throw new Error(`port ${port} is already leased by ${owner?.name ?? 'another name'}`);
	}

	const now = new Date().toISOString();
	db.prepare(
		`INSERT INTO leases (name, port, bind, protocol, kind, notes, firewall, updated_at)
		 VALUES (?, ?, ?, 'tcp', ?, ?, 'wanted', ?)
		 ON CONFLICT(name) DO UPDATE SET
		   port = excluded.port,
		   bind = excluded.bind,
		   kind = excluded.kind,
		   notes = excluded.notes,
		   firewall = 'wanted',
		   updated_at = excluded.updated_at`
	).run(name, port, bind, kind, notes || previous?.notes || '', now);

	return { lease: getLease(name)!, previous };
}

export function release(name: string, opts: { force?: boolean } = {}): Lease {
	const n = assertName(name);
	if (n === DASHBOARD_NAME && !opts.force) {
		throw new Error('refusing to release localberth (the dashboard). pass --force if you mean it');
	}
	const lease = getLease(n);
	if (!lease) throw new Error(`no lease named "${n}"`);
	getDb().prepare('DELETE FROM leases WHERE name = ?').run(n);
	return lease;
}
