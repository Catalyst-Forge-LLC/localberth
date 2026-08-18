# ForgeTrail Lite — candidate patches (this repo)

Feedback for **FORGETRAIL_LITE.md** maintainers. Not product docs.

## 1. Published-package README vs operator README (§14)

Lite §14 (and §4.5) treat root `README.md` as operator onboarding: launchers, `.env` files, monorepo `cd` notes, process status. That is right for an unpublished app.

When the same file is in an **npm `files` whitelist**, it becomes the public package page. Process notes, phase gates, sibling apps, and machine paths then ship to npmjs.com.

Suggested Lite change: if Phase 1 decides the app is a **published package**, say explicitly that root `README.md` is the **public product page** (install + real commands). Operator/process stay in `CONTEXT_PROMPT.md` / `docs/`. Do not require the §4.5 “Quick start (no terminal)” block at the top of a published README.

Project pointer: LocalBerth D14 / D17.

---

| Topic | Lite § | Status |
| ----- | ------ | ------ |
| Published npm README vs operator dump | §14, §4.5 | candidate |
