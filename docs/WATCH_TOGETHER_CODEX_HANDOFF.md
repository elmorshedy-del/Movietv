# Watch Together — Codex Execution Handoff

This file defines how Codex must execute Watch Together work. It is intentionally stricter than the architecture documents.

## Completion rule

A Watch Together task is **not complete** because code was written, committed, pushed, or because one test passed.

It is complete only when all of the following are true:

1. The task changed only files allowed by the active base-branch gate in `.codex/watch-gate.json`.
2. Every required file/content condition in that gate is satisfied.
3. `pnpm watch:gate` exits with code `0` on the task branch after all changes.
4. The task branch is pushed.
5. The GitHub `Watch Together Gate` check is green for the PR.
6. Codex has not started, prepared, scaffolded, or modified files for the next gate.

If any deterministic local check fails, Codex must fix the failure and rerun the complete gate command. It must not stop with a summary that says the task is complete while the gate is red.

If an external/manual validation cannot be performed from Codex Cloud, report it as `EXTERNAL VALIDATION PENDING`; do not fake a pass. External/manual checks do not excuse failures in deterministic repo checks.

## Immutable gate source

The active gate is defined by the copy of:

```text
.codex/watch-gate.json
```

on the **base branch**, not by a modified copy on the task branch.

Do not edit the gate file, the verifier, or the CI workflow from a Watch Together implementation task unless the user explicitly assigns a gate-governance task.

The verifier intentionally reads the base-branch copy so an implementation task cannot widen its own scope.

## Required command loop

Before claiming completion:

```bash
git fetch origin main
pnpm watch:gate
```

If it fails:

```text
read failure
→ fix only within current gate scope
→ rerun pnpm watch:gate
→ repeat until exit 0
```

Do not substitute individual commands for the aggregate gate command in the final verification.

## Gate B result

Gate B is complete and merged.

It established:

- a strict Watch Together TypeScript project;
- repository typecheck wiring that runs both legacy/base and strict Watch Together checks;
- deterministic scope enforcement through `pnpm watch:gate`;
- a green GitHub `Watch Together Gate` check before merge.

One lesson from Gate B is now explicit: do not use a strict-only `@ts-expect-error` probe in a file also compiled by the legacy non-strict root tsconfig. That makes the base compiler report an unused directive. The strict project itself plus gate-enforced compiler options are the proof boundary.

## Current gate

Read `.codex/watch-gate.json` from `origin/main`.

The active gate is:

```text
Gate C — Railway Realtime Transport Spike
```

Purpose:

> Prove that MovieTV's production Node runtime can own a shared HTTP server and a long-lived realtime connection with clean shutdown/reconnect behavior, without yet building rooms or synchronization logic.

The implementation is deliberately narrow.

Allowed concepts:

- extracting a shared Node `http.Server` from production startup;
- a feature-flagged deployment-only WebSocket probe;
- a tiny same-origin probe page for manual Railway/iPhone validation;
- deterministic local connect/reconnect tests;
- graceful shutdown that closes probe sockets before the HTTP server.

Forbidden in Gate C:

- room state;
- participant models;
- playback timeline;
- media/movie types;
- chat;
- Redis;
- Socket.IO room implementation;
- player UI;
- IPTV/live-TV edits.

The native WebSocket probe is **not** the permanent room transport. It exists only to validate the deployment/runtime risk without introducing production room semantics. The canonical production room transport remains Socket.IO per the technical architecture.

The probe must be disabled by default and enabled only when:

```text
WATCH_TOGETHER_SOCKET_PROBE=1
```

The real Railway + iPhone cellular 30-minute/background-foreground soak is an external gate. Until actually observed, the final report must state:

```text
EXTERNAL VALIDATION PENDING
```

Deterministic repository checks must still pass before the Gate C code is mergeable.

## Do not prepare future gates

Examples of prohibited behavior during Gate C:

- creating room/store interfaces;
- adding movie media contracts;
- adding the movie player;
- implementing clock synchronization;
- adding playback intents or timeline state;
- building chat/presence;
- introducing Redis or durable room persistence.

If future work seems obviously useful, mention it in the final report only. Do not implement it.

## Final report format

A successful deterministic gate report must include:

```text
GATE: <letter/title>
STATUS: PASS
COMMIT: <sha>
CHANGED FILES:
- ...

pnpm watch:gate: PASS
GitHub Watch Together Gate: PASS
NEXT GATE STARTED: NO
EXTERNAL VALIDATION PENDING: <none or exact items>
```

If the deterministic gate does not pass, the status is `BLOCKED` or `FAIL`, never `PASS`.

## Review discipline

A reviewer should reject a PR when any of these are true:

- files outside the gate allowlist changed;
- required proof was replaced with a placeholder;
- only a subset of required checks ran;
- the PR includes next-gate preparation;
- external failures are misrepresented as local passes;
- the CI gate is red or absent;
- the final task report says complete despite any of the above.
