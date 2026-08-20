import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isLoopbackClient } from '../binds.js';
import {
	OPEN_TARGET,
	isOperatorFace,
	rowOpenUrl,
	visitorHttpUrl,
	VISITOR_FAVICON_FILES,
	visitorPageHost,
	visitorTileIcons,
	visitorTileLetter
} from '../dashboard-url.js';
import { addressCaption } from '../address.js';
import { machineCard } from '../machine.js';
import { rowBindDisplay, rowDetailFields } from '../row-detail.js';
import { parsePeekPort, peekLoopbackDenied, peekPayload } from './http-peek.js';
import { visitorFeed } from './visitor-feed.js';
import { DASHBOARD_PORT } from './paths.js';
import { getBoard } from './board.js';
import type { BoardRow } from './types.js';

function esc(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

const SITE_STATIC = join(dirname(fileURLToPath(import.meta.url)), '../../../site/static');

const FACE_CSS = `:root { --bg:#faf8f3; --elev:#fff; --line:#e7e2d8; --text:#1a1917; --muted:#4d4a44; --ok:#2a6f6a; --warn:#9a6b12; --tile-band:#000; --tile-band-ink:#faf8f3; }
html,body { height:100%; overflow:hidden; }
body { margin:0; background:var(--bg); color:var(--text); font:14px/1.4 ui-sans-serif,system-ui,sans-serif; }
main { display:flex; flex-direction:column; height:100%; min-height:100dvh; padding:0; overflow:hidden; }
.muted { color:var(--muted); }
header { flex-shrink:0; margin:0; padding:.5rem 1.25rem; background:#000; color:var(--tile-band-ink); }
header .ident { display:flex; flex-wrap:wrap; align-items:center; gap:.35rem .75rem; }
header .brand { display:flex; flex-shrink:0; align-items:center; gap:.65rem; margin:0; }
header .brand img { display:block; height:2.75rem; width:auto; }
header .word { margin:0; font-size:1rem; font-weight:600; letter-spacing:-0.02em; }
header .host { font-size:.875rem; color:rgba(250,248,243,.85); }
header .addrs, header .addrs button { font-size:.875rem; color:rgba(250,248,243,.7); font-variant-numeric:tabular-nums; }
header .meta { font-size:.875rem; color:rgba(250,248,243,.7); }
header .meta a { color:#8fd4cf; text-decoration:none; }
header .dot { color:rgba(250,248,243,.3); }
header button.copy { margin:0; padding:0; border:0; background:none; color:inherit; font:inherit; text-align:left; cursor:pointer; }
.feed { flex:1; min-height:0; overflow:auto; padding:0 1.25rem 1rem; }
.feed.board { display:flex; flex-direction:column; overflow:hidden; padding-top:1rem; }
.sitefoot { flex-shrink:0; border-top:1px solid rgba(250,248,243,.2); background:var(--tile-band); text-align:center; padding:.75rem 1.25rem; padding-bottom:max(.75rem, env(safe-area-inset-bottom)); }
.sitefoot a { color:rgba(250,248,243,.8); text-decoration:none; font-size:.875rem; }
a { color:var(--ok); }
code { color:var(--text); }`;

function siteFooter(): string {
	return `<footer class="sitefoot"><a href="https://localberth.com" rel="noopener">localberth.com</a></footer>`;
}

function brandHeader(meta: string): string {
	const machine = machineCard();
	const addrs = machine.addresses
		.map(
			(addr) =>
				`<span class="dot" aria-hidden="true">·</span><button type="button" class="copy addrs" data-copy="${esc(addr)}">${esc(addressCaption(addr))}</button>`
		)
		.join('');
	return `<header>
<div class="ident">
<span class="brand"><img src="/logo.png" alt=""/><span class="word">LocalBerth</span></span>
<button type="button" class="copy host" data-copy="${esc(machine.hostname)}">${esc(machine.hostname)}</button>
${addrs}
${meta ? `<span class="dot" aria-hidden="true">·</span><span class="meta">${meta}</span>` : ''}
</div>
</header>`;
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

const COPY_SCRIPT = `(function () {
	function copyText(text) {
		if (navigator.clipboard && navigator.clipboard.writeText) {
			return navigator.clipboard.writeText(text).then(function () { return true; }).catch(fallback);
		}
		return Promise.resolve(fallback());
		function fallback() {
			try {
				var el = document.createElement('textarea');
				el.value = text;
				el.setAttribute('readonly', '');
				el.style.position = 'fixed';
				el.style.left = '-9999px';
				document.body.appendChild(el);
				el.select();
				var ok = document.execCommand('copy');
				el.remove();
				return ok;
			} catch (e) { return false; }
		}
	}
	document.addEventListener('click', function (e) {
		var btn = e.target.closest('[data-copy]');
		if (!btn) return;
		var value = btn.getAttribute('data-copy');
		copyText(value).then(function (ok) {
			if (!ok) return;
			var prev = btn.textContent;
			btn.textContent = 'Copied';
			setTimeout(function () { btn.textContent = prev; }, 1200);
		});
	});
	function bindHold(el) {
		var url = el.getAttribute('data-copy-url');
		if (!url || el.getAttribute('data-hold-bound')) return;
		el.setAttribute('data-hold-bound', '1');
		var timer = null;
		var held = false;
		function clear() { if (timer) clearTimeout(timer); timer = null; }
		function flash() {
			copyText(url).then(function (ok) {
				if (!ok) return;
				held = true;
				var label = el.querySelector('.name');
				if (!label) return;
				var prev = label.textContent;
				label.textContent = 'Copied';
				setTimeout(function () { label.textContent = prev; }, 1200);
			});
		}
		el.addEventListener('pointerdown', function (e) {
			if (e.pointerType === 'mouse' && e.button !== 0) return;
			held = false;
			clear();
			timer = setTimeout(flash, 500);
		});
		el.addEventListener('pointerup', clear);
		el.addEventListener('pointercancel', clear);
		el.addEventListener('pointerleave', clear);
		el.addEventListener('click', function (e) {
			if (!held) return;
			e.preventDefault();
			held = false;
		});
		el.addEventListener('contextmenu', function (e) {
			e.preventDefault();
			flash();
		});
	}
	document.querySelectorAll('[data-copy-url]').forEach(bindHold);
	window.localberthBindHold = bindHold;
})();`;

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
<title>LocalBerth</title>
<style>
${FACE_CSS}
.ok { color:var(--ok); }
.warn { color:var(--warn); font-size:.75rem; }
.num { font-variant-numeric:tabular-nums; }
.tabs { display:flex; gap:.15rem; flex-shrink:0; margin-bottom:.75rem; }
.tabs button { margin:0; padding:.35rem .75rem; border:0; border-bottom:2px solid transparent; background:none; color:var(--muted); font:inherit; font-size:.875rem; cursor:pointer; }
.tabs button[aria-selected="true"] { color:var(--text); font-weight:500; border-bottom-color:var(--ok); }
.tabs .n { font-variant-numeric:tabular-nums; color:var(--muted); margin-left:.25rem; }
.pane { display:none; flex:1; min-height:0; }
.pane.on { display:flex; flex-direction:column; }
.scroll { flex:1; min-height:0; overflow:auto; border:1px solid var(--line); border-radius:10px; background:var(--elev); }
.hint { flex-shrink:0; margin:.75rem 0 0; }
table { width:100%; min-width:40rem; border-collapse:separate; border-spacing:0; }
th,td { text-align:left; padding:.55rem .85rem; }
th { position:sticky; top:0; z-index:1; background:var(--elev); color:var(--muted); font-size:.68rem; font-weight:500; letter-spacing:.04em; text-transform:uppercase; border-bottom:1px solid var(--line); }
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
<div class="feed board">
<div class="tabs" role="tablist" aria-label="Board">
<button type="button" role="tab" id="tab-leases" data-tab="leases" aria-controls="pane-leases" aria-selected="true">Leases <span class="n">${board.leaseRows.length}</span></button>
<button type="button" role="tab" id="tab-observed" data-tab="observed" aria-controls="pane-observed" aria-selected="false">Observed <span class="n">${board.observedRows.length}</span></button>
</div>
<div class="pane on" id="pane-leases" data-pane="leases" role="tabpanel" aria-labelledby="tab-leases"><div class="scroll"><table><thead><tr><th>Name</th><th>Port</th><th>Bind</th><th>Listening</th><th>Process</th><th>Firewall</th><th class="go"></th></tr></thead>
<tbody>${leases}</tbody></table></div></div>
<div class="pane" id="pane-observed" data-pane="observed" role="tabpanel" aria-labelledby="tab-observed"><div class="scroll"><table><thead><tr><th>Name</th><th>Port</th><th>Bind</th><th>Listening</th><th>Process</th><th>Firewall</th><th class="go"></th></tr></thead>
<tbody>${observed}</tbody></table></div></div>
<p class="muted hint"><code>localberth claim name --port N</code> · <code>localberth get name</code> · <code>localberth release name</code></p>
</div>
${siteFooter()}
</main>
<script>
${COPY_SCRIPT}
(function () {
	function showTab(id) {
		document.querySelectorAll('[data-tab]').forEach(function (b) {
			b.setAttribute('aria-selected', b.getAttribute('data-tab') === id ? 'true' : 'false');
		});
		document.querySelectorAll('[data-pane]').forEach(function (p) {
			p.classList.toggle('on', p.getAttribute('data-pane') === id);
		});
	}
	document.querySelectorAll('[data-tab]').forEach(function (btn) {
		btn.addEventListener('click', function () {
			showTab(btn.getAttribute('data-tab'));
			closeAll();
			location.hash = '';
		});
	});
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
	if (location.hash.length > 1) {
		var hashKey = decodeURIComponent(location.hash.slice(1));
		if (hashKey.indexOf('obs:') === 0) showTab('observed');
		openKey(hashKey);
	}
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

function visitorTile(
	name: string,
	port: number,
	href: string | null,
	here: boolean,
	title?: string | null,
	icon?: string | null
): string {
	const heading = (title?.trim() || name);
	const letter = esc(visitorTileLetter(name));
	const candidates = here
		? VISITOR_FAVICON_FILES.map((file) => `/${file}`)
		: href
			? visitorTileIcons(href, icon)
			: [];
	const img = visitorIconImg(candidates);
	const caption = here ? 'This app' : `:${port}`;
	const face = `<span class="face"><span class="logo" aria-hidden="true">${letter}${img}</span><span class="name">${esc(heading)}</span></span><span class="port${here ? ' here' : ''}">${esc(caption)}</span>`;
	if (!href || here) {
		return `<div class="tile${here ? ' here' : ''}"${here ? ' aria-current="page"' : ''}>${face}</div>`;
	}
	return `<a class="tile" href="${esc(href)}" target="${OPEN_TARGET}" rel="noopener" aria-label="Open ${esc(heading)}" data-copy-url="${esc(href)}">${face}</a>`;
}

async function visitorPage(board: Awaited<ReturnType<typeof getBoard>>, pageHost: string | null): Promise<string> {
	const feed = await visitorFeed(board.leaseRows, machineCard());
	const body =
		feed.tiles.length === 0
			? `<p class="muted">Nothing listening past loopback. Claim with <code>--lan</code> or start the app on all interfaces.</p>`
			: `<div class="tiles">${feed.tiles
					.map((tile) => {
						const href = pageHost ? visitorHttpUrl(pageHost, tile.port) : null;
						return visitorTile(tile.name, tile.port, href, false, tile.title, tile.icon);
					})
					.join('')}</div>`;
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>LocalBerth</title>
<style>
${FACE_CSS}
.tiles { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.75rem; }
@media (min-width:640px) { .tiles { grid-template-columns:repeat(3,minmax(0,1fr)); } }
.tile { display:flex; flex-direction:column; align-items:stretch; min-height:9.5rem; padding:0; overflow:hidden; text-align:center; text-decoration:none; color:var(--text); background:var(--elev); border:1px solid var(--line); border-radius:10px; box-shadow:0 1px 2px rgba(26,25,23,.04); user-select:none; -webkit-user-select:none; -webkit-touch-callout:none; }
.tile.here { border-color:rgba(42,111,106,.35); }
a.tile:hover { background:rgba(26,25,23,.04); }
.face { display:flex; flex:1; flex-direction:column; align-items:center; justify-content:center; gap:.5rem; padding:1rem .75rem .75rem; }
.logo { position:relative; display:flex; width:3rem; height:3rem; align-items:center; justify-content:center; overflow:hidden; border-radius:12px; background:rgba(26,25,23,.06); color:var(--muted); font-size:1.125rem; font-weight:600; }
.logo img { position:absolute; inset:0; width:100%; height:100%; object-fit:contain; }
.name { width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:.875rem; font-weight:500; }
.port { display:flex; align-items:center; justify-content:center; flex:0 0 18%; min-height:1.75rem; width:100%; background:var(--tile-band); color:var(--tile-band-ink); font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; font-size:.8125rem; }
.port.here { font-family:inherit; font-size:.75rem; font-weight:500; }
#feed { flex:1; }
a { color:var(--ok); }
code { color:var(--text); }
</style>
</head>
<body>
<main>
${brandHeader('')}
<div class="feed" id="feed">${body}</div>
${siteFooter()}
</main>
<script>
${COPY_SCRIPT}
(function () {
	var pageHost = ${JSON.stringify(pageHost)};
	var last = '';
	var empty = ${JSON.stringify(
		`<p class="muted">Nothing listening past loopback. Claim with <code>--lan</code> or start the app on all interfaces.</p>`
	)};
	function nextIcon(img) {
		var n;
		try { n = JSON.parse(img.getAttribute('data-next') || '[]'); } catch (e) { n = []; }
		if (!n.length) { img.hidden = true; return; }
		img.src = n.shift();
		img.setAttribute('data-next', JSON.stringify(n));
	}
	function resolveIcon(openHref, iconHref) {
		if (!iconHref) return null;
		var raw = String(iconHref).trim();
		if (!raw || /^javascript:/i.test(raw)) return null;
		if (raw.indexOf('data:image/') === 0) return raw;
		try {
			var open = new URL(openHref);
			var url = new URL(raw, open);
			if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
			var host = url.hostname.replace(/^\[|\]$/g, '');
			var openHost = open.hostname.replace(/^\[|\]$/g, '');
			var loop = host === '127.0.0.1' || host === '::1' || host === 'localhost';
			if (!loop && host !== openHost) return null;
			url.protocol = open.protocol;
			url.hostname = open.hostname;
			url.port = open.port;
			return url.href;
		} catch (e) { return null; }
	}
	function tileEl(tile) {
		var href = pageHost ? ('http://' + pageHost + ':' + tile.port + '/') : null;
		var heading = (tile.title && String(tile.title).trim()) || tile.name;
		var root = document.createElement(href ? 'a' : 'div');
		root.className = 'tile';
		if (href) {
			root.href = href;
			root.target = ${JSON.stringify(OPEN_TARGET)};
			root.rel = 'noopener';
			root.setAttribute('data-copy-url', href);
			root.setAttribute('aria-label', 'Open ' + heading);
		}
		var logo = document.createElement('span');
		logo.className = 'logo';
		logo.setAttribute('aria-hidden', 'true');
		logo.textContent = (tile.name.trim().charAt(0) || '?').toUpperCase();
		if (href) {
			var guessed = ['favicon.png', 'favicon.svg', 'favicon.ico'].map(function (f) { return href + f; });
			var peeked = resolveIcon(href, tile.icon);
			var files = peeked ? [peeked].concat(guessed.filter(function (u) { return u !== peeked; })) : guessed;
			var img = document.createElement('img');
			img.alt = '';
			img.src = files.shift();
			img.setAttribute('data-next', JSON.stringify(files));
			img.onerror = function () { nextIcon(img); };
			logo.appendChild(img);
		}
		var face = document.createElement('span');
		face.className = 'face';
		var name = document.createElement('span');
		name.className = 'name';
		name.textContent = heading;
		var port = document.createElement('span');
		port.className = 'port';
		port.textContent = ':' + tile.port;
		face.appendChild(logo);
		face.appendChild(name);
		root.appendChild(face);
		root.appendChild(port);
		if (href && window.localberthBindHold) window.localberthBindHold(root);
		return root;
	}
	function draw(tiles) {
		var key = JSON.stringify(tiles);
		if (key === last) return;
		last = key;
		var feed = document.getElementById('feed');
		if (!feed) return;
		feed.replaceChildren();
		if (!tiles.length) {
			feed.innerHTML = empty;
			return;
		}
		var grid = document.createElement('div');
		grid.className = 'tiles';
		tiles.forEach(function (tile) { grid.appendChild(tileEl(tile)); });
		feed.appendChild(grid);
	}
	setInterval(function () {
		fetch('/api/visitor').then(function (r) { return r.json(); }).then(function (j) {
			draw(j.tiles || []);
		});
	}, 8000);
})();
</script>
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
			if (url.pathname === '/api/visitor') {
				const board = await getBoard({ showSystem: false });
				res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
				res.end(JSON.stringify(await visitorFeed(board.leaseRows, machineCard())));
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
				res.end(await visitorPage(board, pageHost));
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
