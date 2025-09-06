# Changelog

## V17.1.2-rma-sync-hotfix
- Stabilize RMA Adjustments: adapter returns empty-safe, no crashes with `VITE_RMA_API=0`.
- Exclude debugger code from TypeScript (`tsconfig.exclude` includes `src/debugger/**`).
- Add minimal logging stubs (`logEvent`, `logRMAEvent`) to avoid named-export mismatches.
- Resolve JSX namespace errors via types shim.
- Version badge: `V17.1.2-rma-sync-hotfix`.

_This entry is documentation-only and does not change runtime behavior._
