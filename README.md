# LocalBerth

**localhost** is the machine. **LocalBerth** is the slip.

Named TCP port leases for a local box. You still open the port. LocalBerth remembers which name owns which number, shows what’s listening, and keeps the firewall rule in sync — on Windows, macOS, and Linux.

## Install

```text
npm i -g localberth
```

or `pnpm add -g localberth`. Node.js 20+.

## Use

```text
localberth claim engram --port 5193 --bind 0.0.0.0
localberth get engram
localberth ls
localberth scan
localberth serve
```

`get` prints only the port, for scripts (`PORT=$(localberth get engram)`).

```text
localberth claim <name> [--port N] [--bind ADDR] [--ephemeral] [--notes TEXT]
localberth release <name> [--force]
localberth firewall sync
localberth firewall status
```

Dashboard: `http://127.0.0.1:54321` (`localberth serve`). Loopback leases do not open a WAN firewall hole. If a claim is not elevated, LocalBerth prints the command to paste.

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
