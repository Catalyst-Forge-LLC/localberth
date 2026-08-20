import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createServer as createNet, type AddressInfo } from 'node:net';
import { after, describe, it } from 'node:test';
import { formatPeek, parsePeekPort, peekHttp, peekPayload } from './http-peek.js';

describe('parsePeekPort', () => {
	it('accepts a real TCP port', () => {
		assert.equal(parsePeekPort('5193'), 5193);
	});

	it('rejects junk', () => {
		assert.equal(parsePeekPort('0'), null);
		assert.equal(parsePeekPort('nope'), null);
	});
});

describe('peekHttp', () => {
	const servers: { close(): void }[] = [];
	after(() => {
		for (const s of servers) s.close();
	});

	it('reads status, type, and title', async () => {
		const server = createServer((_req, res) => {
			res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', server: 'testkit' });
			res.end('<html><head><title>Fizz</title></head><body>ok</body></html>');
		});
		servers.push(server);
		const port = await listen(server);
		const peek = await peekHttp(port);
		assert.equal(peek.http, true);
		assert.equal(peek.status, 200);
		assert.equal(peek.contentType, 'text/html');
		assert.equal(peek.title, 'Fizz');
		assert.match(formatPeek(peek), /200 · text\/html · Fizz/);
	});

	it('does not fetch the reserved dashboard port', async () => {
		const out = await peekPayload(54321);
		assert.equal(out.line, 'This dashboard.');
		assert.equal(out.http, true);
	});

	it('does not fetch a custom serve port', async () => {
		const out = await peekPayload(9999, { selfPort: 9999 });
		assert.equal(out.line, 'This dashboard.');
	});

	it('marks a non-HTTP listener', async () => {
		const server = createNet((socket) => {
			socket.end();
		});
		servers.push(server);
		const port = await listen(server);
		const peek = await peekHttp(port);
		assert.equal(peek.http, false);
		assert.equal(formatPeek(peek), 'Not HTTP.');
	});

	it('falls back to IPv6 loopback', async () => {
		const server = createServer((_req, res) => {
			res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
			res.end('<html><head><title>V6</title></head></html>');
		});
		servers.push(server);
		const port = await listen(server, '::1');
		const peek = await peekHttp(port);
		assert.equal(peek.http, true);
		assert.equal(peek.title, 'V6');
	});
});

function listen(
	server: {
		listen(port: number, host: string, cb: () => void): void;
		address(): string | AddressInfo | null;
	},
	host = '127.0.0.1'
): Promise<number> {
	return new Promise((resolve, reject) => {
		server.listen(0, host, () => {
			const addr = server.address();
			if (addr && typeof addr === 'object' && typeof addr.port === 'number') {
				resolve(addr.port);
				return;
			}
			reject(new Error('expected a TCP address'));
		});
	});
}
