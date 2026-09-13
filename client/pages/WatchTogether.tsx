import { useMemo, useState } from "react";
import type { WatchMovie } from "@shared/watch/media";
import WatchMediaPlayer from "@/components/watch/WatchMediaPlayer";
import type { MediaValidationResult } from "@/watch/media-validation";

interface ProbeConfig {
  movie: WatchMovie | null;
  error: string | null;
}

function parseOptionalPositiveSafeInteger(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function describeValidation(validation: MediaValidationResult | null): string {
  if (validation === null) {
    return "Waiting for browser metadata";
  }

  if (validation.ok === true) {
    return "Fingerprint duration matched";
  }

  return validation.message;
}

function readProbeConfig(): ProbeConfig {
  const params = new URLSearchParams(window.location.search);
  const videoUrl = params.get("src")?.trim() ?? "";
  const durationRaw = params.get("durationMs")?.trim() ?? "";
  const durationMs = Number(durationRaw);

  if (!videoUrl || !durationRaw) {
    return {
      movie: null,
      error: "Provide both ?src=<progressive-mp4-url> and ?durationMs=<expected-duration-ms>.",
    };
  }

  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    return {
      movie: null,
      error: "durationMs must be a positive finite number.",
    };
  }

  const assetId = params.get("assetId")?.trim() || "manual-probe-asset";
  const assetVersion = params.get("assetVersion")?.trim() || "v1";
  const title = params.get("title")?.trim() || "Watch Together media probe";
  const posterUrl = params.get("poster")?.trim() || null;
  const subtitleUrl = params.get("subtitle")?.trim() || "/watch-probe.vtt";
  const subtitleLanguage = params.get("subtitleLang")?.trim() || "en";
  const subtitleLabel = params.get("subtitleLabel")?.trim() || "Probe subtitles";
  const byteLength = parseOptionalPositiveSafeInteger(params.get("byteLength"));
  const etag = params.get("etag")?.trim() || undefined;

  return {
    error: null,
    movie: {
      id: params.get("movieId")?.trim() || "manual-probe-movie",
      title,
      posterUrl,
      videoUrl,
      durationMs,
      subtitles: [
        {
          id: `${subtitleLanguage}-probe`,
          language: subtitleLanguage,
          label: subtitleLabel,
          url: subtitleUrl,
          isDefault: true,
        },
      ],
      fingerprint: {
        assetId,
        assetVersion,
        expectedDurationMs: durationMs,
        ...(byteLength !== undefined ? { byteLength } : {}),
        ...(etag !== undefined ? { etag } : {}),
      },
    },
  };
}

export default function WatchTogether() {
  const config = useMemo(readProbeConfig, []);
  const [validation, setValidation] = useState<MediaValidationResult | null>(null);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
          Watch Together · Gate D
        </p>
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">
          Progressive MP4 media probe
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-white/65">
          This page validates the V1 movie media contract before rooms and synchronization are introduced. It does not use the IPTV/KoraZero playback path.
        </p>
      </header>

      {config.movie ? (
        <>
          <WatchMediaPlayer
            movie={config.movie}
            onValidationChange={setValidation}
          />

          <section className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70 sm:grid-cols-2">
            <div>
              <span className="block text-xs uppercase tracking-wide text-white/40">
                Asset
              </span>
              <code className="break-all text-white/90">
                {config.movie.fingerprint.assetId}@{config.movie.fingerprint.assetVersion}
              </code>
            </div>
            <div>
              <span className="block text-xs uppercase tracking-wide text-white/40">
                Expected duration
              </span>
              <code className="text-white/90">
                {config.movie.fingerprint.expectedDurationMs} ms
              </code>
            </div>
            <div className="sm:col-span-2">
              <span className="block text-xs uppercase tracking-wide text-white/40">
                Media URL
              </span>
              <code className="break-all text-white/90">{config.movie.videoUrl}</code>
            </div>
            <div className="sm:col-span-2">
              <span className="block text-xs uppercase tracking-wide text-white/40">
                Validation
              </span>
              <span className="text-white/90">{describeValidation(validation)}</span>
            </div>
          </section>
        </>
      ) : (
        <section className="space-y-3 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-5 text-sm text-amber-50/90">
          <p>{config.error}</p>
          <p className="text-amber-50/65">
            Example shape: <code>/watch-together?src=%2Fmedia%2Fmovie.mp4&amp;durationMs=7200000&amp;assetId=movie-001&amp;assetVersion=v1</code>
          </p>
          <p className="text-amber-50/65">
            No public sample movie is hardcoded. Use an owner-supplied MP4 when the private media path is ready.
          </p>
        </section>
      )}

      <aside className="rounded-2xl border border-sky-300/20 bg-sky-300/[0.05] p-4 text-sm leading-6 text-sky-50/75">
        <strong className="text-sky-50">EXTERNAL VALIDATION PENDING:</strong>{" "}
        one owner-supplied progressive MP4 still needs to be delivered through the intended private media path and verified for play, pause, seek, and WebVTT subtitles on iPhone Safari and the second real viewing device.
      </aside>
    </main>
  );
}
