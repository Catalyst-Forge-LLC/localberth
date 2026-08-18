---
title: LocalBerth
description: Local DNS for ports.
---

You start a Svelte app. Vite takes **5173**. You start a second one. It takes **5174**. After a reboot you start them in the other order. The ports swap. Bookmarks, firewall rules, and the phone now hit the wrong app.

Name the port so that does not happen. `foo` stays on 5173. `bar` stays on 5174. An agent or the app asks the CLI instead of hoping Vite picked the same number again.

```text
localberth claim foo --port 5173
localberth claim bar --port 5174
localberth get foo
```

**localhost** is the machine; **LocalBerth** is the slip.

A claim is loopback unless you pass `--lan`.

After you install, `localberth serve` opens the dashboard at `http://127.0.0.1:54321`.

[Install](/install) · [CLI](/cli) · [Napkin math](/posts/napkin-math)
