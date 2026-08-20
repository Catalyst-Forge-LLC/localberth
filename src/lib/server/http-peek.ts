import { DASHBOARD_PORT } from './paths.js';

export type HttpPeek = {
	http: boolean;
	status?: number;
	contentType?: string;
	server?: string;
	title?: string;
	iconHref?: string;
	location?: string;
	error?: string;
	ms: number;
};

const PEEK_MS = 300;
const BODY_CAP = 8192;

export function parsePeekPort(raw: string | null): number | null {
	if (!raw) return null;
	const port = Number(raw);
	if (!Number.isInteger(port) || port < 1 || port > 65535) return null;
	return port;
}

export function peekLoopbackDenied(): HttpPeek & { line: string } {
	return { http: false, error: 'loopback only', ms: 0, line: 'Peek is loopback-only.' };
}

/** Loopback GET. Never follows a redirect. Times out at 300ms. */
export async function peekPayload(
	port: number,
	opts: { selfPort?: number } = {}
): Promise<HttpPeek & { line: string }> {
	if (port === DASHBOARD_PORT || (opts.selfPort !== undefined && port === opts.selfPort)) {
		return { http: true, status: 200, contentType: 'text/html', title: 'LocalBerth', ms: 0, line: 'This dashboard.' };
	}
	const peek = await peekHttp(port);
	return { ...peek, line: formatPeek(peek) };
}

export async function peekHttp(port: number): Promise<HttpPeek> {
	const v4 = await peekUrl(`http://127.0.0.1:${port}/`);
	if (v4.http || v4.error === 'timeout') return v4;
	return peekUrl(`http://[::1]:${port}/`);
}

async function peekUrl(url: string): Promise<HttpPeek> {
	const started = Date.now();
	try {
		const res = await fetch(url, {
			method: 'GET',
			redirect: 'manual',
			signal: AbortSignal.timeout(PEEK_MS),
			headers: { accept: 'text/html,*/*;q=0.8' }
		});
		const contentType = (res.headers.get('content-type') ?? '').split(';')[0]?.trim() || undefined;
		const server = res.headers.get('server')?.trim() || undefined;
		const location = res.headers.get('location')?.trim() || undefined;
		let title: string | undefined;
		let iconHref: string | undefined;
		if ((contentType ?? '').includes('text/html')) {
			const html = await readPrefix(res);
			title = readTitle(html);
			iconHref = readIconHref(html);
		} else {
			res.body?.cancel();
		}
		return {
			http: true,
			status: res.status,
			contentType,
			server,
			title,
			iconHref,
			location,
			ms: Date.now() - started
		};
	} catch (err) {
		const name = err instanceof Error ? err.name : '';
		const error = name === 'TimeoutError' || name === 'AbortError' ? 'timeout' : 'not HTTP';
		return { http: false, error, ms: Date.now() - started };
	}
}

export function formatPeek(peek: HttpPeek): string {
	if (!peek.http) {
		if (peek.error === 'timeout') return 'Peek timed out.';
		if (peek.error === 'not listening') return 'Not listening.';
		return 'Not HTTP.';
	}
	const bits = [String(peek.status ?? '')];
	if (peek.contentType) bits.push(peek.contentType);
	if (peek.title) bits.push(peek.title);
	else if (peek.server) bits.push(peek.server);
	if (peek.location && (peek.status ?? 0) >= 300 && (peek.status ?? 0) < 400) {
		bits.push(`→ ${peek.location}`);
	}
	return bits.filter(Boolean).join(' · ');
}

async function readPrefix(res: Response): Promise<string> {
	if (!res.body) return '';
	const reader = res.body.getReader();
	const chunks: Uint8Array[] = [];
	let n = 0;
	try {
		while (n < BODY_CAP) {
			const { done, value } = await reader.read();
			if (done || !value) break;
			chunks.push(value);
			n += value.byteLength;
		}
	} finally {
		await reader.cancel();
	}
	const out = new Uint8Array(n);
	let off = 0;
	for (const chunk of chunks) {
		const take = Math.min(chunk.byteLength, n - off);
		out.set(chunk.subarray(0, take), off);
		off += take;
	}
	return new TextDecoder('utf-8', { fatal: false }).decode(out);
}

export function readTitle(html: string): string | undefined {
	const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
	const title = match?.[1]?.replace(/\s+/g, ' ').trim();
	return title || undefined;
}

/** First `|` or ` - ` segment. Tiles want the app name, not the site tagline. */
export function shortPeekTitle(title: string | null | undefined): string | null {
	if (!title) return null;
	const pipe = firstSegment(title, '|');
	const dash = firstSegment(pipe, ' - ');
	return dash || null;
}

function firstSegment(value: string, sep: string): string {
	const first = value.split(sep).map((part) => part.replace(/\s+/g, ' ').trim()).find(Boolean);
	return first ?? value.replace(/\s+/g, ' ').trim();
}

function readAttr(tag: string, name: string): string | undefined {
	const match = tag.match(new RegExp(`${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
	return match?.[1] ?? match?.[2] ?? match?.[3];
}

/** First apple-touch-icon, then rel=icon, then shortcut icon. */
export function readIconHref(html: string): string | undefined {
	const found: { href: string; rank: number }[] = [];
	for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
		const tag = match[0] ?? '';
		const rel = (readAttr(tag, 'rel') ?? '')
			.toLowerCase()
			.split(/\s+/)
			.filter(Boolean);
		const href = readAttr(tag, 'href')?.trim();
		if (!href || /^javascript:/i.test(href)) continue;
		const apple = rel.some((r) => r === 'apple-touch-icon' || r === 'apple-touch-icon-precomposed');
		const icon = rel.includes('icon');
		const shortcut = rel.includes('shortcut');
		if (!apple && !icon && !shortcut) continue;
		const rank = apple ? 0 : icon && !shortcut ? 1 : 2;
		found.push({ href, rank });
	}
	found.sort((a, b) => a.rank - b.rank);
	return found[0]?.href;
}
