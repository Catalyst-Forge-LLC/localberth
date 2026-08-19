import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isLoopbackClient } from './binds.js';

describe('isLoopbackClient', () => {
	it('allows IPv4 and IPv6 loopback', () => {
		assert.equal(isLoopbackClient('127.0.0.1'), true);
		assert.equal(isLoopbackClient('127.0.0.2'), true);
		assert.equal(isLoopbackClient('::1'), true);
		assert.equal(isLoopbackClient('[::1]'), true);
		assert.equal(isLoopbackClient('::ffff:127.0.0.1'), true);
	});

	it('refuses LAN and missing peers', () => {
		assert.equal(isLoopbackClient('192.168.1.10'), false);
		assert.equal(isLoopbackClient('10.0.0.2'), false);
		assert.equal(isLoopbackClient('::'), false);
		assert.equal(isLoopbackClient(''), false);
		assert.equal(isLoopbackClient(undefined), false);
	});
});
