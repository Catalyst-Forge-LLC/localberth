---
title: CLI
description: localberth command reference.
order: 2
---

```text
localberth get <name>
localberth claim <name> [--port N] [--bind ADDR] [--ephemeral] [--notes TEXT]
localberth ls
localberth scan
localberth firewall sync
```

`get` prints only the port number, for scripts. `claim` writes the lease and tries to add an inbound firewall allow for that TCP port. If you are not admin/sudo, it prints the command to paste.

`scan` lists listening sockets. It never kills a process.

Leases are stored on the machine under `~/.localberth/`.
