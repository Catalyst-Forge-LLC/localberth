---
title: LocalBerth
description: localhost is the machine. LocalBerth is the slip.
---

Local DNS for ports. A name on this machine resolves to a TCP number (`engram` → `5193`). Apps look it up; you still bookmark `http://127.0.0.1:5193` or the Tailscale address.

```text
localberth claim engram --port 5193 --bind 0.0.0.0
localberth release engram
localberth get engram
```

The dashboard lives on your machine at port **54321**. This site is the explainer, not the running app.

[Install](/install) · [CLI](/cli)
