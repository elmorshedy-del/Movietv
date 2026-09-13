# MovieTV Watch Together — Technical Product & Architecture Specification

**Status:** Canonical technical architecture after Claude audit reconciliation  
**Repository:** `elmorshedy-del/Movietv`  
**Audit incorporated:** `claude/architecture-plan-audit-bofi69` @ `daab46c8e4db4b86f2b57013064e324ee148a5d3`  
**Purpose:** Preserve the original design intent, record every material change made after the audit, explain why each change was made, and give future engineers/AI agents one authoritative architecture.

> The original architecture was not discarded. The synchronization core remains intact. Where a decision changed, this document records **Original → Revised → Why** so future agents can understand the design history instead of silently replacing it.

---

# 1. Product Definition

MovieTV Watch Together is a private two-person movie-watching experience inside MovieTV.

Primary experience:

1. One person creates a room for a movie.
2. The second joins from another device/network.
3. Both arm/ready their media player.
4. Both watch the same movie asset.
5. Either person can play, pause, rewind, or seek.
6. The room keeps one authoritative movie timeline.
7. Small divergence is tolerated; large divergence is repaired.
8. If one person genuinely stalls in Couple Mode, both can pause and resume together.
9. Reconnect returns a participant to the current room truth rather than replaying old events.
10. The experience can later accumulate shared memories, ratings, favorite moments, and relationship history.

The product is primarily for **two people**, not a giant public watch-party platform.

---

# 2. Architectural Invariants That Survived the Audit

The audit explicitly validated the most important part of the original design. These remain non-negotiable unless a future ADR/decision entry changes them:

1. **One server-authoritative projected room timeline.**
2. **Clients send intent; the server commits truth.**
3. **The sender also follows the committed broadcast.** No client becomes authoritative merely because it pressed a control.
4. **Reconnect reconciles to the latest snapshot.** Playback state is not reconstructed by replaying old play/pause/seek events.
5. **Stable client identity is separate from socket identity.**
6. **Commands are idempotent.** Duplicate delivery cannot apply a command twice.
7. **Commands are fenced to the current media generation/asset.**
8. **Couple Mode is a first-class product concept.**
9. **Movie Watch Together is separate from existing IPTV/KoraZero live TV.**
10. **Media transport and realtime sync transport are separate systems.**
11. **A room-store interface is the persistence/scaling seam.**
12. **A debug/measurement surface exists before sync thresholds are tuned.**

---

# 3. IPTV Relationship — Clarified

## Original

The first V1 blueprint told Codex to verify the existing live-TV flow before continuing, and to stop when a gate failed.

## Revised

The existing IPTV/KoraZero system is **not a dependency of movie Watch Together**.

```text
MovieTV
├── Live TV / IPTV
│   └── existing KoraZero-backed flow
│
└── Watch Together / Movies
    └── separate VOD media plane
```

IPTV matters only for:

- regression protection;
- reusable infrastructure lessons such as signed-media access;
- an optional future experiment using room/presence/social features on live TV.

## Why

Codex Cloud could not reach KoraZero and reported `/api/tv/home` as 502. That was an external network limitation, not a Watch Together implementation failure.

**Rule:** if IPTV is unreachable because the sandbox/provider cannot be reached, record `EXTERNAL BASELINE LIMITATION` and continue. Only stop for IPTV when a local code change causes a reproducible regression relative to the same environment.

Do not modify `server/tv/` or `client/components/tv/` to solve a Codex outbound-network restriction.

---

# 4. Deployment Runtime — Changed and Now Explicit

## Original

The original technical spec assumed a long-running realtime server but did not name the actual deployment target.

## Revised

**Railway is the canonical V1 Watch Together application runtime.**

```text
Railway
└── long-running Node process
    ├── Express
    ├── Socket.IO
    └── active WatchRoomStore
```

Netlify Functions may remain in the repository for unrelated/history reasons, but they are **not** the Watch Together realtime host.

## Why

Socket.IO requires a long-lived connection model. The audit correctly identified that a serverless-function path cannot be the primary realtime runtime.

## Required external proof

Before calling production realtime ready:

- deploy a minimal socket probe to Railway;
- connect from the real iPhone on cellular;
- keep the session alive about 30 minutes;
- include one background/screen-lock/foreground cycle;
- record disconnect and reconnect behavior.

If Codex lacks Railway access, this becomes `EXTERNAL VALIDATION PENDING`; it does **not** stop code work and must not be falsely marked passed.

---

# 5. V1 Media Plane — Changed from HLS/CMAF-First to Remux-First Progressive MP4

## Original

The original spec proposed a production-grade pipeline:

```text
ffprobe
→ FFmpeg 1080p/720p/480p ladder
→ Shaka Packager
→ HLS/CMAF
→ object storage/CDN
```

That remains a valid future architecture if the product grows.

## Revised V1

For a two-person owner-supplied library, start with:

```text
source movie file
→ ffprobe
→ copy/remux compatible video
→ transcode audio only when required
→ MP4 + faststart
→ WebVTT subtitles
→ private Cloudflare R2
→ authenticated/signed media edge
→ native browser <video>
```

Typical compatible remux concept:

```bash
ffmpeg -i input.mkv \
  -c:v copy \
  -c:a aac -b:a 192k \
  -movflags +faststart \
  output.mp4
```

## Why

For two known viewers, V1 does not need a streaming-company ingestion plane before proving the product. Progressive MP4:

- is first-class on Safari/iPhone;
- seeks via HTTP Range;
- removes Shaka packaging and rendition-alignment work from V1;
- avoids unnecessary ABR behavior interacting with Couple Mode's pause-on-buffer policy;
- lets the product validate real media earlier.

## Escalation back to HLS/CMAF

Use HLS/CMAF later if measurement shows a real need, e.g.:

- source bitrate regularly exceeds a viewer's sustainable connection;
- more viewers are added;
- automatic ABR materially improves reliability;
- DRM/DASH requirements appear;
- progressive delivery proves inadequate on target devices.

The original HLS/CMAF architecture is therefore **preserved as the escalation path**, not deleted.

---

# 6. V1 Movie/Media Contract

Use one immutable media identity per asset revision.

```ts
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

Both viewers must be playing the same asset version.

After `loadedmetadata`, the client verifies at minimum:

- expected asset revision;
- media duration within a documented tolerance;
- optional byte length / ETag if the media edge exposes them.

Mismatch behavior:

```text
show a clear media-version error
refuse synchronized start
```

Never silently synchronize two different edits.

---

# 7. Storage and Media Delivery — Revised Priority

**Preferred V1 movie-byte store: Cloudflare R2.**

Reasons:

- private object storage;
- Range-friendly delivery through a Worker/media edge;
- zero conventional egress charges, important for multi-GB films;
- existing Cloudflare operational experience elsewhere in the user's stack.

Do not host movie bytes on the KoraZero domain or route them through the IPTV provider.

The VOD media token must be scoped to the intended asset/session and live long enough for the movie plus pauses/reconnects. Do **not** reuse short live-HLS token TTLs unchanged.

The memory/archive store must remain separate from movie bytes so memories survive even if media is removed or moved.

---

# 8. Browser Player — Revised for V1

V1 movie playback:

```text
native HTMLVideoElement
progressive MP4
WebVTT subtitle tracks
playsinline
```

`hls.js` is **not required for the V1 movie player**.

If HLS/CMAF is introduced later, use native Safari HLS where appropriate and `hls.js` on MSE browsers.

The existing IPTV HLS player remains separate and should not be refactored into the movie player merely for reuse.

---

# 9. Strict Type-Safety Boundary — New Hard Requirement

## Original

The original plan relied heavily on exact TypeScript protocol types, but the repository's global TypeScript config is not strict.

## Revised

Create a Watch Together-specific strict config before writing sync protocol code.

Suggested `tsconfig.watch.json`:

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

Do not globally migrate the whole legacy repository to strict mode as part of this feature.

## Why

`seq`, `roomEpoch`, discriminated intent types, barrier generations, and snapshots are correctness state. An undefined `seq` must fail validation/typechecking rather than degrade into `NaN` comparison behavior.

---

# 10. Canonical Room Timeline

Use a projectable server-authoritative timeline.

```ts
export interface RoomTimeline {
  roomId: string;
  roomEpoch: number;
  seq: number;
  assetId: string;
  isPlaying: boolean;
  mediaTimeSeconds: number;
  stampedAtServerMs: number;
  playbackRate: number;
  reason: string;
}
```

## Projection — corrected after audit

The original formula missed the future-start clamp.

```ts
export function projectTimeline(
  timeline: RoomTimeline,
  serverNowMs: number,
  durationSeconds: number
): number {
  if (!timeline.isPlaying) {
    return clamp(timeline.mediaTimeSeconds, 0, durationSeconds);
  }

  const elapsedMs = Math.max(
    0,
    serverNowMs - timeline.stampedAtServerMs
  );

  return clamp(
    timeline.mediaTimeSeconds +
      (elapsedMs / 1000) * timeline.playbackRate,
    0,
    durationSeconds
  );
}
```

A future scheduled start therefore stays exactly at the anchor position until the start timestamp arrives.

Required unit test:

```text
future stampedAtServerMs
→ projection remains at anchor
→ never moves backward
```

---

# 11. Sequence, Epoch, and Command Rules

`seq` monotonically increments for every committed timeline mutation.

Clients ignore stale revisions:

```text
lower epoch → stale
same epoch + seq <= current seq → stale
```

Every playback intent carries:

```text
cmdId
roomId
assetId
roomEpoch
observedSeq
intent type
```

Server must provide:

- command idempotency;
- media/epoch fencing;
- participant authorization;
- per-participant intent rate limiting;
- room-level redundant-command coalescing.

A buggy client must not be able to commit unbounded timeline revisions.

---

# 12. Participant Identity — Changed

## Original

The first plan used `userId`, `clientId`, and socket ID even though MovieTV has no actual auth/account source for `userId`.

## Revised V1

Use:

```text
participantId   room-scoped logical participant
clientId        stable browser/device continuity
socketId        ephemeral transport connection
```

V1 participant shape:

```ts
export interface WatchParticipant {
  participantId: string;
  clientId: string;
  displayName: string;
  connected: boolean;
  userArmed: boolean;
  mediaReady: boolean;
  playbackState:
    | "joining"
    | "loading"
    | "ready"
    | "playing"
    | "paused"
    | "buffering"
    | "disconnected";
  lastSeenAtMs: number;
}
```

## Durable memory identity later

Before memories become permanent, introduce:

```text
pairId
personSlot: A | B
recoverable pair key
```

`localStorage.clientId` remains transport continuity only. It must not be the permanent relationship-memory identity.

---

# 13. Join Flow — Corrected

The original ordering checked capacity before resolving reconnect identity, which could make a refresh look like a third participant.

Correct order:

```text
1. validate room
2. resolve clientId against existing participant
3. if existing:
     cancel disconnect grace
     rebind new socket
     preserve participant slot
4. else:
     enforce two-person capacity
     create participant
5. send joined acknowledgement
6. send canonical snapshot
7. broadcast participant state
8. load media
9. advance userArmed/mediaReady separately
```

Add an integration test specifically for:

```text
refresh during 5-second disconnect grace
→ same participant reconnects
→ room does not reject as full
```

---

# 14. Ready State — Split After Audit

## Original

One `ready` boolean represented both user gesture/consent and current media buffering state.

## Revised

Use two separate concepts:

```text
userArmed
mediaReady
```

`userArmed`:

- set by explicit human interaction;
- satisfies autoplay/user-activation requirements;
- remains sticky while that media element exists.

`mediaReady`:

- derived from player/buffer health;
- changes after seek/buffer/reconnect;
- never requires the user to tap Ready again.

This avoids confusing initial consent with routine buffering recovery.

---

# 15. Clock Synchronization — Keep Core, Add Slew

Use an NTP-style four-timestamp exchange:

```text
t0 client send
t1 server receive
t2 server send
t3 client receive
```

Estimate RTT and server offset.

Keep low-RTT samples, but accept that mobile path asymmetry creates an accuracy floor.

**New rule:** do not abruptly replace the active clock offset during playback.

Slew the active offset toward the new estimate at a bounded rate, initially around:

```text
~1 ms of offset change per second
```

This number is provisional and can be tuned.

On reconnect or foreground:

```text
re-clock
→ fetch/reconcile snapshot
→ then correct player
```

Do not let clock-estimate jumps masquerade as media drift.

---

# 16. Scheduled Start / Control Lead — Changed

The old fixed `CONTROL_LEAD_MS = 250` is no longer canonical.

Use a bounded adaptive lead derived from observed room delay.

Initial engineering bounds:

```text
minimum 250 ms
maximum 1200 ms
```

The exact formula may use conservative RTT-derived delay when true one-way delay is unavailable.

The chosen lead must be visible in debug telemetry.

Goal: avoid sending a play timestamp that is already in the past when it reaches the slower phone.

---

# 17. Player Timing Measurement — Improved

Use `requestVideoFrameCallback()` where supported so the sync controller can observe rendered-frame timing rather than only quantized `currentTime`.

Fallback:

- `currentTime`;
- wider tolerance;
- no false claim of frame-level precision.

Real-device validation should include a simple flash/blip test asset recorded side-by-side by a third camera. Browser API drift alone does not include display-pipeline latency.

---

# 18. Drift Policy — Reopened and Made Empirical

## Original

The spec targeted roughly `<100–150 ms P95` and used much tighter correction thresholds.

## Revised

That target is withdrawn as a V1 requirement because it was not empirically calibrated to this two-person product.

Preferred user-facing metric:

> **Togetherness:** percentage of playback time where both are actually watching, neither is stalled, no visible correction fires, and logical drift remains inside the empirically acceptable band.

Provisional defaults until real-device calibration:

```text
|drift| < 400 ms
→ ignore

400 ms – 2 s
→ observe/log in basic V1; optional gentle rate correction later

> 2 s
→ hard correction / Resync candidate
```

These values are **starting defaults, not final truth**.

Before final tuning:

1. run the same movie on both real devices without sync;
2. start via countdown;
3. watch about 20 minutes;
4. record ending logical drift;
5. run side-by-side visible test if possible;
6. record whether either human actually perceived a problem.

A deliberate lag bias may be tested, but is not an invariant yet.

---

# 19. Seeking and Barrier Safety — Corrected

Every barrier must record the canonical sequence at creation.

```ts
export interface ActiveBarrier {
  barrierId: string;
  createdAtSeq: number;
  targetSeconds: number;
  resumeAfterReady: boolean;
}
```

Rule:

```text
if any later explicit playback intent commits a newer seq:
  invalidate the old barrier
```

Required race test:

```text
seek
→ barrier opens
→ partner presses Pause
→ both later become mediaReady
→ old barrier MUST NOT auto-resume
```

## Fast shared rewind

Add a primary **Rewind 15 s for both** control.

If both clients have the target in their reported buffered range:

- commit target;
- seek both;
- resume without heavyweight network rebuffer barrier.

Otherwise use the full barrier.

The server must not assume buffer availability without client evidence.

---

# 20. Couple Buffering Policy — Add Hysteresis

Keep the original core principle:

> In Couple Mode, one person's genuine stall can pause both.

Initial stall debounce:

```text
800 ms
```

Repeated-stall resume buffer escalation within an approximately 5-minute incident window:

```text
1st episode: ~3 s buffered
2nd:         ~10 s
3rd+:        ~25 s
```

After repeated incidents, surface a human choice instead of endlessly oscillating pause/resume:

- keep pausing together;
- switch that viewer to a lower rendition if one exists;
- temporarily watch untethered and catch up.

Pause UI should be attributed:

```text
Paused by you
Paused by partner
Paused — partner's connection
```

Unattributed pauses make the product feel broken.

---

# 21. Disconnect, Background, and Mobile — Moved Into Core Design

iPhone/Safari is a primary environment, not a late QA step.

Required handling from the first player implementation:

- `playsinline`;
- user activation through `userArmed`;
- `visibilitychange`;
- `pagehide`;
- screen lock/background;
- reconnect;
- re-clock on foreground;
- snapshot reconcile before player correction;
- native fullscreen/PiP awareness;
- system-induced changes must not emit user intents.

Couple Mode may proactively pause when a phone is intentionally backgrounded rather than waiting for a mysterious disconnect timeout.

Disconnect grace remains approximately 5 seconds initially.

---

# 22. Escape Hatches — New Requirement

Before full-film soak, ship two recovery controls.

## Resync me

One tap:

```text
fetch latest snapshot
→ refresh clock if needed
→ hard-align local player
```

## Watch untethered

Temporarily preserve:

- room presence;
- chat/voice when available;
- movie identity;

while turning off automatic timeline coupling for that participant.

Show something like:

```text
Partner is ~4 s ahead
[Catch up]
```

A sync-engine bad night must degrade into a usable movie night, not force abandonment.

---

# 23. Subtitles — Moved Into V1

Per-viewer WebVTT subtitles are a V1 feature.

They remain local preferences and never mutate the canonical timeline.

Reason: subtitle language is immediately useful for downloaded films and more important than advanced recommendation features.

---

# 24. Room Store and Persistence — V1 Simplified

## Original

The original architecture anticipated Redis early.

## Revised V1

Use:

```text
WatchRoomStore interface
→ InMemoryWatchRoomStore for first two-person trial
```

This is acceptable while:

- one Railway process runs;
- losing an active room on process restart is acceptable during early trial.

When durable room recovery or multiple instances become necessary, choose an adapter based on actual requirements.

Candidates:

- Redis;
- SQLite/volume where appropriate;
- Cloudflare Durable Objects as a larger architectural alternative.

Durable Objects are **not preselected**; the audit raised them as a strong future option.

---

# 25. Realtime Event Families

The exact V1 event naming can remain compact. Keep one intent channel and one authoritative timeline channel.

Conceptual families:

```text
watch:join
watch:leave
watch:state-request
watch:participants
watch:snapshot

watch:clock
watch:clock-ack

watch:intent
watch:timeline
watch:user-armed
watch:media-ready
watch:media-health
watch:error

watch:chat-send
watch:chat-message
```

Do not create separate peer-authoritative `play`, `pause`, or `seek` truth events.

---

# 26. Intent Protection

Every control command uses `cmdId` and idempotency.

Add two protections not explicit enough in the original plan:

- per-participant command rate limiting;
- room-level minimum commit/coalescing guard for redundant bursts.

A starting guardrail around 100 ms between redundant committed revisions is acceptable, provided real user controls remain responsive.

---

# 27. Voice — Reprioritized, Not a V1 Blocker

## Original

Voice/camera was late and LiveKit/SFU-oriented.

## Revised

After core V1 is working, **V1.5** should test two-person P2P WebRTC audio before large investment in ultra-tight drift servo work.

At exactly two participants:

- one `RTCPeerConnection` is enough;
- room socket can carry signaling;
- TURN fallback may be required;
- LiveKit/SFU is unnecessary unless later chosen for operational simplicity or group mode.

Optional high-value addition:

- movie-audio ducking while partner speech is detected.

Voice remains separate from movie delivery.

---

# 28. Durable Couple Identity and Memory Layer — Changed

The relationship archive must not depend on a browser-local client ID.

Before permanent memory features:

```text
generate recoverable pair secret
→ pairId
→ personSlot A/B
→ persistent memory records
```

Shared resume position is **couple progress** by default.

Memory data must be exportable and stored separately from media bytes.

---

# 29. Memory Generation from the Sync Audit Log — New Connection

Maintain a bounded audit/event ring in the room service for debugging.

Record at least:

```text
committed seq
reason
initiating participant
media position
pause cause
seek/rewind
buffer incident
meaningful reaction later
```

Primary purpose: explain bad nights.

Secondary purpose later: automatically generate memory facts, e.g.:

- "you rewound this scene three times";
- "you both reacted here";
- "this was the most replayed moment."

This reduces the post-movie flow to a short rating/confirmation instead of a long form.

---

# 30. Optional Live-TV Social Experiment — Explicitly Non-Blocking

The audit proposed using existing live TV to ship rooms/presence/reactions early.

Decision:

- useful optional experiment;
- can validate room/presence/social primitives;
- must not delay movie V1;
- must not make movie Watch Together depend on KoraZero;
- must not reuse live-stream timing semantics as movie timeline truth.

---

# 31. Security

Required:

- unguessable private room IDs/invite capabilities;
- no room slot consumed by plain preview-bot HTTP GETs;
- same-origin/security headers preserved unless intentionally changed;
- server-side control authorization;
- chat/message limits;
- private movie bucket;
- short-lived but VOD-appropriate asset/session tokens;
- no secrets in browser code;
- no public movie directory/index;
- memory store separate from media store.

The existing `Referrer-Policy: no-referrer` behavior is load-bearing for room-capability privacy and should not be casually relaxed.

---

# 32. Debug / Observability

The engineering overlay should expose:

```text
room ID
participant/client/socket identity
room epoch
seq
RTT
raw clock estimate
active slewed offset
scheduled control lead
expected canonical media time
actual media time / rVFC time
logical drift
buffer ahead
buffered ranges where available
player state
userArmed
mediaReady
pause cause
active barrier ID
barrier createdAtSeq
last correction
last rejected stale/duplicate command
```

Do not expose these metrics in normal user UI.

---

# 33. Testing — Revised Required Set

Unit/integration tests must include the original logic tests plus the audit-discovered failure modes:

```text
future scheduled timestamp never projects backward
malformed/missing seq is rejected by strict typing/runtime validation
refresh during disconnect grace does not trip room capacity
seek barrier cannot auto-resume after intervening pause
clock estimate changes are slewed rather than stepped
fixed clock-error injection does not create correction oscillation
sustained low-throughput client does not cause endless pause/resume
media duration/version mismatch blocks synchronized start
intent flood is rate-limited/coalesced
background→foreground reconciliation does not emit a user intent
```

Real-device validation must include:

- actual iPhone Safari;
- actual second viewing device;
- cellular/Wi-Fi mix;
- background/screen lock;
- one real network drop;
- subtitles;
- rewind;
- arbitrary seek;
- reconnect;
- full-film soak.

Measure:

- togetherness;
- visible correction count;
- hard seeks;
- buffer pauses;
- reconnect outcome;
- battery/data observations.

Do not claim a drift target is achieved until measured.

---

# 34. Revised Risk Order

The project should validate lethal risks before polishing safe internals:

```text
Gate A — Railway realtime socket survives real phone/network
Gate B — one real movie plays + seeks end-to-end
Gate C — unsynchronized real-device experiment calibrates drift
Gate D — strict TypeScript boundary
Gate E — authoritative sync core
Gate F — mobile/background/reconnect/buffering behavior
Gate G — full-film soak
Gate H — memories/social expansion
```

Codex may implement code while an external human-only gate is pending, but it must label that gate pending and must not claim production readiness.

---

# 35. Decision Log — Original → Revised → Why

| Area | Original | Revised | Why |
|---|---|---|---|
| Realtime host | Unnamed long-running assumption | Railway long-running Node | Actual app deployment + Socket.IO requirement |
| IPTV baseline | Failure could stop plan | External unreachability is non-blocking | Movie system is separate |
| V1 media | HLS/CMAF ladder | Progressive MP4 + Range + VTT | Much simpler for two viewers |
| Storage | R2 candidate | R2 preferred V1 movie store | Egress economics + existing Cloudflare experience |
| V1 player | hls.js/native HLS | native `<video>` MP4 | HLS no longer needed for V1 movie path |
| Type safety | Root TS settings assumed adequate | strict Watch Together tsconfig | Protocol fields are correctness-critical |
| Projection | future stamp could project negative | elapsed clamped at zero | Concrete scheduled-start bug |
| Join capacity | capacity checked before reconnect resolution | resolve clientId first | Prevent refresh being rejected as third viewer |
| Identity | undefined `userId` | participantId/clientId/socketId | No auth system exists |
| Ready | one boolean | userArmed + mediaReady | Different lifetimes/semantics |
| Control lead | fixed 250 ms | adaptive 250–1200 ms | Cellular can exceed fixed lead |
| Clock | direct offset replacement | low-RTT + slew | Prevent phantom drift |
| Drift target | <100–150 ms P95 | empirical togetherness + provisional wider band | Original threshold uncalibrated |
| Seek barrier | auto-resume flag only | barrier fenced by creation seq | Prevent seek→pause race |
| Buffer recovery | fixed 3 s | escalating 3/10/25 s | Prevent oscillation |
| Mobile | near-final test | primary design constraint | iPhone is a real target environment |
| Escape mode | none | Resync + Untethered | Bad sync must degrade gracefully |
| Subtitles | later | V1 | High immediate usefulness |
| Redis | staging requirement | interface + in-memory first | N=2 does not justify early infra |
| Voice | V5/LiveKit | V1.5 P2P experiment | High emotional value at N=2 |
| Memory identity | client-local | pair key / pairId | Archive must survive new phone/browser |
| Live TV social | ignored | optional experiment | Useful validation, but no coupling |

---

# 36. Changes NOT Adopted as Hard Rules

The audit contained strong proposals that remain hypotheses until measured.

Do **not** treat these as immutable architecture:

- exact 150 ms deliberate lag bias;
- exact 400 ms / 2 s thresholds beyond provisional defaults;
- claim that voice makes tight playback sync irrelevant;
- progressive MP4 forever;
- Durable Objects as a pre-decided V2 target;
- live-TV social mode as a mandatory first product step.

The architecture deliberately distinguishes **good audit ideas** from **measured product facts**.

---

# 37. Definition of V1 Success

V1 is successful when:

- two people can join a private room on separate networks;
- both load and verify the same movie revision;
- both can arm/start together;
- either can play/pause;
- shared rewind works;
- arbitrary seek works without barrier races;
- reconnect restores current truth;
- mobile background/foreground recovers coherently;
- a genuine stall can pause the pair without oscillating forever;
- Resync and Untethered escape hatches exist;
- per-viewer subtitles work;
- existing live TV is not regressed by local code;
- one full real-device movie session completes acceptably;
- sync quality is measured rather than assumed.

---

# 38. Core Engineering Principle

> **The room owns the movie timeline. Devices are followers that continuously converge to it.**

And the core product principle remains:

> **In Couple Mode, staying together matters more than maximizing uninterrupted playback — but a failed sync engine must always degrade into a usable movie night.**
