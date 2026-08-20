import { isLoopbackClient } from '$lib/binds';
import { getBoard } from '$lib/server/board';
import { visitorLeaseRows } from '$lib/visitor';
import { visitorPageHost } from '$lib/dashboard-url';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, getClientAddress, request }) => {
	const loopback = isLoopbackClient(getClientAddress());
	if (!loopback) {
		const board = await getBoard({ showSystem: false });
		return {
			face: 'visitor' as const,
			visitorRows: visitorLeaseRows(board.leaseRows),
			pageHost: visitorPageHost(request.headers.get('host')),
			showSystem: false,
			hiddenSystem: 0,
			leaseRows: [],
			observedRows: []
		};
	}
	const showSystem = url.searchParams.get('system') === '1';
	return {
		face: 'operator' as const,
		...(await getBoard({ showSystem })),
		showSystem,
		visitorRows: [],
		pageHost: null
	};
};
