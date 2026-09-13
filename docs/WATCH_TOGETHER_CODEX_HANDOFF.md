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

## Completed gates

### Gate B — Strict Watch Together Type Boundary

Complete and merged.

Established:

- strict Watch Together TypeScript project;
- aggregate legacy + strict Watch Together typecheck;
- gate-enforced scope verification;
- green GitHub gate before merge.

### Gate C — Railway Realtime Transport Spike

Deterministic code complete and merged.

Established:

- one shared Node HTTP server in production startup;
- feature-flagged deployment-only native WebSocket probe;
- deterministic connect/reconnect tests;
- shutdown ordering that closes upgraded probe sockets before HTTP shutdown.

Still external/manual:

```text
EXTERNAL VALIDATION PENDING — real Railway + iPhone cellular ~30-minute soak with one background/foreground cycle.
```

The native probe is not the permanent room transport. The canonical room transport remains Socket.IO.

## Current gate

Read `.codex/watch-gate.json` from `origin/main`.

The active gate is:

```text
Gate D — Progressive MP4 Media Contract and Native Player
```

Purpose:

> Prove the simplest V1 movie media contract and browser playback path before building rooms or synchronization.

Gate D must establish:

- a strict shared progressive-MP4 media contract;
- immutable media fingerprint fields (`assetId`, `assetVersion`, expected duration, optional byte length/ETag);
- local WebVTT subtitle metadata;
- a native HTML `<video>` player using `playsInline` and browser controls;
- `loadedmetadata` duration validation before the asset is considered valid;
- an isolated `/watch-together` probe page that accepts media parameters without hardcoding an external movie dependency;
- deterministic unit tests around media validation.

Forbidden in Gate D:

- room state or participant models;
- Socket.IO room events;
- timeline or clock synchronization;
- playback intent protocol;
- chat/reactions;
- Redis/database work;
- R2 secrets/credentials;
- upload/FFmpeg/ingestion automation;
- HLS/DASH/DRM;
- IPTV/live-TV implementation changes.

The probe may accept a media URL and expected duration through query parameters so the eventual private R2 asset can be tested without changing the player architecture.

Real media validation remains external until an owner-supplied compatible movie is delivered through the intended private media path and verified on the two actual viewing devices.

## Do not prepare future gates

During Gate D do not add:

- room/store interfaces;
- authoritative timeline types;
- clock estimator code;
- sync-controller code;
- Socket.IO production room transport;
- buffering-together policy;
- reconnect room logic.

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
