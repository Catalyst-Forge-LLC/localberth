#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const main = join(here, '..', 'src', 'cli', 'main.ts');
const require = createRequire(import.meta.url);
const tsx = require.resolve('tsx/cli');

const child = spawn(process.execPath, [tsx, main, ...process.argv.slice(2)], {
	stdio: 'inherit',
	windowsHide: true
});

child.on('exit', (code, signal) => {
	if (signal) process.kill(process.pid, signal);
	process.exit(code ?? 1);
});
