/** Browser URL for a lease or listener. Wildcard binds open on loopback. */
export function dashboardHttpUrl(bind: string, port: number): string | null {
	if (!Number.isInteger(port) || port < 1 || port > 65535) return null;
	let host = bind.trim() || '127.0.0.1';
	if (host === '0.0.0.0' || host === '::' || host === '*') host = '127.0.0.1';
	if (host.includes(':') && !host.startsWith('[')) host = `[${host}]`;
	return `http://${host}:${port}/`;
}
