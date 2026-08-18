import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	for (const [key, value] of Object.entries(env)) {
		if (process.env[key] === undefined) process.env[key] = value;
	}
	const host = env.HOST?.trim() || process.env.HOST?.trim() || '127.0.0.1';
	const port = Number(env.PORT || process.env.PORT || 54321);

	return {
		plugins: [tailwindcss(), sveltekit()],
		server: {
			host,
			port: Number.isFinite(port) ? port : 54321,
			strictPort: true
		},
		ssr: {
			external: ['better-sqlite3']
		},
		optimizeDeps: {
			exclude: ['better-sqlite3']
		}
	};
});
