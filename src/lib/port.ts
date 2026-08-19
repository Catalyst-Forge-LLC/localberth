import { getDb } from './server/db.js';
import { getLease } from './server/registry.js';

/** Resolve a lease to a TCP port. For Vite / app config: `server.port = localberthPort('foo', 5173)`. */
export function localberthPort(name: string, fallback?: number): number {
	return localberthListen(name, fallback).port;
}

/**
 * Host + port for Vite `server`. Pin `host` or Vite binds `localhost`, which on
 * Windows is often `[::1]` only while the claim stays `127.0.0.1`.
 */
export function localberthListen(
	name: string,
	fallbackPort?: number
): { host: string; port: number } {
	getDb();
	const lease = getLease(name);
	if (lease) return { host: lease.bind, port: lease.port };
	if (fallbackPort !== undefined) return { host: '127.0.0.1', port: fallbackPort };
	throw new Error(`localberth: no lease named "${name}"`);
}
