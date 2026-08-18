# LocalBerth — Genesis

A hosts file for **ports**. Pairing: **localhost** is the machine; **LocalBerth** is the slip.

On a machine with many always-on and throwaway local apps, the scarce resource is not a hostname — it is a TCP port, plus the firewall hole and the bookmark that point at it. DNS and `/etc/hosts` map names to IPs. They do not assign berths.

**LocalBerth** is a local registry: a name claims a stable port (or gets one from a pool). Apps look up their berth when they start. A dashboard shows leases next to what is actually listening. When a lease is created or moved, the host firewall is updated so Tailscale/LAN clients do not time out on a stale port.

Public home: `localberth.com` — a FilePress site that explains the product and how to install it. The app itself is the npm package `localberth` and runs on your machine (dashboard `:54321`). CLI: `localberth`.

Not in v1: hiding ports behind `app.localhost`, process supervision, or MagicDNS for app names. localhost stays localhost.
