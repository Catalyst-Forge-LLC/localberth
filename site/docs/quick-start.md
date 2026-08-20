---
title: Quick start
---

## Claim two apps

```bash
localberth claim foo --port 5173
localberth claim bar --port 5174
localberth get foo
```

`get` prints only the port (`5173`), for scripts:

```bash
PORT=$(localberth get foo)
```

On Windows PowerShell:

```text
$env:PORT = localberth get foo
```

## Open the dashboard

```bash
localberth serve
```

Then visit `http://127.0.0.1:54321`. Loopback is the operator board. A phone on Tailscale or LAN sees the visitor tiles.

To reach an app from the phone, claim with `--lan` (or start the app on all interfaces):

```bash
localberth claim foo --port 5173 --lan
localberth serve --host 0.0.0.0
```

## See what is listening

```bash
localberth ls
localberth scan
```

`scan` hides common OS ports unless you pass `--all`. It never kills a process.

## Vite

Pin host and port from the lease. See [Vite](/docs/vite).
