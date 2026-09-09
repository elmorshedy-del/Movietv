import {
  Clapperboard,
  Globe2,
  Mic2,
  MoonStar,
  Shirt,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { TvCategoryCard } from "@shared/tv";
import { cn } from "@/lib/utils";

const ICONS: Record<TvCategoryCard["icon"], LucideIcon> = {
  movie: Clapperboard,
  talk: Mic2,
  fashion: Shirt,
  food: UtensilsCrossed,
  discover: Globe2,
  arabic: MoonStar,
};

const ART: Record<TvCategoryCard["icon"], string> = {
  talk: "bg-[radial-gradient(circle_at_28%_26%,rgba(239,155,170,.34),transparent_24%),linear-gradient(135deg,#2b1b23_0%,#171119_45%,#0c0b0f_100%)]",
  fashion: "bg-[radial-gradient(circle_at_68%_18%,rgba(234,210,194,.28),transparent_28%),linear-gradient(140deg,#5d3d44_0%,#261a20_48%,#110d10_100%)]",
  food: "bg-[radial-gradient(circle_at_70%_30%,rgba(219,170,111,.3),transparent_30%),linear-gradient(140deg,#433025_0%,#1e1714_48%,#0c0b0a_100%)]",
  discover: "bg-[radial-gradient(circle_at_70%_24%,rgba(112,157,157,.28),transparent_28%),linear-gradient(145deg,#263738_0%,#172326_48%,#0b1012_100%)]",
  movie: "bg-[radial-gradient(circle_at_64%_24%,rgba(153,74,91,.3),transparent_26%),linear-gradient(145deg,#391a24_0%,#1b1015_48%,#0b090b_100%)]",
  arabic: "bg-[radial-gradient(circle_at_68%_20%,rgba(205,170,111,.28),transparent_25%),linear-gradient(145deg,#473529_0%,#211916_48%,#0d0b0a_100%)]",
};

function Artwork({ icon }: { icon: TvCategoryCard["icon"] }) {
  const Icon = ICONS[icon];
  return (
    <div className={cn("absolute inset-0 overflow-hidden", ART[icon])} aria-hidden="true">
      <div className="absolute -right-5 top-3 h-24 w-24 rounded-full border border-white/[0.08]" />
      <div className="absolute -right-1 top-7 h-16 w-16 rounded-full border border-white/[0.07]" />
      {icon === "arabic" ? (
        <>
          <div className="absolute bottom-0 right-3 h-[72px] w-[78px] rounded-t-full border-x border-t border-[#e3bd82]/16" />
          <div className="absolute bottom-0 right-[43px] h-[90px] w-[2px] bg-[#e3bd82]/10" />
          <MoonStar className="absolute right-7 top-7 h-8 w-8 text-[#e7c692]/38" strokeWidth={1.2} />
        </>
      ) : icon === "movie" ? (
        <>
          <div className="absolute right-4 top-6 h-16 w-24 rotate-[-8deg] rounded-md border border-white/[0.08] bg-black/10" />
          <Clapperboard className="absolute right-8 top-9 h-10 w-10 text-white/18" strokeWidth={1.2} />
        </>
      ) : (
        <Icon className="absolute right-7 top-7 h-12 w-12 text-white/15" strokeWidth={1.1} />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,7,7,.02)_0%,rgba(8,7,7,.12)_40%,rgba(8,7,7,.9)_100%)]" />
    </div>
  );
}

export default function CategoryCard({ item }: { item: TvCategoryCard }) {
  const Icon = ICONS[item.icon];
  return (
    <Link
      to={item.to}
      className="group relative h-[160px] w-[174px] shrink-0 overflow-hidden rounded-[12px] border border-white/[0.075] bg-[#171212] shadow-[0_16px_36px_rgba(0,0,0,.16)] transition duration-200 hover:-translate-y-0.5 hover:border-white/[0.14]"
    >
      <Artwork icon={item.icon} />
      <div className="absolute bottom-0 left-0 right-0 p-3.5">
        <span className="mb-2 grid h-7 w-7 place-items-center rounded-full border border-white/15 bg-black/25 text-white/90 backdrop-blur-sm">
          <Icon className="h-4 w-4" strokeWidth={1.8} />
        </span>
        <p className="text-[14px] font-semibold leading-tight text-white">{item.title}</p>
        <p className="mt-1 line-clamp-2 text-[10.5px] leading-[1.35] text-white/62">{item.description}</p>
      </div>
    </Link>
  );
}
