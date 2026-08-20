import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { addressCaption, addressKind } from './address.js';

describe('addressKind', () => {
	it('labels Tailscale CGNAT and RFC1918 LAN', () => {
		assert.equal(addressKind('100.64.1.2'), 'tailscale');
		assert.equal(addressKind('100.127.0.1'), 'tailscale');
		assert.equal(addressKind('10.0.0.5'), 'lan');
		assert.equal(addressKind('192.168.1.10'), 'lan');
		assert.equal(addressKind('172.16.0.1'), 'lan');
		assert.equal(addressKind('172.31.255.1'), 'lan');
		assert.equal(addressKind('172.15.0.1'), 'other');
		assert.equal(addressKind('8.8.8.8'), 'other');
		assert.equal(addressCaption('100.64.1.2'), '100.64.1.2 Tailscale');
		assert.equal(addressCaption('192.168.1.10'), '192.168.1.10 LAN');
		assert.equal(addressCaption('8.8.8.8'), '8.8.8.8');
	});
});
