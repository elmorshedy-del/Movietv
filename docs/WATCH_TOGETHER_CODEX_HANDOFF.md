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

### Gate B — Strict Watch Together Type Boundary

Complete and merged.

### Gate C — Railway Realtime Transport Spike

Deterministic code complete and merged. The actual Railway+iPhone cellular soak remains external/manual.

### Gate D — Progressive MP4 Media Contract and Native Player

Complete and merged.

Established:

- strict progressive-MP4 movie/media contract;
- immutable media fingerprint fields;
- browser metadata-duration validation;
- native `playsInline` HTML video playback;
- local WebVTT track support;
- isolated `/watch-together` media probe route.

Real owner-supplied private-media validation on the two target devices remains external/manual.

## Gate E — external calibration status

Gate E is the unsynchronized real-device calibration experiment.

It remains:

```text
EXTERNAL VALIDATION PENDING
```

This does not block pure sync-core code. It **does** block declaring any drift threshold, correction band, or perceptual target final.

## Current gate

Read `.codex/watch-gate.json` from `origin/main`.

The active gate is:

```text
Gate F — Shared Authoritative Timeline Core
```

Purpose:

> Establish the strict shared protocol and deterministic timeline math that every later room/server/client implementation must consume.

Gate F must establish only:

- participant/room/timeline shared types;
- readiness split (`userArmed`, `mediaReady`);
- playback intent discriminated unions;
- immutable movie/asset fencing (`movieId`, `assetId`, `assetVersion`, `roomEpoch`);
- command identity (`cmdId`) and observed sequence;
- canonical timeline projection;
- future-start clamp (`Math.max(0, serverNow - stampedAtServerMs)`);
- timeline ordering by epoch then sequence;
- unit tests for paused/playing/future timestamps/clamping/order behavior.

Forbidden in Gate F:

- room-store interfaces or in-memory rooms;
- Express/Socket.IO handlers;
- clock-estimator implementation;
- browser player control;
- buffering policy;
- reconnect timers;
- chat/reactions;
- persistence/database work;
- drift thresholds or correction constants;
- IPTV/live-TV changes.

Playback intents must be discriminated unions: a seek has `targetSeconds`; play and pause do not.

Equal `(roomEpoch, seq)` versions are duplicate/stale, not newer.

Participant identity must use `participantId` + `clientId` (with socket identity remaining transport-level later). Do not invent an account `userId`.

## Do not prepare future gates

During Gate F do not add:

- `WatchRoomStore`;
- room creation endpoints;
- Socket.IO room transport;
- NTP/clock sampling;
- client sync controller;
- barriers;
- buffering/reconnect orchestration.

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
