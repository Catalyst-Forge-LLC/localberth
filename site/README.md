# localberth.com

Marketing + docs site for [LocalBerth](https://github.com/Catalyst-Forge-LLC/localberth), built with [FilePress](https://getfilepress.com) (`getfilepress` on npm).

```bash
pnpm install
pnpm docs:build    # Markdown → docs/dist (Svelte-style shell)
pnpm dev           # docs build + FilePress preview
pnpm build         # → build/ (includes /docs mount)
```

Docs source: `docs/*.md` + `_nav.json`. FilePress mounts `docs/dist` at `/docs` via `paths` in `filepress.config.ts` (requires getfilepress **≥ 0.1.8** for Docs clicks in `filepress dev`). Local pin: `link:../../filepress`.

If LocalBerth is installed, this explainer stays on **5187** as `localberth-site` (not the dashboard on 54321).

Optional: add `theme.css` next to `filepress.config.ts` to override the default Essay theme.

## Deploy

**Cloudflare Pages:** from the repo root, `pnpm ship` (build + `wrangler pages deploy`, project `localberth`). Output is `site/build`, Node 20+.

| Setting | Value |
| --- | --- |
| Root directory | `site` |
| Build command | `pnpm install && pnpm build` |
| Output directory | `build` |
| Node | 20+ |

Any static host: publish the `build/` folder. Details: https://getfilepress.com/deploy
