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
5. [ ] Publish `localberth@0.1.0` (you; agent does not)

