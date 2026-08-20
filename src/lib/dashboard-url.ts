import { isLoopbackBind, isLoopbackClient } from './binds.js';

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

/**
 * Host a visitor should use in Open links — the Host they already typed.
 * Rejects junk so we never invent a Tailscale IP or follow a weird header.
 */
export function visitorPageHost(hostHeader: string | null | undefined): string | null {
	if (!hostHeader) return null;
	const raw = hostHeader.trim();
	if (!raw || /[\s/@\\]/.test(raw)) return null;
	try {
		const url = new URL(`http://${raw}/`);
		let host = url.hostname.replace(/^\[|\]$/g, '');
		if (!host) return null;
		if (host.includes(':')) host = `[${host}]`;
		return host;
	} catch {
		return null;
	}
}

/** Host the browser asked for is loopback (localhost / 127 / ::1). */
export function isLoopbackPageHost(hostHeader: string | null | undefined): boolean {
	const host = visitorPageHost(hostHeader);
	return Boolean(host && isLoopbackBind(host));
}

/**
 * Operator board only when the TCP peer is loopback and Host is too (or omitted).
 * Vite and some Tailscale paths show 127.0.0.1 as the peer while Host is 100.x.
 */
export function isOperatorFace(
	peer: string | null | undefined,
	hostHeader: string | null | undefined
): boolean {
	if (!isLoopbackClient(peer)) return false;
	if (!hostHeader?.trim()) return true;
	return isLoopbackPageHost(hostHeader);
}

/** Visitor Open URL: same host the phone used, app port. */
export function visitorHttpUrl(pageHost: string, port: number): string | null {
	if (!pageHost || !Number.isInteger(port) || port < 1 || port > 65535) return null;
	return `http://${pageHost}:${port}/`;
}

/** Well-known icon files. Phone tries each; LocalBerth does not proxy. */
export const VISITOR_FAVICON_FILES = ['favicon.png', 'favicon.svg', 'favicon.ico'] as const;

/** App icons the phone loads itself. png first — that is what most house sites ship. */
export function visitorFaviconCandidates(href: string): string[] {
	try {
		const base = new URL(href);
		return VISITOR_FAVICON_FILES.map((name) => new URL(name, base).href);
	} catch {
		return [];
	}
}

export function visitorTileLetter(name: string): string {
	const ch = [...name.trim()][0];
	return ch ? ch.toUpperCase() : '?';
}
