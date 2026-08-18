# Berth — Genesis

A hosts file for **ports**.

On a machine with many always-on and throwaway local apps, the scarce resource is not a hostname — it is a TCP port, plus the firewall hole and the bookmark that point at it. DNS and `/etc/hosts` map names to IPs. They do not assign berths.

**Berth** is a local registry: a name claims a stable port (or gets one from a pool). Apps look up their berth when they start. A dashboard shows leases next to what is actually listening. When a lease is created or moved, Windows inbound rules are updated so Tailscale/LAN clients do not time out on a stale port.

Not in v1: hiding ports behind `app.localhost`, process supervision, or MagicDNS for app names.
