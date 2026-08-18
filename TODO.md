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
- Harden firewall backends (pf anchors, firewalld zones)
- Public site + GitHub URLs on npm when those are public
- Publish a real CLI version off `0.0.2`
