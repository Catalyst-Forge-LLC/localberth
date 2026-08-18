# LocalBerth — Phase 1 architecture brief

_Structured capture before scaffolding. A later session should be able to start from this file + `.forgetrail/workflow_tracking.json`._

**Status:** `locked`  
**Last updated:** `2026-08-18` (amended: FilePress site + npm package)  
**Source:** Engram session (Tailscale :5193 firewall miss → port-lease idea)  
**Phase 1 exit:** Brief locked 2026-08-18. Await explicit approval before Phase 2 scaffolding.

---

## 1. Problem and outcome

**What we are building:**

**LocalBerth** is a local **port name service**: stable named leases for TCP ports, a dashboard of leases plus observed listeners, and Windows firewall sync when a lease is assigned or moved. Pairing: **localhost** is the machine; **LocalBerth** is the slip — not a replacement for localhost, and not `*.localberth` URLs in v1.

Apps look up their port at start (`localberth get engram` → `5193`). Humans still use the port (phone, Tailscale `100.*`, bookmarks). Public name **LocalBerth**; CLI and npm package **`localberth`**; repo folder `/localberth`.

**Two surfaces (do not conflate):**

| Surface | What it is | Where it lives |
| ------- | ---------- | -------------- |
| **localberth.com** | FilePress explainer: what it is and how to use it | In-repo `site/` → Cloudflare Pages |
| **npm `localberth`** | The product: CLI + local dashboard | This repo root; runs on the operator’s machine |

The domain is **not** the running app. The dashboard stays on `http://127.0.0.1:54321` after `localberth` is installed from npm.

**Project archetype:** `product` _(personal operator tool; Apache-2.0)_

**What “done” looks like for v1:**

- Named leases persist (`engram` → `5193`, bind `0.0.0.0`, always-on).
- `localberth get <name>` prints the port (and fails clearly if missing).
- `localberth claim` / `ls` / `scan` work from the CLI.
- Dashboard shows **leases** and **observed** listening sockets (process name when available).
- Claiming or moving a lease creates/updates a Windows inbound allow rule for that TCP port (elevation documented; fail with a copy-paste `netsh` if not admin).
- LocalBerth’s own dashboard has a lease named `localberth` on **54321**.
- FilePress site at **localberth.com** explains the product and install (`pages/` for what / how-to).
- Package **`localberth`** is on npm (`bin.localberth`; not `private` at ship). Name reserved as `0.0.0` on 2026-08-18.

**Out of v1:** `*.localhost` proxy, process start/stop, macOS/Linux firewall first-class (scan/CLI should still run), publishing a global `berth` binary (name is crowded).

---

## 2. Users and hero flow

**Primary user:** You — many local services, mix of always-on and test, Windows + Tailscale phone access.

**Hero flow:**

Read localberth.com → `npm i -g localberth` (or `pnpm add -g localberth`) → `localberth claim engram --port 5193 --bind 0.0.0.0` → firewall rule for 5193 → app starts with `PORT=$(localberth get engram)` (or Vite helper) → dashboard at `:54321` shows lease + “listening” → phone uses `http://100.x.x.x:5193`.

**Secondary (v1):**

- Scan: see Postgres, Ollama, mystery Node on a port with no lease (observed-only rows).
- Move: `localberth claim engram --port 5200` updates lease **and** firewall (old 5193 rule removed or left documented).
- Ephemeral: `localberth claim scratch --ephemeral` assigns a free port from a pool.

---

## 3. Constraints

- **Local-only app.** No accounts, no telemetry, no hosted multi-user. The public site is static FilePress, not a hosted registry.
- **Domain ≠ daemon.** `localberth.com` never serves leases. Leases live in `~/.localberth/` on the machine that installed the npm package.
- **The port is the interface.** Do not hide it behind a name-only URL in v1.
- **Windows-first** for firewall. CLI + scan should work on Win/macOS/Linux.
- **Do not become Portless / Hotel.** No PAC file, no `app.localhost` front door in v1.
- **Observed is read-only.** Never kill a process unless a later phase adds an explicit command.
- **LocalBerth must lease itself** (`localberth` → 54321) so it does not become another mystery port.

**State persistence:** A-local. **`~/.localberth/`** (leases + SQLite). Repo `data/` only for dev fixtures.

---

## 4. Stack and tooling

_Same stack as Engram. Locked 2026-08-18._

| Area | Choice | Status | Notes |
| ---- | ------ | ------ | ----- |
| App shape | CLI + local web dashboard | **confirmed** | CLI is the lookup API; dashboard is the harbor board |
| Distribution | Published npm package `localberth` | **confirmed** | Global `bin` `localberth`; app runs locally |
| Public site | FilePress at `site/` | **confirmed** | Explainer + how-to; domain `localberth.com` |
| Site engine | `getfilepress` | **confirmed** | Local: `link:../../filepress`; CI: npm or git pin |
| Site host | Cloudflare Pages | **confirmed** | Root directory `site`; output `build/` |
| Framework | SvelteKit (Svelte 5) + Tailwind | **confirmed** | Same as Engram (the **app**, not the site) |
| Language | TypeScript (ESM, strict) | **confirmed** | Same as Engram |
| Package manager | pnpm | **confirmed** | Same as Engram |
| Adapter | `@sveltejs/adapter-node` | **confirmed** | SQLite + OS listen/firewall need Node |
| Runtime | Node | **confirmed** | CLI + `pnpm dev` |
| CLI runner | `tsx` / `package.json` bin `localberth` | **confirmed** | |
| DB | SQLite (`better-sqlite3`) | **confirmed** | Leases + observed snapshots under `~/.localberth/` |
| Auth | None | **confirmed** | Single operator |
| App deploy | Local only (npm install) | **confirmed** | Dashboard default bind `127.0.0.1`; `0.0.0.0` optional for phone |
| License | Apache-2.0 | **confirmed** | Same as Engram / ForgeTrail |
| Dashboard port | **54321** | **confirmed** | High, easy to remember (not Postgres 5432) |

**Folder shape:**

```text
localberth/                 # GitHub: Catalyst-Forge-LLC/localberth
  src/cli/                  # get, claim, ls, scan, firewall
  src/lib/server/           # registry, observe, firewall
  src/routes/               # local dashboard (not localberth.com)
  data/                     # dev fixtures only; live state is ~/.localberth/
  site/                     # FilePress content → localberth.com
    filepress.config.ts
    pages/                  # home, install, cli, dashboard, firewall
    posts/                  # optional notes
    static/
    package.json            # getfilepress
```

---

## 5. Data model (v1)

**Lease**

| Field | Meaning |
| ----- | ------- |
| `name` | Stable id (`engram`, `dictawhisper`, `localberth`) |
| `port` | TCP port |
| `bind` | `127.0.0.1` / `0.0.0.0` / Tailscale IP |
| `protocol` | `tcp` (udp later) |
| `kind` | `always` \| `ephemeral` |
| `notes` | Free text |
| `firewall` | `wanted` / `applied` / `needs-elevation` / `skipped` |

**Observed** (from OS listen table, not owned)

| Field | Meaning |
| ----- | ------- |
| `port`, `bind`, `pid`, `process`, `seen_at` | Snapshot |
| `lease_name` | Matched lease or null |

Conflict: lease port in use by a process that is not the expected app → dashboard flag, do not auto-kill.

---

## 6. CLI (v1)

```text
localberth get <name>              # stdout: port number only (scripts)
localberth claim <name> [--port N] [--bind ADDR] [--ephemeral]
localberth ls
localberth scan
localberth firewall sync           # apply wanted rules
```

Apps: `PORT=$(localberth get engram)`. Vite often ignores `PORT` — a small `--port` helper or documented `vite.config` `loadEnv` is in scope.

---

## 7. Firewall (Windows)

On claim/move: upsert inbound TCP allow named `LocalBerth <name> <port>` (e.g. `LocalBerth engram 5193`). Remove or disable the previous port’s LocalBerth-managed rule.

If not elevated: print the `netsh` line (today’s Engram 5193 situation) and mark `needs-elevation`.

Do not touch unrelated rules (`Node.js JavaScript Runtime`, leftover `Engram 5173` unless we later add a janitor).

---

## 8. Naming

**Public:** LocalBerth · site `localberth.com` (FilePress explainer)  
**Package:** npm `localberth` · bin `localberth`  
**Pairing:** localhost = the machine; LocalBerth = the slip (addition, not a replacement).  
**Repo:** [Catalyst-Forge-LLC/localberth](https://github.com/Catalyst-Forge-LLC/localberth)  
**CLI:** `localberth` (avoids the crowded global `berth` binary)

The bare name **berth** is crowded:

| Who | What | Binary |
| --- | --- | --- |
| [berth-mcp/berth](https://github.com/berth-mcp/berth) | MCP server package manager | `cargo install berth`, npm `@berth/cli` → `berth` |
| [@whenlabs/berth](https://github.com/WhenLabs-org/when) | Port **conflict resolver** (scan/kill/reassign) | `@whenlabs/berth` → `berth` |
| [zoltanersek/berth](https://github.com/zoltanersek/berth) | Agent **worktree** isolation + ephemeral ports | `berth up/down/dashboard` |
| [tofa84/berth](https://github.com/tofa84/berth) | Mac GUI for Apple containers | app name, not this domain |
| npm `berth` (unscoped) | **Deprecated**, unused |

Closest **product** prior art under a different name: [PortHub](https://github.com/Jason-Vaughan/PortHub) (“DHCP for developers”).

**Why LocalBerth:** same metaphor, pairs with localhost, `localberth.com` is free, CLI and npm name do not collide with cargo/`@whenlabs/berth`. Folder is `/localberth`.

**Mitigation (v1):** `package.json` `"name": "localberth"` + `"bin": { "localberth": "…" }`; publish unscoped when the spine works. Optional later alias `lb`. Do not ship a `berth` bin.

---

## 9. Non-goals (v1)

- Reverse proxy / `engram.localhost` / PAC
- Process manager (start/stop Engram)
- Killing observed processes
- MagicDNS app names
- Multi-user / remote registry
- Hosting the dashboard or lease store at localberth.com

---

## 10. First feature batch (Phase 2 spine)

1. Registry persist + `get` / `claim` / `ls`
2. `scan` (Windows listen table)
3. Dashboard: leases + observed
4. Firewall sync on claim (Windows)
5. Self-lease `localberth` → 54321
6. npm package shape (`name` / `bin` / files) so `localberth` can publish
7. FilePress `site/` (home + install + how-to) for localberth.com

---

## 11. Locked 2026-08-18

1. Stack = Engram (SvelteKit 5 + Tailwind + pnpm + TypeScript ESM + SQLite).
2. Live data = `~/.localberth/`.
3. License = Apache-2.0.
4. Dashboard port = **54321**.
5. **localberth.com** = FilePress explainer in `site/`; app is npm `localberth` running locally.
6. **npm name reserved:** `localberth@0.0.0` published 2026-08-18. Omit homepage / repository / bugs until the site is live and the GitHub repo is public.

**Still needed:** explicit go-ahead to start Phase 2 (scaffold the spine + site).
