import { syncAll, syncLease, firewallCommand } from '../lib/server/firewall.js';
import { scanListeners } from '../lib/server/observe.js';
import { claim, getLease, listLeases } from '../lib/server/registry.js';
import { getDb } from '../lib/server/db.js';

function usage(): string {
	return `localberth — named TCP port leases

Usage:
  localberth get <name>
  localberth claim <name> [--port N] [--bind ADDR] [--ephemeral] [--notes TEXT]
  localberth ls
  localberth scan
  localberth firewall sync
`;
}

function fail(message: string, code = 1): never {
	console.error(message);
	process.exit(code);
}

function takeFlag(args: string[], name: string): boolean {
	const i = args.indexOf(name);
	if (i < 0) return false;
	args.splice(i, 1);
	return true;
}

function takeOpt(args: string[], name: string): string | undefined {
	const i = args.indexOf(name);
	if (i < 0) return undefined;
	const value = args[i + 1];
	if (!value || value.startsWith('-')) fail(`missing value for ${name}`);
	args.splice(i, 2);
	return value;
}

async function main(): Promise<void> {
	getDb();
	const argv = process.argv.slice(2);
	const cmd = argv.shift();
	if (!cmd || cmd === '-h' || cmd === '--help') {
		process.stdout.write(usage());
		return;
	}

	if (cmd === 'get') {
		const name = argv[0];
		if (!name) fail('usage: localberth get <name>');
		const lease = getLease(name);
		if (!lease) fail(`no lease named "${name}"`);
		process.stdout.write(`${lease.port}\n`);
		return;
	}

	if (cmd === 'claim') {
		const args = [...argv];
		const ephemeral = takeFlag(args, '--ephemeral');
		const portRaw = takeOpt(args, '--port');
		const bind = takeOpt(args, '--bind');
		const notes = takeOpt(args, '--notes');
		const name = args[0];
		if (!name || args.length !== 1) fail('usage: localberth claim <name> [--port N] [--bind ADDR] [--ephemeral] [--notes TEXT]');
		const port = portRaw !== undefined ? Number(portRaw) : undefined;
		if (portRaw !== undefined && !Number.isInteger(port)) fail(`invalid --port ${portRaw}`);
		const { lease, previous } = claim({ name, port, bind, ephemeral, notes });
		const fw = await syncLease(lease, previous);
		process.stdout.write(`${lease.name}\t${lease.port}\t${lease.bind}\t${fw.status}\n`);
		if (!fw.ok) {
			console.error(`firewall ${fw.status}. run as admin/sudo, or paste:\n${fw.command}`);
		}
		return;
	}

	if (cmd === 'ls') {
		const leases = listLeases();
		if (leases.length === 0) {
			console.error('no leases');
			return;
		}
		for (const lease of leases) {
			process.stdout.write(
				`${lease.name}\t${lease.port}\t${lease.bind}\t${lease.kind}\t${lease.firewall}\n`
			);
		}
		return;
	}

	if (cmd === 'scan') {
		const rows = await scanListeners();
		if (rows.length === 0) {
			console.error('no listening TCP sockets');
			return;
		}
		for (const row of rows) {
			const name = row.leaseName ?? '-';
			process.stdout.write(
				`${row.port}\t${row.bind}\t${row.pid ?? '-'}\t${row.process ?? '-'}\t${name}\n`
			);
		}
		return;
	}

	if (cmd === 'firewall') {
		const sub = argv[0];
		if (sub !== 'sync') fail('usage: localberth firewall sync');
		const results = await syncAll();
		for (const r of results) {
			process.stdout.write(`${r.lease.name}\t${r.lease.port}\t${r.status}\n`);
			if (!r.ok) console.error(`  ${firewallCommand(r.lease)}\n  ${r.detail ?? ''}`);
		}
		return;
	}

	fail(`unknown command "${cmd}"\n${usage()}`);
}

main().catch((err) => {
	fail(err instanceof Error ? err.message : String(err));
});
