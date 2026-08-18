import type { Lease } from '../types.js';
import { ruleName, scopedBind } from './names.js';
import { run, whichExists } from './run.js';

export type LinuxBackend = 'ufw' | 'firewalld' | 'none';

export async function detectLinuxBackend(): Promise<LinuxBackend> {
	if (await whichExists('ufw')) return 'ufw';
	if (await whichExists('firewall-cmd')) return 'firewalld';
	return 'none';
}

function ufwAllowArgs(lease: Lease): string[] {
	const scope = scopedBind(lease.bind);
	const spec = scope ? `${scope} ${lease.port}/tcp` : `${lease.port}/tcp`;
	return ['allow', spec, 'comment', ruleName(lease)];
}

export function linuxCommands(lease: Lease, action: 'upsert' | 'delete', backend: LinuxBackend): string {
	const name = ruleName(lease);
	if (backend === 'none') {
		return `# no ufw or firewalld on PATH — install one, or open TCP ${lease.port} yourself`;
	}
	if (backend === 'ufw') {
		if (action === 'delete') {
			return `sudo ufw status numbered   # delete only the row commented "${name}"`;
		}
		const spec = scopedBind(lease.bind) ? `${lease.bind} ${lease.port}/tcp` : `${lease.port}/tcp`;
		return `sudo ufw allow ${spec} comment '${name}'`;
	}
	const rich = firewalldRich(lease);
	if (action === 'delete') {
		return `sudo firewall-cmd --permanent --remove-rich-rule='${rich}' && sudo firewall-cmd --reload`;
	}
	return `sudo firewall-cmd --permanent --add-rich-rule='${rich}' && sudo firewall-cmd --reload`;
}

export function firewalldRich(lease: Lease): string {
	const scope = scopedBind(lease.bind);
	const dest = scope ? ` destination address="${scope}"` : '';
	return `rule family="ipv4"${dest} port port="${lease.port}" protocol="tcp" accept comment="${ruleName(lease)}"`;
}

async function ufwDeleteByComment(comment: string): Promise<void> {
	const listed = await run('ufw', ['status', 'numbered']);
	if (!listed.ok) {
		throw new Error(listed.stderr || listed.stdout || 'ufw status failed');
	}
	const hits: number[] = [];
	for (const line of listed.stdout.split(/\r?\n/)) {
		const m = line.match(/^\s*\[\s*(\d+)\s*\].*?#\s*(LocalBerth\s+\S+\s+\d+)/);
		if (m && m[2] === comment) hits.push(Number(m[1]));
	}
	for (const n of hits.sort((a, b) => b - a)) {
		const gone = await run('ufw', ['--force', 'delete', String(n)]);
		if (!gone.ok) throw new Error(gone.stderr || gone.stdout || `ufw delete ${n} failed`);
	}
}

async function applyUfw(lease: Lease, previous: Lease | null): Promise<void> {
	if (previous && ruleName(previous) !== ruleName(lease)) {
		await ufwDeleteByComment(ruleName(previous));
	}
	await ufwDeleteByComment(ruleName(lease));
	const added = await run('ufw', ufwAllowArgs(lease));
	if (!added.ok) throw new Error(added.stderr || added.stdout || 'ufw allow failed');
}

async function applyFirewalld(lease: Lease, previous: Lease | null): Promise<void> {
	const reload = async () => {
		const r = await run('firewall-cmd', ['--reload']);
		if (!r.ok) throw new Error(r.stderr || r.stdout || 'firewall-cmd --reload failed');
	};
	const mutate = async (op: '--add-rich-rule=' | '--remove-rich-rule=', l: Lease) => {
		const r = await run('firewall-cmd', ['--permanent', `${op}${firewalldRich(l)}`]);
		return r;
	};
	if (previous && ruleName(previous) !== ruleName(lease)) {
		await mutate('--remove-rich-rule=', previous);
	}
	await mutate('--remove-rich-rule=', lease);
	const added = await mutate('--add-rich-rule=', lease);
	if (!added.ok) throw new Error(added.stderr || added.stdout || 'firewall-cmd add-rich-rule failed');
	await reload();
}

export async function applyLinux(lease: Lease, previous: Lease | null): Promise<void> {
	const backend = await detectLinuxBackend();
	if (backend === 'none') {
		throw new MissingLinuxError();
	}
	if (backend === 'ufw') await applyUfw(lease, previous);
	else await applyFirewalld(lease, previous);
}

export async function removeLinux(lease: Lease): Promise<void> {
	const backend = await detectLinuxBackend();
	if (backend === 'none') throw new MissingLinuxError();
	if (backend === 'ufw') {
		await ufwDeleteByComment(ruleName(lease));
		return;
	}
	const gone = await run('firewall-cmd', ['--permanent', `--remove-rich-rule=${firewalldRich(lease)}`]);
	if (!gone.ok && !/NOT_ENABLED|no such|NOT_FOUND/i.test(gone.stderr + gone.stdout)) {
		throw new Error(gone.stderr || gone.stdout || 'firewall-cmd remove-rich-rule failed');
	}
	const reload = await run('firewall-cmd', ['--reload']);
	if (!reload.ok) throw new Error(reload.stderr || reload.stdout || 'firewall-cmd --reload failed');
}

export class MissingLinuxError extends Error {
	constructor() {
		super('neither ufw nor firewalld found on PATH');
		this.name = 'MissingLinuxError';
	}
}
