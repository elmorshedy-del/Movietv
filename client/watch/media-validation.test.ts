import { describe, expect, it } from "vitest";
import type { WatchMovie } from "@shared/watch/media";
import {
  DEFAULT_DURATION_TOLERANCE_MS,
  validateLoadedMedia,
  validateMediaContract,
} from "./media-validation";

function movie(overrides: Partial<WatchMovie> = {}): WatchMovie {
  const base: WatchMovie = {
    id: "movie-demo",
    title: "Demo Movie",
    videoUrl: "/media/demo.mp4",
    durationMs: 7_200_000,
    subtitles: [
      {
        id: "en",
        language: "en",
        label: "English",
        url: "/watch-probe.vtt",
        isDefault: true,
      },
    ],
    fingerprint: {
      assetId: "asset-demo",
      assetVersion: "v1",
      expectedDurationMs: 7_200_000,
      byteLength: 123_456,
      etag: "demo-etag",
    },
  };

  return {
    ...base,
    ...overrides,
    fingerprint: {
      ...base.fingerprint,
      ...overrides.fingerprint,
    },
  };
}

describe("Watch Together media validation", () => {
  it("accepts loaded metadata that matches the expected asset duration", () => {
    const result = validateLoadedMedia(movie(), 7200);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.actualDurationMs).toBe(7_200_000);
      expect(result.differenceMs).toBe(0);
    }
  });

  it("allows only the configured duration tolerance", () => {
    const inside = validateLoadedMedia(
      movie(),
      (7_200_000 + DEFAULT_DURATION_TOLERANCE_MS) / 1000,
    );
    const outside = validateLoadedMedia(
      movie(),
      (7_200_000 + DEFAULT_DURATION_TOLERANCE_MS + 1) / 1000,
    );

    expect(inside.ok).toBe(true);
    expect(outside).toMatchObject({
      ok: false,
      code: "duration-mismatch",
    });
  });

  it("rejects invalid browser duration values", () => {
    expect(validateLoadedMedia(movie(), Number.NaN)).toMatchObject({
      ok: false,
      code: "invalid-duration",
    });
    expect(validateLoadedMedia(movie(), Number.POSITIVE_INFINITY)).toMatchObject({
      ok: false,
      code: "invalid-duration",
    });
  });

  it("rejects a contract whose movie duration and asset fingerprint disagree", () => {
    const errors = validateMediaContract(
      movie({
        durationMs: 7_100_000,
      }),
    );

    expect(errors).toContain(
      "movie.durationMs must equal fingerprint.expectedDurationMs",
    );
  });

  it("rejects missing immutable asset identity", () => {
    const errors = validateMediaContract(
      movie({
        fingerprint: {
          assetId: "",
          assetVersion: "",
          expectedDurationMs: 7_200_000,
        },
      }),
    );

    expect(errors).toContain("fingerprint.assetId is required");
    expect(errors).toContain("fingerprint.assetVersion is required");
  });
});
