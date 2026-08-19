/** One named tab so a second Open replaces the first. Do not use rel=noreferrer — Chrome then ignores the name. */
export const OPEN_TARGET = 'localberth-open';

/** Prefer the observed listen address so IPv6-only Vite still opens. */
export function rowOpenUrl(row: {
	listening: boolean;
	lease?: { bind: string; port: number } | null;
	observed?: { bind: string; port: number } | null;
}): string | null {
	if (!row.listening) return null;
	const port = row.lease?.port ?? row.observed?.port;
	const bind = row.observed?.bind ?? row.lease?.bind;
	if (!port || !bind) return null;
	return dashboardHttpUrl(bind, port);
}

/** Browser URL for a lease or listener. Wildcard binds open on loopback. */
export function dashboardHttpUrl(bind: string, port: number): string | null {
	if (!Number.isInteger(port) || port < 1 || port > 65535) return null;
	let host = bind.trim() || '127.0.0.1';
	if (host === '0.0.0.0' || host === '::' || host === '*') host = '127.0.0.1';
	if (host.includes(':') && !host.startsWith('[')) host = `[${host}]`;
	return `http://${host}:${port}/`;
}
