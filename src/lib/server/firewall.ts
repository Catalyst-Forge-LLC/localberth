import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { listLeases, setFirewall } from './registry.js';
import type { Lease } from './types.js';

const execFileAsync = promisify(execFile);

export type FirewallAttempt = {
	lease: Lease;
	ok: boolean;
	status: Lease['firewall'];
	command: string;
	detail?: string;
};

function ruleName(lease: Pick<Lease, 'name' | 'port'>): string {
	return `LocalBerth ${lease.name} ${lease.port}`;
}

export function firewallCommand(lease: Lease, action: 'upsert' | 'delete' = 'upsert'): string {
	const name = ruleName(lease);
	if (process.platform === 'win32') {
		if (action === 'delete') {
			return `netsh advfirewall firewall delete rule name="${name}"`;
		}
		return [
			`netsh advfirewall firewall delete rule name="${name}"`,
			`netsh advfirewall firewall add rule name="${name}" dir=in action=allow protocol=TCP localport=${lease.port}`
		].join(' && ');
	}
	if (process.platform === 'darwin') {
		return `sudo pfctl -a localberth -f <(echo "pass in proto tcp from any to any port ${lease.port}")`;
	}
	if (action === 'delete') {
		return `sudo ufw delete allow ${lease.port}/tcp || sudo firewall-cmd --permanent --remove-port=${lease.port}/tcp`;
	}
	return `sudo ufw allow ${lease.port}/tcp comment '${name}' || sudo firewall-cmd --permanent --add-port=${lease.port}/tcp && sudo firewall-cmd --reload`;
}

async function run(cmd: string, args: string[]): Promise<void> {
	await execFileAsync(cmd, args, { windowsHide: true });
}

async function applyWindows(lease: Lease, previous: Lease | null): Promise<void> {
	if (previous && (previous.port !== lease.port || previous.name !== lease.name)) {
		await run('netsh', ['advfirewall', 'firewall', 'delete', 'rule', `name=${ruleName(previous)}`]).catch(
			() => undefined
		);
	}
	await run('netsh', ['advfirewall', 'firewall', 'delete', 'rule', `name=${ruleName(lease)}`]).catch(
		() => undefined
	);
	await run('netsh', [
		'advfirewall',
		'firewall',
		'add',
		'rule',
		`name=${ruleName(lease)}`,
		'dir=in',
		'action=allow',
		'protocol=TCP',
		`localport=${lease.port}`
	]);
}

async function applyDarwin(leases: Lease[]): Promise<void> {
	const ports = [...new Set(leases.map((l) => l.port))].sort((a, b) => a - b);
	const body = ports.map((p) => `pass in proto tcp from any to any port ${p}`).join('\n') + '\n';
	const file = join(tmpdir(), 'localberth.pf');
	writeFileSync(file, body, 'utf8');
	await run('pfctl', ['-a', 'localberth', '-f', file]);
}

async function applyLinux(lease: Lease, previous: Lease | null): Promise<void> {
	const tryUfw = async (args: string[]) => run('ufw', args);
	try {
		if (previous && previous.port !== lease.port) {
			await tryUfw(['delete', 'allow', `${previous.port}/tcp`]).catch(() => undefined);
		}
		await tryUfw(['allow', `${lease.port}/tcp`, 'comment', ruleName(lease)]);
		return;
	} catch {
		/* fall through to firewalld */
	}
	if (previous && previous.port !== lease.port) {
		await run('firewall-cmd', ['--permanent', `--remove-port=${previous.port}/tcp`]).catch(
			() => undefined
		);
	}
	await run('firewall-cmd', ['--permanent', `--add-port=${lease.port}/tcp`]);
	await run('firewall-cmd', ['--reload']);
}

export async function syncLease(lease: Lease, previous: Lease | null = null): Promise<FirewallAttempt> {
	const command = firewallCommand(lease);
	try {
		if (process.platform === 'win32') await applyWindows(lease, previous);
		else if (process.platform === 'darwin') await applyDarwin(listLeases());
		else await applyLinux(lease, previous);
		setFirewall(lease.name, 'applied');
		return { lease: { ...lease, firewall: 'applied' }, ok: true, status: 'applied', command };
	} catch (err) {
		const missing = /not found|ENOENT/i.test(err instanceof Error ? err.message : String(err));
		const status = missing ? 'skipped' : 'needs-elevation';
		setFirewall(lease.name, status);
		return {
			lease: { ...lease, firewall: status },
			ok: false,
			status,
			command,
			detail: err instanceof Error ? err.message : String(err)
		};
	}
}

export async function syncAll(): Promise<FirewallAttempt[]> {
	const leases = listLeases();
	const out: FirewallAttempt[] = [];
	for (const lease of leases) {
		out.push(await syncLease(lease, null));
	}
	return out;
}
