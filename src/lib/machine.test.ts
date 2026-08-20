import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { pickAddresses, skipIfaceName } from './machine.js';

describe('pickAddresses', () => {
	it('keeps Tailscale and Wi-Fi, skips Hyper-V and loopback', () => {
		assert.equal(skipIfaceName('vEthernet (Default Switch)'), true);
		assert.equal(skipIfaceName('Tailscale'), false);
		assert.deepEqual(
			pickAddresses({
				'Loopback Pseudo-Interface 1': [{ address: '127.0.0.1', family: 'IPv4', internal: true }],
				'Tailscale': [{ address: '100.64.1.2', family: 'IPv4', internal: false }],
				'Wi-Fi': [{ address: '192.168.1.10', family: 'IPv4', internal: false }],
				'vEthernet (Default Switch)': [{ address: '172.21.192.1', family: 'IPv4', internal: false }]
			}),
			['100.64.1.2', '192.168.1.10']
		);
	});
});
