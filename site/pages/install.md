---
title: Install
description: Install LocalBerth from npm.
order: 1
---

Node.js 20 or newer.

```text
npm i -g localberth
```

or

```text
pnpm add -g localberth
```

Then claim a port and start your app with it:

```text
localberth claim fizzbuzz --port 5193 --bind 0.0.0.0
PORT=$(localberth get fizzbuzz)
```

On Windows PowerShell:

```text
$env:PORT = localberth get fizzbuzz
```

Open the dashboard:

```text
localberth serve
```

Then visit `http://127.0.0.1:54321`.

When you are done with a name:

```text
localberth release fizzbuzz
```
