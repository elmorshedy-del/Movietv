# MovieTV Watch Together — Architecture & Plan Audit

**Reviewing:** `MOVIETV_WATCH_TOGETHER_TECHNICAL_SPEC.md` (architecture baseline) and
`docs/WATCH_TOGETHER_V1_BUILD_BLUEPRINT.md` (V1 plan)
**Reviewed against:** `elmorshedy-del/Movietv` @ `8839d07`, and `elmorshedy-del/MorshLive` (KoraZero)
**Stance:** auditor *and* co-architect. Section 8 proposes changes rather than only finding faults.
**Media assumption used here:** downloaded movie files (owner-supplied), **not** the IPTV stream.

---

## 0. Verdict

The **synchronization design is genuinely good** and I would not change its core. Server-authoritative
projected timeline, intent/commit, clock estimation, idempotent commands, stale fencing — that is the
correct model, it is correctly motivated, and it is the part most projects get wrong. Keep it.

Three things are wrong at a level that no amount of careful implementation fixes:

1. **The plan sequences the survivable work first and the project-killing work last.** V1 ends at
   "two people watch a movie together." The movie is assumed into existence in one sentence
   (Blueprint §3). Acquisition, remux, storage, delivery, and cost — the parts that actually decide
   whether this ships — are deferred to V1.2/V2.
2. **Neither document names a deployment target, and the one the repo is configured for cannot run
   this.** `netlify/functions/api.ts` + `netlify.toml` deploy the API as serverless functions.
   Socket.IO cannot live there. The word "Netlify" appears zero times across both documents.
3. **The media architecture is sized for a streaming company, not for two people and a hard drive.**
   The FFmpeg ladder + Shaka Packager + CMAF plane (Spec §6, Blueprint §48) is roughly 20× the work of
   what a downloaded-movie product actually needs, and its central feature (adaptive bitrate)
   *actively fights* the product's central feature (couple pause-on-buffer).

There is also a fourth, quieter problem: **the emotional half of the product — the memory archive,
which is stated to be the signature feature — is anchored to `localStorage`.** It is one cleared
browser away from deletion.

Everything below is organized so you can disagree with any single item without losing the rest.

---

## 1. Ground truth: what the repository actually is

I read the repo rather than trusting the plan's description of it. Several plan assumptions are stale.

| Plan says | Repo actually | Consequence |
|---|---|---|
| "Existing app stack: React 18 + RR6 + TS + Vite + Express 5 + Vitest" | Correct | ✅ |
| Production startup is `server/node-build.ts` calling `app.listen()` (BP §13) | Correct (`server/node-build.ts:32`) | ✅ |
| — (never mentioned) | `netlify/functions/api.ts` wraps the same app in `serverless-http`; `netlify.toml` routes `/api/*` to it | ❌ **Blocker.** See §4 |
| — (never mentioned) | `.env.example` and `.dockerignore` both reference **Railway** as a deploy target | Two deploy targets, plan addresses neither |
| "Package additions: hls.js" (BP §37) | hls.js **already ships**, loaded at runtime from jsDelivr, pinned `1.5.13` (`LivePlayer.tsx:4`) | Duplicate library at two versions |
| Types are "exact" and stale-`seq` rejection is a core invariant | `tsconfig.json:19,22,24` — `strict:false`, `noImplicitAny:false`, `strictNullChecks:false` | ❌ **The protocol's type safety is not enforced.** See §5.1 |
| MovieTV has a movie library to draw from | It has **zero movies**. It is a live IPTV channel browser fed by `korazero.com/api/iptv-lab/catalog` | ❌ See §2.1 |
| "users", `userId` in `WatchParticipant` | **No auth, no accounts, no database.** Only a sidebar UI cookie exists | `userId` is undefined behavior |
| AGENTS.md: "TailwindCSS 3" | `tailwindcss ^4.3.3` | Baseline docs are stale; don't trust them |
| Step 1: "record baseline `pnpm typecheck && test && build`" | `node_modules` absent; no `lint` script exists (CI runs typecheck/test/build only) | Fine, but an agent in a clean sandbox will report a false failure |

**Two copies of the blueprint exist and they differ.** `docs/WATCH_TOGETHER_V1_BUILD_BLUEPRINT.md`
(committed in `8839d07`) and the uploaded `MOVIETV_WATCH_TOGETHER_V1_BUILD_BLUEPRINT.md` share all 57
sections but differ in §13 and the repo copy carries an extra §0. An agent told "build from the
blueprint" reads one; a human reviewing the upload reads the other. **Pick one canonical file.**

**Relevant sibling-repo fact:** MorshLive *is* KoraZero, and MovieTV's live plane is a downstream
consumer of its Cloudflare Worker. That matters here only as available infrastructure — you already
own a Cloudflare account, a deployed Worker, a signed-media-token implementation, and CI for it.
See §4.3 and §8.

---

## 2. Product audit

### 2.1 The product has no content, and the plan does not treat that as the critical path

Blueprint §3 is the load-bearing sentence of the entire project:

> "V1 may use one or more pre-existing HLS-compatible movie assets that have already been prepared manually."

Everything else in 2,143 lines rests on that clause. But with downloaded source files, "prepared
manually" means: acquire → inspect → remux/transcode → extract subtitles → store somewhere with
Range support → serve it authenticated → and pay for the egress. That is the product. The sync engine
is the *feature*; the media pipeline is the *product*.

Sequencing the feature before the product means the likely outcome is a beautiful, well-tested,
measured synchronization engine with nothing to watch on it. For a solo builder spending evenings,
that is the failure mode to design against.

**The good news is that with downloaded files the pipeline is far smaller than the spec thinks.**
See §3.

### 2.2 The memory layer — the stated signature feature — is built on the most fragile primitive available

Spec §33 and §2 both name the shared-memory archive as what makes this product distinct, not the sync.
I agree with that product judgment completely. But:

- There is no account system, and none is planned before V3.
- Identity is `localStorage["movietv_watch_client_id"]` (BP §18), explicitly "not authentication."
- `WatchParticipant.userId` exists in the type with no defined source.

So the ratings, notes, saved scenes, and yearly recap — the things whose *entire value is that they
accumulate over years* — hang off a browser key that dies when she clears site data, switches from
phone to laptop, or gets a new phone. **The most durable-by-intent part of the product sits on the
least durable-by-construction storage in the stack.**

This does not require building auth. See §8.8 for a "pair key" that fixes it in an afternoon.

### 2.3 The sync target is the wrong metric, and it is set far too tight

The spec targets **P95 pairwise drift < 100–150 ms** (Spec §41, BP §46) and treats tighter as better.
I want to challenge this directly, because it drives the thresholds, the servo, the test harness, and
a meaningful fraction of the total build cost.

100 ms is approximately the broadcast lip-sync threshold (ITU-R BT.1359 territory). **That threshold
describes audio and video of one stream arriving at one person's eyes and ears.** It has nothing to
do with two people in two buildings.

What actually degrades a shared viewing experience is:

1. **Spoiler leakage** — she reacts to something he has not seen yet. This requires her to be *ahead*
   by more than the reaction-channel latency.
2. **Visible correction artifacts** — a hard seek, a stutter, an audio click. 100% noticeable.
3. **Uncoordinated stalls** — one person waiting while the other watches on.

Note what is *not* on that list: a steady, symmetric 300 ms offset. Nobody can perceive that, because
there is no shared reference frame between two rooms.

And critically: **the reaction channel is already slower than the video timeline.** A WebRTC voice
path is ~100–200 ms mouth-to-ear; a phone call is 150–300 ms. If you add voice (§8.1 — you should),
the voice latency *dominates* and driving pairwise drift from 300 ms to 80 ms buys nothing observable.
You would be optimizing the small term while the large term is untouched.

**Counter-proposal — "lag-biased sync":**

| | Spec §18 | Blueprint §26 | Proposed |
|---|---|---|---|
| Target | drift ≈ 0 | drift ≈ 0 | **follower ≈ 150 ms *behind* canonical** |
| Ignore band | < 100 ms | < 150 ms | **< 400 ms** |
| Soft (rate) correction | 100–400 ms | V1.1 | **400 ms – 2 s, ≤ ±3 %, slewed** |
| Hard seek | > 500–800 ms | ≥ 750 ms × 2 checks | **> 2 s, or user-requested** |

Rationale: a deliberate negative bias means normal jitter never puts either person *ahead* of the
other's reaction — it converts the failure mode from "spoiler" to "she's reacting to what she just
saw," which is indistinguishable from a normal conversation. Widening the dead zone eliminates
almost all corrections. Raising the hard-seek floor means a *visible* failure is never used to fix an
*invisible* one, which is the trade the current thresholds get backwards.

**Replace the metric too (§8.2): "togetherness" — the fraction of runtime with |drift| < 500 ms, no
one buffering, and no visible correction.** That metric punishes the things people notice and ignores
the things they don't. P95 drift does the opposite.

### 2.4 Chat is the wrong presence medium, and voice is misfiled as V5

Spec §31 and BP §2 defer voice to the last phase, "only when usage proves need." I think this is the
single biggest product misordering in the plan.

Two people watching a movie together do not type. Typing means looking away from the screen, at a
second screen, and using a hand. The product's own stated principle (Spec §49) is *"staying together
matters more than maximizing uninterrupted playback"* — and the feature that most delivers
togetherness is scheduled last.

Also, per §2.3: **voice does not just add value, it reduces the sync requirement.** It is a
sync-budget feature. Deferring it means you spend V1.1 chasing milliseconds that voice would have
made irrelevant.

And the usual objection — "voice needs an SFU, that's LiveKit, that's a whole subsystem" — **is false
at N = 2.** SFUs exist to avoid N² peer connections. With exactly two participants there is exactly
one connection. See §8.1: this is ~150 lines on your existing socket, not a new service.

### 2.5 Mobile is a design constraint, not a test step

BP Step 22 of 23 is "test real iPhone Safari." For a couple, at least one person is on a phone, in
bed, on wifi, with a screen that locks. That is not a validation step; it is the primary environment.
Unhandled today:

- **Backgrounding / screen lock.** `<video>` pauses, timers throttle to ~1/min, the socket dies. On
  resume the client must re-clock and reconcile *before* doing anything — and must not fire an intent.
  The plan mentions visibility only for clock sampling (BP §20).
- **Native fullscreen and PiP take over the element.** Your Ready overlay, your custom controls, and
  your debug overlay all disappear inside iOS's native player chrome. The ready barrier has no UI in
  that state.
- **Battery.** 500 ms drift checks + 2 s clock pings + a socket + HLS for 2 hours. Nobody has measured
  this. If a movie night costs 40 % of her battery, that is a product defect.
- **Cellular data.** A 1080p remux at 8 Mbps is ~7 GB for one film. That is a plan-tier conversation,
  not a technicality.
- **`pagehide` / `visibilitychange` should proactively emit an intent-to-pause**, so a backgrounded
  phone produces a clean attributed pause instead of a mystery 5-second-grace pause.

### 2.6 There is no escape hatch

The most important feature in a two-person sync product is the ability to **stop syncing**. Sync
engines fail; the product must degrade into a working video player, not a broken one. Missing:

- a **"resync me"** button (one tap, hard-seek to canonical, no ceremony);
- a **"watch untethered"** toggle that keeps chat/voice/presence and drops the timeline coupling,
  showing a soft "Sara is 4 s ahead — [catch up]" indicator instead.

Without these, one bad night in the sync engine is one abandoned movie night. See §8.7.

### 2.7 Seeking is the most common interaction and the plan makes it the heaviest

"Wait, what did he say?" is the highest-frequency action in couple viewing. BP §25 routes every seek
through pause → seek → buffer → both-ready → scheduled resume. That is realistically 1.5–3 s of
ceremony for a 10-second rewind of content that is **already in the buffer.**

**Fix: a fast path for small seeks.** If the target is inside both clients' buffered range, commit the
new timeline immediately with no barrier and let drift correction absorb the rest. Reserve the full
barrier for long seeks that require a network fetch. Then make **"rewind 15 s for both"** a large,
obvious button (§8.5) — it is more valuable than the scrubber.

### 2.8 Missing product surface: deciding what to watch, and resuming it

Choosing the film is 30 % of movie night and 100 % of the friction. The spec jumps straight to
"Surprise Night" (§33.5) and an ML-adjacent pair recommender (§33.6) while the mundane version — a
shared shortlist with a veto — is absent. So is **shared resume position**, which the spec raises as
open question #14 and never decides. For a couple watching a film across two nights, shared resume is
worth more than the entire yearly recap. See §8.10.

### 2.9 Rights and hosting (stated once, factually)

Downloaded commercial films, stored on your infrastructure and streamed to a second person, is
distribution rather than personal use in most jurisdictions. Spec §44 waves at this in one sentence.
I am not going to relitigate your decision — but it has **architectural consequences you should take
either way**, and they are cheap:

- private bucket, no public index, no directory listing, no search-engine-visible pages;
- invite-only rooms with unguessable IDs (already planned);
- **do not host it on `korazero.com`** or any domain tied to something you care about;
- assume a host can act on a notice and remove the media without warning;
- **keep the memory archive in a separate store from the media, with an export path.** Ratings, notes,
  markers, and scene bookmarks have no rights problem at all. If the films disappear, the relationship
  archive should survive untouched. This is good architecture regardless of your risk view.

---

## 3. Media architecture — the largest available simplification

### 3.1 The spec's pipeline is the wrong shape for downloaded files

Spec §6 / BP §48 specify: ffprobe → FFmpeg ladder (1080p/720p/480p H.264) → Shaka Packager → aligned
CMAF/HLS → object storage → validation. Concretely, for a two-person product this means:

- **A full 1080p H.264 re-encode is roughly 30–90 minutes of CPU per rendition, per film — × 3.**
  On what machine? Not Netlify, not a hobby dyno. This implies a home box or a rented worker: an
  entire ops surface the plan never budgets for.
- **Adaptive bitrate's value is adapting to unknown networks at scale.** You have two known networks
  and two known devices. If her wifi cannot hold 1080p, you pick 720p once — permanently, per person.
- **ABR actively fights couple mode.** A mid-movie level switch flushes the buffer and can rebuffer.
  In couple mode that trips the buffering barrier and pauses *both* people. **The spec's adaptive
  quality feature will trigger the spec's pause-both policy.** That contradiction is not noted anywhere.
- **Segment alignment (Spec §6.7) is a problem created entirely by the ladder.** Delete the ladder and
  the problem disappears.

### 3.2 Counter-proposal: remux-first, one rendition, progressive MP4

For each downloaded film, one job:

```bash
# ~1–3 minutes for a 2h film. Video is copied, not re-encoded.
ffmpeg -i in.mkv -c:v copy -c:a aac -b:a 192k -movflags +faststart out.mp4
ffmpeg -i in.mkv -map 0:s:0 -c:s webvtt subs.en.vtt      # per subtitle track
ffmpeg -i in.mkv -ss 00:04:00 -frames:v 1 poster.jpg
```

- `-c:v copy` — no video encode. Minutes, not hours.
- AC3/EAC3/DTS → AAC. Audio-only encode; fast and universally playable.
- `+faststart` moves the `moov` atom to the front → instant start and **seeking via HTTP Range**.
- Output per film: one `.mp4`, N `.vtt`, one poster. **A 40-line shell script replaces the entire
  ingestion plane, the packager, and the encode-worker architecture.**

Then serve it as `<video src="…mp4">`. **No hls.js, no MSE, no manifest, no packager.** Seeking is a
Range request. Safari and iOS treat this as first-class. This deletes an entire subsystem from V1 *and*
removes the hls.js version conflict noted in §1.

**Where it breaks, and what to do:**

| Case | Handling |
|---|---|
| H.265/HEVC video in the source | Plays in Safari and Chrome (hw), not Firefox. If you both use Safari/Chrome, ship it. Otherwise `-c:v libx264` for that one film. |
| Source bitrate exceeds a connection (a 1080p rip can be 8–15 Mbps) | **The one real reason to transcode.** Answer is not a ladder: produce one extra 720p ≈ 2.5 Mbps file, selected manually, per person. |
| Different people on different renditions | **Works for free.** Both files have identical duration and timeline, so the canonical timeline is valid across them — the same property Spec §6.7 builds keyframe alignment to achieve. |

Escalate to HLS/CMAF only if you ever have real ABR need or more than a handful of viewers. Not before.

### 3.3 Storage and egress: the number that should drive the vendor choice

A 2 h 1080p remux is roughly 4–8 GB. Two viewers streaming it is **8–16 GB of egress per movie night.**

| Option | Egress | Practical result |
|---|---|---|
| Netlify / Vercel bandwidth | ~$0.09/GB after included tier; Netlify includes 100 GB/mo | **≈ 7 movie nights/month**, then ~$1 per night |
| S3 | ~$0.09/GB | ~$0.70–1.45 per movie night, forever |
| **Cloudflare R2** | **$0** | ~$0.015/GB-month storage. **20 films × 6 GB = 120 GB ≈ $1.80/month, unlimited watching.** |

Spec §7.2 calls R2 "a strong candidate" without giving the reason. **The reason is zero egress, and
for this product it is decisive** — it is the difference between a per-night marginal cost and a
rounding error. You also already have the Cloudflare account, domain, Worker, and CI (MorshLive).

R2 supports Range natively through the Workers binding (`env.BUCKET.get(key, { range })`, returning
proper 206s), so **progressive MP4 + R2 + an ~80-line signed-token Worker is the complete media plane.**
Compare with the spec's V2. This is the single largest win available in the whole review.

### 3.4 One lesson to take from the existing IPTV edge — and one not to

You already have a signed media proxy in MorshLive (`backend/adapters/xtream.js`). Reuse its *shape*
(HMAC token → private upstream, Range-aware). **Do not reuse its TTL.**

`TOKEN_TTL_SECONDS = 30 * 60`, and `rewriteManifest()` mints a token per segment URL *at manifest fetch
time*. For **live** HLS that is self-refreshing — the client re-fetches a rolling manifest constantly.
For a **2-hour VOD**, every segment token is minted at t=0 and expires at minute 30. Both viewers would
lose the film at the same instant — which couple mode would then read as a simultaneous mutual stall
and pause the room, permanently.

For VOD: scope the token to `(asset, person, room)` with a TTL ≥ runtime + slack (e.g. 6 h), or make it
refreshable mid-playback. This is a small note, but it matters precisely because that proxy is the
nearest existing template and an agent will reach for it.

---

## 4. Deployment and runtime — the structural hole

### 4.1 The plan has no deployment target

Searching both documents for `netlify`, `vercel`, `railway`, `serverless`, `lambda`: **zero hits.**
Meanwhile the repo ships `netlify/functions/api.ts` and a `netlify.toml` routing `/api/*` to it, and
`.env.example` / `.dockerignore` both reference Railway.

**Socket.IO cannot run on Netlify Functions.** No persistent connections, no shared memory, a new
invocation per request. If Netlify is production, the plan is undeployable exactly as written.

The trap is the timing: **dev (Vite middleware) works, and local prod (`node dist/server/node-build.mjs`)
works.** You discover the failure only on the real host, after Blueprint Steps 1–5 are complete and the
whole sync engine is designed around a stateful process. BP §13's "refactor to `http.createServer(app)`"
is correct advice *for a long-lived container* and silently assumes one without ever saying so.

**This should be Step 0 of the plan**, ahead of shared types.

### 4.2 Recommended: prove the socket before building on it

Before any sync code: deploy the current app plus a bare WebSocket that echoes a server timestamp, to
the *real* host. Connect from the actual iPhone on cellular. Hold it for 30 minutes with the screen
locking. Log RTT, disconnects, and reconnect behaviour.

If a socket cannot survive 30 minutes from a phone on your chosen host, nothing downstream matters.
That is the real first gate, and it costs an evening.

### 4.3 The runtime decision, with a strong dark-horse candidate

| Option | Fit | Notes |
|---|---|---|
| **Railway / Fly single container** | **Best for V1** | Long-lived Node, Socket.IO as planned, in-memory store genuinely fine at N=2. Least change from the plan. `.env.example` suggests you already lean here. |
| Netlify Functions | ❌ | Cannot host the socket. Keep it for the static SPA only, or drop it. |
| **Cloudflare Durable Objects** | **Best long-term** | See below. |

**Durable Objects deserve serious consideration and neither document mentions them.**

A Durable Object is a single-threaded, globally-addressable, stateful actor with a WebSocket
hibernation API. It is, almost literally, the thing Spec §10 describes: *one authoritative room
timeline that everything converges to.* One DO per room.

What that collapses:

- **Redis disappears.** `state.storage` is a transactional per-object KV — that *is* the room snapshot,
  durably, with no extra infrastructure. Blueprint Step 20 (the Redis gate before staging) is deleted.
- **Spec §39 horizontal scaling becomes a no-op forever.** No sticky sessions, no Socket.IO adapter, no
  multi-node room-ownership problem. Those sections stop being future work and start being non-problems.
- **Spec §38.5 server-restart recovery mostly disappears**, and with it much of the motivation for the
  `roomEpoch` machinery.
- **WebSocket hibernation** means an idle room costs approximately nothing.
- **R2 lives in the same account**, served by the same Worker — one media plane, one auth model.
- Cost: Workers Paid, $5/month, covers all of it. You already have the account and the CI.

Honest trade-offs:

- **Socket.IO does not run on Workers.** You would use raw WebSockets. For this protocol that is fine —
  8 client→server and 8 server→client events, no rooms/adapters/namespaces needed. You lose Socket.IO's
  automatic reconnect and long-polling fallback; you are writing reconnect logic anyway (BP §30), and
  long-polling is useless for this workload.
- **A DO is pinned to one region**, so one of you may see 100–200 ms RTT. That is mostly harmless
  because the protocol is *clock-offset* based, not RTT based — but see §5.2 on asymmetric paths.
- Local development is a different story (`wrangler dev` rather than Vite middleware).

**My recommendation:** ship V1 on a Railway/Fly container (minimum deviation from the plan, fastest to
a working movie night), and write the `WatchRoomStore` interface — which the plan already correctly
identifies as the key seam (BP §14) — so that a DO migration is an adapter swap. Then treat DO as the
V2 target rather than Redis. **Redis is the wrong first implementation of the right interface:** at one
to two concurrent rooms it buys nothing except surviving an app restart, which SQLite or an atomically
renamed JSON file gives you for a fraction of the operational cost.

---

## 5. Sync protocol — specific defects

These are concrete. Each will produce a real bug.

### 5.1 `strict: false` makes the protocol's type safety decorative — **highest severity**

`tsconfig.json:19,22,24` disables `strict`, `strictNullChecks`, and `noImplicitAny` repo-wide. The
plan's entire premise is exact types: a discriminated union of intents, nullable timeline fields, and
epoch/`seq` comparisons that decide whether to apply or discard authoritative state.

Under this configuration, an `undefined` `seq` silently produces `NaN` comparisons. `NaN <= x` is
`false` — so **`incoming.seq <= current.seq` returns `false` and the stale timeline is applied.** The
one invariant the plan calls non-negotiable (BP §53.1) fails silently, with no type error and no
runtime error.

**Fix, cheapest possible:** a second tsconfig with `strict: true` covering `shared/watch/**` and
`server/watch/**`, wired into `pnpm typecheck`. Do this before writing a line of the sync core.

### 5.2 Scheduled start contradicts the projection function — **spec bug**

BP §19 sets `stampedAtServerMs = startAtServerMs` (a *future* time) with `isPlaying = true`, then adds
"before `stampedAtServerMs`, expected position remains `mediaTimeSeconds`." But BP §7 defines
`projectTimeline` as a pure function with no such clause, and instructs "do not invent additional
timeline fields."

As literally specified, `projectTimeline` returns a **negatively-advancing position** before the start
time, because `(now − future)` is negative. So where does the special rule live? If inside
`projectTimeline`, §7 is wrong. If in the client, the server and client now disagree about the
canonical position — which destroys the "one projection function" premise the whole design rests on.

**Fix:** put the clamp inside the pure function and say so explicitly:
`elapsed = max(0, serverNowMs − stampedAtServerMs)`. Add a unit test for a future stamp.

### 5.3 The clock estimator is biased on asymmetric paths, and re-estimation creates phantom drift

BP §20 uses `offset = ((t1−t0) + (t2−t3)) / 2`, which assumes symmetric latency. Mobile networks are
famously asymmetric — LTE uplink is routinely 2–5× slower than downlink. The min-RTT filter reduces
variance but does **not** remove the bias.

Consequence: **a phone on cellular can carry a systematic 30–80 ms offset error that no amount of drift
correction can ever detect,** because it is baked into that client's definition of "now." This is the
accuracy floor of the entire system and neither document names it.

Two mitigations, both important:

1. **Accept the constant.** A stable offset error is harmless — both parties are consistently offset,
   and there is no shared reference frame to reveal it. This is another argument for the wider dead
   zone in §2.3.
2. **Do not step the offset mid-movie.** A jumpy estimate turns into *phantom* drift and triggers real
   corrections for a measurement artifact. **Slew the offset — cap the rate of change at roughly 1 ms
   per second** — instead of replacing it on each new median. Not mentioned anywhere; this is one of
   the highest-value additions in this document.

### 5.4 `video.currentTime` is not a precise clock — use `requestVideoFrameCallback`

`currentTime` updates on frame boundaries (~41.7 ms at 24 fps) and browsers quantize it further.
Sampling it against `Date.now()` yields **±20–40 ms of pure quantization noise before any real drift
exists.** The spec's 100 ms ignore band is barely above its own noise floor — it will chase noise.

**`video.requestVideoFrameCallback()`** (Chrome, Safari; not Firefox) provides `mediaTime` and
`expectedDisplayTime` — a frame-accurate pairing of media clock to wall clock, which is *exactly* the
measurement this system needs. Neither document mentions it. Use rVFC where available and fall back to
`currentTime` with a widened dead zone where it is not.

Related: **two devices reporting identical `currentTime` can still be visibly out of sync**, because
render-pipeline latency differs by device by 50–150 ms. The Playwright harness in BP §44 measures
`currentTime` and therefore cannot see this at all. See §8.11 for a zero-code measurement that can.

### 5.5 The seek barrier can be overridden by an intervening pause — **race**

BP §25: a seek commits a paused timeline at the target, sets `resumeAfterBarrier: true` in coordination
state (deliberately outside the canonical timeline), and resumes when both report ready.

Race: A seeks to 600 → barrier opens with `resumeAfterBarrier = true` → **before both are ready, B
presses Pause** → server commits a pause (`seq+1`) → both then become ready → **the barrier fires a
resume and overrides B's explicit pause.** The room starts playing against an explicit user command.

**Fix:** barriers must record the `seq` at which they were created and be **voided by any intervening
committed intent.** Add this to the required test list — it is not currently covered.

### 5.6 `ready` is one boolean carrying three different meanings

The same flag means "I tapped Ready to start," "I have buffered enough after a seek," and "I have
recovered from a stall." These have different lifetimes and different reset rules, which is why BP §30
step 6 has to hedge: "participant taps Ready again only if browser media interaction requires it or
player was fully recreated."

**Fix — split it:**

- `userArmed` — a one-time gesture-consent bit per media element. Sticky. Satisfies iOS autoplay
  policy. Never needs re-tapping unless the element is recreated.
- `mediaReady` — a continuous, derived boolean from buffer health. Never involves the user.

This removes the ambiguity *and* directly fixes the UX complaint in §2.7: seeks stop feeling like they
require permission.

### 5.7 The buffering barrier has no hysteresis and will oscillate

BP §27: one person stalls → pause both → resume when both have ≥ 3 s buffered.

Failure mode: her connection sustains ~0.9× realtime. She buffers 3 s, resumes, drains it, stalls again
~10 s later, pauses both, buffers 3 s, resumes… **A pause/resume oscillation every ten seconds for the
rest of the film.** That is materially worse than either watching separately or simply letting her lag.
There is no hysteresis, no escalation, and no give-up path.

**Fix, two parts:**

1. **Escalating resume buffer.** 3 s → 10 s → 25 s on repeated stalls within a window. Stop trying to
   resume quickly when the evidence says the connection cannot sustain it.
2. **After N stalls in a window, ask the humans.** "Sara's connection is struggling —
   [switch her to 720p] / [keep pausing together] / [let her catch up]." A product answer beats an
   algorithm here, and it is honest about what is happening.

### 5.8 Join-flow ordering makes a refresh look like a third participant

BP §17 lists step 6 "validate participant count < 2" **before** step 7 "adds/reconnects participant."
BP §29 allows a 5-second disconnect grace during which the old participant still occupies a slot.

So: she refreshes → her old entry is still within grace → the rejoin hits the capacity check → **her own
reconnect is rejected as a third participant.** As written this is a bug.

**Fix:** resolve `clientId` to an existing participant *first*; only apply the capacity check to
genuinely new identities. Reorder the documented flow, and add a test (the plan tests "participant
rejoin" and "room capacity = 2" separately, but never their interaction).

### 5.9 `CONTROL_LEAD_MS = 250` is too short for a phone on cellular

BP §23 schedules play at `now + 250 ms`. For that to work, the intent must reach the server, be
committed, be broadcast, arrive at the *slower* client, and be scheduled — all inside 250 ms. A phone on
cellular with 150 ms one-way easily exceeds that. The scheduled moment is then **already in the past on
arrival**, and that client hard-jumps instead of starting smoothly. Every play, all night, for whichever
person has the worse connection.

**Fix:** make the lead adaptive from measured RTT:
`lead = clamp(250, 2 × worst_observed_one_way + 100, 1200)`. The server knows every participant's RTT
already — it is running the clock protocol.

### 5.10 No rate limiting on `watch:intent`

Chat is rate limited (BP §31, 5 per 5 s). Intents are not. A buggy client loop or a stuck key can commit
hundreds of timeline revisions per second, each broadcast to everyone.

**Fix:** coalesce server-side — a minimum interval (~100 ms) between committed revisions per room — plus
a per-participant rate limit. Cheap, and it also protects against a misbehaving drift controller.

### 5.11 Nothing verifies both clients loaded the *same* media

A canonical timeline is only meaningful if both people are playing identical media. With downloaded
files this is a live risk: re-encode or replace an asset and one client may hold a cached older version
with a different duration or a different intro offset. The result is silent, permanent
"synchronization" to the wrong scene.

`assetId` fencing (Spec §14) is *server-side identity*, not *client-observed media identity*.

**Fix:** include a media fingerprint (duration to the millisecond, plus byte length or ETag) in the
snapshot; each client verifies its loaded media against it and refuses to sync — loudly — on mismatch.

### 5.12 The invite URL is a bearer capability and will be crawled

Room ID as a 128-bit URL secret is the right call for this product. Two notes:

- `Referrer-Policy: no-referrer` is already set globally (`server/index.ts:18`), which correctly
  prevents the room ID leaking to jsDelivr, poster hosts, and fonts. **This is accidentally right —
  document it as load-bearing so nobody relaxes it.**
- When she opens the link in WhatsApp/iMessage, the platform's crawler fetches it for a preview. Ensure
  a bot GET **cannot consume a participant slot** (it will not open a socket, but the capacity logic
  should be socket-based, not request-based). Also accept that the room ID is thereby known to a third
  party — for an invite-only room with a short lifetime that is tolerable, but if it bothers you, make
  the shared link a one-time code exchanged for the real room ID.

---

## 6. Plan and sequencing audit

### 6.1 Risk ordering is inverted

Ranking what can actually kill this project:

| Risk | Plan position |
|---|---|
| 1. No movies to watch (acquire → remux → store → serve → pay) | V1.2 / V2 — **after** everything |
| 2. Cannot deploy WebSockets to your actual host | **Never mentioned** |
| 3. Her phone cannot hold a session / burns battery / iOS breaks it | Step 22 of 23 |
| 4. Sync feels bad even when it technically works | Step 15, with unvalidated thresholds |
| 5. Rights / hosting takedown | One sentence (Spec §44) |

And what is laborious-but-safe: shared types, room store, chat, debug overlay, idempotency —
**Steps 2–19.** The plan opens with the safe work and closes with the lethal work. Spike the risks first.

### 6.2 Proposed re-ordering

Insert three gates before the plan's Step 2, then keep most of the existing order.

- **Step 0 — Deployment spike.** Per §4.2. Real host, real phone, real cellular, 30 minutes, screen
  locking. *Gate: a socket survives.*
- **Step 0b — One movie, end to end.** One downloaded file → remux → R2 → signed-token Worker → plays
  and **seeks** in Safari on the actual iPhone and on the desktop. *Gate: one film is watchable and
  seekable on both devices, without any sync code at all.*
- **Step 0c — The unsynchronized experiment.** Both of you open that film on your own devices and count
  down "3–2–1–play." Watch 20 minutes. Measure how far apart you end up **with no sync engine
  whatsoever** — and, far more importantly, **ask her whether it felt wrong.**

  Step 0c is the cheapest experiment in the project and it calibrates every threshold in the spec. You
  may find natural drift is ~2 s over 20 minutes and neither of you noticed, which would justify the
  looser thresholds in §2.3 and could remove the servo from the roadmap entirely. You may find it feels
  broken at 400 ms, which would justify the spec as written. **Right now both documents are guessing,
  and Spec §47 honestly admits it.** One evening replaces the guess with data.

- Then Blueprint Steps 2–19 largely as written — they are well-formed.
- **Move iPhone testing from Step 22 to continuous from Step 8.** It is the primary environment.
- **Replace Step 20 (Redis) with a durability adapter** (SQLite or atomic-rename JSON) behind the same
  interface, and reposition Durable Objects as the V2 target.
- **Add: voice.** Per §2.4 and §8.1, as V1.5, before the drift servo.

### 6.3 Missing tests

The unit/integration lists (BP §42–43) are good on logic and blind on the failure sources that
dominate in practice:

- **Clock-error injection** — force a fixed +200 ms offset error into one client and assert corrections
  converge without oscillation. *The dominant real-world error source is completely untested.*
- **The §5.5 barrier race** — seek → pause during barrier → assert no auto-resume.
- **§5.8** — rejoin during disconnect grace does not trip the capacity check.
- **§5.7** — a sustained 0.9× throughput client does not produce pause/resume oscillation.
- **§5.2** — projection with a future `stampedAtServerMs` never returns a decreasing position.
- **§5.11** — mismatched media duration is detected and refused.
- **Soak (Step 23) should specify the hard conditions:** her on cellular, screen locking, one
  backgrounding, one real network drop. "Watch one full movie" is the right test; make it the *realistic*
  one.

### 6.4 Internal contradictions between the two documents

An agent told these are both canonical will pick arbitrarily:

| Topic | Spec | Blueprint |
|---|---|---|
| Drift ignore band | < 100 ms (§18) | < 150 ms (§26) |
| Soft correction | 100–400 ms (§18) | Deferred to V1.1 (§26) |
| Hard seek | > 500–800 ms (§18) | ≥ 750 ms × 2 checks (§26) |
| Start lead | 500–1000 ms (§16) | 750 ms (§19), 250 ms control lead (§23) |
| Player | hls.js as a new dependency (§9) | hls.js as a new dependency (§37) — **but it already ships from a CDN** |

The Blueprint's looser drift numbers are the better ones and should win; §2.3 argues for looser still.
Resolve these in one place and delete the other.

### 6.5 Process weight

§54's ADR ceremony and §55's agent-execution rules are reasonable for a team and will be skipped by a
solo builder at 11 pm. `THIRD_PARTY_NOTICES.md` (§40) only matters if you copy code, and §39 concludes
you should reimplement rather than copy — so it likely never applies.

**Suggest:** replace the ADR template with a single append-only `docs/DECISIONS.md`, five lines per
entry (date / what changed / why / what would reverse it). You will actually write that one.

The deeper point: **the documents' process rigor is load-bearing for confidence but not for outcomes.**
2,143 lines of build order, invariants, and agent rules give an impression of thoroughness while the
five items in §6.1 — the ones that decide whether this exists — get a sentence each. Move the rigor to
where the risk is.

---

## 7. What the plan gets right, and should not be talked out of

Stating this plainly so the length of this audit does not mislead:

1. **Server-authoritative projected timeline.** Correct, and correctly justified. It is not
   scale engineering — it is *correctness* engineering, and it is what makes reconnect, late join,
   missed events, and restart recovery collapse into one mechanism. Keep it exactly.
2. **The sender waits for the committed broadcast.** Unintuitive, frequently abandoned under pressure,
   and completely right. This single rule eliminates an entire family of echo and race bugs.
3. **Intent vs. truth separation.** Right.
4. **Reconcile-to-snapshot rather than replay events on reconnect.** Right, and the reasoning is right.
5. **`clientId` ≠ `socketId`.** Right, and routinely gotten wrong.
6. **The `WatchRoomStore` interface as the key architectural seam** (BP §14). This is the single best
   structural decision in the plan. It is what makes the Redis→SQLite→Durable Object argument in §4.3
   a cheap disagreement instead of an expensive one.
7. **Command idempotency and `assetId` fencing.** Cheap, and they prevent genuinely nasty bugs.
8. **The mandatory debug overlay (BP §35) before any tuning.** Correct discipline, correctly gated.
9. **Keeping the live-TV subsystem isolated.** Right.
10. **Couple mode as a first-class product concept rather than a configuration flag.** This is the
    product insight that makes the whole thing worth building, and it is what distinguishes it from
    every generic watch-party tool.

---

## 8. Proposals (co-architect section)

Ordered by value per unit of work.

### 8.1 Voice, at N = 2, without an SFU — V1.5, not V5

Two browsers, one `RTCPeerConnection`, audio only, signalled over the socket you already have.
No LiveKit, no SFU, no new service — **an SFU exists to avoid N² connections, and N = 2 has exactly one.**
Free STUN; TURN only for the ~10 % of pairs behind symmetric NAT, and Cloudflare sells TURN cheaply.

Roughly 150 lines. Per §2.3 it is also a **sync-budget feature**: with a voice channel present, the
100–150 ms drift target becomes unjustifiable and you can stop paying for it.

**Extension — audio ducking.** Voice-activity detection on the peer stream drops movie volume to ~30 %
while she talks, plus a 500 ms tail. ~20 lines with the Web Audio API. This is the "same couch" feeling
in a way no watch-party product does well, and it is the highest emotional-value-per-line item in the
entire product.

### 8.2 Replace P95 drift with "togetherness"

Fraction of runtime where |pairwise drift| < 500 ms **and** nobody is buffering **and** no visible
correction fired. Show it only in the debug overlay. It rewards the things people perceive and ignores
the things they don't — which P95 drift gets exactly backwards.

### 8.3 Prefetch instead of adapt — the contrarian one

The spec's answer to bad connections is adaptive bitrate. For a two-person product where **you know in
the afternoon what you will watch at 9 pm**, there is a strictly better answer: **download it early.**

- A "Tonight's pick" shelf. Choose the film in the afternoon; both devices background-fetch it.
- At 9 pm you press play on locally-cached bytes. **Delivery variance is zero, so sync is trivially
  perfect and the couple-pause barrier never fires.**
- iOS Safari storage quotas make a full 2 GB cache unrealistic, so the realistic form is: **cache the
  first 15–20 minutes (~300–400 MB) and stream the rest.** That alone kills the startup stall and the
  early-movie churn, which is where most bad nights begin.

**The answer to buffering is not adaptive bitrate; it is foresight.** ABR is what you build when you
cannot know the future. You can.

### 8.4 Timeline anchors instead of chat

Tapping ❤️ or 😂 drops a marker on *both* scrubbers at that media time — appearing live on hers as you
tap. On a rewatch, the scrubber is dotted with your history. This is Spec §33.2 "Remember This" made
zero-effort (one tap, no note required) and *bilateral*. Unlike chat, it does not require looking away
from the screen, which is the entire problem with chat during a film.

### 8.5 "Rewind 15 s for both" as a primary control

The single most common couple-viewing action. One tap, both jump back, auto-resume, **no barrier** —
the content is already buffered (§2.7). Make it a large obvious button. It is worth more than the
scrubber.

### 8.6 Always attribute the pause

Never show a neutral pause icon. Show **"Paused — Sara's connection"** or **"Paused by you."** In a
two-person system the social information *is* the feature. An unattributed pause produces "is it me? is
it her? is it broken?", which is the most corrosive experience in a shared session — and it is the
experience that makes people give up and watch separately.

### 8.7 A first-class untethered mode

A toggle that keeps chat, voice, and presence and drops the timeline coupling, showing
**"Sara is 4 s ahead — [catch up]"** instead. Plus a one-tap **"resync me."**

This is the escape hatch from §2.6. It guarantees that a bad night in the sync engine is never a lost
movie night — and honestly, it may be good enough on most nights, which is itself useful information.

### 8.8 The pair key — fixing the identity mismatch without building auth

Replace `localStorage.clientId` as the *memory* anchor (keep it for socket continuity):

- Generate one shared secret once — the **pair key** — stored on both devices and mirrored server-side.
- It identifies **the couple**, not the browser. Memories attach to `pairId` + `personSlot` (A/B).
- Recovery is re-entering the pair code. No passwords, no email, no auth system.
- Now a cleared browser or a new phone costs a re-pair, not the entire archive.

This is the minimum viable fix for §2.2, and it also finally gives `WatchParticipant.userId` a defined
meaning.

### 8.9 Make the post-movie ritual 30 seconds long

Nobody fills in a form with poster, date, ratings, favourite scene, notes, and a selfie at 11:40 pm.
Spec §33.1 will not survive contact with a real Friday.

**Reduce to: two taps (one 1–5 heart each) plus one auto-generated line** — *"You both laughed at
01:12:40"*, *"You rewound this scene three times"* — derived from data you already have. Offer the long
form behind an "add more" link for the rare night someone wants it.

The auto-generated version will exist. The form version will not.

### 8.10 Solve "what are we watching" before solving recommendations

A two-person shortlist with a **silent veto**: each adds up to five, either can veto without the other
learning what was vetoed (this detail matters — it removes the "why did you veto my pick" argument
entirely), and the app picks randomly from the survivors.

~100 lines, no ML, and it solves a real recurring friction. It is worth more than Spec §33.6's pair
recommender. Pair it with **shared resume position** (Spec open question #14), which for a couple
watching across two nights is worth more than the entire yearly recap.

### 8.11 The clap test — measuring what actually matters, with zero code

BP §44's Playwright harness measures `currentTime`, which excludes render-pipeline latency that differs
by device by 50–150 ms (§5.4). So it can report perfect sync while the two screens are visibly apart.

Instead: encode a one-frame white flash plus an audio blip at known media times into a test asset. Put
both devices side by side and record them with a third phone's camera. **The video of the two screens
is your drift measurement** — measured in photons, which is the only unit that matters. Zero code, and
it captures the end-to-end path the harness structurally cannot see.

### 8.12 Make the sync engine's audit log the source of the memory layer

Keep the projected-timeline model, but also append every committed revision to a bounded in-memory ring
(last ~200). Cost: nothing.

Benefits: the debug overlay can explain *why* you are where you are; a bad night becomes analysable
after the fact; and — the interesting part — **the Memory Card can be generated from it.** "You paused
14 times." "You rewound 01:12:40 three times" → *that is your favourite moment*, detected rather than
asked for.

The product's emotional layer falls out of the sync engine's own telemetry. Neither document connects
these two halves, and they are one small data structure apart. This is the idea I would most want you
to take from this audit.

### 8.13 Ship the social layer on live TV first — highest-ROI re-sequencing available

The repo is already a working live IPTV app, and you already watch matches.

**Live sync is dramatically easier than movie sync**: no arbitrary seek, no pause semantics, no seek
barrier, no scheduled resume — live streams self-align to within a few seconds by construction. A
"watch this match together" button needs only presence + chat + reactions + rooms. **No timeline
projection at all.**

That is roughly a one-week feature on the stack that exists today, and it would:

- ship the room, presence, identity, chat, and reaction code — **all of which the movie product reuses
  verbatim**;
- give you real two-person usage data *before* the movie pipeline exists;
- validate the socket-on-your-host question (§4.2) with something you would actually use;
- produce a working shared experience for her in week one instead of month three.

Both documents miss this entirely, because both treat the live-TV subsystem purely as something to
avoid touching (Spec §—, BP §36/§38). It is not just something to avoid breaking — **it is a free
staging environment for the hard half of the product.**

---

## 9. If I were rewriting the plan in one page

```
Gate 0   Deployment spike        socket survives 30 min from her phone on cellular
Gate 0b  One movie E2E           remux → R2 → signed Worker → plays AND seeks on iPhone Safari
Gate 0c  Unsynced experiment     both watch 20 min with a 3-2-1 countdown; measure drift; ASK HER
Gate 0d  Strict types            strict tsconfig over shared/watch + server/watch

Gate 1   Live watch-together     rooms + presence + chat + reactions on the EXISTING live TV
                                 (ships the social layer; validates everything; ~1 week)

Gate 2   Sync core               shared types → timeline projection (+future-stamp clamp)
                                 → room store iface → sockets → clientId → snapshot
Gate 3   Player + clock          progressive MP4 player → clock sampler (slewed offset) → rVFC
Gate 4   Barriers                userArmed/mediaReady split → scheduled start (adaptive lead)
Gate 5   Controls                play/pause/seek intents → fast path for buffered seeks
                                 → idempotency → barrier seq-invalidation
Gate 6   Drift                   lag-biased: ignore <400ms, rate 400ms–2s, hard seek >2s
Gate 7   Buffering               debounce → escalating resume buffer → ask-the-humans on repeat
Gate 8   Untethered mode         the escape hatch — ship before the soak, not after
Gate 9   Voice                   P2P audio + ducking
Gate 10  Soak                    full film, her on cellular, screen locking, one real drop
Gate 11  Memory                  pair key → two-tap rating → auto-generated card from the audit log
```

Deferred indefinitely, and I would argue permanently: FFmpeg ladder, Shaka Packager, CMAF alignment,
Redis, horizontal scaling, Socket.IO Redis adapter, ABR, DRM, DASH, group mode, LiveKit.

---

## 10. Spec §47's open questions — how I would answer them now

The spec is right to leave these open; here are the ones I would close today rather than measure.

| # | Question | My answer |
|---|---|---|
| 1 | Exact drift thresholds | 400 ms / 2 s, lag-biased (§2.3) — but run Gate 0c first |
| 2 | Start lead | Adaptive: `clamp(250, 2 × worst_one_way + 100, 1200)` (§5.9) |
| 3 | Buffering debounce | 800 ms is fine; the missing piece is **escalation**, not the initial value (§5.7) |
| 4 | "Ready" buffer in couple mode | 3 s first, then 10 s, then 25 s on repeats |
| 5 | Pause immediately on disconnect? | 5 s grace, **but** send a proactive pause on `pagehide`/`visibilitychange` so it is attributed (§2.5) |
| 6 | Chat retention | Forever — it is tiny, and it feeds the memory layer |
| 7 | Room history persists? | Rooms ephemeral; **the pair's history permanent** and stored separately from media (§2.9) |
| 8 | Markers private or shared? | **Shared by default.** A private-by-default shared-memory feature is a contradiction |
| 9 | CDN / storage vendor | **Cloudflare R2**, and the reason is zero egress (§3.3) |
| 10 | Encoding ladder | **No ladder.** Remux + one optional 720p (§3.2) |
| 11 | Subtitle edge cases | Promote subtitles **into V1** — with downloaded films and a bilingual couple this is a top-three feature, not a V2.1 item |
| 12 | Accounts mandatory for invitees? | No accounts. **Pair key** (§8.8) |
| 13 | Shared controls for both by default? | Yes. Two people; asymmetric control is a product smell |
| 14 | Resume from couple or personal progress? | **Couple progress.** It is the whole premise |

Two of these deserve emphasis because the documents underweight them badly: **#11 subtitles** (with
downloaded films, per-viewer subtitle language is likely the most-used feature in the product, and it is
currently scheduled for V2.1) and **#9/#10**, which together are the difference between a weekend of
work and a quarter of it.

---

## 11. Summary of blocking items

Fix before writing sync code:

1. **Choose and prove the deployment target** (§4.1, §4.2). The repo's configured target cannot run this.
2. **Enable `strict` for the sync modules** (§5.1). The core invariant fails silently without it.
3. **Decide the media plane** (§3.2, §3.3). Remux + progressive MP4 + R2, or justify the ladder.
4. **Fix the projection/scheduled-start contradiction** (§5.2). It is a real bug, specified.
5. **Reorder the join flow** (§5.8). A refresh currently reads as a third participant.
6. **Collapse the two blueprint copies and resolve the threshold contradictions** (§1, §6.4).

Fix before the soak:

7. Barrier `seq` invalidation (§5.5) · 8. Slewed clock offset (§5.3) · 9. Adaptive control lead (§5.9) ·
10. Buffering escalation (§5.7) · 11. Media fingerprint check (§5.11) · 12. Untethered mode (§8.7).

Decide as product, not engineering:

13. Voice to V1.5 (§8.1) · 14. Subtitles into V1 (§10 #11) · 15. Pair key before any memory feature
(§8.8) · 16. Run Gate 0c before tuning a single threshold (§6.2).

---

*Audit produced against `Movietv@8839d07`. Every repository claim in §1 was verified by reading the
files cited; every claim about the two planning documents cites its section. Where I disagree with the
plan I have tried to give the reasoning rather than the conclusion, so you can reject any individual
argument on its merits.*
