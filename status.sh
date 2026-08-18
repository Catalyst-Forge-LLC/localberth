#!/usr/bin/env bash
set -euo pipefail
pnpm exec tsx src/cli/main.ts ls
echo
pnpm exec tsx src/cli/main.ts firewall status
