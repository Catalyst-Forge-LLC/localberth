# ForgeTrail Lite — candidate patches (this repo)

Feedback for **FORGETRAIL_LITE.md** maintainers. Not product docs.

## 1. Published-package README vs operator README (§14)

Lite §14 (and §4.5) treat root `README.md` as operator onboarding: launchers, `.env` files, monorepo `cd` notes, process status. That is right for an unpublished app.

When the same file is in an **npm `files` whitelist**, it becomes the public package page. Process notes, phase gates, sibling apps, and machine paths then ship to npmjs.com.

Suggested Lite change: if Phase 1 decides the app is a **published package**, say explicitly that root `README.md` is the **public product page** (install + real commands). Operator/process stay in `CONTEXT_PROMPT.md` / `docs/`. Do not require the §4.5 “Quick start (no terminal)” block at the top of a published README.

Project pointer: LocalBerth D14 / D17.

## 2. README images must be in the npm `files` whitelist (§14)

npmjs.com resolves relative `<img src>` from the **published tarball**, not the git tree. A logo at `site/static/logo.png` 404s on the package page if `files` only lists `README.md` and app paths.

Suggested Lite change: when the root README is the public npm page, say that any relative image in it has to be listed in `package.json` `files` (or live under a directory that already is). `npm pack --dry-run` is the check.

Project pointer: LocalBerth 0.1.0 README mark.

## 3. npm 12 blocks native install scripts (global CLIs) (§4.1 / §13)

Lite already covers **pnpm** ignoring `better-sqlite3` (`onlyBuiltDependencies`). **npm 12** (Node 24.17+ ships 12.0.2) does the same by default: `allowScripts` is off. `ignore-scripts` can still be `false`.

`better-sqlite3` **12.x** has `"install": "prebuild-install || node-gyp rebuild"`. After `npm i -g <cli>`, the package is on disk with **no** `.node`. Runtime: `Could not locate the bindings file`. Global installs cannot use `package.json#allowScripts`; the escape is `npm i -g pkg --allow-scripts=better-sqlite3`.

**13.x** publishes N-API `prebuilds/*.node` in the tarball and has **no** install script. A published CLI that needs SQLite on `npm i -g` should depend on **^13**, not 12. Do **not** list 13.x in `pnpm.onlyBuiltDependencies`: pnpm then runs implicit `node-gyp rebuild` (because `binding.gyp` is present) and can fail on Windows even though the prebuild is already in the package.

Suggested Lite change: next to the pnpm native-addon note, say npm 12 global installs skip dep install scripts; prefer addons that ship prebuilds (or document `--allow-scripts=`).

Project pointer: LocalBerth 0.2.1 / D23.

## 4. SvelteKit `$lib/server` in shared UI helpers (agent / Kit)

A `+page.svelte` that imports a `$lib` helper which then imports `$lib/server/*` is a browser load of server code. Kit’s overlay is often **An impossible situation occurred** (`LoadPluginContext.load`), not the clearer “Cannot import $lib/server into code that runs in the browser” pyramid. That happens when the import chain does not match a page entrypoint in Kit’s map (nested `.svelte` helpers, Windows path normalize).

Suggested Lite change: in the SvelteKit / agent anti-pattern list, say: keep bind/format helpers used by `+page.svelte` **outside** `$lib/server`. `import type` from `$lib/server` is not enough if a sibling runtime import pulls the folder in. The thrown string “impossible situation” is this class of leak, not a Vite kernel bug.

Project pointer: LocalBerth dashboard `row-detail` → `$lib/server/firewall/names`.

## 5. Published npm CLI should not depend on tsx (§4.1 / §13)

`tsx` pulls `esbuild`. `esbuild` has a `postinstall` and optional `@esbuild/<platform>-<arch>` packages. npm 12 blocks the script; the optional binary usually still lands, but the install warns and can fail if the optional package is skipped.

Suggested Lite change: if Phase 1 says the app is a **published CLI**, compile with `tsc` (or a bundler) on publish (`prepublishOnly`). Keep `tsx` as a **devDependency** for tests and `pnpm cli`. Do not put the TS runner on the published runtime graph. Platform-native work stays in addons that ship prebuilds (see §3), not in the JS entry.

Project pointer: LocalBerth D26 / 0.2.4.

---

| Topic | Lite § | Status |
| ----- | ------ | ------ |
| Published npm README vs operator dump | §14, §4.5 | candidate |
| README images must ship in the tarball | §14 | candidate |
| npm 12 + native addons on `npm i -g` | §4.1, §13 | candidate |
| Kit `$lib/server` via a shared helper → “impossible situation” | agent / Kit | candidate |
| Published CLI: compile, do not runtime-depend on tsx | §4.1, §13 | candidate |
