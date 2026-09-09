import { useEffect, useRef, useState } from "react";
import type { TvPlaybackResponse } from "@shared/tv";

const HLS_SRC = "https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js";
const MPEGTS_SRC = "https://cdn.jsdelivr.net/npm/mpegts.js@1.8.1/dist/mpegts.min.js";

interface PlayerGlobals extends Window {
  Hls?: any;
  mpegts?: any;
}

let librariesPromise: Promise<void> | null = null;

function loadScript(src: string, ready: () => boolean) {
  if (ready()) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
    document.head.appendChild(script);
  });
}

function loadPlayerLibraries() {
  if (librariesPromise) return librariesPromise;
  const globals = window as PlayerGlobals;
  librariesPromise = Promise.all([
    loadScript(HLS_SRC, () => Boolean(globals.Hls)),
    loadScript(MPEGTS_SRC, () => Boolean(globals.mpegts)),
  ]).then(() => undefined);
  return librariesPromise;
}

export default function LivePlayer({
  source,
  onFatal,
}: {
  source: TvPlaybackResponse;
  onFatal: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState("Preparing live channel…");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let disposed = false;
    let hls: any = null;
    let tsPlayer: any = null;
    let reconnectTimer: number | null = null;
    let tsFailures = 0;
    let everPlayed = false;
    let triedHls = false;

    const clearReconnect = () => {
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
      reconnectTimer = null;
    };

    const releaseTs = () => {
      if (!tsPlayer) return;
      try {
        tsPlayer.pause();
        tsPlayer.unload();
        tsPlayer.detachMediaElement();
        tsPlayer.destroy();
      } catch {
        // Best-effort cleanup for a library-owned resource.
      }
      tsPlayer = null;
    };

    const releaseHls = () => {
      if (!hls) return;
      try {
        hls.destroy();
      } catch {
        // Best-effort cleanup for a library-owned resource.
      }
      hls = null;
    };

    const resetVideo = () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
    };

    const fatal = () => {
      if (disposed) return;
      setStatus("Trying another feed…");
      onFatal();
    };

    const playHls = () => {
      if (disposed || triedHls || !source.playbackUrl) return fatal();
      triedHls = true;
      clearReconnect();
      releaseTs();
      resetVideo();
      setStatus("Connecting live stream…");

      const globals = window as PlayerGlobals;
      const nativeHls = Boolean(video.canPlayType("application/vnd.apple.mpegurl"));
      const hlsJsUsable = Boolean(globals.Hls?.isSupported?.());

      if (nativeHls && !hlsJsUsable) {
        video.src = source.playbackUrl;
        void video.play().catch(() => setStatus("Tap play to start"));
        return;
      }

      if (!hlsJsUsable) return fatal();
      hls = new globals.Hls({
        enableWorker: true,
        manifestLoadingMaxRetry: 3,
        levelLoadingMaxRetry: 3,
        fragLoadingMaxRetry: 4,
        liveSyncDurationCount: 3,
      });
      hls.on(globals.Hls.Events.ERROR, (_event: unknown, data: any) => {
        if (disposed || !data?.fatal) return;
        fatal();
      });
      hls.loadSource(source.playbackUrl);
      hls.attachMedia(video);
      void video.play().catch(() => setStatus("Tap play to start"));
    };

    const playTs = () => {
      if (disposed || !source.tsPlaybackUrl) return playHls();
      const globals = window as PlayerGlobals;
      const mpegts = globals.mpegts;
      const hevc = source.channel.codec === "h265";
      let supportsHevcMse = false;
      try {
        supportsHevcMse = Boolean(mpegts?.getFeatureList?.()?.mseH265Playback);
      } catch {
        supportsHevcMse = false;
      }
      const tsUsable = Boolean(mpegts?.isSupported?.()) && (!hevc || supportsHevcMse);
      if (!tsUsable) return playHls();

      clearReconnect();
      releaseHls();
      releaseTs();
      resetVideo();
      setStatus(everPlayed ? "Reconnecting…" : "Connecting live stream…");

      tsPlayer = mpegts.createPlayer(
        { type: "mpegts", isLive: true, url: source.tsPlaybackUrl },
        { enableWorker: false, enableStashBuffer: false, stashInitialSize: 128 },
      );
      tsPlayer.attachMediaElement(video);
      tsPlayer.on(mpegts.Events.ERROR, () => {
        if (disposed || reconnectTimer !== null) return;
        tsFailures += 1;
        releaseTs();
        if (!everPlayed && tsFailures >= 2) return playHls();
        if (everPlayed && tsFailures >= 3) return fatal();
        reconnectTimer = window.setTimeout(() => {
          reconnectTimer = null;
          playTs();
        }, everPlayed ? 700 : 1000);
      });
      video.onended = () => {
        if (disposed || reconnectTimer !== null) return;
        reconnectTimer = window.setTimeout(() => {
          reconnectTimer = null;
          playTs();
        }, 500);
      };
      tsPlayer.load();
      const attempt = tsPlayer.play();
      if (attempt?.catch) attempt.catch(() => setStatus("Tap play to start"));
    };

    const onPlaying = () => {
      everPlayed = true;
      tsFailures = 0;
      setStatus("Live");
    };
    video.addEventListener("playing", onPlaying);

    loadPlayerLibraries()
      .then(() => {
        if (!disposed) playTs();
      })
      .catch(() => fatal());

    return () => {
      disposed = true;
      clearReconnect();
      video.removeEventListener("playing", onPlaying);
      video.onended = null;
      releaseHls();
      releaseTs();
      resetVideo();
    };
  }, [source.streamId, source.playbackUrl, source.tsPlaybackUrl, source.channel.codec, onFatal]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-[16px] border border-white/[0.08] bg-black shadow-[0_30px_80px_rgba(0,0,0,.45)]">
      <video
        ref={videoRef}
        controls
        playsInline
        autoPlay
        className="h-full w-full bg-black object-contain"
      />
      <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/10 bg-black/55 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/75 backdrop-blur-md">
        {status}
      </div>
    </div>
  );
}
