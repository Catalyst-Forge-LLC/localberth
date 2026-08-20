import { json } from '@sveltejs/kit';
import { machineCard } from '$lib/machine';
import { getBoard } from '$lib/server/board';
import { visitorSnapshot } from '$lib/visitor';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const board = await getBoard({ showSystem: false });
	return json(visitorSnapshot(board.leaseRows, machineCard()));
};
