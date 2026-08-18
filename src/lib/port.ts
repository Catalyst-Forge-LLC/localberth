import { getDb } from './server/db.js';
import { getLease } from './server/registry.js';

/** Resolve a lease to a TCP port. For Vite / app config: `server.port = localberthPort('fizzbuzz', 5193)`. */
export function localberthPort(name: string, fallback?: number): number {
	getDb();
	const lease = getLease(name);
	if (lease) return lease.port;
	if (fallback !== undefined) return fallback;
	throw new Error(`localberth: no lease named "${name}"`);
}
