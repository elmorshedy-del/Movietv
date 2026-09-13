# Watch Together — Codex Execution Handoff

This file defines how Codex or any engineer must execute Watch Together work. It is intentionally stricter than the architecture documents.

## Completion rule

A Watch Together task is **not complete** because code was written, committed, pushed, or because one test passed.

It is complete only when all of the following are true:

1. The task changed only files allowed by the active base-branch gate in `.codex/watch-gate.json`.
2. Every required file/content condition in that gate is satisfied.
3. `pnpm watch:gate` exits with code `0` on the task branch after all changes.
4. The task branch is pushed.
5. The GitHub `Watch Together Gate` check is green for the PR.
6. No next-gate preparation was added.

If any deterministic local check fails, fix the failure and rerun the complete gate command. Do not stop with a completion summary while the gate is red.

If an external/manual validation cannot be performed from the coding environment, report it as `EXTERNAL VALIDATION PENDING`; do not fake a pass. External/manual checks do not excuse deterministic repository-check failures.

## Immutable gate source

The active gate is defined by the copy of:

```text
.codex/watch-gate.json
```

on the **base branch**, not by a modified copy on the task branch.

Do not edit the gate file, verifier, or CI workflow from a normal implementation branch unless the user explicitly assigns gate-governance work.

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

Do not substitute individual commands for the aggregate gate command in final verification.

## Completed deterministic gates

- Gate B — strict Watch Together TypeScript boundary.
- Gate C — shared production HTTP server + feature-flagged realtime transport spike.
- Gate D — progressive MP4 media contract, fingerprint validation, native player, WebVTT probe.
- Gate F — strict shared participant/timeline/event types, future-safe timeline projection, epoch/sequence ordering, asset fencing.

## External/manual gates still pending

Gate E — unsynchronized real-device drift calibration remains:

```text
EXTERNAL VALIDATION PENDING
```

The Gate C Railway+iPhone cellular soak and Gate D owner-supplied private-media two-device validation also remain external/manual. None may be reported as passed until actually observed.

## Current gate

Read `.codex/watch-gate.json` from `origin/main`.

The active gate is:

```text
Gate G — In-Memory Room Store and Room Service
```

Purpose:

> Establish the room-domain seam and correct two-person identity/capacity behavior before transport handlers exist.

Gate G must establish only:

- `WatchRoomStore` interface;
- `StoredWatchRoom` domain shape;
- single-process `InMemoryWatchRoomStore`;
- safe clone boundaries so callers cannot mutate stored state behind the store;
- room creation using the exact movie/media fingerprint and the canonical initial timeline;
- secure random room/participant IDs;
- participant join/rejoin logic;
- reconnect-by-`clientId` **before** enforcing capacity;
- max two logical participant slots;
- processed-command TTL seam for later idempotency;
- deterministic tests for creation, rejoin, capacity, identity preservation, and command TTL behavior.

Forbidden in Gate G:

- HTTP room-creation endpoints;
- Socket.IO handlers;
- socket IDs/disconnect timers;
- clock estimator;
- client sync controller;
- seek barriers;
- buffering-together policy;
- chat/reactions;
- Redis/database adapters;
- UI changes;
- IPTV/live-TV changes.

The store adapter is in-memory because V1 is one Railway process. Business logic must depend only on `WatchRoomStore` so persistence can change later without rewriting the room service.

`updateRoom` must apply its updater atomically inside the single process. The service must not perform a separate capacity read followed by a later write that allows two concurrent joins to bypass the limit.

A room that already has two participant slots must still permit either existing `clientId` to rejoin and preserve its `participantId`.

## Do not prepare future gates

During Gate G do not add:

- Socket.IO lifecycle code;
- `/api/watch/rooms`;
- clock messages;
- scheduled start logic;
- play/pause/seek handlers;
- buffering/reconnect grace orchestration.

Those belong to later gates.

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

Reject a PR when any of these are true:

- files outside the gate allowlist changed;
- required proof was replaced with a placeholder;
- only a subset of required checks ran;
- next-gate work appears;
- external failures are misrepresented as local passes;
- the CI gate is red or absent;
- the final report says complete despite any of the above.
