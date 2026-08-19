# LocalBerth TODO

## Phase 2 spine

1. [x] Registry persist + `get` / `claim` / `ls`
2. [x] `scan` (OS listen table)
3. [x] Dashboard: leases + observed
4. [x] Firewall sync on claim (Windows / macOS / Linux)
5. [x] Self-lease `localberth` → 54321
6. [x] npm package shape (`name` / `bin` / files)
7. [x] FilePress `site/` (home + install + how-to)

## After the spine

- [x] `release` + `serve`
- [x] Hide system/RPC observed ports (toggle / `scan --all`)
- [x] Vite helper `localberthPort()` (`localberth/port`)
- [x] Harden firewall backends (pf anchors, firewalld rich rules, loopback skip)

## Phase 3

1. [x] README matches the real CLI (public/npm page, no process notes)
2. [x] Sad-path messages: missing `get`, busy `serve` port
2b. [x] `claim --or-next` when the requested port is leased or listening
3. [ ] Dogfood: elevated `firewall sync` for non-loopback leases
4. [ ] Public site + GitHub URLs on npm when those are public
5. [x] Publish `localberth@0.1.0` (you; agent does not)
6. [x] Publish `localberth@0.1.1` so the README mark is in the tarball (you; agent does not)
7. [x] Publish `localberth@0.1.2` (README dashboard line; you; agent does not)
8. [x] Publish `localberth@0.2.0` (claim defaults to loopback, `--lan`; you; agent does not)
9. [x] Sibling LocalBerth rollout — waves 0–2 (FilePress engine + house sites + Engram + DictaWhisper). Wave 3 is other Vite apps.
10. [ ] Publish `localberth@0.2.1` (better-sqlite3 13 for npm 12 global install; you; agent does not)
11. [ ] Publish `localberth@0.2.2` (IPv6 scan, `localberthListen`, peek loopback-only; you; agent does not)

