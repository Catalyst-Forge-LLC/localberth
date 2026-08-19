#!/usr/bin/env bash
set -euo pipefail
pnpm install
node scripts/ensure-lease.mjs localberth-site 5187
