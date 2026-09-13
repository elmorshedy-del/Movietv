# MovieTV Watch Together — V1 Build Blueprint

**Status:** Canonical implementation plan for the first working version  
**Repository:** `elmorshedy-del/Movietv`  
**Audience:** Codex, other AI coding agents, human engineers, reviewers, QA  
**Rule:** Build from this file unless a documented ADR explicitly changes a core decision.

> This plan intentionally focuses implementation detail on V1. Later phases are mapped so V1 does not paint the project into a corner. Do not overbuild future features before the V1 gates pass.

---

# 0. Codex / Engineer Start Here

Before changing code:

1. Read this entire document.
2. Inspect the current repository HEAD. Do not assume file contents from an old commit.
3. Read root `AGENTS.md` and obey existing repository conventions.
4. Run and record the current baseline:
   - `pnpm typecheck`
   - `pnpm test`
   - `pnpm build`
5. Verify the existing live-TV flow still works before Watch Together edits.
6. Implement **only the next unfinished build step** in section 41.
7. Add tests for that step.
8. Re-run typecheck/tests/build.
9. Report exact files changed and exact checks run.
10. If a gate fails, stop there and fix it before continuing.

Do not silently replace this architecture with another framework, language, or synchronization model.

---

# 1. What V1 Must Be

V1 is a real **two-person synchronized movie room**.

A user must be able to:

1. open a movie;
2. create a private Watch Together room;
3. share the room link;
4. have a second person join;
5. both tap **Ready**;
6. start the same movie together;
7. play, pause, and seek together;
8. remain closely synchronized;
9. recover after a temporary disconnect;
10. send basic text chat messages;
11. see whether the other person is connected / ready / buffering.

That is V1. Nothing else may delay it.

---

# 2. Explicit V1 Non-Goals

Do **not** build these yet:

- automated movie ingestion pipeline;
- FFmpeg worker farm;
- MovieTV-generated multi-bitrate ladders;
- R2/Cloudflare Worker media gateway;
- Redis clustering;
- horizontal app scaling;
- voice/video chat;
- reactions;
- saved scenes;
- Movie Night Capsule;
- yearly recap;
- recommendations;
- Surprise Night;
- group rooms larger than 2;
- DRM;
- DASH;
- native apps;
- public room discovery;
- complex roles/moderation.

They are later phases, not missing V1 requirements.

---

# 3. V1 Media Assumption

V1 may use one or more **already prepared, seekable VOD HLS assets**.

Each test movie only needs:

```text
movie id
title
poster
runtime
HLS master manifest URL
```

Conceptual example:

```json
{
  "id": "movie_demo_1",
  "title": "Demo Movie",
  "runtimeSeconds": 7200,
  "posterUrl": "/assets/demo-poster.jpg",
  "manifestUrl": "https://media.example.com/demo/master.m3u8"
}
```

Rules:

- both viewers use the **same exact media asset**;
- manifest must be VOD and seekable;
- do not store movie bytes in PostgreSQL;
- V1 sync code must only depend on the movie contract above, not on how the movie was produced.

This allows later ingestion/storage work to replace the catalog source without rewriting synchronization.

---

# 4. V1 Architecture

```text
                    MovieTV
                       │
           ┌───────────┴───────────┐
           │                       │
        React UI                Express
           │                       │
           │                  Socket.IO
           │                       │
           │              authoritative room state
           │                       │
           └───────────────┬───────┘
                           │
                      movie HLS
                           │
                           ▼
                    browser <video>
```

Initial deployment:

- one MovieTV application process;
- in-memory active room store allowed only for the first local proof;
- business logic must depend on a `WatchRoomStore` interface;
- before staging/public V1, add Redis behind that same interface;
- PostgreSQL is not required for the initial ephemeral room proof.

---

# 5. Core Synchronization Rule

There is exactly **one authoritative room timeline**.

Do not synchronize by forwarding button presses.

Wrong:

```text
A presses Play
→ tell B to play
```

Required:

```text
A requests Play
→ server validates intent
→ server commits new room timeline
→ server broadcasts committed timeline
→ A and B both apply the committed timeline
```

The person who pressed the button also follows the server result.

Architectural invariant:

> Clients send intent. The server commits truth. Every client converges to that truth.

---

# 6. Required Shared Types

Create:

```text
shared/watch/types.ts
```

Use these concepts unless a concrete tested bug requires extension:

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
  userId: string;
  clientId: string;
  displayName: string;
  connected: boolean;
  ready: boolean;
  playbackState: WatchParticipantState;
  lastSeenAtMs: number;
}

export interface WatchMovie {
  id: string;
  title: string;
  runtimeSeconds: number;
  posterUrl?: string | null;
  manifestUrl: string;
}

export interface RoomTimeline {
  roomId: string;
  roomEpoch: number;
  seq: number;
  movieId: string;
  isPlaying: boolean;
  mediaTimeSeconds: number;
  stampedAtServerMs: number;
  playbackRate: number;
  reason:
    | "room-created"
    | "play"
    | "pause"
    | "seek"
    | "buffer-pause"
    | "resume"
    | "reconnect-repair";
}

export interface WatchRoomSnapshot {
  roomId: string;
  mode: "couple";
  movie: WatchMovie;
  timeline: RoomTimeline;
  participants: WatchParticipant[];
  createdAtMs: number;
}
```

Keep these types in `shared/`; do not duplicate client/server versions.

---

# 7. Timeline Projection

Create:

```text
shared/watch/timeline.ts
```

Required pure function:

```ts
export function projectTimeline(
  timeline: RoomTimeline,
  serverNowMs: number,
  runtimeSeconds: number
): number
```

Rules:

```text
if paused:
  projected = mediaTimeSeconds

if playing and serverNowMs < stampedAtServerMs:
  projected = mediaTimeSeconds

if playing and serverNowMs >= stampedAtServerMs:
  projected = mediaTimeSeconds
    + ((serverNowMs - stampedAtServerMs) / 1000) * playbackRate
```

Clamp:

```text
0 <= projected <= runtimeSeconds
```

This module must not import React, Socket.IO, browser APIs, Redis, or Express.

Required unit tests:

- paused projection;
- playing projection;
- future scheduled timestamp;
- clamp at 0;
- clamp at runtime.

---

# 8. Sequence and Epoch Rules

`seq` starts at `1`.

Every authoritative timeline mutation increments it by exactly one.

Example:

```text
room created     seq 1
play             seq 2
pause            seq 3
seek             seq 4
resume           seq 5
```

Client rejects stale timeline when:

```text
incoming.roomEpoch < current.roomEpoch
```

or:

```text
incoming.roomEpoch == current.roomEpoch
AND incoming.seq <= current.seq
```

V1 uses one epoch while the same movie remains loaded.

Future movie replacement/reinitialization may advance epoch and reset sequence.

Do not use wall-clock arrival order as timeline ordering.

---

# 9. Command Identity / Idempotency

Every control intent includes:

```ts
cmdId: string
```

Browser uses:

```ts
crypto.randomUUID()
```

Intent contract:

```ts
interface PlaybackIntent {
  cmdId: string;
  roomId: string;
  movieId: string;
  roomEpoch: number;
  observedSeq: number;
  type: "play" | "pause" | "seek";
  targetSeconds?: number;
}
```

Server keeps recently processed command IDs per room.

V1 retention:

```text
15 minutes
```

If the same `cmdId` arrives twice:

- apply once;
- do not increment sequence twice;
- return or broadcast current canonical state when useful.

Every position-changing intent also carries `movieId` and `roomEpoch` so a delayed old seek cannot affect a newer movie generation.

---

# 10. Fixed V1 Socket Event Names

Create:

```text
shared/watch/events.ts
```

## Client → Server

```text
watch:join
watch:leave
watch:ready
watch:intent
watch:buffering
watch:clock
watch:chat-send
watch:state-request
```

## Server → Client

```text
watch:joined
watch:snapshot
watch:participants
watch:timeline
watch:ready-state
watch:clock-ack
watch:chat-message
watch:error
```

Do not add synonymous `play`, `pause`, `seek`, `room:update`, etc.

All user playback actions use `watch:intent`.

All authoritative playback changes use `watch:timeline`.

---

# 11. Socket Payloads

## `watch:join`

```ts
{
  roomId: string;
  clientId: string;
  displayName: string;
}
```

## `watch:joined`

```ts
{
  roomId: string;
  participantId: string;
}
```

## `watch:snapshot`

```ts
WatchRoomSnapshot
```

## `watch:ready`

```ts
{
  roomId: string;
  ready: boolean;
}
```

## `watch:intent`

```ts
{
  cmdId: string;
  roomId: string;
  movieId: string;
  roomEpoch: number;
  observedSeq: number;
  type: "play" | "pause" | "seek";
  targetSeconds?: number;
}
```

## `watch:buffering`

```ts
{
  roomId: string;
  buffering: boolean;
  currentTimeSeconds: number;
  bufferAheadSeconds: number;
}
```

## `watch:clock`

```ts
{
  t0ClientMs: number;
}
```

## `watch:clock-ack`

```ts
{
  t0ClientMs: number;
  t1ServerReceiveMs: number;
  t2ServerSendMs: number;
}
```

Capture `t1` and `t2` with no unnecessary async work between them.

## `watch:chat-send`

```ts
{
  roomId: string;
  message: string;
}
```

## `watch:chat-message`

```ts
{
  id: string;
  roomId: string;
  senderClientId: string;
  senderDisplayName: string;
  message: string;
  sentAtServerMs: number;
}
```

---

# 12. Required File Layout

Add:

```text
server/watch/
├── movie-catalog.ts
├── room-store.ts
├── in-memory-room-store.ts
├── redis-room-store.ts       # required before staging/public V1
├── room-service.ts
├── timeline-service.ts
├── clock-service.ts
├── chat-service.ts
└── socket.ts
```

Shared:

```text
shared/watch/
├── types.ts
├── events.ts
├── timeline.ts
└── constants.ts
```

Client logic:

```text
client/watch/
├── socket.ts
├── clock.ts
├── sync-controller.ts
├── useWatchRoom.ts
└── player-adapter.ts
```

UI:

```text
client/components/watch/
├── WatchPlayer.tsx
├── WatchControls.tsx
├── ParticipantsBar.tsx
├── ReadyOverlay.tsx
├── ChatPanel.tsx
├── ConnectionBanner.tsx
└── WatchDebugOverlay.tsx
```

Page:

```text
client/pages/WatchTogether.tsx
```

Do not mix Watch Together implementation into `client/components/tv/LivePlayer.tsx`.

Do not casually refactor `server/tv/` or `client/components/tv/`.

---

# 13. Existing MovieTV Integration Points

The current app uses React/Vite/Express with:

```text
client/App.tsx
server/index.ts
server/node-build.ts
shared/
vite.config.ts
vite.config.server.ts
```

Current production startup uses `server/node-build.ts` and `app.listen()`.

Socket.IO needs the underlying HTTP server, so production startup must be refactored to Node `http.createServer(app)` and Socket.IO attached to that server.

Conceptual target:

```ts
const app = createServer();
const httpServer = createHttpServer(app);
attachWatchSocket(httpServer);
httpServer.listen(port);
```

Requirements:

- same origin;
- same public port;
- no separate public Socket.IO port;
- existing REST/API behavior preserved;
- graceful shutdown should close the HTTP/socket server cleanly.

Development must also support real WebSocket connections. If Vite middleware mode cannot reliably host the required socket server, create a documented development server entry rather than changing production architecture to suit Vite.

---

# 14. Room Store Interface

Business logic depends on an interface, never directly on Redis.

Create:

```ts
export interface WatchRoomStore {
  createRoom(room: StoredWatchRoom): Promise<void>;
  getRoom(roomId: string): Promise<StoredWatchRoom | null>;
  updateRoom(
    roomId: string,
    updater: (room: StoredWatchRoom) => StoredWatchRoom
  ): Promise<StoredWatchRoom>;
  deleteRoom(roomId: string): Promise<void>;
  hasProcessedCommand(roomId: string, cmdId: string): Promise<boolean>;
  markProcessedCommand(
    roomId: string,
    cmdId: string,
    ttlSeconds: number
  ): Promise<void>;
}
```

Local proof:

```text
InMemoryWatchRoomStore
```

Staging/production:

```text
RedisWatchRoomStore
```

Do not let React or socket handlers contain persistence implementation details.

---

# 15. Room Creation

Add HTTP endpoint:

```text
POST /api/watch/rooms
```

Input:

```ts
{
  movieId: string;
  displayName: string;
}
```

Output:

```ts
{
  roomId: string;
  invitePath: string;
}
```

Rules:

- room IDs must be cryptographically random / unguessable;
- no incrementing numeric room IDs;
- URL path:

```text
/watch-together/:roomId
```

V1 room policy:

- mode fixed to `couple`;
- maximum 2 active participants;
- both participants may control playback;
- no moderator/host hierarchy in V1.

---

# 16. Movie Catalog Adapter

Create:

```text
server/watch/movie-catalog.ts
```

For V1 it may be a simple typed config of manually prepared HLS movies.

The client must not hardcode movie manifest URLs.

Room snapshot supplies the movie contract.

Later PostgreSQL media metadata must be able to replace this catalog without changing the Watch Together sync service.

---

# 17. Stable Client Identity

Persist:

```text
localStorage["movietv_watch_client_id"]
```

Generate once with:

```ts
crypto.randomUUID()
```

Keep separate concepts:

```text
userId   = person/account identity
clientId = stable browser/device identity
socketId = one transient connection
```

A refresh changes `socketId`, not `clientId`.

Do not use `socket.id` as participant identity.

`clientId` alone is continuity metadata, not authentication.

---

# 18. Exact Join Flow

```text
1. browser opens /watch-together/:roomId
2. load/create stable clientId
3. Socket.IO connects
4. emit watch:join
5. server validates room exists
6. server validates capacity or recognizes reconnecting clientId
7. server binds socket to participant
8. emit watch:joined privately
9. emit watch:snapshot privately
10. broadcast watch:participants
11. client loads movie manifest
12. player enters loading state
13. when playable/seekable, show Ready interaction
14. user taps Ready
15. emit watch:ready { ready:true }
```

Never auto-start merely because a socket connected.

---

# 19. Ready Barrier and Initial Scheduled Start

Start only when:

```text
participant count == 2
AND both connected
AND both ready
```

Initial constant:

```text
START_LEAD_MS = 750
```

When both become ready for the first start:

1. server chooses `startAtServerMs = now + 750`;
2. server commits timeline:

```text
isPlaying = true
mediaTimeSeconds = 0
stampedAtServerMs = startAtServerMs
reason = play
seq += 1
```

3. broadcast `watch:timeline`;
4. clients use synchronized clock estimate to start at the scheduled moment.

Before the future timestamp, `projectTimeline()` must stay at the anchor position rather than project negative/early time.

---

# 20. Clock Synchronization

Create one client clock module that exposes:

```ts
serverNowMs(): number
```

Do not scatter offset math through components.

NTP-style sample:

```text
t0 client send
t1 server receive
t2 server send
t3 client receive
```

Compute:

```text
rtt = (t3 - t0) - (t2 - t1)

offset = ((t1 - t0) + (t2 - t3)) / 2
```

V1 sampling policy:

```text
on join: 8 samples, 150 ms apart
steady state: 1 sample every 2 seconds
visibility restore: 4-sample burst
retain: latest 32 valid samples
estimator: median offset of the 5 lowest-RTT samples from the last 60 seconds
```

Pause ordinary periodic sampling while the page is hidden.

Debug overlay must expose current RTT and estimated offset.

---

# 21. Applying Authoritative Timeline

On `watch:timeline`:

1. reject stale epoch/sequence;
2. store timeline;
3. compute expected media time from `serverNowMs()`;
4. if paused, pause player and correct large position error;
5. if playing, seek if necessary and schedule play at `stampedAtServerMs`;
6. mark timeline sequence as applied.

Applying server state must **not** generate another user intent.

---

# 22. Player Adapter / Feedback-Loop Prevention

Create a player adapter separating:

```text
USER action
SYSTEM correction
```

Use explicit suppression/state, not only time delays.

Concept:

```ts
let systemMutationDepth = 0;

async function runSystemMutation(fn: () => Promise<void> | void) {
  systemMutationDepth++;
  try {
    await fn();
  } finally {
    systemMutationDepth--;
  }
}
```

Native `play`, `pause`, `seeking`, `seeked` events caused by system correction must not create `watch:intent`.

A human UI control should create exactly one intent.

---

# 23. Play Intent

When user presses Play:

Client:

- create `cmdId`;
- emit `watch:intent`;
- do not treat local player state as canonical.

Server:

1. validate room participant;
2. validate movie ID;
3. validate room epoch;
4. dedupe `cmdId`;
5. project current canonical position;
6. create timeline:

```text
isPlaying = true
mediaTimeSeconds = projected current position
stampedAtServerMs = now + CONTROL_LEAD_MS
reason = play
seq += 1
```

Initial:

```text
CONTROL_LEAD_MS = 250
```

7. broadcast `watch:timeline` to everyone, including sender.

Tune only from measurement later.

---

# 24. Pause Intent

Server on Pause:

1. project canonical position at receipt;
2. commit:

```text
isPlaying = false
mediaTimeSeconds = projected position
stampedAtServerMs = server now
reason = pause
seq += 1
```

3. broadcast.

Sender applies the same committed timeline as peer.

---

# 25. Seek Intent / Seek Barrier

While user drags scrubber:

- local preview is allowed;
- do not emit repeated room seeks.

On scrub release:

```text
type = seek
targetSeconds = selected position
```

Server:

1. validate bounds;
2. remember whether canonical timeline was playing;
3. commit paused timeline at target;
4. `seq += 1`;
5. broadcast;
6. clients seek locally and buffer;
7. both report ready;
8. if room was playing before seek, schedule a synchronized resume after both are ready.

Coordination-only temporary field may include:

```ts
resumeAfterBarrier: boolean
```

Do not place temporary barrier mechanics inside the permanent timeline contract unless later evidence requires it.

---

# 26. V1 Drift Controller

V1 intentionally starts with a conservative correction model.

Loop interval:

```text
DRIFT_CHECK_INTERVAL_MS = 500
```

Only while:

- canonical timeline is playing;
- player is not buffering;
- page is active enough to measure reliably.

Compute:

```text
driftMs = (actualPlayerSeconds - expectedRoomSeconds) * 1000
```

Initial behavior:

```text
|drift| < 150 ms
→ do nothing

150 <= |drift| < 750 ms
→ record/observe only in V1

|drift| >= 750 ms for 2 consecutive checks
→ hard seek to expected position
```

Do not build a PID/RLS/predictive rate controller in V1.

Soft fractional-rate correction belongs to V1.1 after baseline measurements exist.

Log each hard correction in debug telemetry.

---

# 27. Couple Buffering Policy

Signature V1 behavior:

> If one participant genuinely stalls, both pause.

Buffering evidence may include:

- media `waiting`;
- media `stalled`;
- no forward playback progress while room expects play;
- relevant HLS error/state.

Debounce:

```text
BUFFERING_DEBOUNCE_MS = 800
```

Do not pause the room for a 100–200 ms hiccup.

If buffering persists:

1. client emits `watch:buffering { buffering:true }`;
2. server marks participant buffering;
3. if room is playing, server commits paused timeline at projected canonical position;
4. reason = `buffer-pause`;
5. broadcast timeline;
6. both pause.

Recovery condition:

```text
player readyState >= HAVE_FUTURE_DATA
AND bufferAheadSeconds >= READY_BUFFER_SECONDS
```

Initial:

```text
READY_BUFFER_SECONDS = 3
```

When both connected participants are no longer buffering and are ready:

1. server schedules resume at `now + 750ms`;
2. commit/broadcast timeline with reason `resume`.

---

# 28. Buffer Ahead Calculation

Use `video.buffered`.

Find the buffered range containing `video.currentTime`.

Return:

```text
rangeEnd - currentTime
```

If current position is not in a buffered range:

```text
0
```

Do not infer buffer seconds merely from network requests.

---

# 29. Disconnect Policy

Initial grace:

```text
DISCONNECT_GRACE_MS = 5000
```

On disconnect:

1. mark socket unavailable;
2. begin 5-second grace timer;
3. if same `clientId` rejoins, cancel timer and bind new socket;
4. send latest snapshot;
5. if grace expires, mark participant disconnected;
6. because V1 is couple mode, pause canonical timeline if currently playing;
7. broadcast participant state.

A refresh should normally recover inside grace without creating a duplicate participant.

---

# 30. Reconnect Recovery

When the same `clientId` returns:

1. bind new socket;
2. send current snapshot;
3. refresh clock samples;
4. ensure correct movie is loaded;
5. apply current canonical timeline;
6. if media interaction was reset by browser, require Ready again only where needed;
7. resume through the normal ready/scheduled-start path.

Do not replay old play/pause/seek history.

Current snapshot is truth.

---

# 31. Basic Chat

V1 chat is deliberately small.

Validation:

```text
trim whitespace
length 1..1000 characters
rate limit 5 messages / 5 seconds / participant
server supplies sender identity
```

Prototype may keep messages only for room lifetime.

Before long-lived production history, persist them separately in PostgreSQL.

Chat may never mutate timeline state.

---

# 32. Watch Page UI

Desktop:

```text
┌──────────────────────────────────────────────┐
│ Movie title                   Invite button  │
├───────────────────────────────┬──────────────┤
│                               │ Participants │
│           VIDEO               │ Chat         │
│                               │              │
├───────────────────────────────┤              │
│ controls / timeline           │              │
└───────────────────────────────┴──────────────┘
```

Mobile:

```text
┌───────────────────────┐
│ Movie title / invite  │
├───────────────────────┤
│                       │
│        VIDEO          │
│                       │
├───────────────────────┤
│ controls              │
├───────────────────────┤
│ You ●     Partner ●   │
├───────────────────────┤
│ Chat bottom sheet     │
└───────────────────────┘
```

Do not permanently shrink iPhone video into a narrow two-column layout.

Use the existing MovieTV visual language rather than introducing a second unrelated design system.

---

# 33. Ready Overlay

Before synchronized participation:

```text
Ready to watch together?

[ I'm Ready ]
```

Show:

```text
You: Ready
Partner: Waiting
```

The Ready tap also supplies the explicit user gesture mobile browsers may require before audible playback.

---

# 34. Participant Status

Normal UI shows only useful human-facing state:

```text
Connected
Ready
Buffering
Reconnecting
Disconnected
```

Do not expose raw sync metrics in normal UI.

---

# 35. Mandatory Debug Overlay

Create:

```text
client/components/watch/WatchDebugOverlay.tsx
```

Enable only with:

```text
?watchDebug=1
```

Display at minimum:

```text
room id
socket connected
client id
epoch
seq
RTT
clock offset
canonical playing state
expected media time
actual media time
drift ms
buffer ahead
participant states
last correction
```

Do not tune synchronization without this instrumentation.

---

# 36. Route Isolation

Add:

```text
/watch-together/:roomId
```

Do not replace or repurpose existing:

```text
/watch/:channelId
```

Existing live TV must remain behaviorally isolated.

---

# 37. Expected Package Additions

V1 expects:

```text
socket.io
socket.io-client
hls.js
```

Before staging Redis adapter:

```text
redis
```

Do **not** introduce for V1:

- Next.js;
- NestJS;
- FastAPI;
- Rust service;
- gRPC;
- Kafka;
- Kubernetes;
- LiveKit.

Those would be architecture drift.

---

# 38. Existing Files Likely to Change

Expected edits:

```text
package.json
server/index.ts
server/node-build.ts
vite.config.ts and/or a dedicated dev server entry
vite.config.server.ts
client/App.tsx
```

Expected additions:

```text
server/watch/
shared/watch/
client/watch/
client/components/watch/
client/pages/WatchTogether.tsx
```

Do not refactor the live-TV subsystem merely to make Watch Together code look uniform.

---

# 39. Open-Source Reference / Reuse Map

## A. Emby Watch Party

Repository:

```text
Oratorian/emby-watchparty
```

License verified during architecture review:

```text
MIT
```

Study especially:

```text
docs/SOCKET_API.md
backend/src/party_manager.py
backend socket/event handling
frontend room/player state code
```

Useful for:

- stable `client_id` distinct from socket ID;
- reconnect lifecycle;
- ready barriers;
- buffering coordination;
- chat;
- participant lifecycle;
- individual stream preference patterns.

Do not bring over:

- Emby auth;
- Emby API client;
- per-user transcoding;
- host lock states;
- late-join voting;
- Emby progress APIs.

If source code is copied or substantially adapted, preserve required MIT attribution.

## B. SyncTV

Repository:

```text
synctv-org/synctv
```

License verified:

```text
MIT
```

Use primarily as an architecture reference for:

- room service boundaries;
- realtime messaging separation;
- explicit clock/config design;
- Redis/Postgres separation;
- future scaling patterns.

Do not port its Rust/gRPC/Kubernetes stack into MovieTV V1.

## C. Mustard Watch Party

Repository:

```text
JonSnow1807/Mustard-Watch-Party
```

Architecture review did **not** find a root LICENSE.

Therefore:

```text
REFERENCE ONLY — DO NOT COPY SOURCE CODE
```

Study:

```text
docs/SYNC_DESIGN.md
docs/FORMAL.md
docs/SCALING.md
docs/AUDIO_TRUTH.md
measurement/test harness material
```

Independently reimplement concepts:

- projected canonical timeline;
- wait-for-authoritative-broadcast;
- NTP-style clock estimation;
- idempotent commands;
- stale media fencing;
- later soft drift correction;
- impairment-test methodology.

## D. Syncplay

Repository:

```text
Syncplay/syncplay
```

License verified:

```text
Apache-2.0
```

Use as reference for:

- latency-aware synchronization;
- mature client/server timing thinking;
- practical correction behavior.

Do not transplant its desktop-player architecture into the browser app.

---

# 40. Third-Party Attribution Rule

If MIT/Apache source code is actually copied or substantially adapted, create/update:

```text
THIRD_PARTY_NOTICES.md
```

Record:

```text
project
repository
commit/tag
license
original source file
MovieTV destination file
what was changed
```

If only an idea is independently reimplemented, document the inspiration in architecture notes; do not falsely describe it as copied code.

---

# 41. Exact V1 Build Order

The engineer/agent must work in this order.

## Step 1 — Protect baseline

Run:

```text
pnpm typecheck
pnpm test
pnpm build
```

Record any pre-existing failures.

Manually verify existing live-TV page/player.

Do not claim baseline passed unless it did.

## Step 2 — Shared sync core

Create:

```text
shared/watch/types.ts
shared/watch/events.ts
shared/watch/constants.ts
shared/watch/timeline.ts
```

Add unit tests for projection, future timestamps, sequence/epoch stale checks.

Gate: tests + typecheck pass.

## Step 3 — Movie catalog

Create `server/watch/movie-catalog.ts`.

Register one valid test HLS movie.

Gate: server can resolve movie by ID through typed adapter.

## Step 4 — Room store and room service

Create `WatchRoomStore`, in-memory adapter, service.

Add `POST /api/watch/rooms`.

Gate: create room, retrieve room, capacity rules tested.

## Step 5 — Real Socket.IO server

Refactor HTTP startup and attach Socket.IO on same server/port.

Implement `watch:join` only first.

Gate: two browser tabs can connect/join same room.

## Step 6 — Stable `clientId`

Persist localStorage ID.

Gate: refresh does not create a third/duplicate participant.

## Step 7 — Snapshot and presence

Implement `watch:snapshot` and `watch:participants`.

Gate: reconnecting client receives current room state.

## Step 8 — Standalone HLS player

Build `WatchPlayer` with hls.js/native HLS path.

Gate: test movie plays, pauses, seeks normally without sync controls.

Do not proceed if media playback itself is unstable.

## Step 9 — Clock synchronization

Implement sampler/estimator and debug output.

Gate: debug overlay displays stable RTT/offset samples.

## Step 10 — Ready barrier

Implement Ready UI and participant readiness.

Gate: room cannot start until both are connected and ready.

## Step 11 — Scheduled initial start

Use `START_LEAD_MS = 750`.

Gate: both clients receive same timeline revision and scheduled anchor.

## Step 12 — Server-authoritative play/pause

Implement `watch:intent` and `watch:timeline` for play/pause.

Gate: sender also waits for authoritative timeline; no echo loops.

## Step 13 — Seek barrier

One seek on scrub release.

Flow:

```text
pause canonical state
→ both seek
→ both ready
→ scheduled resume if previously playing
```

Gate: repeated seeks do not desynchronize room.

## Step 14 — Command idempotency/stale fencing

Implement `cmdId`, `movieId`, `roomEpoch` checks.

Gate: duplicate command increments seq once; old-movie command rejected.

## Step 15 — Basic drift correction

500 ms checks; sustained >=750 ms triggers hard correction.

Gate: injected position error converges and correction is logged.

## Step 16 — Buffering telemetry

Add buffering debounce and `bufferAheadSeconds`.

Gate: server can distinguish stable playback from genuine stall.

## Step 17 — Couple pause-on-buffer

If one stalls >800 ms, pause both; after both have >=3 s buffer, scheduled resume.

Gate: healthy viewer cannot run seconds ahead of stalled partner.

## Step 18 — Disconnect grace/reconnect

5-second grace, stable client recovery, snapshot reconciliation.

Gate: refresh/short drop recovers; long drop pauses couple room.

## Step 19 — Basic chat

Add chat panel and validation/rate limit.

Gate: chat burst does not mutate or delay canonical playback state.

## Step 20 — Redis adapter

Implement `RedisWatchRoomStore` behind same interface.

Required before staging/public V1.

Gate: app process restart with Redis intact preserves active room state as designed.

## Step 21 — Browser test harness

Add automated two-client tests.

Gate: start/pause/seek/reconnect/buffer scenarios are repeatable.

## Step 22 — Real iPhone test

Test Safari on physical iPhone.

Validate:

- Ready interaction;
- inline video;
- start;
- pause/play;
- seek;
- reconnect;
- chat/mobile layout.

## Step 23 — Full-session staging soak

Watch at least one full-length movie with two real devices/networks.

Record defects/debug telemetry.

Only then call V1 complete.

---

# 42. Required Unit Tests

At minimum:

```text
timeline projection while paused
timeline projection while playing
future scheduled timestamp
sequence ordering
epoch ordering
seek clamp
duplicate command
participant rejoin
room capacity = 2
ready barrier
buffer pause
resume barrier
disconnect grace
```

No sync-core change is complete without relevant tests.

---

# 43. Required Integration Scenarios

## A — Join

- create room;
- A joins;
- B joins;
- both visible.

## B — Start

- both ready;
- server schedules start;
- both receive same timeline seq.

## C — Pause

- A pauses;
- both apply same seq;
- canonical position freezes.

## D — Play from B

- B plays;
- both resume from canonical position.

## E — Seek

- A seeks to 600;
- both seek;
- both ready;
- room resumes near 600.

## F — Duplicate

- same intent delivered twice;
- sequence increments once.

## G — Short disconnect

- B disconnects;
- reconnects inside 5s;
- same participant identity retained.

## H — Long disconnect

- B gone >5s;
- canonical room pauses.

## I — Buffering

- B stalls >800ms;
- room pauses;
- both recover/ready;
- scheduled resume occurs.

---

# 44. Browser Test Harness Metrics

Use Playwright after logical tests.

Two browser contexts should expose test-only metrics:

```text
client A currentTime
client B currentTime
canonical expectedTime
pairwise drift
RTT
clock offset
timeline seq
player state
buffer ahead
```

Initial scenarios:

```text
clean localhost
100 ms artificial latency if available
one reconnect
one seek
one forced stall
```

V1 goal is reliable correctness before advanced statistical optimization.

---

# 45. V1 Acceptance Criteria

V1 is complete only when all are true:

1. two users can join one private room;
2. room refuses a third active participant;
3. both must be Ready before initial play;
4. scheduled start works;
5. either person can play/pause;
6. either person can seek;
7. duplicate commands do not double-apply;
8. stale timeline revisions are ignored;
9. same `clientId` survives refresh;
10. reconnect reconciles from current snapshot;
11. prolonged disconnect pauses couple room;
12. genuine buffering pauses both after debounce;
13. both resume together after recovery;
14. basic chat works;
15. existing MovieTV live TV still works;
16. typecheck/tests/build pass;
17. physical iPhone Safari has been tested;
18. one full movie session completes without sync failure.

---

# 46. V1.1 — Tighten Synchronization

Only after V1 measurements exist.

Add:

- fractional playback-rate capability probe;
- gentle soft correction for moderate drift;
- fewer hard seeks;
- improved clock filtering;
- hidden-tab/sleep recovery;
- empirical threshold tuning.

Target to measure, not claim in advance:

```text
normal-condition P95 pairwise drift < 100–150 ms
```

Do not choose final thresholds without measurements.

---

# 47. V1.2 — Real Movie Library / Storage

Replace manual movie catalog with:

```text
PostgreSQL metadata
+
private object storage
+
authenticated media delivery
```

Add durable models for:

- movies;
- media assets;
- audio tracks;
- subtitle tracks;
- manifest/storage keys.

Watch Together remains unchanged because it still consumes the same `WatchMovie` contract.

---

# 48. V2 — Automated Media Ingestion

Add separate worker:

```text
source file
→ ffprobe
→ FFmpeg aligned renditions
→ Shaka Packager / equivalent
→ HLS/CMAF
→ object storage
```

The worker outputs the same HLS manifest contract consumed by V1.

Sync code must not know how media was produced.

---

# 49. V2.1 — Individual Media Preferences

Add local per-viewer:

- quality;
- audio language;
- subtitles.

These are **not room timeline state**.

Two people may use different quality/audio/subtitle tracks while sharing the same movie time.

---

# 50. V3 — Meaningful Product Layer

Add after playback is excellent:

- reactions;
- **Remember This** timestamp markers;
- **Our Movie Memory**;
- individual/shared ratings;
- Movie Night Capsule;
- Surprise Night;
- annual shared movie story later.

These attach to movie/session/timestamp and do not alter synchronization semantics.

---

# 51. V4 — Group Mode

Only after couple mode is excellent.

Add:

```text
mode = group
```

Group policy differs:

- one stalled viewer normally does not pause everyone;
- lagging viewer catches up independently;
- configurable playback permissions;
- larger presence/chat handling.

Do not weaken couple behavior to make group behavior easier.

---

# 52. V5 — Scale / Optional Voice

Only when usage metrics justify it.

Potential additions:

- multiple app replicas;
- Socket.IO Redis Streams adapter;
- stronger atomic room-state mutation;
- operational metrics service;
- LiveKit for optional voice/camera.

Movie delivery remains HLS/CDN, not WebRTC.

---

# 53. Architectural Invariants

Future agents must not casually change these:

```text
1. One authoritative room timeline.
2. Clients send intent; server commits truth.
3. Sender follows server truth too.
4. Reconnect reconciles current state, not old playback events.
5. Stable client identity is separate from socket identity.
6. Same movie asset is the shared timeline reference.
7. Quality/audio/subtitles are local preferences, not room position.
8. Couple mode prioritizes staying together.
9. Existing live-TV subsystem stays isolated.
10. Media delivery is separate from realtime sync/control transport.
```

Changing any of these requires an ADR first.

---

# 54. ADR Requirement

Create:

```text
docs/adr/ADR-XXXX-title.md
```

Template:

```md
# Context
What problem forced reconsideration?

# Existing decision
What does the blueprint currently require?

# Evidence
What test, measurement, limitation, or product need shows it is wrong?

# Alternatives
What options were evaluated?

# New decision
What changes?

# Migration
How is existing code/data moved safely?

# Regression risks
What can break?

# Tests
How will the new decision be validated?
```

Do not change architecture first and document it afterward.

---

# 55. Execution / Reporting Rule for AI Agents

For every implementation step, the agent must report:

```text
step implemented
files added
files modified
tests added
commands run
exact outcomes
known limitations
next recommended step
```

Rules:

- inspect current code before editing;
- do not assume old paths/content;
- do not perform unrelated refactors;
- do not skip a failed gate;
- do not replace selected libraries/frameworks without approval;
- do not claim build/test success unless run;
- do not claim deployment success unless deployment is verified;
- preserve live-TV behavior throughout.

---

# 56. Overall Product Connection

The complete product grows from the same permanent core:

```text
                    Watch Together V1
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   better sync       movie platform     social memory
        │                 │                 │
      V1.1              V1.2/V2             V3
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
                     group mode
                          │
                          V4
                          │
                  scale / voice if needed
                          │
                          V5
```

V1 is not throwaway prototype logic.

Its permanent core is:

```text
movie asset
room
participants
canonical timeline
clock estimate
intent/commit protocol
basic drift correction
couple buffering policy
reconnect
```

Every later feature attaches around that core.

---

# 57. Final Definition

The goal is not to build every imagined feature immediately.

The goal is:

> Build the smallest version that already feels like two people are genuinely watching one movie together.

Once that core is stable, measured, and proven on real devices, extend it one layer at a time without replacing the foundation.