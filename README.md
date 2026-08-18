# Berth

Named **port leases** for a machine that runs a lot of local services.

You keep using the port. Berth’s job is to remember which name owns which number, show what’s actually listening, and keep the Windows firewall rule in sync when a lease changes.

```text
berth get engram          → 5193
berth ls                  → leases + observed listeners
http://127.0.0.1:3999     → dashboard (proposed default)
```

This is not a reverse proxy and not DNS. Humans and phones still open `http://<tailscale-ip>:5193`.

## Status

Phase 1 brief is in `docs/PHASE_1_BRIEF.md` (**draft** — lock stack before scaffolding).

## Name

Local folder and product: **Berth**. The `berth` CLI binary is already used by other tools if installed globally (see the brief §8). This repo stays `private` until that’s decided.

## Sibling

Lives next to Engram, DictaWhisper, ChronoVault at `berth`.
