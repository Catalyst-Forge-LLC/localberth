import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	dashboardHttpUrl,
	rowOpenUrl,
	isOperatorFace,
	visitorFaviconCandidates,
	visitorHttpUrl,
	visitorPageHost,
	visitorTileLetter
} from './dashboard-url.js';

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

	it('builds visitor opens from the request Host', () => {
		assert.equal(visitorPageHost('100.64.1.2:54321'), '100.64.1.2');
		assert.equal(visitorPageHost('[fd7a:115c::2]:54321'), '[fd7a:115c::2]');
		assert.equal(visitorPageHost('evil.com/x'), null);
		assert.equal(visitorHttpUrl('100.64.1.2', 5193), 'http://100.64.1.2:5193/');
		assert.deepEqual(visitorFaviconCandidates('http://100.64.1.2:5193/'), [
			'http://100.64.1.2:5193/favicon.png',
			'http://100.64.1.2:5193/favicon.svg',
			'http://100.64.1.2:5193/favicon.ico'
		]);
		assert.equal(
			visitorFaviconCandidates('http://[fd7a:115c::2]:6173/')[0],
			'http://[fd7a:115c::2]:6173/favicon.png'
		);
		assert.equal(visitorTileLetter('fizzbuzz'), 'F');
		assert.equal(visitorTileLetter(''), '?');
		assert.equal(isOperatorFace('127.0.0.1', '127.0.0.1:54321'), true);
		assert.equal(isOperatorFace('127.0.0.1', 'localhost:54321'), true);
		assert.equal(isOperatorFace('127.0.0.1', null), true);
		assert.equal(isOperatorFace('127.0.0.1', '100.64.1.2:54321'), false);
		assert.equal(isOperatorFace('100.64.1.2', '127.0.0.1:54321'), false);
	});
});
