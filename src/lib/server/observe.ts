import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { leaseByPort } from './registry.js';
import type { Observed } from './types.js';

const execFileAsync = promisify(execFile);

function run(cmd: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
	return execFileAsync(cmd, args, { windowsHide: true, maxBuffer: 8 * 1024 * 1024 }).catch(
		(err: NodeJS.ErrnoException & { stdout?: string; stderr?: string }) => {
			if (err.stdout !== undefined) return { stdout: err.stdout, stderr: err.stderr ?? '' };
			throw err;
		}
	);
}

export async function scanListeners(): Promise<Observed[]> {
	const seenAt = new Date().toISOString();
	const raw = process.platform === 'win32' ? await scanWindows() : await scanUnix();
	const merged = new Map<string, Observed>();
	for (const row of raw) {
		const key = `${row.bind}:${row.port}`;
		if (!merged.has(key)) {
			merged.set(key, {
				...row,
				seenAt,
				leaseName: leaseByPort(row.port)?.name ?? null
			});
		}
	}
	return [...merged.values()].sort((a, b) => a.port - b.port || a.bind.localeCompare(b.bind));
}

/** Windows `netstat -ano -p TCP` / `TCPv6` LISTENING lines. */
export function parseNetstat(stdout: string): Omit<Observed, 'seenAt' | 'leaseName'>[] {
	const rows: Omit<Observed, 'seenAt' | 'leaseName'>[] = [];
	for (const line of stdout.split(/\r?\n/)) {
		if (!/LISTENING/i.test(line)) continue;
		const parts = line.trim().split(/\s+/);
		if (parts.length < 4) continue;
		const local = parseListenAddr(parts[1] ?? '');
		if (!local) continue;
		const pid = Number(parts[parts.length - 1]);
		rows.push({
			port: local.port,
			bind: local.bind,
			pid: Number.isInteger(pid) ? pid : null,
			process: null
		});
	}
	return rows;
}

function parseListenAddr(local: string): { bind: string; port: number } | null {
	const colon = local.lastIndexOf(':');
	if (colon < 0) return null;
	const bind = local.slice(0, colon).replace(/^\[|\]$/g, '');
	const port = Number(local.slice(colon + 1));
	if (!Number.isInteger(port) || port < 1 || port > 65535) return null;
	return { bind: bind === '*' ? '0.0.0.0' : bind, port };
}

async function scanWindows(): Promise<Omit<Observed, 'seenAt' | 'leaseName'>[]> {
	const [v4, v6] = await Promise.all([
		run('netstat', ['-ano', '-p', 'TCP']),
		run('netstat', ['-ano', '-p', 'TCPv6'])
	]);
	const rows = [...parseNetstat(v4.stdout), ...parseNetstat(v6.stdout)];
	const pids = new Set<number>();
	for (const row of rows) {
		if (row.pid && row.pid > 0) pids.add(row.pid);
	}
	const names = await windowsProcessNames(pids);
	for (const row of rows) {
		if (row.pid) row.process = names.get(row.pid) ?? null;
	}
	return rows;
}

async function windowsProcessNames(pids: Set<number>): Promise<Map<number, string>> {
	const map = new Map<number, string>();
	if (pids.size === 0) return map;
	try {
		const { stdout } = await run('tasklist', ['/FO', 'CSV', '/NH']);
		for (const line of stdout.split(/\r?\n/)) {
			const cols = parseCsv(line);
			if (cols.length < 2) continue;
			const pid = Number(cols[1]);
			if (pids.has(pid)) map.set(pid, cols[0]);
		}
	} catch {
		/* process names are optional */
	}
	return map;
}

function parseCsv(line: string): string[] {
	const out: string[] = [];
	let cur = '';
	let q = false;
	for (const ch of line) {
		if (ch === '"') {
			q = !q;
			continue;
		}
		if (ch === ',' && !q) {
			out.push(cur);
			cur = '';
			continue;
		}
		cur += ch;
	}
	if (cur || line.endsWith(',')) out.push(cur);
	return out;
}

async function scanUnix(): Promise<Omit<Observed, 'seenAt' | 'leaseName'>[]> {
	try {
		const { stdout } = await run('lsof', ['-nP', '-iTCP', '-sTCP:LISTEN']);
		return parseLsof(stdout);
	} catch {
		const { stdout } = await run('ss', ['-lntup']);
		return parseSs(stdout);
	}
}

function parseLsof(stdout: string): Omit<Observed, 'seenAt' | 'leaseName'>[] {
	const rows: Omit<Observed, 'seenAt' | 'leaseName'>[] = [];
	for (const line of stdout.split(/\n/).slice(1)) {
		const parts = line.trim().split(/\s+/);
		if (parts.length < 9) continue;
		const process = parts[0];
		const pid = Number(parts[1]);
		const name = parts[parts.length - 2] ?? '';
		const local = parseListenAddr(name);
		if (!local) continue;
		rows.push({
			process,
			pid: Number.isInteger(pid) ? pid : null,
			bind: local.bind,
			port: local.port
		});
	}
	return rows;
}

function parseSs(stdout: string): Omit<Observed, 'seenAt' | 'leaseName'>[] {
	const rows: Omit<Observed, 'seenAt' | 'leaseName'>[] = [];
	for (const line of stdout.split(/\n/)) {
		if (!/LISTEN/i.test(line)) continue;
		const local = line.trim().split(/\s+/).find((p) => /:\d+$/.test(p));
		if (!local) continue;
		const colon = local.lastIndexOf(':');
		const bind = local.slice(0, colon).replace(/^\[|\]$/g, '') || '0.0.0.0';
		const port = Number(local.slice(colon + 1));
		const users = line.match(/users:\(\("([^"]+)",pid=(\d+)/);
		rows.push({
			port,
			bind: bind === '*' ? '0.0.0.0' : bind,
			process: users?.[1] ?? null,
			pid: users ? Number(users[2]) : null
		});
	}
	return rows;
}
