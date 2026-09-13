# Watch Together — Codex Execution Handoff

This file defines how Codex or any engineer must execute Watch Together work. It is intentionally stricter than the architecture documents.

## Completion rule

A Watch Together task is complete only when the active base-branch gate is satisfied, `pnpm watch:gate` exits `0`, the task branch is pushed, the GitHub `Watch Together Gate` check is green, and no next-gate preparation was added.

If a deterministic check fails, fix it within the active gate and rerun the entire gate. External/manual validation must be reported as `EXTERNAL VALIDATION PENDING`, never converted into a pass.

The active gate is always the **base-branch** `.codex/watch-gate.json`. Normal implementation branches must not edit that gate, the verifier, or the CI workflow.

## Completed deterministic gates

- Gate B — strict Watch Together TypeScript boundary.
- Gate C — shared production HTTP server + feature-flagged realtime transport spike.
- Gate D — progressive MP4 media contract, fingerprint validation, native player, WebVTT probe.
- Gate F — authoritative shared timeline/event types and pure timeline math.
- Gate G — `WatchRoomStore`, clone-safe in-memory adapter, room service, secure IDs, reconnect-before-capacity behavior.

## External/manual validation still pending

- Gate C — Railway + iPhone cellular realtime soak.
- Gate D — owner-supplied private progressive MP4 on the two target devices.
- Gate E — unsynchronized real-device drift calibration.

These remain pending until actually observed.

## Current gate

```text
Gate H — Socket.IO Room Lifecycle
```

Purpose:

> Connect the existing room domain service to the permanent realtime transport without yet implementing playback control semantics.

Gate H must establish only:

- Socket.IO server attached to the existing shared Node HTTP server;
- same-origin defaults, no permissive CORS;
- `watch:join` using stable `clientId` and returning logical `participantId`;
- private `watch:joined` and canonical `watch:snapshot` after join;
- room-wide `watch:participants` updates;
- `watch:state-request` returning the latest snapshot, not replayed history;
- `watch:clock` / `watch:clock-ack` raw timestamp exchange;
- transport disconnect marking the existing participant `connected=false` while preserving its slot;
- explicit `watch:leave` removing the logical slot;
- handler errors converted to `watch:error`;
- production shutdown closing Socket.IO before the deployment probe and HTTP server;
- integration tests including a full-room reconnect that preserves `participantId`.

Identity rule:

```text
clientId      = stable browser/device continuity
participantId = logical room participant
socket.id     = ephemeral transport only
```

Never use `socket.id` as logical participant identity.

## Forbidden in Gate H

Do not add:

- `/api/watch/rooms`;
- play/pause/seek command handling;
- clock offset estimation;
- scheduled starts;
- sync controller/player corrections;
- disconnect-grace timer or couple pause-on-disconnect;
- buffering policy;
- chat/reactions;
- Redis/database persistence;
- UI changes;
- IPTV/live-TV changes.

## Required loop

```bash
git fetch origin main
pnpm watch:gate
```

Fix failures and rerun until green. Then stop before Gate I.
