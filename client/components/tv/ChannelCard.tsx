import { Play } from "lucide-react";
import { Link } from "react-router-dom";
import type { TvChannelSummary } from "@shared/tv";
import ChannelWordmark from "./ChannelWordmark";

export default function ChannelCard({ channel }: { channel: TvChannelSummary }) {
  const quality = channel.quality !== "unknown" ? channel.quality.toUpperCase() : "Live";

  return (
    <Link
      to={`/watch/${encodeURIComponent(channel.id)}`}
      className="group relative block h-[118px] w-[190px] shrink-0 overflow-hidden rounded-[13px] border border-white/[0.075] bg-[linear-gradient(145deg,#241819_0%,#140f10_58%,#100d0e_100%)] shadow-[0_18px_42px_rgba(0,0,0,.2)] transition duration-200 hover:-translate-y-0.5 hover:border-[#f39aa6]/35 hover:shadow-[0_20px_46px_rgba(0,0,0,.3)]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_84%_8%,rgba(242,128,144,.16),transparent_40%),linear-gradient(180deg,rgba(255,255,255,.015),transparent_45%)]" />
      <div className="relative flex h-full flex-col justify-between px-3.5 py-3">
        <div className="flex items-start justify-between gap-3">
          <ChannelWordmark channel={channel} />
          <span className="mt-0.5 flex shrink-0 items-center gap-1 rounded-full border border-[#f08d9a]/24 bg-[#f08d9a]/10 px-2 py-1 text-[8.5px] font-semibold uppercase tracking-[0.16em] text-[#f5a1ac]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#f07886] shadow-[0_0_8px_rgba(240,120,134,.75)]" />
            Live
          </span>
        </div>

        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0 pr-1">
            <p className="line-clamp-1 text-[13px] font-semibold leading-tight text-white/94">{channel.label}</p>
            <p className="mt-1 text-[9.5px] font-medium uppercase tracking-[0.11em] text-white/34">{quality}</p>
          </div>
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/[0.055] bg-white/[0.075] text-white/78 transition group-hover:border-transparent group-hover:bg-[#f39aa6] group-hover:text-[#211214]">
            <Play className="h-3.5 w-3.5 fill-current" />
          </span>
        </div>
      </div>
    </Link>
  );
}
