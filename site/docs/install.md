---
title: Install
---

Requires **Node.js 20+**.

## Global install

```bash
npm i -g localberth
```

or `pnpm add -g localberth`.

Then:

```bash
localberth claim foo --port 5173
localberth serve
```

The dashboard is `http://127.0.0.1:54321`. Leases live in `~/.localberth/` on the machine that ran the CLI.

## From a checkout

```bash
pnpm install
pnpm cli ls
```

`setup.bat` then `run.bat` also works. The dashboard from the tree is `pnpm dev` (Vite). The published CLI is `localberth serve`.

## Site and docs

This documentation is [localberth.com/docs](https://localberth.com/docs). Product pages live on FilePress; these docs are a path mount at `/docs`.
