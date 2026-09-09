import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Heart, Radio, RefreshCw } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import LivePlayer from "@/components/tv/LivePlayer";
import { fetchPlayback } from "@/lib/tv-api";
import {
  isFavoriteChannel,
  recordRecentChannel,
  toggleFavoriteChannel,
} from "@/lib/tv-preferences";

export default function Watch() {
  const { channelId = "" } = useParams();
  const [variant, setVariant] = useState(0);
  const [favorite, setFavorite] = useState(() => isFavoriteChannel(channelId));
  const [playbackExhausted, setPlaybackExhausted] = useState(false);

  useEffect(() => {
    setVariant(0);
    setPlaybackExhausted(false);
    setFavorite(isFavoriteChannel(channelId));
  }, [channelId]);

  const playback = useQuery({
    queryKey: ["tv", "playback", channelId, variant],
    queryFn: ({ signal }) => fetchPlayback(channelId, variant, signal),
    enabled: Boolean(channelId),
    retry: false,
  });

  useEffect(() => {
    if (playback.data?.channel.id) recordRecentChannel(playback.data.channel.id);
  }, [playback.data?.channel.id]);

  const tryNextVariant = useCallback(() => {
    const data = playback.data;
    if (!data) return;
    const next = data.variantIndex + 1;
    if (next < data.variantCount) {
      setVariant(next);
      return;
    }
    setPlaybackExhausted(true);
  }, [playback.data]);

  const toggleFavorite = () => {
    setFavorite(toggleFavoriteChannel(channelId));
  };

  return (
    <main className="min-h-[75vh] bg-[radial-gradient(circle_at_50%_0%,rgba(111,49,64,.14),transparent_32%),#090909] pb-16">
      <div className="mx-auto w-full max-w-[1120px] px-5 pt-7 sm:px-7 sm:pt-9">
        <div className="mb-5 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-medium text-white/55 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          <button
            type="button"
            onClick={toggleFavorite}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${
              favorite
                ? "border-[#ef8795]/35 bg-[#ef8795]/12 text-[#f3a2ad]"
                : "border-white/10 bg-white/[0.035] text-white/65 hover:bg-white/[0.07]"
            }`}
          >
            <Heart className={`h-4 w-4 ${favorite ? "fill-current" : ""}`} />
            {favorite ? "Saved" : "Favorite"}
          </button>
        </div>

        {playback.isLoading ? (
          <div className="aspect-video w-full animate-pulse rounded-[16px] border border-white/[0.06] bg-black" />
        ) : playback.isError ? (
          <div className="grid aspect-video w-full place-items-center rounded-[16px] border border-[#ef8795]/15 bg-[#160f10] p-8 text-center">
            <div>
              <Radio className="mx-auto h-7 w-7 text-[#ef8795]" />
              <p className="mt-4 font-medium text-white">This channel is not available right now.</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/48">
                {playback.error instanceof Error ? playback.error.message : "The live feed could not be loaded."}
              </p>
              <button
                type="button"
                onClick={() => void playback.refetch()}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#ef8795] px-4 py-2 text-sm font-semibold text-[#211214]"
              >
                <RefreshCw className="h-4 w-4" /> Try again
              </button>
            </div>
          </div>
        ) : playback.data ? (
          <LivePlayer source={playback.data} onFatal={tryNextVariant} />
        ) : null}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e78b98]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ef7989]" />
              Live channel
            </div>
            <h1 className="mt-1.5 font-display text-3xl text-white sm:text-4xl">
              {playback.data?.channel.label || "Live TV"}
            </h1>
            {playback.data?.channel.providerName ? (
              <p className="mt-1 text-xs text-white/38">{playback.data.channel.providerName}</p>
            ) : null}
          </div>

          {playback.data ? (
            <p className="text-xs text-white/35">
              {playback.data.channel.quality !== "unknown"
                ? playback.data.channel.quality.toUpperCase()
                : "AUTO"}
              {playback.data.variantCount > 1
                ? ` · feed ${playback.data.variantIndex + 1}/${playback.data.variantCount}`
                : ""}
            </p>
          ) : null}
        </div>

        {playbackExhausted ? (
          <div className="mt-6 rounded-[12px] border border-[#ef8795]/15 bg-[#1a1113] p-4 text-sm text-white/55">
            Every available feed for this channel failed. Nothing else was substituted, so you never get sent to the wrong channel.
          </div>
        ) : null}
      </div>
    </main>
  );
}
