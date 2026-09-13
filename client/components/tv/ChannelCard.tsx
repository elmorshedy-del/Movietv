import { useEffect, useMemo, useState } from "react";
import { Play } from "lucide-react";
import { Link } from "react-router-dom";
import type { TvChannelSummary } from "@shared/tv";
import ChannelWordmark from "./ChannelWordmark";

function accentFor(channel: TvChannelSummary): string {
  const id = channel.id.toLowerCase();
  if (id.startsWith("netflix")) return "#e95a64";
  if (id.startsWith("bein")) return "#8f79c9";
  if (id.startsWith("mbc")) return "#cf9a72";
  if (id.startsWith("rotana") || id.startsWith("art-") || id.startsWith("nile-")) return "#d2a36f";
  if (id.startsWith("dmc")) return "#a790d0";
  if (id.startsWith("on-")) return "#e77983";
  if (id.includes("discovery") || id.includes("nat-geo") || id.includes("animal") || id.includes("history") || id.includes("travel")) return "#719b95";
  if (id.includes("food") || id.includes("fatafeat") || id.includes("sofra") || id.includes("hgtv")) return "#bb8d63";
  if (id.includes("fashion") || id.includes("woman") || id.includes("tlc") || id.includes("entertainment")) return "#c98c9d";
  return "#ef94a2";
}

export default function ChannelCard({ channel }: { channel: TvChannelSummary }) {
  const [logoIndex, setLogoIndex] = useState(0);
  const quality = channel.quality !== "unknown" ? channel.quality.toUpperCase() : "LIVE";
  const logoSources = useMemo(
    () =>
      Array.from(
        new Set(
          [
            ...(channel.logoSources || []),
            channel.brandIcon || undefined,
            channel.icon || undefined,
          ].filter((value): value is string => Boolean(value)),
        ),
      ),
    [channel.logoSources, channel.brandIcon, channel.icon],
  );
  const logoSignature = logoSources.join("|");

  useEffect(() => {
    setLogoIndex(0);
  }, [channel.id, logoSignature]);

  const activeLogo = logoSources[logoIndex] || null;
  const accent = accentFor(channel);

  return (
    <Link
      to={`/watch/${encodeURIComponent(channel.id)}`}
      data-tv-channel-card
      className="group relative block h-[132px] w-[186px] shrink-0 overflow-hidden rounded-[7px] border border-white/[0.08] bg-[#171112] shadow-[0_16px_38px_rgba(0,0,0,.25)] outline-none transition-[transform,box-shadow,border-color] duration-300 ease-out motion-safe:hover:-translate-y-1 motion-safe:hover:scale-[1.022] hover:border-white/[0.2] hover:shadow-[0_24px_54px_rgba(0,0,0,.46)] focus-visible:border-[#f39aa6]/48 focus-visible:ring-2 focus-visible:ring-[#f39aa6]/24 active:scale-[0.985]"
    >
      <div className="absolute inset-0 bg-[linear-gradient(145deg,#1c1517_0%,#120e10_52%,#0a0809_100%)]" />
      <div
        className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full opacity-25 blur-3xl transition-opacity duration-300 group-hover:opacity-40"
        style={{ background: accent }}
      />
      <div
        className="pointer-events-none absolute -bottom-14 -left-10 h-28 w-28 rounded-full opacity-10 blur-3xl"
        style={{ background: accent }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,.025)_0%,transparent_38%,rgba(0,0,0,.38)_100%)]" />
      <div className="pointer-events-none absolute -inset-y-10 -left-[65%] w-[42%] rotate-[14deg] bg-gradient-to-r from-transparent via-white/[0.07] to-transparent opacity-0 transition-[transform,opacity] duration-500 ease-out motion-safe:group-hover:translate-x-[430%] motion-safe:group-hover:opacity-100" />

      <div className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1.5 rounded-full border border-white/12 bg-black/25 px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.15em] text-white/85 backdrop-blur-md">
        <span className="h-1.5 w-1.5 rounded-full bg-[#f07886] shadow-[0_0_7px_rgba(240,120,134,.72)] motion-safe:group-hover:animate-pulse" />
        Live
      </div>
      <span className="absolute right-2.5 top-2.5 z-10 rounded-full border border-white/10 bg-black/22 px-2 py-1 text-[7.5px] font-semibold uppercase tracking-[0.12em] text-white/70 backdrop-blur-md">
        {quality}
      </span>

      <div className="absolute inset-x-3 top-[30px] z-[1] flex h-[58px] items-center justify-center overflow-hidden">
        <div className="flex min-h-[46px] min-w-[102px] items-center justify-center rounded-[10px] border border-white/[0.11] bg-white/[0.035] px-3.5 py-2 shadow-[0_8px_26px_rgba(0,0,0,.2)] backdrop-blur-xl transition-[transform,background-color,border-color,box-shadow] duration-300 group-hover:scale-[1.035] group-hover:border-white/[0.2] group-hover:bg-white/[0.055] group-hover:shadow-[0_10px_30px_rgba(0,0,0,.3)]">
          {activeLogo ? (
            <img
              src={activeLogo}
              alt={`${channel.label} logo`}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="max-h-[40px] max-w-[120px] object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,.52)] transition-[transform,filter] duration-300 ease-out group-hover:scale-[1.045] group-hover:brightness-110"
              onError={() => setLogoIndex((index) => index + 1)}
            />
          ) : (
            <ChannelWordmark channel={channel} />
          )}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-[2] flex h-[38px] items-center justify-between gap-2 px-3">
        <p className="min-w-0 truncate text-[11.5px] font-semibold leading-tight text-white drop-shadow-[0_1px_5px_rgba(0,0,0,.7)] transition-colors duration-300 group-hover:text-[#fff8f8]">
          {channel.label}
        </p>
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/[0.14] bg-black/24 text-white/88 backdrop-blur-sm transition-[transform,background-color,border-color,color,box-shadow] duration-300 ease-out group-hover:scale-110 group-hover:border-transparent group-hover:bg-[#f39aa6] group-hover:text-[#211214] group-hover:shadow-[0_5px_16px_rgba(243,154,166,.25)]">
          <Play className="h-3.5 w-3.5 fill-current" />
        </span>
      </div>
    </Link>
  );
}