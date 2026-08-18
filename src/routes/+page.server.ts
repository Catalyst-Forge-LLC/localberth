import { getBoard } from '$lib/server/board';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const showSystem = url.searchParams.get('system') === '1';
	return { ...(await getBoard({ showSystem })), showSystem };
};
