import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export { DASHBOARD_NAME, DASHBOARD_PORT } from '../reserved.js';

export function dataHome(): string {
	const override = process.env.LOCALBERTH_HOME?.trim();
	const dir = override || join(homedir(), '.localberth');
	mkdirSync(dir, { recursive: true });
	return dir;
}

export function dbPath(): string {
	return join(dataHome(), 'localberth.sqlite');
}
