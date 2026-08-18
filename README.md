# LocalBerth

**Local DNS for ports.**

Named TCP port leases for a local box. A name on this machine resolves to a TCP number (`engram` → `5193`). You still open the port. **localhost** is the machine; **LocalBerth** is the slip. LocalBerth remembers which name owns which number, shows what’s listening, and keeps the firewall rule in sync — on Windows, macOS, and Linux.

## Install

```text
npm i -g localberth
```

or `pnpm add -g localberth`. Node.js 20+.

## Use

```text
localberth claim engram --port 5193 --bind 0.0.0.0
localberth release engram
localberth get engram
localberth ls
localberth scan
localberth serve
```

`get` prints only the port, for scripts (`PORT=$(localberth get engram)`).

**claim**

- `--port N` — request this TCP port. Omit it and LocalBerth picks the next free port from the always pool (`46000–46999`).
- `--bind ADDR` — default `0.0.0.0`. Loopback (`127.0.0.1`) does not open a WAN firewall hole.
- `--ephemeral` — scratch lease; default bind `127.0.0.1`; pool `47000–47999` if no `--port`.
- `--notes TEXT` — stored on the lease.
- `--or-next` — if `--port` is already leased or something is already listening, take the next free pool port instead. Without this flag you can still claim a listening port (you are naming what is there); a second name cannot take an already-leased port.

```text
localberth claim scratch --port 5193 --or-next
localberth release <name> [--force]
localberth firewall sync
localberth firewall status
```

Dashboard: `http://127.0.0.1:54321` (`localberth serve`). If a claim is not elevated, LocalBerth prints the command to paste.

Leases live in `~/.localberth/` on the machine that ran the CLI.

## Vite

```ts
import { localberthPort } from 'localberth/port';

export default defineConfig({
	server: { port: localberthPort('engram', 5193) }
});
```

## From this repo

Double-click `setup.bat` then `run.bat` (or `./setup.sh` && `./run.sh`) — or:

```text
pnpm install
pnpm dev          # SvelteKit board on :54321
pnpm exec tsx src/cli/main.ts ls
```

The FilePress explainer is `site/` (`pnpm site:dev`). That site is not the running dashboard.

Apache-2.0 · Catalyst Forge, LLC
