import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export type RunResult = {
	ok: boolean;
	code: number | string;
	stdout: string;
	stderr: string;
};

export class MissingToolError extends Error {
	readonly tool: string;
	constructor(tool: string) {
		super(`${tool} not found on PATH`);
		this.name = 'MissingToolError';
		this.tool = tool;
	}
}

export async function run(cmd: string, args: string[]): Promise<RunResult> {
	try {
		const { stdout, stderr } = await execFileAsync(cmd, args, {
			windowsHide: true,
			maxBuffer: 4 * 1024 * 1024
		});
		return { ok: true, code: 0, stdout: stdout ?? '', stderr: stderr ?? '' };
	} catch (err) {
		const e = err as NodeJS.ErrnoException & { status?: number; stdout?: string; stderr?: string };
		if (e.code === 'ENOENT') throw new MissingToolError(cmd);
		const code = e.status ?? e.code ?? 1;
		return {
			ok: false,
			code,
			stdout: e.stdout ?? '',
			stderr: e.stderr ?? e.message ?? ''
		};
	}
}

export function needsElevation(result: RunResult): boolean {
	const text = `${result.stderr}\n${result.stdout}`;
	return /access is denied|requested operation requires elevation|not authorized|operation not permitted|permission denied|must be root|you must be root|polkit|authentication/i.test(
		text
	);
}

export class UnelevatedError extends Error {
	constructor() {
		super('not running as admin or root');
		this.name = 'UnelevatedError';
	}
}

let elevatedCache: boolean | null = null;

/** True when this process can change the host firewall. Never prompts for UAC/sudo. */
export async function isElevated(): Promise<boolean> {
	if (elevatedCache !== null) return elevatedCache;
	if (process.platform === 'win32') {
		try {
			const r = await run('whoami', ['/groups']);
			elevatedCache = /S-1-16-12288|S-1-16-16384/.test(r.stdout);
		} catch {
			elevatedCache = false;
		}
		return elevatedCache;
	}
	elevatedCache = typeof process.getuid === 'function' && process.getuid() === 0;
	return elevatedCache;
}

export function resetElevatedCache(): void {
	elevatedCache = null;
}

export function whichExists(cmd: string): Promise<boolean> {
	const probe = process.platform === 'win32' ? ['where', [cmd]] : ['sh', ['-c', `command -v ${cmd}`]];
	return run(probe[0] as string, probe[1] as string[]).then((r) => r.ok);
}
