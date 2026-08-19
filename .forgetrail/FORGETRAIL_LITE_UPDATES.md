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

---

| Topic | Lite § | Status |
| ----- | ------ | ------ |
| Published npm README vs operator dump | §14, §4.5 | candidate |
| README images must ship in the tarball | §14 | candidate |
| npm 12 + native addons on `npm i -g` | §4.1, §13 | candidate |
