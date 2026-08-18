export type LeaseKind = 'always' | 'ephemeral';
export type FirewallStatus = 'wanted' | 'applied' | 'needs-elevation' | 'skipped';

export type Lease = {
	name: string;
	port: number;
	bind: string;
	protocol: 'tcp';
	kind: LeaseKind;
	notes: string;
	firewall: FirewallStatus;
	updatedAt: string;
};

export type Observed = {
	port: number;
	bind: string;
	pid: number | null;
	process: string | null;
	seenAt: string;
	leaseName: string | null;
};

export type BoardRow = {
	lease: Lease | null;
	observed: Observed | null;
	listening: boolean;
	conflict: boolean;
};
