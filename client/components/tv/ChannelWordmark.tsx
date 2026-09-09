import type { TvChannelSummary } from "@shared/tv";
import { cn } from "@/lib/utils";

interface BrandStyle {
  text: string;
  className?: string;
  accent?: string;
}

function styleFor(channel: TvChannelSummary): BrandStyle {
  const id = channel.id.toLowerCase();
  const label = channel.label;

  if (id.startsWith("hbo")) return { text: label.toUpperCase(), className: "font-black tracking-[-0.08em] text-[18px]" };
  if (id.startsWith("showtime")) return { text: label.toUpperCase(), className: "font-black tracking-[-0.045em] text-[12px]" };
  if (id.startsWith("starz")) return { text: label.toUpperCase(), className: "font-semibold tracking-[0.18em] text-[11px]" };
  if (id.startsWith("osn")) return { text: label.replace(/^OSN\s*/i, "OSN · "), className: "font-bold tracking-[-0.025em] text-[11px]" };
  if (id.startsWith("netflix")) return { text: label.replace(/^Netflix\s*/i, "N · "), className: "font-black tracking-[-0.02em] text-[12px]", accent: "text-[#ef4e59]" };
  if (id.startsWith("bein")) return { text: label.replace(/^beIN\s*/i, "beIN · "), className: "font-bold tracking-[-0.035em] text-[12px]" };
  if (id.startsWith("sky")) return { text: label.replace(/^Sky\s*/i, "sky · "), className: "font-semibold tracking-[-0.035em] text-[12px]" };
  if (id.startsWith("rotana")) return { text: label.toUpperCase(), className: "font-bold tracking-[0.08em] text-[10px]" };
  if (id.startsWith("mbc")) return { text: label.toLowerCase(), className: "font-black italic tracking-[-0.08em] text-[18px]" };
  if (id.startsWith("dmc")) return { text: label.toLowerCase(), className: "font-black tracking-[-0.06em] text-[17px]" };
  if (id.startsWith("on-")) return { text: label.toUpperCase(), className: "font-black tracking-[-0.06em] text-[17px]" };
  if (id.startsWith("art-")) return { text: label.toUpperCase(), className: "font-bold tracking-[0.07em] text-[10px]" };
  if (id.startsWith("abc") || id.startsWith("nbc") || id.startsWith("cbs")) return { text: label.toUpperCase(), className: "font-black tracking-[-0.06em] text-[17px]" };
  if (label.length <= 5) return { text: label.toUpperCase(), className: "font-black tracking-[-0.04em] text-[16px]" };

  return { text: label, className: "font-semibold tracking-[-0.025em] text-[11px]" };
}

export default function ChannelWordmark({ channel }: { channel: TvChannelSummary }) {
  const brand = styleFor(channel);
  return (
    <div
      className="flex h-10 min-w-0 max-w-[118px] items-center overflow-hidden"
      aria-label={`${channel.label} logo`}
    >
      <span
        className={cn(
          "block max-w-full truncate whitespace-nowrap text-white/92",
          brand.className,
          brand.accent,
        )}
      >
        {brand.text}
      </span>
    </div>
  );
}
