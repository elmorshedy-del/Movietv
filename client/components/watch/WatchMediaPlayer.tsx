import { useEffect, useState, type SyntheticEvent } from "react";
import type { WatchMovie } from "@shared/watch/media";
import {
  validateLoadedMedia,
  type MediaValidationResult,
} from "@/watch/media-validation";

interface WatchMediaPlayerProps {
  movie: WatchMovie;
  onValidationChange?: (result: MediaValidationResult | null) => void;
}

export default function WatchMediaPlayer({
  movie,
  onValidationChange,
}: WatchMediaPlayerProps) {
  const [validation, setValidation] = useState<MediaValidationResult | null>(
    null,
  );
  const [mediaError, setMediaError] = useState<string | null>(null);

  useEffect(() => {
    setValidation(null);
    setMediaError(null);
    onValidationChange?.(null);
  }, [
    movie.fingerprint.assetId,
    movie.fingerprint.assetVersion,
    movie.videoUrl,
    onValidationChange,
  ]);

  function handleLoadedMetadata(event: SyntheticEvent<HTMLVideoElement>) {
    const result = validateLoadedMedia(movie, event.currentTarget.duration);
    setValidation(result);
    onValidationChange?.(result);

    if (!result.ok) {
      event.currentTarget.pause();
    }
  }

  function handleError() {
    setMediaError(
      "The browser could not load this media URL. Check that the MP4 is reachable and supports byte-range playback.",
    );
  }

  const validationText = validation
    ? validation.ok
      ? `Asset validated (${validation.differenceMs} ms duration difference)`
      : `Asset validation failed: ${validation.message}`
    : "Waiting for loadedmetadata validation";

  return (
    <section className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
        <video
          key={`${movie.fingerprint.assetId}:${movie.fingerprint.assetVersion}:${movie.videoUrl}`}
          className="aspect-video w-full bg-black"
          src={movie.videoUrl}
          poster={movie.posterUrl ?? undefined}
          controls
          playsInline
          preload="metadata"
          onLoadedMetadata={handleLoadedMetadata}
          onError={handleError}
        >
          {movie.subtitles.map((track) => (
            <track
              key={track.id}
              kind="subtitles"
              src={track.url}
              srcLang={track.language}
              label={track.label}
              default={track.isDefault}
            />
          ))}
          Your browser does not support HTML video.
        </video>
      </div>

      <div
        role="status"
        className={`rounded-xl border px-4 py-3 text-sm ${
          validation?.ok
            ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
            : validation && !validation.ok
              ? "border-red-400/30 bg-red-400/10 text-red-100"
              : "border-white/10 bg-white/5 text-white/70"
        }`}
      >
        {validationText}
      </div>

      {mediaError ? (
        <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100">
          {mediaError}
        </p>
      ) : null}
    </section>
  );
}
