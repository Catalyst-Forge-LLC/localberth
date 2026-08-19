import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseNetstat } from './observe.js';

describe('parseNetstat', () => {
	it('reads IPv4 and IPv6 LISTENING lines', () => {
		const rows = parseNetstat(`
  TCP    127.0.0.1:54321        0.0.0.0:0              LISTENING       18660
  TCP    [::1]:6173             [::]:0                 LISTENING       24436
  TCP    [::ffff:127.0.0.1]:5193 [::]:0                LISTENING       99
  TCP    127.0.0.1:39470        127.0.0.1:54321        ESTABLISHED     43552
`);
		assert.deepEqual(
			rows.map((r) => ({ bind: r.bind, port: r.port, pid: r.pid })),
			[
				{ bind: '127.0.0.1', port: 54321, pid: 18660 },
				{ bind: '::1', port: 6173, pid: 24436 },
				{ bind: '127.0.0.1', port: 5193, pid: 99 }
			]
		);
	});
});
