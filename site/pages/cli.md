---
title: CLI
description: localberth command reference.
order: 2
---

```text
localberth get <name>
localberth claim <name> [--port N] [--bind ADDR] [--ephemeral] [--notes TEXT] [--or-next]
localberth release <name> [--force]
localberth ls
localberth scan [--all]
localberth firewall sync
localberth firewall status
localberth serve [--host ADDR] [--port N]
```

## claim

Writes the lease, then tries to add an inbound firewall allow only for non-loopback binds. Loopback (`127.0.0.1`) is skipped: no WAN hole. Rules are named `LocalBerth <name> <port>` and only those are removed. Firewall writes need admin or root. Without that, the lease still saves and LocalBerth prints the command to paste. It does not prompt for UAC or sudo.

| Flag | What it does |
| ---- | ------------ |
| `--port N` | Request this TCP port. Omit it and LocalBerth picks the next free port from the always pool (`46000–46999`). |
| `--bind ADDR` | Listen address. Default `0.0.0.0`, or `127.0.0.1` with `--ephemeral`. |
| `--ephemeral` | Scratch lease. Default bind is loopback. Port pool is `47000–47999` if you omit `--port`. |
| `--notes TEXT` | Stored on the lease. |
| `--or-next` | If `--port` is already leased or something is already listening, take the next free pool port instead. |

Without `--or-next` you can still claim a port that is already listening. That is how you name an app that is already up. A second name cannot take a port another lease already owns; pass `--or-next` to get a free port.

```text
localberth claim engram --port 5193 --bind 0.0.0.0
localberth claim scratch --port 5193 --or-next
localberth release scratch
```

`get` prints only the port number, for scripts.

`scan` lists listening sockets and hides common OS/RPC ports unless you pass `--all`. It never kills a process.

`serve` opens the dashboard (default `127.0.0.1:54321`).

Vite apps can set the port from a lease:

```ts
import { localberthPort } from 'localberth/port';

export default defineConfig({
	server: { port: localberthPort('engram', 5193) }
});
```

Leases are stored on the machine under `~/.localberth/`.
