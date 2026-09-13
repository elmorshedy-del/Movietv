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
Gate G — In-Memory Room Store and Room Service
```

Gate F's pure shared timeline/protocol core is merged.

Gate E remains `EXTERNAL VALIDATION PENDING`; it prevents final drift tuning but does not block domain/store construction.

Gate G is intentionally server-domain-only: `WatchRoomStore`, its single-process in-memory adapter, room creation, participant join/rejoin/capacity logic, and deterministic tests. Do not add HTTP or Socket.IO room handlers yet.
