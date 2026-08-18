import { getBoard } from '$lib/server/board';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return getBoard();
};
