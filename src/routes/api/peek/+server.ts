import { json } from '@sveltejs/kit';
import { isLoopbackClient } from '$lib/binds';
import { parsePeekPort, peekLoopbackDenied, peekPayload } from '$lib/server/http-peek';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, getClientAddress }) => {
	if (!isLoopbackClient(getClientAddress())) {
		return json(peekLoopbackDenied(), { status: 403 });
	}
	const port = parsePeekPort(url.searchParams.get('port'));
	if (port === null) return json({ http: false, error: 'invalid port', ms: 0, line: 'Invalid port.' }, { status: 400 });
	const selfPort = parsePeekPort(url.port) ?? undefined;
	return json(await peekPayload(port, { selfPort }));
};
