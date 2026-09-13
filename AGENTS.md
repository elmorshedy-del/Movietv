# MovieTV Agent Instructions

These rules apply to Codex and any other coding agent working in this repository.

## Watch Together — mandatory execution contract

For any Watch Together task, read these files before editing code:

1. `docs/WATCH_TOGETHER_START_HERE.md`
2. `docs/WATCH_TOGETHER_CODEX_HANDOFF.md`
3. `docs/WATCH_TOGETHER_TECHNICAL_SPEC.md`
4. `docs/WATCH_TOGETHER_V1_AUDIT_RECONCILIATION.md`
5. `docs/WATCH_TOGETHER_V1_BUILD_BLUEPRINT.md` only as historical/supporting detail where not superseded.

### Active gate is authoritative

The active implementation gate is defined by the **base-branch** copy of:

```text
.codex/watch-gate.json
```

A Watch Together implementation task may change only the files permitted by that gate.

Do not edit `.codex/watch-gate.json`, `scripts/verify-watch-gate.mjs`, or `.github/workflows/watch-together-gate.yml` from a normal implementation task unless the user explicitly assigns a gate-governance task.

### No future-gate preparation

Do not prepare, scaffold, refactor for, or partially implement the next gate.

If the current gate is B, Gate C work is forbidden even if it appears obviously useful.

If future work is discovered, report it instead of implementing it.

### A task is not complete until the gate passes

Before claiming a Watch Together task is complete, run:

```bash
git fetch origin main
pnpm watch:gate
```

If it fails, fix the failure within current-gate scope and rerun the **entire** command. Repeat until it exits `0`.

Do not substitute a subset such as only `pnpm test`.

After pushing, the PR's `Watch Together Gate` GitHub check must also be green. A red or missing gate means the task is not complete.

If an external/manual validation cannot run from the coding environment, report exactly `EXTERNAL VALIDATION PENDING`; never convert that into a pass. External limitations do not excuse deterministic repository-check failures.

### Required final report

Use this structure:

```text
GATE: <gate>
STATUS: PASS | BLOCKED | FAIL
COMMIT: <sha>
CHANGED FILES:
- ...

pnpm watch:gate: PASS | FAIL
GitHub Watch Together Gate: PASS | PENDING | FAIL
NEXT GATE STARTED: NO
EXTERNAL VALIDATION PENDING: <none or exact items>
```

If `pnpm watch:gate` is not green, `STATUS` cannot be `PASS`.

## Watch Together architecture invariants

Unless the canonical technical spec explicitly changes them:

- Movie Watch Together is separate from IPTV/KoraZero live TV.
- Clients send playback intent; the server commits authoritative room truth.
- The sender also follows the committed broadcast.
- Reconnect reconciles from a snapshot rather than replaying stale playback events.
- Stable client identity is separate from socket identity.
- Couple Mode is a first-class two-person behavior.
- Do not modify live-TV code to solve Codex/network sandbox reachability failures.

## Repository stack

- Package manager: pnpm
- Frontend: React 18 + React Router 6 + TypeScript + Vite
- Styling: Tailwind CSS 4 + Radix UI
- Backend: Express 5
- Testing: Vitest
- Production Node runtime: Railway for the current MovieTV deployment path

## Normal verification

For ordinary repository work:

```bash
pnpm typecheck
pnpm test
pnpm build
```

For Watch Together work, use `pnpm watch:gate` instead because it includes scope enforcement plus the required deterministic verification.

## General change discipline

- Inspect current repository HEAD before editing.
- Keep changes tight and reversible.
- Do not claim a test/build/deployment passed unless it was actually run and observed.
- Do not hardcode credentials, stream IDs, or secrets.
- Keep server-only secrets out of Vite-exposed `VITE_*` variables.
- Preserve existing live-TV behavior unless the task explicitly targets it.
- Add React routes before the catch-all `*` route in `client/App.tsx`.
- Shared client/server types belong under `shared/`.
