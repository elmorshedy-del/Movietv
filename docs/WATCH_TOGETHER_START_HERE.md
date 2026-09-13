# Watch Together — Start Here

This is the canonical entry point for engineers and AI agents.

Read in this order:

1. `docs/WATCH_TOGETHER_TECHNICAL_SPEC.md` — current architecture and the full Original → Revised → Why decision history.
2. `docs/WATCH_TOGETHER_V1_AUDIT_RECONCILIATION.md` — current Codex continuation plan, retroactive work, revised gates, and exact next task.
3. `docs/WATCH_TOGETHER_V1_BUILD_BLUEPRINT.md` — original V1 blueprint, preserved as design history and detailed reference where not superseded.

Where documents conflict:

```text
TECHNICAL_SPEC.md
+ V1_AUDIT_RECONCILIATION.md
    win.

V1_BUILD_BLUEPRINT.md
    remains historical/supporting detail.
```

The existing IPTV/KoraZero system is not a dependency of movie Watch Together. External IPTV reachability failures in Codex/CI are non-blocking unless a local code change caused a regression.

## Current next task

Start **Gate B** in `WATCH_TOGETHER_V1_AUDIT_RECONCILIATION.md`:

- add `tsconfig.watch.json` with strict Watch Together type checking;
- wire it into the package verification scripts;
- run `pnpm typecheck`, `pnpm test`, and `pnpm build`;
- report exact changes/results;
- stop before Gate C.

Do not investigate the KoraZero 403/502 as part of Gate B.
