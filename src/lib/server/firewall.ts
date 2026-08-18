import type { Lease } from './types.js';
import { applyDarwin, darwinCommands, writePfAnchor } from './firewall/darwin.js';
import { applyLinux, detectLinuxBackend, linuxCommands, MissingLinuxError } from './firewall/linux.js';
import { shouldOpenInbound } from './firewall/names.js';
import { isElevated, MissingToolError, UnelevatedError } from './firewall/run.js';
import { applyWindows, removeWindows, windowsCommands } from './firewall/windows.js';
import { listLeases, setFirewall } from './registry.js';

export type FirewallAttempt = {
	lease: Lease;
	ok: boolean;
	status: Lease['firewall'];
	command: string;
	detail?: string;
};

export type FirewallBackend = 'netsh' | 'pf' | 'ufw' | 'firewalld' | 'none';

export async function detectBackend(): Promise<FirewallBackend> {
	if (process.platform === 'win32') return 'netsh';
	if (process.platform === 'darwin') return 'pf';
	return detectLinuxBackend();
}

export function firewallCommand(lease: Lease, action: 'upsert' | 'delete' = 'upsert'): string {
	if (!shouldOpenInbound(lease) && action === 'upsert') {
		return `# ${lease.name} binds ${lease.bind} — no inbound rule`;
	}
	if (process.platform === 'win32') return windowsCommands(lease, action);
	if (process.platform === 'darwin') return darwinCommands(listLeases());
	return linuxCommands(lease, action, 'ufw');
}

async function linuxCommandFor(lease: Lease, action: 'upsert' | 'delete'): Promise<string> {
	const backend = await detectLinuxBackend();
	return linuxCommands(lease, action, backend);
}

export async function pasteableCommand(lease: Lease, action: 'upsert' | 'delete' = 'upsert'): Promise<string> {
	if (!shouldOpenInbound(lease) && action === 'upsert') {
		return `# ${lease.name} binds ${lease.bind} — no inbound rule`;
	}
	if (process.platform === 'win32') return windowsCommands(lease, action);
	if (process.platform === 'darwin') return darwinCommands(listLeases());
	return linuxCommandFor(lease, action);
}

function classifyFail(err: unknown): Lease['firewall'] {
	if (err instanceof UnelevatedError) return 'needs-elevation';
	if (err instanceof MissingToolError || err instanceof MissingLinuxError) return 'skipped';
	const msg = err instanceof Error ? err.message : String(err);
	if (/not found on PATH|neither ufw nor firewalld/i.test(msg)) return 'skipped';
	return 'needs-elevation';
}

async function skipForElevation(lease: Lease, command: string): Promise<FirewallAttempt | null> {
	if (await isElevated()) return null;
	if (process.platform === 'darwin') writePfAnchor(listLeases());
	setFirewall(lease.name, 'needs-elevation');
	return {
		lease: { ...lease, firewall: 'needs-elevation' },
		ok: false,
		status: 'needs-elevation',
		command,
		detail: 'not running as admin or root; lease is saved'
	};
}

async function applyOne(lease: Lease, previous: Lease | null): Promise<void> {
	if (process.platform === 'win32') {
		await applyWindows(lease, previous);
		return;
	}
	if (process.platform === 'darwin') {
		await applyDarwin(listLeases());
		return;
	}
	await applyLinux(lease, previous);
}

export async function syncLease(lease: Lease, previous: Lease | null = null): Promise<FirewallAttempt> {
	const command = await pasteableCommand(lease, 'upsert');
	if (!shouldOpenInbound(lease)) {
		setFirewall(lease.name, 'skipped');
		return {
			lease: { ...lease, firewall: 'skipped' },
			ok: true,
			status: 'skipped',
			command,
			detail: 'loopback bind — no inbound hole'
		};
	}
	const unelevated = await skipForElevation(lease, command);
	if (unelevated) return unelevated;
	try {
		await applyOne(lease, previous);
		setFirewall(lease.name, 'applied');
		return { lease: { ...lease, firewall: 'applied' }, ok: true, status: 'applied', command };
	} catch (err) {
		const status = classifyFail(err);
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
	if (process.platform === 'darwin') {
		const inbound = leases.filter(shouldOpenInbound);
		const command = darwinCommands(leases);
		writePfAnchor(leases);
		if (inbound.length > 0 && !(await isElevated())) {
			return leases.map((lease) => {
				const skip = !shouldOpenInbound(lease);
				const st = skip ? 'skipped' : 'needs-elevation';
				setFirewall(lease.name, st);
				return {
					lease: { ...lease, firewall: st },
					ok: skip,
					status: st,
					command,
					detail: skip ? 'loopback bind — no inbound hole' : 'not running as admin or root; lease is saved'
				};
			});
		}
		try {
			await applyDarwin(leases);
			const out: FirewallAttempt[] = [];
			for (const lease of leases) {
				if (!shouldOpenInbound(lease)) {
					setFirewall(lease.name, 'skipped');
					out.push({
						lease: { ...lease, firewall: 'skipped' },
						ok: true,
						status: 'skipped',
						command,
						detail: 'loopback bind — no inbound hole'
					});
					continue;
				}
				setFirewall(lease.name, 'applied');
				out.push({ lease: { ...lease, firewall: 'applied' }, ok: true, status: 'applied', command });
			}
			if (inbound.length === 0 && leases.length > 0) return out;
			return out;
		} catch (err) {
			const status = classifyFail(err);
			return leases.map((lease) => {
				const skip = !shouldOpenInbound(lease);
				const st = skip ? 'skipped' : status;
				setFirewall(lease.name, st);
				return {
					lease: { ...lease, firewall: st },
					ok: skip,
					status: st,
					command,
					detail: skip ? 'loopback bind — no inbound hole' : err instanceof Error ? err.message : String(err)
				};
			});
		}
	}

	const out: FirewallAttempt[] = [];
	for (const lease of leases) {
		out.push(await syncLease(lease, null));
	}
	return out;
}

export async function removeLeaseRule(lease: Lease): Promise<FirewallAttempt> {
	const command = await pasteableCommand(lease, 'delete');
	if (!shouldOpenInbound(lease)) {
		return { lease, ok: true, status: 'skipped', command, detail: 'loopback bind — no inbound hole' };
	}
	if (!(await isElevated())) {
		if (process.platform === 'darwin') writePfAnchor(listLeases());
		return {
			lease,
			ok: false,
			status: 'needs-elevation',
			command,
			detail: 'not running as admin or root; lease already released'
		};
	}
	try {
		if (process.platform === 'win32') await removeWindows(lease);
		else if (process.platform === 'darwin') await applyDarwin(listLeases());
		else await (await import('./firewall/linux.js')).removeLinux(lease);
		return { lease, ok: true, status: 'skipped', command };
	} catch (err) {
		const status = classifyFail(err);
		return {
			lease,
			ok: status === 'skipped',
			status,
			command,
			detail: err instanceof Error ? err.message : String(err)
		};
	}
}
