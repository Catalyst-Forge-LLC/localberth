import {
	isLoopbackBind,
	isWildcardBind,
	normalizeBind
} from '../../binds.js';
import type { Lease } from '../types.js';

export {
	bindRelation,
	bindsOverlap,
	isLoopbackBind,
	isWildcardBind,
	normalizeBind,
	type BindRelation
} from '../../binds.js';

export const RULE_PREFIX = 'LocalBerth';

export function ruleName(lease: Pick<Lease, 'name' | 'port'>): string {
	return `${RULE_PREFIX} ${lease.name} ${lease.port}`;
}

/** 0.0.0.0 / :: / empty → all interfaces. Otherwise pin the rule to that address. */
export function scopedBind(bind: string): string | null {
	const b = normalizeBind(bind);
	if (isWildcardBind(b) || isLoopbackBind(b)) return null;
	return b;
}

export function shouldOpenInbound(lease: Pick<Lease, 'bind'>): boolean {
	return !isLoopbackBind(lease.bind);
}
