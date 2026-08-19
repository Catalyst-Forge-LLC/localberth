import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { dashboardHttpUrl, rowOpenUrl } from './dashboard-url.js';

describe('dashboardHttpUrl', () => {
	it('uses the bind as the host', () => {
		assert.equal(dashboardHttpUrl('127.0.0.1', 54321), 'http://127.0.0.1:54321/');
	});

	it('maps wildcard binds to loopback', () => {
		assert.equal(dashboardHttpUrl('0.0.0.0', 5193), 'http://127.0.0.1:5193/');
		assert.equal(dashboardHttpUrl('::', 7777), 'http://127.0.0.1:7777/');
	});

	it('brackets IPv6', () => {
		assert.equal(dashboardHttpUrl('::1', 8008), 'http://[::1]:8008/');
	});

	it('rejects a bad port', () => {
		assert.equal(dashboardHttpUrl('127.0.0.1', 0), null);
	});

	it('opens on the observed bind when Vite is IPv6-only', () => {
		assert.equal(
			rowOpenUrl({
				listening: true,
				lease: { bind: '127.0.0.1', port: 6173 },
				observed: { bind: '::1', port: 6173 }
			}),
			'http://[::1]:6173/'
		);
	});
});
