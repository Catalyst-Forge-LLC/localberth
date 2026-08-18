---
title: LocalBerth
description: Local DNS for ports.
---

Name a TCP port on this machine. `engram` is 5193. You still bookmark the number or the Tailscale address.

**localhost** is the machine; **LocalBerth** is the slip.

The dashboard is on this computer at port **54321**. This site is the explainer, not the running app.

```text
localberth claim engram --port 5193 --bind 0.0.0.0
localberth release engram
localberth get engram
```

[Install](/install) · [CLI](/cli)
