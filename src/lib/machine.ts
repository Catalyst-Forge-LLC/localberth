import { networkInterfaces, hostname as osHostname } from 'node:os';
import { addrRank } from './address.js';

export type MachineCard = {
	hostname: string;
	addresses: string[];
};

const SKIP_IFACE = /vethernet|hyper-?v|docker|wsl|loopback|bluetooth|vmware|virtualbox|vbox|br-|veth|cni|flannel/i;

export function skipIfaceName(name: string): boolean {
	return SKIP_IFACE.test(name);
}

export function isPublicV4(address: string, internal: boolean): boolean {
	if (internal) return false;
	if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(address)) return false;
	if (address.startsWith('169.254.')) return false;
	if (address.startsWith('127.')) return false;
	return true;
}

export function pickAddresses(
	ifaces: Record<string, { address: string; family: string | number; internal: boolean }[] | undefined>
): string[] {
	const found: string[] = [];
	for (const [name, addrs] of Object.entries(ifaces)) {
		if (skipIfaceName(name)) continue;
		for (const row of addrs ?? []) {
			if (row.family !== 'IPv4' && row.family !== 4) continue;
			if (!isPublicV4(row.address, row.internal)) continue;
			found.push(row.address);
		}
	}
	return [...new Set(found)].sort((x, y) => addrRank(x) - addrRank(y) || x.localeCompare(y)).slice(0, 4);
}

export function machineCard(): MachineCard {
	return {
		hostname: osHostname(),
		addresses: pickAddresses(networkInterfaces())
	};
}
