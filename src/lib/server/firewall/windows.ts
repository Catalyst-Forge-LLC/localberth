import type { Lease } from '../types.js';
import { ruleName, scopedBind } from './names.js';
import { needsElevation, run, type RunResult } from './run.js';

export function windowsCommands(lease: Lease, action: 'upsert' | 'delete'): string {
	const name = ruleName(lease);
	if (action === 'delete') {
		return `netsh advfirewall firewall delete rule name="${name}"`;
	}
	const scope = scopedBind(lease.bind);
	const add = [
		`netsh advfirewall firewall add rule name="${name}" dir=in action=allow protocol=TCP localport=${lease.port}`,
		`description="Managed by LocalBerth"`
	];
	if (scope) add.push(`localip=${scope}`);
	return [`netsh advfirewall firewall delete rule name="${name}"`, add.join(' ')].join(' && ');
}

async function deleteNamed(name: string): Promise<RunResult> {
	return run('netsh', ['advfirewall', 'firewall', 'delete', 'rule', `name=${name}`]);
}

async function showNamed(name: string): Promise<boolean> {
	const shown = await run('netsh', ['advfirewall', 'firewall', 'show', 'rule', `name=${name}`]);
	if (!shown.ok) return false;
	return /Rule Name:/i.test(shown.stdout) && !/No rules match/i.test(shown.stdout);
}

export async function applyWindows(lease: Lease, previous: Lease | null): Promise<void> {
	if (previous && ruleName(previous) !== ruleName(lease)) {
		const gone = await deleteNamed(ruleName(previous));
		if (!gone.ok && needsElevation(gone) && !/No rules match/i.test(gone.stdout + gone.stderr)) {
			throw new Error(gone.stderr || gone.stdout || 'netsh delete previous failed');
		}
	}

	const name = ruleName(lease);
	if (await showNamed(name)) {
		const cleared = await deleteNamed(name);
		if (!cleared.ok && needsElevation(cleared)) {
			throw new Error(cleared.stderr || cleared.stdout || 'netsh delete failed');
		}
	}

	const args = [
		'advfirewall',
		'firewall',
		'add',
		'rule',
		`name=${name}`,
		'dir=in',
		'action=allow',
		'protocol=TCP',
		`localport=${String(lease.port)}`,
		'description=Managed by LocalBerth'
	];
	const scope = scopedBind(lease.bind);
	if (scope) args.push(`localip=${scope}`);

	const added = await run('netsh', args);
	if (!added.ok) {
		throw new Error(added.stderr || added.stdout || 'netsh add failed');
	}
}

export async function removeWindows(lease: Lease): Promise<void> {
	const gone = await deleteNamed(ruleName(lease));
	const text = `${gone.stdout}\n${gone.stderr}`;
	if (gone.ok || /No rules match/i.test(text)) return;
	throw new Error(gone.stderr || gone.stdout || 'netsh delete failed');
}
