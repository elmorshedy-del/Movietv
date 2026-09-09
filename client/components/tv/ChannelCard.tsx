import { Play } from "lucide-react";
import { Link } from "react-router-dom";
import type { TvChannelSummary } from "@shared/tv";

function initials(label: string) {
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function ChannelCard({ channel }: { channel: TvChannelSummary }) {
  return (
    <Link
      to={`/watch/${encodeURIComponent(channel.id)}`}
      className="group relative block h-[112px] w-[180px] shrink-0 overflow-hidden rounded-[12px] border border-white/[0.07] bg-[linear-gradient(145deg,#211617,#100d0e)] shadow-[0_16px_40px_rgba(0,0,0,.18)] transition duration-200 hover:-translate-y-0.5 hover:border-[#f39aa6]/35"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(242,128,144,.12),transparent_42%)]" />
      <div className="relative flex h-full flex-col justify-between p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 min-w-11 items-center justify-center overflow-hidden rounded-[9px] bg-white/[0.06] px-2 ring-1 ring-white/[0.06]">
            {channel.icon ? (
              <img
                src={channel.icon}
                alt=""
                referrerPolicy="no-referrer"
                className="max-h-8 max-w-[72px] object-contain"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <span className="text-sm font-bold tracking-wide text-white/85">{initials(channel.label)}</span>
            )}
          </div>
          <span className="flex items-center gap-1 rounded-full border border-[#f08d9a]/20 bg-[#f08d9a]/10 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#f4a6b0]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#f07886] shadow-[0_0_8px_rgba(240,120,134,.7)]" />
            Live
          </span>
        </div>

        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold text-white">{channel.label}</p>
            <p className="mt-0.5 truncate text-[10px] text-white/42">
              {channel.quality !== "unknown" ? channel.quality.toUpperCase() : "Live channel"}
            </p>
          </div>
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/[0.08] text-white/80 transition group-hover:bg-[#f39aa6] group-hover:text-[#211214]">
            <Play className="h-3.5 w-3.5 fill-current" />
          </span>
        </div>
      </div>
    </Link>
  );
}
