import { createServer } from 'node:http';
import { dashboardHttpUrl } from '../dashboard-url.js';
import { DASHBOARD_PORT } from './paths.js';
import { getBoard } from './board.js';
import type { BoardRow } from './types.js';

function esc(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function linked(label: string, href: string | null): string {
	const text = esc(label);
	if (!href) return text;
	return `<a href="${esc(href)}" target="_blank" rel="noreferrer">${text}</a>`;
}

function rowCells(row: BoardRow): string {
	const name = row.lease?.name ?? '—';
	const tag = row.lease ? '' : ' <span class="warn">observed</span>';
	const port = row.lease?.port ?? row.observed?.port ?? 0;
	const bind = row.lease?.bind ?? row.observed?.bind ?? '';
	const href = row.listening ? dashboardHttpUrl(bind, port) : null;
	const listening = row.listening ? '<span class="ok">yes</span>' : '<span class="muted">no</span>';
	const proc = row.observed?.process ?? '—';
	const pid = row.observed?.pid ? ` <span class="muted">(${row.observed.pid})</span>` : '';
	const fw = row.lease?.firewall ?? '—';
	return `<tr><td>${linked(name, href)}${tag}</td><td class="num">${linked(String(port || '—'), href)}</td><td class="muted">${esc(bind)}</td><td>${listening}</td><td class="muted">${esc(proc)}${pid}</td><td class="muted">${esc(fw)}</td></tr>`;
}

function page(board: Awaited<ReturnType<typeof getBoard>>, showSystem: boolean): string {
	const leases = board.leaseRows.map(rowCells).join('');
	const observed = board.observedRows.map(rowCells).join('') ||
		'<tr><td colspan="6" class="muted">Nothing extra listening (system ports hidden).</td></tr>';
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
:root { --bg:#0c1220; --elev:#141c2e; --line:rgba(255,255,255,.08); --text:#e8eef8; --muted:#8b97ad; --ok:#6ec8c0; --warn:#e4b86a; }
html,body { height:100%; }
body { margin:0; background:var(--bg); color:var(--text); font:14px/1.4 ui-sans-serif,system-ui,sans-serif; }
main { padding:1rem 1.25rem 1.5rem; }
.muted { color:var(--muted); }
.ok { color:var(--ok); }
.warn { color:var(--warn); font-size:.75rem; }
.num { font-variant-numeric:tabular-nums; }
header { display:flex; justify-content:space-between; align-items:center; gap:1rem; flex-wrap:wrap; margin-bottom:.75rem; }
header .brand { font-weight:600; }
header .meta { color:var(--muted); font-size:.8rem; }
section { margin-top:1.15rem; }
h2 { font-size:.8rem; font-weight:600; color:var(--muted); margin:0 0 .4rem; }
table { width:100%; min-width:40rem; border-collapse:collapse; background:var(--elev); border:1px solid var(--line); border-radius:10px; overflow:hidden; }
th,td { text-align:left; padding:.45rem .75rem; }
th { color:var(--muted); font-weight:500; }
tr + tr td { border-top:1px solid var(--line); }
tbody tr:nth-child(even) { background:rgba(255,255,255,.035); }
tbody tr:hover { background:rgba(255,255,255,.07); }
a { color:var(--ok); }
</style>
</head>
<body>
<main>
<header>
<p class="brand">LocalBerth</p>
<p class="meta">:${DASHBOARD_PORT} · ${toggle}</p>
</header>
<section>
<h2>Leases</h2>
<table><thead><tr><th>Name</th><th>Port</th><th>Bind</th><th>Listening</th><th>Process</th><th>Firewall</th></tr></thead>
<tbody>${leases}</tbody></table>
</section>
<section>
<h2>Observed</h2>
<table><thead><tr><th>Name</th><th>Port</th><th>Bind</th><th>Listening</th><th>Process</th><th>Firewall</th></tr></thead>
<tbody>${observed}</tbody></table>
</section>
<p class="muted" style="margin-top:1.5rem"><code>localberth claim name --port N</code> · <code>localberth get name</code> · <code>localberth release name</code></p>
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
			const showSystem = url.searchParams.get('system') === '1';
			const board = await getBoard({ showSystem });
			if (url.pathname === '/api/board') {
				res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
				res.end(JSON.stringify(board));
				return;
			}
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
