---
title: CLI
description: localberth command reference.
order: 2
---

```text
localberth get <name>
localberth claim <name> [--port N] [--bind ADDR] [--lan] [--ephemeral] [--notes TEXT] [--or-next]
localberth release <name> [--force]
localberth ls
localberth scan [--all]
localberth firewall sync
localberth firewall status
localberth serve [--host ADDR] [--port N]
```

## claim

A claim is private to this machine (`127.0.0.1`) unless you pass `--lan` or `--bind` to a non-loopback address. Then LocalBerth tries to add an inbound firewall allow. Loopback skips that: no WAN hole. Rules are named `LocalBerth <name> <port>` and only those are removed. Firewall writes need admin or root. Without that, the lease still saves and LocalBerth prints the command to paste. It does not prompt for UAC or sudo.

| Flag | What it does |
| ---- | ------------ |
| `--port N` | Request this TCP port. Omit it and LocalBerth picks the next free port from the always pool (`46000–46999`). |
| `--bind ADDR` | Listen address. Default `127.0.0.1`. |
| `--lan` | Bind `0.0.0.0` and sync an inbound firewall allow. Do not combine with `--bind`. |
| `--ephemeral` | Scratch lease. Port pool is `47000–47999` if you omit `--port`. |
| `--notes TEXT` | Stored on the lease. |
| `--or-next` | If `--port` is already leased or something is already listening, take the next free pool port instead. |

Without `--or-next` you can still claim a port that is already listening. That is how you name an app that is already up. A second name cannot take a port another lease already owns; pass `--or-next` to get a free port.

```text
localberth claim fizzbuzz --port 5193 --lan
localberth claim scratch --port 5193 --or-next
localberth release scratch
```

`get` prints only the port number, for scripts.

`scan` lists listening sockets and hides common OS/RPC ports unless you pass `--all`. It never kills a process.

`serve` opens the dashboard (default `127.0.0.1:54321`).

Vite apps should set host and port from the lease. Pin `host` or Vite binds `localhost` (`[::1]` on many Windows machines) while the claim stays `127.0.0.1`.

```ts
import { localberthListen } from 'localberth/port';

const listen = localberthListen('fizzbuzz', 5193);

export default defineConfig({
	server: { host: listen.host, port: listen.port, strictPort: true }
});
```

`localberthPort(name, fallback)` still returns only the number.

Leases are stored on the machine under `~/.localberth/`.
