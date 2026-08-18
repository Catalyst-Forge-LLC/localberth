---
title: CLI
description: localberth command reference.
order: 2
---

```text
localberth get <name>
localberth claim <name> [--port N] [--bind ADDR] [--ephemeral] [--notes TEXT]
localberth release <name> [--force]
localberth ls
localberth scan [--all]
localberth firewall sync
localberth serve [--host ADDR] [--port N]
```

`get` prints only the port number, for scripts. `claim` writes the lease and tries to add an inbound firewall allow. If you are not admin/sudo, it prints the command to paste. `release` drops the lease and tries to remove the LocalBerth-managed rule.

`scan` lists listening sockets and hides common OS/RPC ports unless you pass `--all`. It never kills a process.

`serve` opens the harbor board (default `127.0.0.1:54321`).

Vite apps can set the port from a lease:

```ts
import { localberthPort } from 'localberth/port';

export default defineConfig({
	server: { port: localberthPort('engram', 5193) }
});
```

Leases are stored on the machine under `~/.localberth/`.
