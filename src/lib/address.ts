export type AddressKind = 'tailscale' | 'lan' | 'other';

/** CGNAT 100.64/10 is Tailscale. RFC1918 is LAN. Safe for the dashboard client. */
export function addressKind(address: string): AddressKind {
	const [a, b] = address.split('.').map(Number);
	if (a === 100 && (b ?? 0) >= 64 && (b ?? 0) <= 127) return 'tailscale';
	if (a === 10) return 'lan';
	if (a === 192 && b === 168) return 'lan';
	if (a === 172 && (b ?? 0) >= 16 && (b ?? 0) <= 31) return 'lan';
	return 'other';
}

export function addressKindLabel(kind: AddressKind): string | null {
	if (kind === 'tailscale') return 'Tailscale';
	if (kind === 'lan') return 'LAN';
	return null;
}

export function addressCaption(address: string): string {
	const label = addressKindLabel(addressKind(address));
	return label ? `${address} ${label}` : address;
}

export function addrRank(address: string): number {
	const kind = addressKind(address);
	if (kind === 'tailscale') return 0;
	if (kind === 'lan') return 1;
	return 2;
}
