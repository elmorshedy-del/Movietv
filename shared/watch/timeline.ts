import type { MediaGenerationIdentity, RoomTimeline } from "./types";

function requireFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be finite`);
  }
}

export function clampMediaTime(
  mediaTimeSeconds: number,
  durationSeconds: number,
): number {
  requireFinite(mediaTimeSeconds, "mediaTimeSeconds");
  requireFinite(durationSeconds, "durationSeconds");

  if (durationSeconds < 0) {
    throw new RangeError("durationSeconds must be non-negative");
  }

  return Math.min(durationSeconds, Math.max(0, mediaTimeSeconds));
}

/**
 * Projects the canonical server timeline at a caller-supplied server time.
 *
 * A future stampedAtServerMs represents a scheduled start. Elapsed time is
 * clamped at zero so the projected position never runs backwards before that
 * start timestamp arrives.
 */
export function projectTimeline(
  timeline: RoomTimeline,
  serverNowMs: number,
  durationSeconds: number,
): number {
  requireFinite(serverNowMs, "serverNowMs");
  requireFinite(timeline.stampedAtServerMs, "timeline.stampedAtServerMs");
  requireFinite(timeline.playbackRate, "timeline.playbackRate");

  const anchor = clampMediaTime(timeline.mediaTimeSeconds, durationSeconds);

  if (!timeline.isPlaying) {
    return anchor;
  }

  const elapsedMs = Math.max(0, serverNowMs - timeline.stampedAtServerMs);
  const projected = anchor + (elapsedMs / 1000) * timeline.playbackRate;

  return clampMediaTime(projected, durationSeconds);
}

/**
 * Timeline versions are ordered lexicographically by roomEpoch, then seq.
 * Equal versions are duplicate/stale and therefore not newer.
 */
export function isIncomingTimelineNewer(
  current: Pick<RoomTimeline, "roomEpoch" | "seq">,
  incoming: Pick<RoomTimeline, "roomEpoch" | "seq">,
): boolean {
  if (incoming.roomEpoch !== current.roomEpoch) {
    return incoming.roomEpoch > current.roomEpoch;
  }

  return incoming.seq > current.seq;
}

export function isSameMediaGeneration(
  timeline: Pick<
    RoomTimeline,
    "movieId" | "assetId" | "assetVersion" | "roomEpoch"
  >,
  identity: MediaGenerationIdentity,
): boolean {
  return (
    timeline.movieId === identity.movieId &&
    timeline.assetId === identity.assetId &&
    timeline.assetVersion === identity.assetVersion &&
    timeline.roomEpoch === identity.roomEpoch
  );
}
