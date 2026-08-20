import { json } from '@sveltejs/kit';
import { machineCard } from '$lib/machine';
import { getBoard } from '$lib/server/board';
import { visitorFeed } from '$lib/server/visitor-feed';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const board = await getBoard({ showSystem: false });
	return json(await visitorFeed(board.leaseRows, machineCard()));
};
