---
title: Claim
---

A claim names a TCP port on this machine. Default bind is `127.0.0.1` — no WAN hole.

```bash
localberth claim foo --port 5173
localberth claim foo --port 5173 --lan
localberth release foo
```

## Flags

| Flag | What it does |
| --- | --- |
| `--port N` | Request this TCP port. Omit it and LocalBerth picks the next free port from the always pool (`46000–46999`). |
| `--bind ADDR` | Listen address. Default `127.0.0.1`. |
| `--lan` | Bind `0.0.0.0` and sync an inbound firewall allow. Do not pass `--bind` with this. |
| `--ephemeral` | Scratch lease. Pool is `47000–47999` if you omit `--port`. |
| `--notes TEXT` | Stored on the lease. |
| `--or-next` | If `--port` is already leased or something is already listening, take the next free pool port instead. |

Without `--or-next` you can still claim a port that is already listening. That is how you name an app that is already up. A second name cannot take a port another lease already owns; pass `--or-next` to get a free port.

```bash
localberth claim scratch --port 5173 --or-next
localberth release scratch
```

`localberth` itself is reserved on **54321**. Release it only with `--force`.
