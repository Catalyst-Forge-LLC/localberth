# LocalBerth

Content-only filepress site. Local engine via `link:../../filepress`.

```bash
# once in the engine repo
cd ../../filepress && pnpm install

# in this site
pnpm install
pnpm dev
pnpm build    # → build/
```

Optional: add `theme.css` next to `filepress.config.ts` to
override the default Essay theme.

## Deploy

`link:` only works on your machine. For CI/hosting, pin npm or a git tag:

```json
"getfilepress": "^0.1.1"
```

**Cloudflare Pages:** from the repo root, `pnpm ship` (build + `wrangler pages deploy`, project `localberth`). Output is `site/build`, Node 20+.

Any static host: publish the `build/` folder. Details: https://getfilepress.com/deploy
