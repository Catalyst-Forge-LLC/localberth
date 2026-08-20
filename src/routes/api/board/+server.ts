import { json, error } from '@sveltejs/kit';
import { isLoopbackClient } from '$lib/binds';
import { getBoard } from '$lib/server/board';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, getClientAddress }) => {
	if (!isLoopbackClient(getClientAddress())) {
		throw error(403, 'Board API is loopback-only.');
	}
	const showSystem = url.searchParams.get('system') === '1';
	return json(await getBoard({ showSystem }));
};
