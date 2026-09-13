# MovieTV Watch Together — V1 Audit Reconciliation / Codex Continuation Plan

**Status:** Read this before continuing implementation.  
**Original plan preserved:** `docs/WATCH_TOGETHER_V1_BUILD_BLUEPRINT.md`  
**Canonical architecture:** `docs/WATCH_TOGETHER_TECHNICAL_SPEC.md`  
**Audit incorporated:** `claude/architecture-plan-audit-bofi69` @ `daab46c8e4db4b86f2b57013064e324ee148a5d3`

> This file does **not** delete the original V1 blueprint. It records what changed after the audit, why it changed, what Codex must do retroactively, and the revised order from this point forward. Where this file conflicts with the original blueprint, this file wins.

---

# 1. Current Codex Status

The previous Codex run completed the old Step 1 baseline and reported:

```text
pnpm typecheck  PASS
pnpm test       PASS
pnpm build      PASS
SPA route       PASS
/api/tv/home    502 because external IPTV provider could not be reached
korazero.com    blocked/rejected by Codex outbound environment
working tree    clean
```

## Correct interpretation

The first four results are valid baseline evidence.

The IPTV/KoraZero failure is **not** a Watch Together blocker because:

- movie Watch Together uses a separate VOD media plane;
- Codex did not introduce the failure;
- the same sandbox could not reach the external provider;
- the working tree stayed clean.

**Nothing from old Step 1 needs to be reverted.**

Do not retry or modify IPTV as a prerequisite unless a later local code change causes a reproducible regression in an environment where the provider was otherwise reachable.

---

# 2. Mandatory Retroactive Work Before Old Step 2

Codex stopped before writing the sync core, which is good: the audit changes can be applied before architectural code exists.

Perform the following in order.

## R0 — Read the canonical docs

Read completely:

```text
docs/WATCH_TOGETHER_TECHNICAL_SPEC.md
docs/WATCH_TOGETHER_V1_AUDIT_RECONCILIATION.md
docs/WATCH_TOGETHER_V1_BUILD_BLUEPRINT.md
```

Interpretation rule:

```text
Technical Spec + this Reconciliation
    supersede conflicting old blueprint wording.

Old blueprint
    remains design history and still supplies detail where not superseded.
```

Do not use an uploaded duplicate blueprint as a second source of truth.

## R1 — Add strict Watch Together type checking

This is the first code change now.

Create:

```text
tsconfig.watch.json
```

Requirements:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "noEmit": true
  },
  "include": [
    "shared/watch/**/*.ts",
    "server/watch/**/*.ts",
    "client/watch/**/*.ts",
    "client/components/watch/**/*.tsx",
    "client/pages/WatchTogether.tsx"
  ]
}
```

Wire package scripts so the normal verification path includes both the repo's ordinary typecheck and the strict Watch Together check.

Do **not** globally migrate the whole repo to strict mode as part of this feature.

Gate:

```text
Watch Together protocol code with an omitted required seq/epoch field must fail strict typecheck.
```

After the change run:

```text
pnpm typecheck
pnpm test
pnpm build
```

## R2 — Correct the deployment assumption

Record and implement around:

```text
Watch Together realtime runtime = Railway long-running Node process
Netlify Functions = not the Socket.IO realtime host
```

The old blueprint's `http.createServer(app)` direction remains correct for Railway.

Before production/staging readiness, perform a real Railway socket probe from iPhone cellular for roughly 30 minutes with at least one background/foreground cycle.

If Codex Cloud cannot deploy to Railway:

```text
mark: EXTERNAL VALIDATION PENDING
continue code work
DO NOT claim the gate passed
DO NOT stop the entire project
```

KoraZero reachability is unrelated to this gate.

## R3 — Change the V1 movie/media contract before player work

The old mandatory-HLS contract is superseded.

V1 movie media is:

```text
progressive MP4
HTTP Range
WebVTT subtitles
private/authenticated media delivery
```

Shared types must include at minimum:

```text
assetId
assetVersion
title
durationMs
videoUrl
subtitles[]
fingerprint
optional byteLength
optional etag
```

The room timeline must not know or care whether a future player adapter is progressive MP4 or HLS.

## R4 — One real-media gate exists, but credentials may be external

Before calling the player phase complete, prove on the real target devices:

```text
one owner-supplied compatible movie
→ MP4/remux
→ private media delivery
→ play
→ seek
→ subtitles
```

Required devices:

- actual iPhone Safari;
- the other actual viewing device.

If Codex does not have R2/media credentials:

```text
use a deterministic legal/test MP4 fixture for implementation
mark: REAL MEDIA GATE PENDING
continue code that does not require credentials
never invent secrets
never fake a production pass
```

## R5 — Unsynchronized calibration is a human gate, not a Codex blocker

Before final drift tuning:

1. play the same asset on both real devices;
2. start by countdown;
3. watch about 20 minutes with no sync engine;
4. record ending logical drift;
5. if possible use a flash/blip side-by-side camera test;
6. record whether either viewer perceived a problem.

Until this is done, drift constants remain provisional.

## R6 — No prior sync code needs retroactive repair yet

At the time of this reconciliation, Codex had not started old Step 2 and reported a clean working tree.

Therefore there is currently **nothing to migrate** in:

```text
shared/watch/
server/watch/
client/watch/
```

If a later run has already created those modules, audit them against sections 4–18 below before proceeding.

---

# 3. Revised V1 Runtime Shape

```text
                         MovieTV on Railway
                               │
                    long-running Node process
                               │
                  ┌────────────┴────────────┐
                  │                         │
               Express                  Socket.IO
                  │                         │
                  └────────────┬────────────┘
                               │
                      canonical room timeline
                               │
                      WatchRoomStore interface
                               │
                    InMemory adapter first at N=2

Movie media:
private R2/authenticated edge
        │
        ▼
progressive MP4 + WebVTT
        │
        ▼
native HTMLVideoElement
```

The existing IPTV/KoraZero path remains separate.

---

# 4. Revised Shared Types

Do not create a fake account `userId`.

Use participant/client/socket identity separately.

```ts
export type WatchParticipantState =
  | "joining"
  | "loading"
  | "ready"
  | "playing"
  | "paused"
  | "buffering"
  | "disconnected";

export interface WatchParticipant {
  participantId: string;
  clientId: string;
  displayName: string;
  connected: boolean;
  userArmed: boolean;
  mediaReady: boolean;
  playbackState: WatchParticipantState;
  lastSeenAtMs: number;
}

export interface WatchSubtitleTrack {
  id: string;
  language: string;
  label: string;
  url: string;
  isDefault?: boolean;
}

export interface MediaFingerprint {
  assetId: string;
  assetVersion: string;
  expectedDurationMs: number;
  byteLength?: number;
  etag?: string;
}

export interface WatchMovie {
  id: string;
  title: string;
  posterUrl?: string | null;
  videoUrl: string;
  durationMs: number;
  subtitles: WatchSubtitleTrack[];
  fingerprint: MediaFingerprint;
}
```

Long-term memories later attach to:

```text
pairId + personSlot
```

not to `clientId`.

---

# 5. Projection Fix Required in the First Sync-Core Commit

The old projection function was incomplete for future scheduled starts.

Required behavior:

```ts
const elapsedMs = Math.max(
  0,
  serverNowMs - timeline.stampedAtServerMs
);
```

Then project and clamp to movie duration.

Mandatory test:

```text
future stampedAtServerMs
→ projected position remains exactly at the anchor
→ never moves backward
```

---

# 6. Join Flow — Exact Correct Order

Use:

```text
1. validate room exists
2. resolve incoming clientId against existing participant
3. if existing:
     cancel disconnect grace
     replace socket binding
     preserve participant slot
4. else:
     enforce max-two capacity
     create participant
5. send watch:joined
6. send canonical watch:snapshot
7. broadcast participant state
8. client loads movie
9. client advances userArmed/mediaReady separately
```

Capacity applies only to genuinely new participants.

Required test:

```text
refresh during disconnect grace
→ same participant rejoins
→ no third-participant rejection
```

---

# 7. Ready State — Replace One Boolean

Old `ready` is superseded.

Use:

```text
userArmed
mediaReady
```

`userArmed`:

- human gesture;
- autoplay/user-activation permission;
- sticky for the lifetime of the media element.

`mediaReady`:

- derived player/buffer health;
- changes after seek/stall/reconnect;
- never asks the human to tap Ready again.

Socket payloads must represent these separate semantics.

---

# 8. Barrier Fencing — Required

Every seek/recovery coordination barrier must carry:

```text
barrierId
createdAtSeq
targetSeconds
resumeAfterReady
```

If an explicit later playback intent commits a newer `seq`, invalidate the old barrier.

Required race test:

```text
seek
→ barrier opens
→ partner presses Pause
→ both become mediaReady later
→ room MUST remain paused
```

---

# 9. Clock Estimator — Keep NTP Shape, Add Slew

Keep four timestamps and low-RTT sample filtering.

Add:

- do not step the active offset during playback;
- slew it toward the new estimate;
- initial maximum change around 1 ms/s;
- re-clock on foreground/reconnect before correcting player.

Do not treat a clock-estimator jump as media drift.

---

# 10. Scheduled Control Lead — Adaptive

Old fixed `CONTROL_LEAD_MS = 250` is superseded.

Use a bounded adaptive lead from observed room delay.

Initial bounds:

```text
min 250 ms
max 1200 ms
```

Expose the chosen lead in debug telemetry.

The exact formula may use conservative RTT-derived delay because true one-way delay is not directly known.

---

# 11. Drift Behavior — Provisional Until Real-Device Calibration

Do not chase sub-frame timing noise.

Initial conservative V1 behavior:

```text
|drift| < 400 ms
→ no correction

400 ms – 2 s
→ log/observe in basic V1
→ optional gentle rate correction only after capability/measurement work

> 2 s
→ hard correction / Resync candidate
```

Use `requestVideoFrameCallback()` when available.

These values are provisional, not product truth.

---

# 12. Buffering Hysteresis

Initial stall debounce:

```text
800 ms
```

Repeated stalls within approximately five minutes escalate resume buffer:

```text
1st: 3 s
2nd: 10 s
3rd+: 25 s
```

After repeated incidents, ask the users instead of infinite auto-oscillation.

Potential choices:

- keep pausing together;
- use lower rendition if one exists;
- temporarily watch untethered.

Pause reason must be visible in UI.

---

# 13. Media Fingerprint Gate

After `loadedmetadata`, verify:

- asset version;
- duration against expected duration;
- optional byte length/ETag where available.

Mismatch:

```text
show media-version error
refuse synchronized start
```

Do not sync different cuts/versions silently.

---

# 14. Intent Protection

Keep `cmdId` idempotency.

Also add:

- per-participant intent rate limit;
- room-level redundant-command coalescing/minimum commit guard.

A buggy UI/drift loop must not produce hundreds of committed revisions per second.

---

# 15. Mobile Is Continuous Validation

From the first player step onward handle/test:

- iPhone Safari;
- `playsinline`;
- screen lock/background;
- `visibilitychange`;
- `pagehide`;
- reconnect;
- re-clock on foreground;
- snapshot reconciliation;
- native fullscreen/PiP;
- no user-intent feedback loops from system corrections.

The old "iPhone test near the end" is superseded.

---

# 16. V1 Escape Controls

Before the full-film soak, implement:

## Resync me

Fetch current truth, refresh clock if required, hard-align only the local player.

## Watch untethered

Keep room/presence/chat while disabling automatic timeline coupling for that participant.

Display relative offset and a `Catch up` action.

A bad sync night must still be a usable movie night.

---

# 17. Shared Rewind

Add **Rewind 15 s for both** as a primary control.

Fast path only when both clients report that the target is inside buffered data.

If not, use the full seek/rebuffer barrier.

Do not infer buffered availability on the server without client evidence.

---

# 18. Subtitles

WebVTT subtitles are V1.

They are local per viewer and never part of canonical room time.

---

# 19. Persistence / Redis Change

Do not implement Redis merely because old Step 20 required it.

V1:

```text
WatchRoomStore
→ InMemoryWatchRoomStore
```

This is acceptable for the first two-person trial on one Railway process.

When restart durability or multi-instance scale is actually required, choose the adapter then.

Candidates include:

- Redis;
- SQLite/volume where suitable;
- Cloudflare Durable Objects as a larger future architecture.

No future adapter is pre-selected.

---

# 20. Voice Priority

Voice is no longer V5-only.

Sequence:

```text
core V1 stable
→ V1.5 two-person P2P WebRTC audio experiment
→ then decide whether advanced drift-servo work is worth the complexity
```

Voice does not block initial movie sync.

At N=2 an SFU is not required by architecture; TURN fallback may still be needed.

---

# 21. Memory Identity / Resume

Before durable memory features:

```text
pair key
→ pairId
→ personSlot
```

Do not use browser `clientId` as the permanent memory identity.

Shared resume default:

```text
couple progress
```

Keep memory metadata separate from movie bytes and provide export later.

---

# 22. Audit/Event Ring

Keep a bounded in-memory event/audit ring for each active room.

Record:

```text
seq
reason
initiating participant
media position
pause cause
seek/rewind
buffer incident
```

Primary purpose: debugging.

Later use the same events to auto-generate Movie Memory facts such as repeated rewinds/favorite moments.

---

# 23. Revised Build Order — Replaces Old Section 41

The original Section 41 remains historical reference. Use this order now.

## Gate A — Baseline [DONE]

Prior Codex result:

```text
typecheck PASS
tests PASS
build PASS
SPA PASS
IPTV external provider unavailable
working tree clean
```

No retry needed.

## Gate B — Strict Watch Together Type Boundary [NEXT]

Deliver:

```text
tsconfig.watch.json
package script wiring
strict verification
```

Then run:

```text
pnpm typecheck
pnpm test
pnpm build
```

## Gate C — Deployment / Socket Spike

Code:

- refactor production startup to an HTTP server as required for Socket.IO;
- attach a minimal feature-flagged socket probe;
- prove local connect/reconnect;
- do not touch IPTV internals.

External validation:

- Railway;
- actual iPhone cellular;
- about 30 minutes;
- one background/foreground.

If external validation cannot be performed from Codex, mark pending and continue.

## Gate D — Progressive MP4 Media Contract + Basic Player

Implement:

- revised shared media types;
- native `<video>` player;
- play/pause/seek;
- WebVTT subtitles;
- loadedmetadata duration/fingerprint check.

Use deterministic test media if real R2 credentials are unavailable.

## Gate E — Unsynchronized Real-Device Calibration [HUMAN]

Does not block pure core coding, but blocks final drift tuning.

## Gate F — Shared Sync Core

Create:

```text
shared/watch/types.ts
shared/watch/events.ts
shared/watch/constants.ts
shared/watch/timeline.ts
```

Must include future-stamp clamp and strict types.

## Gate G — Room Store / Service

Create:

```text
WatchRoomStore
InMemoryWatchRoomStore
room-service
```

No Redis requirement.

## Gate H — Socket Room Lifecycle

Implement:

```text
join
leave
snapshot
participants
state request
clock messages
```

Reconnect identity before capacity check.

## Gate I — Clock Estimator

Implement:

- sample burst;
- periodic samples;
- low-RTT filtering;
- slewed active offset;
- foreground re-clock.

## Gate J — userArmed + mediaReady Barrier

Initial shared start with adaptive scheduled lead.

No ambiguous single `ready` boolean.

## Gate K — Authoritative Play/Pause

Flow:

```text
intent
→ validate
→ dedup/rate protect
→ commit seq
→ broadcast
→ sender and peer apply
```

No optimistic local authority.

## Gate L — Seek + Shared Rewind

Implement:

- arbitrary seek barrier;
- `createdAtSeq` fencing;
- invalidation on intervening explicit command;
- 15-second shared rewind;
- buffered fast path only with client evidence.

## Gate M — Basic Sync Correction

Start conservative:

```text
<400 ms ignore
400 ms–2 s observe/log
>2 s hard correction candidate
```

Use rVFC where supported.

Do not build advanced servo before real-device calibration results.

## Gate N — Couple Buffering

Implement:

- 800 ms debounce;
- attributed pause;
- 3/10/25 s resume escalation;
- no endless oscillation.

## Gate O — Disconnect / Background / Reconnect

Implement:

- ~5 s disconnect grace;
- existing-client reconnect before capacity;
- foreground re-clock;
- snapshot reconcile;
- no stale event replay;
- no programmatic-event feedback loops.

## Gate P — Escape Hatch

Implement before soak:

```text
Resync me
Watch untethered
Catch up
```

## Gate Q — Basic Chat

Optional minimal room chat remains independent of playback state.

## Gate R — Debug Overlay + Browser Harness

Debug overlay must include:

```text
seq
epoch
RTT
raw clock estimate
active slewed offset
scheduled lead
expected time
actual/rVFC time
drift
buffer ahead/ranges
participant states
pause cause
active barrier id + createdAtSeq
last correction
```

## Gate S — Full-Film Real-Device Soak

Required:

- actual iPhone;
- actual second device;
- one full film;
- background/screen lock;
- one real network interruption;
- subtitles;
- rewind;
- arbitrary seek;
- reconnect.

Record:

```text
togetherness
visible correction count
hard seeks
buffer pauses
reconnect outcome
battery/data observations
```

## Gate T — V1 Completion

Only after Gate S:

- remove temporary probe behavior;
- re-run live-TV regression smoke;
- distinguish external provider failure from local regression;
- document measured thresholds;
- declare V1 behavior.

---

# 24. Retroactive Tests Newly Required

These were missing or too weak in the original plan and are now mandatory:

```text
future scheduled timestamp never projects backward
strict typing/runtime validation rejects malformed seq/epoch
refresh within disconnect grace does not trip two-person capacity
seek barrier cannot auto-resume after intervening pause
active clock offset is slewed, not stepped
fixed clock-error injection does not create correction oscillation
sustained low throughput does not create infinite pause/resume
media duration/version mismatch blocks synchronized start
intent flood is rate limited/coalesced
background→foreground reconcile emits no fake user intent
```

---

# 25. Original Plan Sections Explicitly Superseded

Treat old wording as historical if it says:

```text
HLS is mandatory V1 movie transport
hls.js is a required new V1 movie dependency
fixed 250 ms control lead is final
one ready boolean is enough
capacity is checked before reconnect identity
~750 ms hard-seek threshold is final truth
Redis is mandatory before staging
iPhone testing belongs near the end
voice only belongs in V5
clientId/localStorage can anchor durable memories
IPTV availability blocks Watch Together
```

Old blueprint concepts that remain valid:

```text
server-authoritative projected timeline
intent/commit/broadcast
sender follows server truth
snapshot reconnect
cmdId idempotency
asset fencing
couple mode
live-TV isolation
debug-first tuning
```

---

# 26. Code Reuse / Licensing After Audit

No change to the reuse policy:

- **Emby Watch Party** — MIT; concepts/code may be adapted with attribution if copied.
- **SyncTV** — MIT; architecture reference.
- **Mustard Watch Party** — reference-only unless license is explicitly verified; do not copy source.
- **Syncplay** — Apache-2.0; protocol/reference material.

The audit does not authorize copying unlicensed code.

---

# 27. Agent Continuation Rule

For every Codex run:

1. inspect current repository HEAD;
2. read the canonical technical spec and this reconciliation;
3. identify the next unfinished **revised gate**;
4. implement only that gate or a clearly bounded substep;
5. add its tests;
6. run typecheck/tests/build;
7. report exact files changed;
8. report exact checks and outcomes;
9. mark human/external gates `PENDING` instead of inventing a pass;
10. do not change the architecture because an external IPTV provider is unreachable;
11. do not silently reintroduce HLS/Redis/Netlify-realtime assumptions from the old plan;
12. if evidence proves a revised choice wrong, document the decision before changing it.

---

# 28. Exact Next Instruction to Codex

At the point this file was written, the next task is:

> **Start Gate B: add the strict Watch Together TypeScript boundary (`tsconfig.watch.json` and package-script wiring), verify it, run typecheck/test/build, and stop to report the result before beginning Gate C. Do not investigate the KoraZero 403/502 as part of this task.**
