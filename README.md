# LocalBerth

**localhost** is the machine. **LocalBerth** is the slip.

Named **port leases** for a box that runs a lot of local services. You still open `http://127.0.0.1:5193` (or the Tailscale IP). LocalBerth remembers which name owns which number, shows what’s listening, and keeps the Windows firewall rule in sync.

```text
localberth get engram     → 5193
localberth ls             → leases + observed listeners
http://127.0.0.1:3999     → dashboard (proposed default)
```

Intended site: [localberth.com](https://localberth.com). Repo folder stays `/berth`.

## Status

Phase 1 brief is in `docs/PHASE_1_BRIEF.md` (**draft** — lock stack before scaffolding).

## Sibling

Next to Engram, DictaWhisper, ChronoVault at `berth`.
