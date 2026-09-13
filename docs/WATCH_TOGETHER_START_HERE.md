# Watch Together — Start Here

This is the canonical entry point for engineers and AI agents.

Read in this order:

1. `docs/WATCH_TOGETHER_CODEX_HANDOFF.md` — mandatory execution/completion rules.
2. `docs/WATCH_TOGETHER_TECHNICAL_SPEC.md` — current architecture and Original → Revised → Why decision history.
3. `docs/WATCH_TOGETHER_V1_AUDIT_RECONCILIATION.md` — current continuation plan, retroactive work, revised gates, and implementation sequence.
4. `docs/WATCH_TOGETHER_V1_BUILD_BLUEPRINT.md` — original V1 blueprint, preserved as historical/supporting detail where not superseded.

The active implementation gate is defined by the **base-branch** copy of:

```text
.codex/watch-gate.json
```

Where documents conflict:

```text
CODEX_HANDOFF.md
+ base-branch .codex/watch-gate.json
    control execution/completion.

TECHNICAL_SPEC.md
+ V1_AUDIT_RECONCILIATION.md
    control current architecture/sequence.

V1_BUILD_BLUEPRINT.md
    remains historical/supporting detail.
```

The existing IPTV/KoraZero system is not a dependency of movie Watch Together. External IPTV reachability failures in Codex/CI are non-blocking unless a local code change caused a regression.

## Mandatory completion command

For every Watch Together implementation gate:

```bash
git fetch origin main
pnpm watch:gate
```

A task is **not complete** until that command exits `0` after all changes and the PR's `Watch Together Gate` check is green.

If the command fails, fix the failure within the active gate and rerun it. Do not stop with a completion report while it is red.

After a gate passes, **stop**. Do not prepare or begin the next gate in the same task.

## Current gate

The active base-branch manifest currently specifies:

```text
Gate F — Shared Authoritative Timeline Core
```

Gate D's deterministic progressive-MP4 media contract/player work is merged.

Gate E is a real-device calibration experiment rather than a repository-code gate. It remains `EXTERNAL VALIDATION PENDING`. Per the reconciled architecture, that does **not** block building the pure shared sync core, but no drift threshold may be treated as final until Gate E is actually performed.

Gate F is intentionally pure and shared: types, event payloads, timeline projection/order math, and tests only. Do not create room storage, Socket.IO handlers, clock-estimator code, player sync control, chat, persistence, or UI in this gate.
