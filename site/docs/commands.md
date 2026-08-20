---
title: Commands
---

| Command | Description |
| --- | --- |
| `localberth get <name>` | Print the port (scripts) |
| `localberth claim <name> …` | Name a TCP port |
| `localberth release <name> [--force]` | Drop a lease |
| `localberth ls` | List leases |
| `localberth scan [--all]` | List listening sockets |
| `localberth firewall sync` | Apply inbound rules for `--lan` leases |
| `localberth firewall status` | Show rule state |
| `localberth serve [--host ADDR] [--port N]` | Open the dashboard |
| `localberth server` | Same as `serve` |

```bash
localberth --help
```

Deep pages: [Claim](/docs/claim), [Dashboard](/docs/dashboard), [Firewall](/docs/firewall), [Vite](/docs/vite).
