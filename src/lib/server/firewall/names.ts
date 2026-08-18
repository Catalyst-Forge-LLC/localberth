import type { Lease } from '../types.js';

export const RULE_PREFIX = 'LocalBerth';

export function ruleName(lease: Pick<Lease, 'name' | 'port'>): string {
	return `${RULE_PREFIX} ${lease.name} ${lease.port}`;
}

export function isLoopbackBind(bind: string): boolean {
	const b = bind.trim().toLowerCase();
	return b === '127.0.0.1' || b === '::1' || b === 'localhost';
}

/** 0.0.0.0 / :: / empty → all interfaces. Otherwise pin the rule to that address. */
export function scopedBind(bind: string): string | null {
	const b = bind.trim();
	if (!b || b === '0.0.0.0' || b === '::' || b === '*' || b === '[::]') return null;
	if (isLoopbackBind(b)) return null;
	return b;
}

export function shouldOpenInbound(lease: Pick<Lease, 'bind'>): boolean {
	return !isLoopbackBind(lease.bind);
}
