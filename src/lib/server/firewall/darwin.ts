import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { dataHome } from '../paths.js';
import type { Lease } from '../types.js';
import { shouldOpenInbound } from './names.js';
import { run } from './run.js';

export function pfAnchorPath(): string {
	const dir = join(dataHome(), 'pf');
	mkdirSync(dir, { recursive: true });
	return join(dir, 'localberth.anchor');
}

export function renderPfAnchor(leases: Lease[]): string {
	const ports = [...new Set(leases.filter(shouldOpenInbound).map((l) => l.port))].sort((a, b) => a - b);
	if (ports.length === 0) {
		return '# LocalBerth — no inbound ports (loopback-only leases)\n';
	}
	return [
		'# Managed by LocalBerth. Loaded as pf anchor "localberth".',
		...ports.map((p) => `pass in proto tcp from any to any port ${p}`)
	].join('\n') + '\n';
}

export function pfInstallHint(anchorFile: string): string {
	return [
		'# once: add these two lines to /etc/pf.conf, then enable pf',
		'anchor "localberth"',
		`load anchor "localberth" from "${anchorFile}"`,
		`sudo pfctl -ef /etc/pf.conf && sudo pfctl -a localberth -f "${anchorFile}"`
	].join('\n');
}

export function darwinCommands(leases: Lease[]): string {
	const file = pfAnchorPath();
	return ['# write the LocalBerth pf anchor, then:', pfInstallHint(file), '', renderPfAnchor(leases)].join(
		'\n'
	);
}

export function writePfAnchor(leases: Lease[]): string {
	const file = pfAnchorPath();
	writeFileSync(file, renderPfAnchor(leases), 'utf8');
	return file;
}

export async function applyDarwin(leases: Lease[]): Promise<void> {
	const file = writePfAnchor(leases);
	const loaded = await run('pfctl', ['-a', 'localberth', '-f', file]);
	if (loaded.ok) return;
	throw new Error(
		`${loaded.stderr || loaded.stdout || 'pfctl failed'}\n${pfInstallHint(file)}`
	);
}
