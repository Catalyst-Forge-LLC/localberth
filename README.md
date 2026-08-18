<p align="center">
  <img src="site/static/logo.png" alt="LocalBerth" width="218" />
</p>

# LocalBerth

**Local DNS for ports.**

You start a Svelte app. Vite takes **5173**. You start a second one. It takes **5174**. After a reboot you start them in the other order. The ports swap. Bookmarks, firewall rules, and the phone now hit the wrong app.

Name the port so that does not happen. `foo` stays on 5173. `bar` stays on 5174. An agent or the app asks the CLI instead of hoping Vite picked the same number again.

**localhost** is the machine; **LocalBerth** is the slip.

It records which name owns which number, shows what is listening, and updates the host firewall on Windows, macOS, and Linux.

## Install

```text
npm i -g localberth
```

or `pnpm add -g localberth`. Node.js 20+.

## Use

```text
localberth claim foo --port 5173
localberth claim bar --port 5174
localberth get foo
localberth ls
localberth scan
localberth serve
```

`get` prints only the port, for scripts (`PORT=$(localberth get foo)`).

**claim**

- `--port N`: request this TCP port. Omit it and LocalBerth picks the next free port from the always pool (`46000–46999`).
- `--bind ADDR`: default `0.0.0.0`. Loopback (`127.0.0.1`) does not open a WAN firewall hole.
- `--ephemeral`: scratch lease; default bind `127.0.0.1`; pool `47000–47999` if no `--port`.
- `--notes TEXT`: stored on the lease.
- `--or-next`: if `--port` is already leased or something is already listening, take the next free pool port instead. Without this flag you can still claim a listening port (you are naming what is there). A second name cannot take an already-leased port.

```text
localberth claim foo --port 5173 --bind 0.0.0.0
localberth claim scratch --port 5173 --or-next
localberth release <name> [--force]
localberth firewall sync
localberth firewall status
```

Dashboard: `http://127.0.0.1:54321` (`localberth serve`). Loopback leases skip the WAN hole. A non-loopback claim still saves the lease if you are not admin/root; LocalBerth prints the firewall command to paste. It does not prompt for UAC or sudo.

Leases live in `~/.localberth/` on the machine that ran the CLI.

## Vite

```ts
import { localberthPort } from 'localberth/port';

export default defineConfig({
	server: { port: localberthPort('foo', 5173) }
});
```

## Checkout

`setup.bat` then `run.bat`, or `pnpm install` and `pnpm dev`. CLI from the tree: `pnpm cli ls`.

Apache-2.0 · Catalyst Forge, LLC
