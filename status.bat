@echo off
pnpm exec tsx src/cli/main.ts ls
echo.
pnpm exec tsx src/cli/main.ts firewall status
