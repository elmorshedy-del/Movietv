import { useState } from "react";
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
  if (id.includes("hiwar") || id.includes("attessia") || id.includes("nessma") || id.includes("hannibal") || id.includes("tunisia")) return "#c88378";
  if (id.includes("discovery") || id.includes("nat-geo") || id.includes("animal") || id.includes("history") || id.includes("travel")) return "#719b95";
  if (id.includes("food") || id.includes("fatafeat") || id.includes("sofra") || id.includes("hgtv")) return "#bb8d63";
  if (id.includes("fashion") || id.includes("woman") || id.includes("tlc") || id.includes("entertainment")) return "#c98c9d";
  return "#ef94a2";
}

export default function ChannelCard({ channel }: { channel: TvChannelSummary }) {
  const [iconFailed, setIconFailed] = useState(false);
  const quality = channel.quality !== "unknown" ? channel.quality.toUpperCase() : "LIVE";
  const showIcon = Boolean(channel.icon) && !iconFailed;
  const accent = accentFor(channel);

  return (
    <Link
      to={`/watch/${encodeURIComponent(channel.id)}`}
      data-tv-channel-card
      className="group relative block h-[132px] w-[186px] shrink-0 overflow-hidden rounded-[6px] border border-white/[0.07] bg-[linear-gradient(145deg,#241819_0%,#140f10_58%,#0d0b0c_100%)] shadow-[0_16px_38px_rgba(0,0,0,.22)] outline-none transition-[transform,box-shadow,border-color] duration-300 ease-out motion-safe:hover:-translate-y-1 motion-safe:hover:scale-[1.022] hover:border-[#f39aa6]/38 hover:shadow-[0_24px_52px_rgba(0,0,0,.42),0_0_28px_rgba(243,154,166,.08)] focus-visible:border-[#f39aa6]/48 focus-visible:ring-2 focus-visible:ring-[#f39aa6]/24 active:scale-[0.985]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_12%,rgba(242,128,144,.12),transparent_39%),linear-gradient(180deg,rgba(255,255,255,.02),transparent_50%)] transition-opacity duration-300 group-hover:opacity-80" />
      <div
        className="pointer-events-none absolute left-1/2 top-[31px] h-[66px] w-[132px] -translate-x-1/2 rounded-full opacity-40 blur-2xl transition-[opacity,transform] duration-300 group-hover:scale-110 group-hover:opacity-70"
        style={{ background: accent }}
      />
      <div className="pointer-events-none absolute -inset-y-10 -left-[65%] w-[42%] rotate-[14deg] bg-gradient-to-r from-transparent via-white/[0.07] to-transparent opacity-0 transition-[transform,opacity] duration-500 ease-out motion-safe:group-hover:translate-x-[430%] motion-safe:group-hover:opacity-100" />

      <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full border border-[#f08d9a]/20 bg-black/22 px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.15em] text-[#f5a1ac] backdrop-blur-sm transition-[border-color,background-color] duration-300 group-hover:border-[#f08d9a]/32 group-hover:bg-[#32191d]/55">
        <span className="h-1.5 w-1.5 rounded-full bg-[#f07886] shadow-[0_0_7px_rgba(240,120,134,.72)] motion-safe:group-hover:animate-pulse" />
        Live
      </div>

      <div className="absolute inset-x-3 top-[31px] z-[1] flex h-[62px] items-center justify-center overflow-hidden">
        {showIcon ? (
          <img
            src={channel.icon || ""}
            alt={`${channel.label} logo`}
            loading="lazy"
            className="max-h-[45px] max-w-[128px] object-contain drop-shadow-[0_3px_12px_rgba(0,0,0,.34)] transition-[transform,filter,opacity] duration-300 ease-out group-hover:scale-[1.055] group-hover:brightness-110 group-hover:drop-shadow-[0_5px_17px_rgba(0,0,0,.42)]"
            onError={() => setIconFailed(true)}
          />
        ) : (
          <div className="transition-transform duration-300 ease-out group-hover:scale-[1.045]">
            <ChannelWordmark channel={channel} />
          </div>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 z-[2] flex h-[39px] items-center justify-between gap-2 border-t border-white/[0.045] bg-black/32 px-3 backdrop-blur-[2px] transition-colors duration-300 group-hover:bg-black/42">
        <div className="min-w-0">
          <p className="truncate text-[11.5px] font-semibold leading-tight text-white/92 transition-colors duration-300 group-hover:text-white">{channel.label}</p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="text-[8px] font-medium uppercase tracking-[0.12em] text-white/35 transition-colors duration-300 group-hover:text-white/48">{quality}</span>
            <span className="h-[2px] w-[2px] rounded-full bg-white/20" />
            <span className="text-[7.5px] font-medium uppercase tracking-[0.12em] text-white/26">TV</span>
          </div>
        </div>
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/[0.07] bg-white/[0.075] text-white/78 transition-[transform,background-color,border-color,color,box-shadow] duration-300 ease-out group-hover:scale-110 group-hover:border-transparent group-hover:bg-[#f39aa6] group-hover:text-[#211214] group-hover:shadow-[0_5px_16px_rgba(243,154,166,.25)]">
          <Play className="h-3.5 w-3.5 fill-current" />
        </span>
      </div>
    </Link>
  );
}
