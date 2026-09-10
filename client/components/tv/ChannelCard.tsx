import { useState } from "react";
import { Play } from "lucide-react";
import { Link } from "react-router-dom";
import type { TvChannelSummary } from "@shared/tv";
import ChannelWordmark from "./ChannelWordmark";

const PHOTO_SETS = {
  cinema: [
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=700&q=82",
    "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=700&q=82",
    "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=700&q=82",
  ],
  us: [
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=700&q=82",
    "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=700&q=82",
    "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=700&q=82",
  ],
  style: [
    "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=700&q=82",
    "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=700&q=82",
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=700&q=82",
  ],
  food: [
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=700&q=82",
    "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=700&q=82",
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=700&q=82",
  ],
  discover: [
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=700&q=82",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=700&q=82",
    "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=700&q=82",
  ],
  arabic: [
    "https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?auto=format&fit=crop&w=700&q=82",
    "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=700&q=82",
    "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=700&q=82",
  ],
} as const;

function stableIndex(value: string, length: number) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  return hash % length;
}

function photoSetFor(channel: TvChannelSummary) {
  const id = channel.id.toLowerCase();
  if (id.includes("food") || id.includes("fatafeat") || id.includes("sofra") || id.includes("hgtv")) return PHOTO_SETS.food;
  if (id.includes("fashion") || id.includes("woman") || id.includes("tlc") || id.includes("entertainment") || id.includes("oxygen")) return PHOTO_SETS.style;
  if (id.includes("discovery") || id.includes("nat-geo") || id.includes("animal") || id.includes("history") || id.includes("travel") || id.includes("bbc-earth")) return PHOTO_SETS.discover;
  if (id.startsWith("mbc-") || id.startsWith("rotana") || id.startsWith("art-") || id.startsWith("nile-") || id.startsWith("dmc") || id.startsWith("on-") || id.includes("hiwar") || id.includes("attessia") || id.includes("nessma") || id.includes("hannibal") || id.includes("tunisia")) return PHOTO_SETS.arabic;
  if (id.startsWith("abc-") || id.startsWith("nbc-") || id.startsWith("amc-") || id.startsWith("fx-") || id.startsWith("fxx-") || id.includes("usa-network") || id.includes("freeform")) return PHOTO_SETS.us;
  return PHOTO_SETS.cinema;
}

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
  const [iconFailed, setIconFailed] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  const quality = channel.quality !== "unknown" ? channel.quality.toUpperCase() : "LIVE";
  const showIcon = Boolean(channel.icon) && !iconFailed;
  const accent = accentFor(channel);
  const photos = photoSetFor(channel);
  const photo = photos[stableIndex(channel.id, photos.length)];

  return (
    <Link
      to={`/watch/${encodeURIComponent(channel.id)}`}
      data-tv-channel-card
      className="group relative block h-[132px] w-[186px] shrink-0 overflow-hidden rounded-[7px] border border-white/[0.08] bg-[#171112] shadow-[0_16px_38px_rgba(0,0,0,.25)] outline-none transition-[transform,box-shadow,border-color] duration-300 ease-out motion-safe:hover:-translate-y-1 motion-safe:hover:scale-[1.022] hover:border-white/[0.2] hover:shadow-[0_24px_54px_rgba(0,0,0,.46)] focus-visible:border-[#f39aa6]/48 focus-visible:ring-2 focus-visible:ring-[#f39aa6]/24 active:scale-[0.985]"
    >
      {!photoFailed ? (
        <img
          src={photo}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover saturate-[.76] brightness-[.58] transition-[transform,filter] duration-500 ease-out motion-safe:group-hover:scale-[1.055] group-hover:saturate-[.94] group-hover:brightness-[.68]"
          onError={() => setPhotoFailed(true)}
        />
      ) : null}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,6,7,.14)_0%,rgba(8,6,7,.22)_42%,rgba(8,6,7,.93)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,8,9,.52),rgba(12,8,9,.06)_62%,rgba(12,8,9,.18))]" />
      <div
        className="pointer-events-none absolute -right-8 -top-12 h-28 w-28 rounded-full opacity-20 blur-2xl transition-opacity duration-300 group-hover:opacity-38"
        style={{ background: accent }}
      />
      <div className="pointer-events-none absolute -inset-y-10 -left-[65%] w-[42%] rotate-[14deg] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent opacity-0 transition-[transform,opacity] duration-500 ease-out motion-safe:group-hover:translate-x-[430%] motion-safe:group-hover:opacity-100" />

      <div className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1.5 rounded-full border border-white/12 bg-black/35 px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.15em] text-white/85 backdrop-blur-md">
        <span className="h-1.5 w-1.5 rounded-full bg-[#f07886] shadow-[0_0_7px_rgba(240,120,134,.72)] motion-safe:group-hover:animate-pulse" />
        Live
      </div>
      <span className="absolute right-2.5 top-2.5 z-10 rounded-full border border-white/10 bg-black/30 px-2 py-1 text-[7.5px] font-semibold uppercase tracking-[0.12em] text-white/70 backdrop-blur-md">
        {quality}
      </span>

      <div className="absolute inset-x-3 top-[30px] z-[1] flex h-[58px] items-center justify-center overflow-hidden">
        <div className="flex min-h-[42px] min-w-[94px] items-center justify-center rounded-[9px] border border-white/[0.1] bg-black/30 px-3 py-1.5 shadow-[0_7px_22px_rgba(0,0,0,.24)] backdrop-blur-md transition-[transform,background-color,border-color] duration-300 group-hover:scale-[1.035] group-hover:border-white/[0.16] group-hover:bg-black/38">
          {showIcon ? (
            <img
              src={channel.icon || ""}
              alt={`${channel.label} logo`}
              loading="lazy"
              className="max-h-[35px] max-w-[112px] object-contain drop-shadow-[0_3px_10px_rgba(0,0,0,.45)] transition-[transform,filter] duration-300 ease-out group-hover:scale-[1.04] group-hover:brightness-110"
              onError={() => setIconFailed(true)}
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
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/[0.14] bg-black/34 text-white/88 backdrop-blur-sm transition-[transform,background-color,border-color,color,box-shadow] duration-300 ease-out group-hover:scale-110 group-hover:border-transparent group-hover:bg-[#f39aa6] group-hover:text-[#211214] group-hover:shadow-[0_5px_16px_rgba(243,154,166,.25)]">
          <Play className="h-3.5 w-3.5 fill-current" />
        </span>
      </div>
    </Link>
  );
}
