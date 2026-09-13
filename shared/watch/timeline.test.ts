import { describe, expect, it } from "vitest";
import type { RoomTimeline } from "./types";
import {
  clampMediaTime,
  isIncomingTimelineNewer,
  isSameMediaGeneration,
  projectTimeline,
} from "./timeline";

function timeline(overrides: Partial<RoomTimeline> = {}): RoomTimeline {
  return {
    roomId: "room-1",
    roomEpoch: 1,
    seq: 1,
    movieId: "movie-1",
    assetId: "asset-1",
    assetVersion: "v1",
    isPlaying: false,
    mediaTimeSeconds: 10,
    stampedAtServerMs: 1_000,
    playbackRate: 1,
    reason: "room-created",
    ...overrides,
  };
}

describe("authoritative timeline projection", () => {
  it("keeps a paused timeline fixed at its anchor", () => {
    const value = projectTimeline(
      timeline({ isPlaying: false, mediaTimeSeconds: 12 }),
      11_000,
      120,
    );

    expect(value).toBe(12);
  });

  it("advances a playing timeline from the server timestamp", () => {
    const value = projectTimeline(
      timeline({
        isPlaying: true,
        mediaTimeSeconds: 12,
        stampedAtServerMs: 1_000,
      }),
      3_500,
      120,
    );

    expect(value).toBe(14.5);
  });

  it("holds a future scheduled start at the anchor instead of projecting backwards", () => {
    const value = projectTimeline(
      timeline({
        isPlaying: true,
        mediaTimeSeconds: 20,
        stampedAtServerMs: 5_000,
      }),
      4_000,
      120,
    );

    expect(value).toBe(20);
  });

  it("clamps projected playback to the media duration", () => {
    const value = projectTimeline(
      timeline({
        isPlaying: true,
        mediaTimeSeconds: 119,
        stampedAtServerMs: 1_000,
      }),
      5_000,
      120,
    );

    expect(value).toBe(120);
  });

  it("clamps raw media time to zero and duration", () => {
    expect(clampMediaTime(-3, 120)).toBe(0);
    expect(clampMediaTime(130, 120)).toBe(120);
  });
});

describe("timeline epoch and sequence ordering", () => {
  it("accepts a higher sequence in the same epoch", () => {
    expect(
      isIncomingTimelineNewer(
        { roomEpoch: 2, seq: 10 },
        { roomEpoch: 2, seq: 11 },
      ),
    ).toBe(true);
  });

  it("rejects equal or lower sequence values in the same epoch", () => {
    expect(
      isIncomingTimelineNewer(
        { roomEpoch: 2, seq: 10 },
        { roomEpoch: 2, seq: 10 },
      ),
    ).toBe(false);
    expect(
      isIncomingTimelineNewer(
        { roomEpoch: 2, seq: 10 },
        { roomEpoch: 2, seq: 9 },
      ),
    ).toBe(false);
  });

  it("lets a newer epoch outrank any sequence from the older epoch", () => {
    expect(
      isIncomingTimelineNewer(
        { roomEpoch: 2, seq: 999 },
        { roomEpoch: 3, seq: 1 },
      ),
    ).toBe(true);
    expect(
      isIncomingTimelineNewer(
        { roomEpoch: 3, seq: 1 },
        { roomEpoch: 2, seq: 999 },
      ),
    ).toBe(false);
  });
});

describe("media generation fencing", () => {
  it("matches only the same movie asset version and room epoch", () => {
    const current = timeline({ roomEpoch: 4 });

    expect(
      isSameMediaGeneration(current, {
        movieId: "movie-1",
        assetId: "asset-1",
        assetVersion: "v1",
        roomEpoch: 4,
      }),
    ).toBe(true);

    expect(
      isSameMediaGeneration(current, {
        movieId: "movie-1",
        assetId: "asset-1",
        assetVersion: "v2",
        roomEpoch: 4,
      }),
    ).toBe(false);
  });
});
