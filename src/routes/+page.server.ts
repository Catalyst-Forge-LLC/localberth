import { machineCard } from '$lib/machine';
import { getBoard } from '$lib/server/board';
import { visitorLeaseRows } from '$lib/visitor';
import { isOperatorFace, visitorPageHost } from '$lib/dashboard-url';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, getClientAddress, request }) => {
	const machine = machineCard();
	if (!isOperatorFace(getClientAddress(), request.headers.get('host'))) {
		const board = await getBoard({ showSystem: false });
		return {
			face: 'visitor' as const,
			visitorRows: visitorLeaseRows(board.leaseRows),
			pageHost: visitorPageHost(request.headers.get('host')),
			showSystem: false,
			hiddenSystem: 0,
			leaseRows: [],
			observedRows: [],
			machine
		};
	}
	const showSystem = url.searchParams.get('system') === '1';
	return {
		face: 'operator' as const,
		...(await getBoard({ showSystem })),
		showSystem,
		visitorRows: [],
		pageHost: null,
		machine
	};
};
