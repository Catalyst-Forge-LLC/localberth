# Context — LocalBerth

## What this is

**Local DNS for ports.** **localhost** is the machine; **LocalBerth** is the slip. Apps look up a port by name; humans still use the number. Not real DNS and not `*.localhost` URLs. Dashboard shows leases plus observed listeners. Claim/move updates the host firewall (Windows / macOS / Linux).

## Hero workflow

Vite 5173/5174 swap after reboot is the common story. Hero: `localberth claim engram --port 5193 --bind 0.0.0.0` → firewall rule → `PORT=$(localberth get engram)` → dashboard at `:54321` → phone uses `http://100.x.x.x:5193`.

## Stack

SvelteKit 5 + Tailwind 4 + pnpm + TypeScript ESM + `@sveltejs/adapter-node` + SQLite (`better-sqlite3`). CLI via `tsx`. Live data: `~/.localberth/`. Dashboard port **54321**. FilePress site in `site/` → localberth.com.

## Architecture at a glance

- `src/cli/main.ts` — `get` / `claim` (`--or-next`) / `release` / `ls` / `scan` / `firewall sync` / `serve`
- `src/lib/port.ts` — `localberthPort(name, fallback)` for Vite configs
- `src/lib/server/registry.ts` — lease persist + self-lease `localberth` → 54321
- `src/lib/server/observe.ts` — OS listen table (read-only)
- `src/lib/server/firewall/` — netsh (named rules), pf anchor, ufw comments / firewalld rich rules; loopback skips inbound
- `src/routes/` — local dashboard (not localberth.com)
- Public copy: `docs/aibreze-overlay.md`
- `site/` — FilePress explainer

## Conventions

- Package manager: pnpm
- Modules: ESM only
- Language: TypeScript (strict)
- Do not hide ports behind name-only URLs
- Observed is read-only (no process kill)
- Public README is the operator/npm page (no ForgeTrail or sibling notes)
- Omit homepage / repository on npm until the site and GitHub repo are public

## Current phase

`3-stabilization`

## Recent gotchas (last 3–5)

- npmjs.com Readme tab can show “no README” even when the tarball and `npm view readme` are correct (indexer / staged publish). Republish or wait.
- Do not put machine paths (`z:/workspace/...`) in committed files.

## Pointers

- Brief: `docs/PHASE_1_BRIEF.md`
- Tracking: `.forgetrail/workflow_tracking.json`
- TODO: `TODO.md`
