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

## Current gate

Read `.codex/watch-gate.json` from `origin/main`.

At the time this handoff was created the active gate is:

```text
Gate B — Strict Watch Together Type Boundary
```

The purpose is not merely to create a second tsconfig. It is to **prove** strict nullability and implicit-any protection are active for Watch Together code.

A valid strict sentinel should contain compile-time probes such as:

```ts
const validNumber: number = 1;
void validNumber;

// If strictNullChecks is accidentally disabled, this directive becomes unused
// and TypeScript must fail the gate.
// @ts-expect-error strictNullChecks must reject undefined as number
const strictNullProbe: number = undefined;
void strictNullProbe;

// If noImplicitAny is accidentally disabled, this directive becomes unused
// and TypeScript must fail the gate.
// @ts-expect-error noImplicitAny must reject an untyped parameter
function implicitAnyProbe(value) {
  return value;
}
void implicitAnyProbe;
```

Use the actual gate manifest as the file allowlist.

## Do not prepare future gates

Examples of prohibited behavior during Gate B:

- creating `server/http-server.ts`;
- changing `server/node-build.ts`;
- adding Socket.IO;
- adding room types;
- adding the movie player;
- adding deployment probe code;
- creating tests for future Gate C runtime work.

If future work seems obviously useful, mention it in the final report only. Do not implement it.

## Final report format

A successful gate report must include:

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

If the gate does not pass, the status is `BLOCKED` or `FAIL`, never `PASS`.

## Review discipline

A reviewer should reject a PR when any of these are true:

- files outside the gate allowlist changed;
- required proof was replaced with a placeholder;
- only a subset of required checks ran;
- the PR includes next-gate preparation;
- external failures are misrepresented as local passes;
- the CI gate is red or absent;
- the final task report says complete despite any of the above.
