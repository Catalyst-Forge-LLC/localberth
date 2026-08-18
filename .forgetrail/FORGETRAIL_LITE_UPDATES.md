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

---

| Topic | Lite § | Status |
| ----- | ------ | ------ |
| Published npm README vs operator dump | §14, §4.5 | candidate |
| README images must ship in the tarball | §14 | candidate |
