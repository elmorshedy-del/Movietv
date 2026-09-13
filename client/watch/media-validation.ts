import type { WatchMovie } from "@shared/watch/media";

export const DEFAULT_DURATION_TOLERANCE_MS = 1500;

export type MediaValidationResult =
  | {
      ok: true;
      actualDurationMs: number;
      expectedDurationMs: number;
      differenceMs: number;
    }
  | {
      ok: false;
      code:
        | "invalid-contract"
        | "invalid-duration"
        | "duration-mismatch";
      message: string;
      actualDurationMs?: number;
      expectedDurationMs?: number;
      differenceMs?: number;
    };

function isPositiveFiniteNumber(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export function validateMediaContract(movie: WatchMovie): string[] {
  const errors: string[] = [];
  const fingerprint = movie.fingerprint;

  if (!movie.id.trim()) errors.push("movie.id is required");
  if (!movie.title.trim()) errors.push("movie.title is required");
  if (!movie.videoUrl.trim()) errors.push("movie.videoUrl is required");
  if (!fingerprint.assetId.trim()) errors.push("fingerprint.assetId is required");
  if (!fingerprint.assetVersion.trim()) {
    errors.push("fingerprint.assetVersion is required");
  }

  if (!isPositiveFiniteNumber(movie.durationMs)) {
    errors.push("movie.durationMs must be a positive finite number");
  }

  if (!isPositiveFiniteNumber(fingerprint.expectedDurationMs)) {
    errors.push(
      "fingerprint.expectedDurationMs must be a positive finite number",
    );
  }

  if (
    isPositiveFiniteNumber(movie.durationMs) &&
    isPositiveFiniteNumber(fingerprint.expectedDurationMs) &&
    movie.durationMs !== fingerprint.expectedDurationMs
  ) {
    errors.push(
      "movie.durationMs must equal fingerprint.expectedDurationMs",
    );
  }

  if (
    fingerprint.byteLength !== undefined &&
    (!Number.isSafeInteger(fingerprint.byteLength) || fingerprint.byteLength <= 0)
  ) {
    errors.push("fingerprint.byteLength must be a positive safe integer");
  }

  const subtitleIds = new Set<string>();
  for (const track of movie.subtitles) {
    if (!track.id.trim()) errors.push("subtitle id is required");
    if (!track.language.trim()) errors.push("subtitle language is required");
    if (!track.label.trim()) errors.push("subtitle label is required");
    if (!track.url.trim()) errors.push("subtitle url is required");
    if (subtitleIds.has(track.id)) {
      errors.push(`duplicate subtitle id: ${track.id}`);
    }
    subtitleIds.add(track.id);
  }

  return errors;
}

/**
 * Validates the media element's loaded metadata against the immutable movie
 * fingerprint. A room must never treat the asset as synchronized-ready until
 * this returns ok=true.
 */
export function validateLoadedMedia(
  movie: WatchMovie,
  actualDurationSeconds: number,
  toleranceMs = DEFAULT_DURATION_TOLERANCE_MS,
): MediaValidationResult {
  const contractErrors = validateMediaContract(movie);
  if (contractErrors.length > 0) {
    return {
      ok: false,
      code: "invalid-contract",
      message: contractErrors.join("; "),
    };
  }

  if (!isPositiveFiniteNumber(actualDurationSeconds)) {
    return {
      ok: false,
      code: "invalid-duration",
      message: "Browser reported an invalid media duration",
    };
  }

  if (!Number.isFinite(toleranceMs) || toleranceMs < 0) {
    return {
      ok: false,
      code: "invalid-contract",
      message: "Duration tolerance must be a finite non-negative number",
    };
  }

  const actualDurationMs = Math.round(actualDurationSeconds * 1000);
  const expectedDurationMs = movie.fingerprint.expectedDurationMs;
  const differenceMs = Math.abs(actualDurationMs - expectedDurationMs);

  if (differenceMs > toleranceMs) {
    return {
      ok: false,
      code: "duration-mismatch",
      message: `Loaded media duration differs from the expected asset by ${differenceMs} ms`,
      actualDurationMs,
      expectedDurationMs,
      differenceMs,
    };
  }

  return {
    ok: true,
    actualDurationMs,
    expectedDurationMs,
    differenceMs,
  };
}
