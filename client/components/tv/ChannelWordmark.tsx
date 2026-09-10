import type { TvChannelSummary } from "@shared/tv";
import { cn } from "@/lib/utils";

interface BrandStyle {
  primary: string;
  secondary?: string;
  primaryClass?: string;
  secondaryClass?: string;
  accent?: string;
}

function splitBrand(label: string, prefix: RegExp): [string, string | undefined] {
  const secondary = label.replace(prefix, "").trim();
  return [label.match(prefix)?.[0]?.trim() || label, secondary || undefined];
}

function styleFor(channel: TvChannelSummary): BrandStyle {
  const id = channel.id.toLowerCase();
  const label = channel.label;

  if (id.startsWith("hbo")) {
    const suffix = label.replace(/^HBO\s*/i, "").trim();
    return {
      primary: "HBO",
      secondary: suffix || undefined,
      primaryClass: "text-[22px] font-black tracking-[-0.09em]",
      secondaryClass: "text-[8px] font-semibold uppercase tracking-[0.13em]",
    };
  }
  if (id.startsWith("showtime")) {
    const suffix = label.replace(/^Showtime\s*/i, "").trim();
    return {
      primary: "SHOWTIME",
      secondary: suffix || undefined,
      primaryClass: "text-[13px] font-black tracking-[-0.055em]",
      secondaryClass: "text-[8px] font-semibold uppercase tracking-[0.13em]",
    };
  }
  if (id.startsWith("starz")) {
    const suffix = label.replace(/^STARZ\s*/i, "").trim();
    return {
      primary: "STARZ",
      secondary: suffix || undefined,
      primaryClass: "text-[13px] font-semibold tracking-[0.2em]",
      secondaryClass: "text-[8px] font-semibold uppercase tracking-[0.12em]",
    };
  }
  if (id.startsWith("osn")) {
    const [, suffix] = splitBrand(label, /^OSN\s*/i);
    return {
      primary: "OSN",
      secondary: suffix,
      primaryClass: "text-[18px] font-black tracking-[-0.04em]",
      secondaryClass: "max-w-[112px] truncate text-[8px] font-semibold tracking-[0.01em]",
    };
  }
  if (id.startsWith("netflix")) {
    const suffix = label.replace(/^Netflix\s*/i, "").trim();
    return {
      primary: "N",
      secondary: suffix || "Netflix",
      primaryClass: "text-[24px] font-black tracking-[-0.06em]",
      secondaryClass: "text-[8px] font-bold uppercase tracking-[0.12em]",
      accent: "text-[#ef4e59]",
    };
  }
  if (id.startsWith("bein")) {
    const suffix = label.replace(/^beIN\s*/i, "").trim();
    return {
      primary: "beIN",
      secondary: suffix,
      primaryClass: "text-[17px] font-black tracking-[-0.06em]",
      secondaryClass: "max-w-[112px] truncate text-[8px] font-semibold tracking-[0.01em]",
    };
  }
  if (id.startsWith("sky")) {
    const suffix = label.replace(/^Sky\s*/i, "").trim();
    return {
      primary: "sky",
      secondary: suffix,
      primaryClass: "text-[19px] font-semibold italic tracking-[-0.07em]",
      secondaryClass: "max-w-[112px] truncate text-[8px] font-semibold tracking-[0.01em]",
    };
  }
  if (id.startsWith("rotana")) {
    const suffix = label.replace(/^Rotana\s*/i, "").trim();
    return {
      primary: "ROTANA",
      secondary: suffix,
      primaryClass: "text-[13px] font-bold tracking-[0.11em]",
      secondaryClass: "text-[8px] font-semibold uppercase tracking-[0.11em]",
    };
  }
  if (id.startsWith("mbc")) {
    return {
      primary: label.toLowerCase(),
      primaryClass: "text-[20px] font-black italic tracking-[-0.09em]",
    };
  }
  if (id.startsWith("dmc")) {
    return { primary: label.toLowerCase(), primaryClass: "text-[20px] font-black tracking-[-0.065em]" };
  }
  if (id.startsWith("on-")) {
    return { primary: label.toUpperCase(), primaryClass: "text-[20px] font-black tracking-[-0.065em]" };
  }
  if (id.startsWith("art-")) {
    return { primary: label.toUpperCase(), primaryClass: "text-[11px] font-bold tracking-[0.08em]" };
  }
  if (id.startsWith("abc") || id.startsWith("nbc") || id.startsWith("cbs")) {
    return { primary: label.toUpperCase(), primaryClass: "text-[20px] font-black tracking-[-0.06em]" };
  }
  if (label.length <= 5) {
    return { primary: label.toUpperCase(), primaryClass: "text-[18px] font-black tracking-[-0.04em]" };
  }

  return { primary: label, primaryClass: "max-w-[124px] truncate text-[12px] font-semibold tracking-[-0.025em]" };
}

export default function ChannelWordmark({ channel }: { channel: TvChannelSummary }) {
  const brand = styleFor(channel);

  return (
    <div
      className="flex min-h-10 min-w-0 max-w-[132px] flex-col items-center justify-center text-center leading-none"
      aria-label={`${channel.label} logo`}
    >
      <span
        className={cn(
          "block max-w-full whitespace-nowrap text-white/94",
          brand.primaryClass,
          brand.accent,
        )}
      >
        {brand.primary}
      </span>
      {brand.secondary ? (
        <span className={cn("mt-1 block max-w-full whitespace-nowrap text-white/58", brand.secondaryClass)}>
          {brand.secondary}
        </span>
      ) : null}
    </div>
  );
}
