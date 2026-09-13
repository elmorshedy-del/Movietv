# Watch Together — Start Here

This is the canonical entry point for engineers and AI agents.

Read in this order:

1. `docs/WATCH_TOGETHER_CODEX_HANDOFF.md` — mandatory execution/completion rules.
2. `docs/WATCH_TOGETHER_TECHNICAL_SPEC.md` — current architecture and Original → Revised → Why decision history.
3. `docs/WATCH_TOGETHER_V1_AUDIT_RECONCILIATION.md` — current continuation plan, retroactive work, revised gates, and implementation sequence.
4. `docs/WATCH_TOGETHER_V1_BUILD_BLUEPRINT.md` — original V1 blueprint, preserved as historical/supporting detail where not superseded.

The active implementation gate is defined by the **base-branch** `.codex/watch-gate.json`. Execution/completion follows that manifest and `docs/WATCH_TOGETHER_CODEX_HANDOFF.md`; architecture follows the technical spec and audit reconciliation.

The existing IPTV/KoraZero system is not a dependency of movie Watch Together. External IPTV reachability failures are non-blocking unless a local code change caused a regression.

## Mandatory completion command

```bash
git fetch origin main
pnpm watch:gate
```

A task is not complete until it exits `0` after all changes and the PR's `Watch Together Gate` check is green. After a gate passes, stop before the next gate.

## Current gate

```text
Gate I — Client Clock Estimator
```

Gates B, C, D, F, G, and H are merged. Gate E remains an external real-device calibration.

Gate I is pure client clock math only: four-timestamp exchanges, recent low-RTT sample selection, median offset, bounded offset slew, `serverNowMs()`, diagnostics, and deterministic tests. Do not wire Socket.IO into the browser or implement playback readiness/synchronization yet.
