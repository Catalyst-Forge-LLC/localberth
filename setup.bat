@echo off
pnpm install
node scripts\ensure-lease.mjs localberth-site 5187
