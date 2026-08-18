import { json } from '@sveltejs/kit';
import { getBoard } from '$lib/server/board';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const showSystem = url.searchParams.get('system') === '1';
	return json(await getBoard({ showSystem }));
};
