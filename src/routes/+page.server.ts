import { machineCard } from '$lib/machine';
import { getBoard } from '$lib/server/board';
import { visitorFeed } from '$lib/server/visitor-feed';
import { isOperatorFace, visitorPageHost } from '$lib/dashboard-url';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, getClientAddress, request }) => {
	const machine = machineCard();
	if (!isOperatorFace(getClientAddress(), request.headers.get('host'))) {
		const board = await getBoard({ showSystem: false });
		const feed = await visitorFeed(board.leaseRows, machine);
		return {
			face: 'visitor' as const,
			visitorTiles: feed.tiles,
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
		visitorTiles: [],
		pageHost: null,
		machine
	};
};
