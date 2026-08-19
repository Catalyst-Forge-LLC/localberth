/** Bind address helpers. Safe for the dashboard client — do not put this under $lib/server. */

/** Strip brackets, map ::ffff:IPv4, treat * as 0.0.0.0. */
export function normalizeBind(bind: string): string {
	const raw = bind.trim();
	if (!raw) return raw;
	const unbracket = raw.replace(/^\[|\]$/g, '');
	const mapped = ipv4FromMapped(unbracket);
	if (mapped) return mapped;
	if (unbracket === '*') return '0.0.0.0';
	return unbracket;
}

function ipv4FromMapped(bind: string): string | null {
	const dotted = bind.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
	if (dotted) return dotted[1] ?? null;
	const hex = bind.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
	if (!hex) return null;
	const hi = parseInt(hex[1] ?? '', 16);
	const lo = parseInt(hex[2] ?? '', 16);
	if (!Number.isInteger(hi) || !Number.isInteger(lo)) return null;
	return `${(hi >> 8) & 255}.${hi & 255}.${(lo >> 8) & 255}.${lo & 255}`;
}

export function isLoopbackBind(bind: string): boolean {
	const b = normalizeBind(bind).toLowerCase();
	return b === '127.0.0.1' || b === '::1' || b === 'localhost';
}

export function isWildcardBind(bind: string): boolean {
	const b = normalizeBind(bind);
	return !b || b === '0.0.0.0' || b === '::' || b === '*';
}

/** Same slip: exact bind, both loopback, or either side is all-interfaces. */
export function bindsOverlap(leaseBind: string, observedBind: string): boolean {
	const a = normalizeBind(leaseBind);
	const b = normalizeBind(observedBind);
	if (a === b) return true;
	if (isLoopbackBind(a) && isLoopbackBind(b)) return true;
	if (isWildcardBind(a) || isWildcardBind(b)) return true;
	return false;
}

export type BindRelation = 'same' | 'equivalent' | 'wider' | 'narrower' | 'other';

/** How the process bind compares to the claim. */
export function bindRelation(leaseBind: string, observedBind: string): BindRelation {
	const a = normalizeBind(leaseBind);
	const b = normalizeBind(observedBind);
	if (a === b) return 'same';
	if (isLoopbackBind(a) && isLoopbackBind(b)) return 'equivalent';
	if (isWildcardBind(b) && !isWildcardBind(a)) return 'wider';
	if (isWildcardBind(a) && !isWildcardBind(b)) return 'narrower';
	if (bindsOverlap(a, b)) return 'equivalent';
	return 'other';
}
