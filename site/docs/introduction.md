---
title: Introduction
---

**LocalBerth** is local DNS for ports. A name owns a TCP number on this machine. You still type the port.

**localhost** is the machine; **LocalBerth** is the slip.

You start a Svelte app. Vite takes **5173**. You start a second one. It takes **5174**. After a reboot you start them in the other order. The ports swap. Bookmarks, firewall rules, and the phone now hit the wrong app.

Name the port so that does not happen. `foo` stays on 5173. `bar` stays on 5174. An agent or the app asks the CLI instead of hoping Vite picked the same number again.

## What it is

- Named leases persist on the machine that ran the CLI (`~/.localberth/`)
- `localberth get foo` prints only the port, for scripts
- A dashboard on **54321** shows leases and what is listening
- `--lan` binds `0.0.0.0` and syncs an inbound firewall allow on Windows, macOS, and Linux

It is **not** a reverse proxy. It does not give you `foo.localhost` URLs.

## Two surfaces

| Surface | What it is |
| --- | --- |
| [localberth.com](https://localberth.com) | This site: what it is and how to use it |
| npm `localberth` | The CLI and dashboard, on your machine |

The domain never serves leases.

## Next

- [Install](/docs/install) — npm or a checkout
- [Quick start](/docs/quick-start) — claim, get, serve
- [Commands](/docs/commands) — full reference
