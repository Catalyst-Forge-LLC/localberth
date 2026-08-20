import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isLoopbackClient } from '../binds.js';
import {
	OPEN_TARGET,
	isOperatorFace,
	rowOpenUrl,
	visitorFaviconCandidates,
	visitorHttpUrl,
	VISITOR_FAVICON_FILES,
	visitorPageHost,
	visitorTileLetter
} from '../dashboard-url.js';
import { rowBindDisplay, rowDetailFields } from '../row-detail.js';
import { isVisitorSelf, visitorLeaseRows } from '../visitor.js';
import { parsePeekPort, peekLoopbackDenied, peekPayload } from './http-peek.js';
import { DASHBOARD_PORT } from './paths.js';
import { getBoard } from './board.js';
import type { BoardRow } from './types.js';

function esc(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

const SITE_STATIC = join(dirname(fileURLToPath(import.meta.url)), '../../../site/static');

const FACE_CSS = `:root { --bg:#faf8f3; --elev:#fff; --line:#e7e2d8; --text:#1a1917; --muted:#4d4a44; --ok:#2a6f6a; --warn:#9a6b12; }
html,body { height:100%; }
body { margin:0; background:var(--bg); color:var(--text); font:14px/1.4 ui-sans-serif,system-ui,sans-serif; }
main { padding:1rem 1.25rem 1.5rem; }
.muted { color:var(--muted); }
header { display:flex; justify-content:space-between; align-items:center; gap:1rem; flex-wrap:wrap; margin-bottom:.75rem; }
header .brand { margin:0; }
header .brand img { display:block; height:3.5rem; width:auto; }
header .meta { color:var(--muted); font-size:.8rem; }
a { color:var(--ok); }
code { color:var(--text); }`;

function brandHeader(meta: string): string {
	return `<header><p class="brand"><img src="/logo.png" alt="LocalBerth"/></p><p class="meta">${meta}</p></header>`;
}

function sendSiteAsset(res: import('node:http').ServerResponse, file: string, type: string): boolean {
	try {
		const body = readFileSync(join(SITE_STATIC, file));
		res.writeHead(200, { 'content-type': type, 'cache-control': 'public, max-age=3600' });
		res.end(body);
		return true;
	} catch {
		return false;
	}
}

const OPEN_ICON =
	'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 3H3.5A1.5 1.5 0 0 0 2 4.5v8A1.5 1.5 0 0 0 3.5 14h8a1.5 1.5 0 0 0 1.5-1.5V10"/><path d="M9 2h5v5"/><path d="M14 2 8 8"/></svg>';

function openCell(href: string | null): string {
	if (!href) return '<td class="go"></td>';
	return `<td class="go"><a href="${esc(href)}" target="${OPEN_TARGET}" rel="noopener" title="Open" aria-label="Open">${OPEN_ICON}</a></td>`;
}

function rowKey(row: BoardRow): string {
	if (row.lease) return `lease:${row.lease.name}`;
	return `obs:${row.observed?.port ?? ''}:${row.observed?.bind ?? ''}`;
}

function facts(row: BoardRow): string {
	const fields = rowDetailFields(row);
	const items = fields
		.map((f) => {
			const cls = [f.wide || f.label === 'Notes' ? 'wide' : '', f.warn ? 'warn-field' : '']
				.filter(Boolean)
				.join(' ');
			const attr = cls ? ` class="${cls}"` : '';
			return `<div${attr}><dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`;
		})
		.join('');
	return `<dl class="facts">${items}<div class="http"><dt>HTTP</dt><dd class="peek">${row.listening ? 'Peeking…' : 'Not listening.'}</dd></div></dl>`;
}

function rowPair(row: BoardRow): string {
	const name = row.lease?.name ?? '—';
	const tag = row.lease ? '' : ' <span class="warn">observed</span>';
	const port = row.lease?.port ?? row.observed?.port ?? 0;
	const bind = rowBindDisplay(row);
	const href = rowOpenUrl(row);
	const listening = row.listening ? '<span class="ok">yes</span>' : '<span class="muted">no</span>';
	const proc = row.observed?.process ?? '—';
	const pid = row.observed?.pid ? ` <span class="muted">(${row.observed.pid})</span>` : '';
	const fw = row.lease?.firewall ?? '—';
	const key = esc(rowKey(row));
	return `<tr class="row" data-key="${key}"><td>${esc(name)}${tag}</td><td class="num">${port || '—'}</td><td class="muted">${esc(bind)}</td><td>${listening}</td><td class="muted">${esc(proc)}${pid}</td><td class="muted">${esc(fw)}</td>${openCell(href)}</tr>
<tr class="detail" data-for="${key}" data-port="${port}" data-listening="${row.listening ? '1' : ''}"><td colspan="7"><div class="panel"><div class="inner">${facts(row)}</div></div></td></tr>`;
}

function page(board: Awaited<ReturnType<typeof getBoard>>, showSystem: boolean): string {
	const leases = board.leaseRows.map(rowPair).join('');
	const observed = board.observedRows.map(rowPair).join('') ||
		'<tr><td colspan="7" class="muted">Nothing extra listening (system ports hidden).</td></tr>';
	const toggle = showSystem
		? '<a href="/">Hide system ports</a>'
		: `<a href="/?system=1">Show ${board.hiddenSystem} system port${board.hiddenSystem === 1 ? '' : 's'}</a>`;
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta http-equiv="refresh" content="8"/>
<title>LocalBerth</title>
<style>
${FACE_CSS}
.ok { color:var(--ok); }
.warn { color:var(--warn); font-size:.75rem; }
.num { font-variant-numeric:tabular-nums; }
section { margin-top:1.15rem; }
h2 { font-size:.8rem; font-weight:600; color:var(--muted); margin:0 0 .4rem; }
table { width:100%; min-width:40rem; border-collapse:collapse; background:var(--elev); border:1px solid var(--line); border-radius:10px; overflow:hidden; }
th,td { text-align:left; padding:.55rem .85rem; }
th { color:var(--muted); font-size:.68rem; font-weight:500; letter-spacing:.04em; text-transform:uppercase; }
.go { width:2.1rem; text-align:right; padding-left:.25rem; padding-right:.65rem; }
.go a { display:inline-flex; color:var(--ok); }
tr.row td { border-top:1px solid var(--line); }
tr.row { cursor:pointer; }
tr.row:nth-child(4n+3) { background:rgba(26,25,23,.03); }
tr.row:hover, tr.row.open { background:rgba(26,25,23,.05); }
tr.detail td { padding:0; border:0; }
tr.detail .panel { display:grid; grid-template-rows:0fr; transition:grid-template-rows .18s ease; }
tr.detail .inner { overflow:hidden; min-height:0; }
tr.detail.open .panel { grid-template-rows:1fr; }
tr.detail.open .inner { padding:.75rem 1rem .9rem; }
.facts { display:grid; grid-template-columns:repeat(auto-fill,minmax(12.5rem,1fr)); gap:.7rem 1.75rem; margin:0; }
.facts div { min-width:0; }
.facts dt { color:var(--muted); font-size:.68rem; letter-spacing:.04em; text-transform:uppercase; }
.facts dd { margin:.2rem 0 0; }
.facts .wide { grid-column:span 2; }
.facts .warn-field dd { color:var(--warn); }
.facts .http { grid-column:1 / -1; }
.facts .peek { color:var(--ok); }
a { color:var(--ok); }
</style>
</head>
<body>
<main>
${brandHeader(`:${DASHBOARD_PORT} · ${toggle}`)}
<section>
<h2>Leases</h2>
<table><thead><tr><th>Name</th><th>Port</th><th>Bind</th><th>Listening</th><th>Process</th><th>Firewall</th><th class="go"></th></tr></thead>
<tbody>${leases}</tbody></table>
</section>
<section>
<h2>Observed</h2>
<table><thead><tr><th>Name</th><th>Port</th><th>Bind</th><th>Listening</th><th>Process</th><th>Firewall</th><th class="go"></th></tr></thead>
<tbody>${observed}</tbody></table>
</section>
<p class="muted" style="margin-top:1.5rem"><code>localberth claim name --port N</code> · <code>localberth get name</code> · <code>localberth release name</code></p>
</main>
<script>
(function () {
	function closeAll() {
		document.querySelectorAll('tr.detail.open').forEach(function (el) { el.classList.remove('open'); });
		document.querySelectorAll('tr.row.open').forEach(function (el) { el.classList.remove('open'); });
	}
	function openKey(key) {
		var row = document.querySelector('tr.row[data-key="' + key + '"]');
		var detail = document.querySelector('tr.detail[data-for="' + key + '"]');
		if (!row || !detail) return;
		closeAll();
		row.classList.add('open');
		detail.classList.add('open');
		location.hash = encodeURIComponent(key);
		var peek = detail.querySelector('.peek');
		if (!detail.getAttribute('data-listening')) {
			if (peek) peek.textContent = 'Not listening.';
			return;
		}
		if (peek) peek.textContent = 'Peeking…';
		fetch('/api/peek?port=' + encodeURIComponent(detail.getAttribute('data-port') || ''))
			.then(function (r) { return r.json(); })
			.then(function (j) { if (peek) peek.textContent = j.line || 'Not HTTP.'; });
	}
	document.querySelectorAll('tr.row').forEach(function (row) {
		row.addEventListener('click', function (e) {
			if (e.target.closest('a')) return;
			var key = row.getAttribute('data-key');
			var detail = document.querySelector('tr.detail[data-for="' + key + '"]');
			if (detail && detail.classList.contains('open')) {
				closeAll();
				location.hash = '';
				return;
			}
			openKey(key);
		});
	});
	if (location.hash.length > 1) openKey(decodeURIComponent(location.hash.slice(1)));
})();
</script>
</body>
</html>`;
}

function visitorIconImg(candidates: string[]): string {
	if (candidates.length === 0) return '';
	const [first, ...rest] = candidates;
	return `<img src="${esc(first ?? '')}" alt="" data-next="${esc(JSON.stringify(rest))}" onerror="var n;try{n=JSON.parse(this.getAttribute('data-next')||'[]')}catch(e){n=[]}if(!n.length){this.hidden=true;return;}this.src=n.shift();this.setAttribute('data-next',JSON.stringify(n))"/>`;
}

function visitorTile(name: string, port: number, href: string | null, here: boolean): string {
	const letter = esc(visitorTileLetter(name));
	const candidates = here
		? VISITOR_FAVICON_FILES.map((file) => `/${file}`)
		: href
			? visitorFaviconCandidates(href)
			: [];
	const img = visitorIconImg(candidates);
	const caption = here ? 'This app' : String(port);
	const face = `<span class="logo" aria-hidden="true">${letter}${img}</span><span class="name">${esc(name)}</span><span class="port${here ? ' here' : ''}">${esc(caption)}</span>`;
	if (!href || here) {
		return `<div class="tile${here ? ' here' : ''}"${here ? ' aria-current="page"' : ''}>${face}</div>`;
	}
	return `<a class="tile" href="${esc(href)}" target="${OPEN_TARGET}" rel="noopener" aria-label="Open ${esc(name)}">${face}</a>`;
}

function visitorPage(board: Awaited<ReturnType<typeof getBoard>>, pageHost: string | null): string {
	const rows = visitorLeaseRows(board.leaseRows);
	const body =
		rows.length === 0
			? `<p class="muted">Nothing listening past loopback. Claim with <code>--lan</code> or start the app on all interfaces.</p>`
			: `<div class="tiles">${rows
					.map((row) => {
						const name = row.lease!.name;
						const port = row.lease!.port;
						const here = isVisitorSelf(row);
						const href = here || !pageHost ? null : visitorHttpUrl(pageHost, port);
						return visitorTile(name, port, href, here);
					})
					.join('')}</div>`;
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta http-equiv="refresh" content="8"/>
<title>LocalBerth</title>
<style>
${FACE_CSS}
.tiles { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.75rem; }
@media (min-width:640px) { .tiles { grid-template-columns:repeat(3,minmax(0,1fr)); } }
.tile { display:flex; flex-direction:column; align-items:center; gap:.5rem; padding:1rem .75rem; text-align:center; text-decoration:none; color:var(--text); background:var(--elev); border:1px solid var(--line); border-radius:10px; box-shadow:0 1px 2px rgba(26,25,23,.04); }
.tile.here { border-color:rgba(42,111,106,.35); }
a.tile:hover { background:rgba(26,25,23,.04); }
.logo { position:relative; display:flex; width:3rem; height:3rem; align-items:center; justify-content:center; overflow:hidden; border-radius:12px; background:rgba(26,25,23,.06); color:var(--muted); font-size:1.125rem; font-weight:600; }
.logo img { position:absolute; inset:0; width:100%; height:100%; object-fit:contain; }
.name { width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:.875rem; font-weight:500; }
.port { font-variant-numeric:tabular-nums; font-size:.75rem; color:var(--muted); }
.port.here { font-variant-numeric:normal; color:var(--ok); }
a { color:var(--ok); }
code { color:var(--text); }
</style>
</head>
<body>
<main>
${brandHeader('reachable on this machine')}
${body}
</main>
</body>
</html>`;
}

export async function serveDashboard(opts: { host?: string; port?: number } = {}): Promise<void> {
	const host = opts.host ?? process.env.HOST?.trim() ?? '127.0.0.1';
	const port = opts.port ?? Number(process.env.PORT || DASHBOARD_PORT);
	const server = createServer(async (req, res) => {
		try {
			const url = new URL(req.url ?? '/', `http://${host}:${port}`);
			if (url.pathname === '/logo.png' && sendSiteAsset(res, 'logo.png', 'image/png')) return;
			if (url.pathname === '/favicon.svg' && sendSiteAsset(res, 'favicon.svg', 'image/svg+xml')) return;
			const loopback = isLoopbackClient(req.socket.remoteAddress);
			const operator = isOperatorFace(req.socket.remoteAddress, req.headers.host);
			if (url.pathname === '/api/peek') {
				if (!loopback) {
					res.writeHead(403, { 'content-type': 'application/json; charset=utf-8' });
					res.end(JSON.stringify(peekLoopbackDenied()));
					return;
				}
				const peekPort = parsePeekPort(url.searchParams.get('port'));
				if (peekPort === null) {
					res.writeHead(400, { 'content-type': 'application/json; charset=utf-8' });
					res.end(JSON.stringify({ http: false, error: 'invalid port', ms: 0, line: 'Invalid port.' }));
					return;
				}
				res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
				res.end(JSON.stringify(await peekPayload(peekPort, { selfPort: port })));
				return;
			}
			if (url.pathname === '/api/board') {
				if (!loopback) {
					res.writeHead(403, { 'content-type': 'application/json; charset=utf-8' });
					res.end(JSON.stringify({ error: 'loopback only', line: 'Board API is loopback-only.' }));
					return;
				}
				const showSystem = url.searchParams.get('system') === '1';
				const board = await getBoard({ showSystem });
				res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
				res.end(JSON.stringify(board));
				return;
			}
			if (!operator) {
				const board = await getBoard({ showSystem: false });
				const pageHost = visitorPageHost(req.headers.host);
				res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
				res.end(visitorPage(board, pageHost));
				return;
			}
			const showSystem = url.searchParams.get('system') === '1';
			const board = await getBoard({ showSystem });
			res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
			res.end(page(board, showSystem));
		} catch (err) {
			res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
			res.end(err instanceof Error ? err.message : String(err));
		}
	});
	await new Promise<void>((resolve, reject) => {
		server.once('error', (err: NodeJS.ErrnoException) => {
			if (err.code === 'EADDRINUSE') {
				reject(
					new Error(
						`port ${port} is already in use. stop the other dashboard, or: localberth serve --port N`
					)
				);
				return;
			}
			if (err.code === 'EACCES') {
				reject(new Error(`cannot bind ${host}:${port} (permission denied)`));
				return;
			}
			reject(err);
		});
		server.listen(port, host, () => {
			console.error(`LocalBerth dashboard  http://${host}:${port}/`);
			resolve();
		});
	});
}
