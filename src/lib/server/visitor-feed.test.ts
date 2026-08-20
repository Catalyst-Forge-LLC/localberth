import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { type AddressInfo } from 'node:net';
import { after, describe, it } from 'node:test';
import type { BoardRow } from '../types.js';
import { visitorFeed } from './visitor-feed.js';

function row(partial: { name: string; port: number; bind: string; listening: boolean }): BoardRow {
	return {
		lease: {
			name: partial.name,
			port: partial.port,
			bind: partial.bind,
			protocol: 'tcp',
			kind: 'always',
			notes: '',
			firewall: 'skipped',
			updatedAt: '2026-08-19T12:00:00.000Z'
		},
		observed: partial.listening
			? {
					port: partial.port,
					bind: partial.bind,
					pid: 1,
					process: 'node.exe',
					seenAt: '2026-08-19T12:00:00.000Z',
					leaseName: partial.name
				}
			: null,
		listening: partial.listening,
		conflict: false,
		also: []
	};
}

describe('visitorFeed', () => {
	const servers: { close(): void }[] = [];
	after(() => {
		for (const s of servers) s.close();
	});

	it('peeks title and icon onto visitor tiles', async () => {
		const server = createServer((_req, res) => {
			res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
			res.end('<html><head><title>Desk</title><link rel="icon" href="/mark.svg"></head></html>');
		});
		servers.push(server);
		const port = await listen(server);
		const snap = await visitorFeed(
			[row({ name: 'phone', port, bind: '0.0.0.0', listening: true })],
			{ hostname: 'desk', addresses: ['100.64.1.2'] }
		);
		assert.deepEqual(snap.tiles, [
			{ name: 'phone', port, title: 'Desk', icon: '/mark.svg' }
		]);
	});
});

function listen(server: {
	listen(port: number, host: string, cb: () => void): void;
	address(): string | AddressInfo | null;
}): Promise<number> {
	return new Promise((resolve, reject) => {
		server.listen(0, '127.0.0.1', () => {
			const addr = server.address();
			if (addr && typeof addr === 'object' && typeof addr.port === 'number') {
				resolve(addr.port);
				return;
			}
			reject(new Error('expected a TCP address'));
		});
	});
}
