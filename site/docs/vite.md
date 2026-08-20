---
title: Vite
---

Pin `host` and `port` from the lease. Vite’s default host is `localhost`, which on Windows is often `[::1]` only while the claim is `127.0.0.1`. Same port, two sockets.

```ts
import { localberthListen } from 'localberth/port';

const listen = localberthListen('foo', 5173);

export default defineConfig({
	server: { host: listen.host, port: listen.port, strictPort: true }
});
```

`localberthPort(name, fallback)` still returns just the number.

If the name is missing and you pass a fallback, you get `127.0.0.1` and that port. If there is no fallback, it throws.

For a phone tile, start Vite with `--host` (or `server.host: true`) so the process listens past loopback.
