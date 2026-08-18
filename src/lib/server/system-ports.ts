/** Well-known OS / RPC listeners that drown the board. Leases always show. */
const SYSTEM_PORTS = new Set([
	135, 137, 138, 139, 445, 5357, 3389, 2179, 5040, 5985, 47001, 7680
]);

export function isSystemPort(port: number): boolean {
	if (SYSTEM_PORTS.has(port)) return true;
	if (port >= 49664 && port <= 49720) return true;
	return false;
}
