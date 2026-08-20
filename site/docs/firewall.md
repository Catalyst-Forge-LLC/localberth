---
title: Firewall
---

A loopback claim does not open a WAN hole. `--lan` binds `0.0.0.0` and tries to add an inbound allow.

```bash
localberth claim foo --port 5173 --lan
localberth firewall sync
localberth firewall status
```

Rules are named `LocalBerth <name> <port>`. Only those are removed on release or move.

## Privilege

Firewall writes need admin or root. Without that, the lease still saves and LocalBerth prints the command to paste. It does not prompt for UAC or sudo.

Backends: `netsh` on Windows, `pf` on macOS, `ufw` or `firewalld` on Linux.

## Bind vs listen

The claim can stay on `127.0.0.1` while the app listens on all interfaces (`vite --host`). The visitor menu follows the **socket**, not the claim text. The firewall rule follows the claim: you still need `--lan` (or a pasted rule) if the phone should get through the host firewall.
