import { useState } from "react";
import { Play } from "lucide-react";
import { Link } from "react-router-dom";
import type { TvChannelSummary } from "@shared/tv";
import ChannelWordmark from "./ChannelWordmark";

export default function ChannelCard({ channel }: { channel: TvChannelSummary }) {
  const [iconFailed, setIconFailed] = useState(false);
  const quality = channel.quality !== "unknown" ? channel.quality.toUpperCase() : "LIVE";
  const showIcon = Boolean(channel.icon) && !iconFailed;

  return (
    <Link
      to={`/watch/${encodeURIComponent(channel.id)}`}
      data-tv-channel-card
      className="group relative block h-[132px] w-[186px] shrink-0 overflow-hidden rounded-[6px] border border-white/[0.07] bg-[linear-gradient(145deg,#241819_0%,#140f10_58%,#0d0b0c_100%)] shadow-[0_16px_38px_rgba(0,0,0,.22)] transition duration-200 hover:-translate-y-0.5 hover:border-[#f39aa6]/30 hover:shadow-[0_20px_46px_rgba(0,0,0,.3)]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_12%,rgba(242,128,144,.14),transparent_39%),linear-gradient(180deg,rgba(255,255,255,.02),transparent_50%)]" />

      <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full border border-[#f08d9a]/20 bg-black/22 px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.15em] text-[#f5a1ac] backdrop-blur-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-[#f07886] shadow-[0_0_7px_rgba(240,120,134,.72)]" />
        Live
      </div>

      <div className="absolute inset-x-3 top-[31px] flex h-[62px] items-center justify-center overflow-hidden">
        {showIcon ? (
          <img
            src={channel.icon || ""}
            alt={`${channel.label} logo`}
            loading="lazy"
            className="max-h-[44px] max-w-[126px] object-contain drop-shadow-[0_3px_12px_rgba(0,0,0,.32)]"
            onError={() => setIconFailed(true)}
          />
        ) : (
          <ChannelWordmark channel={channel} />
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 flex h-[39px] items-center justify-between gap-2 border-t border-white/[0.045] bg-black/28 px-3 backdrop-blur-[1px]">
        <div className="min-w-0">
          <p className="truncate text-[11.5px] font-semibold leading-tight text-white/92">{channel.label}</p>
          <p className="mt-0.5 text-[8px] font-medium uppercase tracking-[0.12em] text-white/35">{quality}</p>
        </div>
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/[0.07] bg-white/[0.075] text-white/78 transition group-hover:border-transparent group-hover:bg-[#f39aa6] group-hover:text-[#211214]">
          <Play className="h-3.5 w-3.5 fill-current" />
        </span>
      </div>
    </Link>
  );
}
