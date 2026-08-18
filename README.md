# LocalBerth

**localhost** is the machine. **LocalBerth** is the slip.

Named TCP port leases for a local box. You still open the port. LocalBerth remembers which name owns which number, shows what’s listening, and keeps the firewall rule in sync — on Windows, macOS, and Linux.

```text
npm i -g localberth
localberth claim engram --port 5193 --bind 0.0.0.0
localberth get engram
localberth serve
```

Dashboard: `http://127.0.0.1:54321`

Apache-2.0 · Catalyst Forge, LLC
