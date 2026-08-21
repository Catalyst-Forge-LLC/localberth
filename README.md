<p align="center">
  <img src="site/static/logo.png" alt="LocalBerth" width="218" />
</p>

# LocalBerth

**Local DNS for ports.**

> **berth** *n.* *a ship's allotted place at a dock.*

Vite hands out 5173, then 5174. Reboot, and they swap. Name the port so they do not.

**localhost** is the machine; **LocalBerth** is the slip.

**Docs:** [localberth.com/docs](https://localberth.com/docs) · **Site:** [localberth.com](https://localberth.com)

## Install

```bash
npm i -g localberth
localberth claim foo --port 5173
localberth serve
```

or `pnpm add -g localberth`. Node.js 20+.

## Quick start

```bash
localberth claim foo --port 5173
localberth claim bar --port 5174
localberth get foo
localberth serve --host 0.0.0.0
```

`get` prints only the port, for scripts. `--lan` binds `0.0.0.0` and syncs an inbound firewall allow.

## What you get

Named leases. A dashboard on **54321** (operator table on loopback, visitor tiles on the phone). Firewall sync on Windows, macOS, and Linux. A Vite helper that pins host and port. Flags live in the [docs](https://localberth.com/docs).

<!-- xfacts-nutrition-label -->

## Nutrition label

- **AppFacts:** [viewer](https://appfacts.dev/v#af1.eNpNUkuP1DAM_iuRTyClUx63nkAjIR4FCbo3hJCbetts0yTE7sxWo_nvKJmyy9X5Xv6cC5ygea3B40LQgAsGXU9JJtAgW8yzM_UKY1Qvuu7HS9DAgrIyNIBG7IlAg7OGPGfs-4hmourN4dUNaGZoLuDQjyuOGXC3RepMslG06k7khLT6jCf8Nzt2nVbdRM5p9fHuawsa0urFlnTfwkCHBwYN9wkXOoc0QwM3mS9WiuXmrB-zEVp3tn7IiqBhQMEeS8bue2slx54Cyw1c1oarhoEiQ_PzAh4aeMdF-YHruYjHvYwnc3UfkpKJ1IA89QHTAFd94_YkQqniP84Kvd3JkRJbFvKiWELCkYpCDEmUI2TiJ77s8Q3zTt5XU6tYZ2V7RvLjjnjuVtEjmVVs8MXg2H5SXB4Yrr809Kt1Qz5MRDPjSL8X9DhSyhF9XPLpiSV7lgIqM5GZcz2JYmArIW3QwCQSuanr0cq09gcTlvqIgm5jqT6ENFLVtsf6vx91_QtkIdFS) · [raw](https://github.com/Catalyst-Forge-LLC/localberth/blob/main/APP_FACTS.md)

## Development

```bash
pnpm install
pnpm test
pnpm cli ls
```

Site (FilePress + docs mount): `pnpm --dir site ship`

Apache-2.0 · Catalyst Forge, LLC
