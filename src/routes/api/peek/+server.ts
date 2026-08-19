import { json } from '@sveltejs/kit';
import { parsePeekPort, peekPayload } from '$lib/server/http-peek';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const port = parsePeekPort(url.searchParams.get('port'));
	if (port === null) return json({ http: false, error: 'invalid port', ms: 0, line: 'Invalid port.' }, { status: 400 });
	return json(await peekPayload(port));
};
