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

const ICONS: Record<TvCategoryCard["icon"], LucideIcon> = {
  movie: Clapperboard,
  talk: Mic2,
  fashion: Shirt,
  food: UtensilsCrossed,
  discover: Globe2,
  arabic: MoonStar,
};

export default function CategoryCard({ item }: { item: TvCategoryCard }) {
  const Icon = ICONS[item.icon];
  return (
    <Link
      to={item.to}
      className="group relative h-[160px] w-[174px] shrink-0 overflow-hidden rounded-[12px] border border-white/[0.07] bg-[#171212]"
    >
      <img
        src={item.image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover saturate-[.78] transition duration-300 group-hover:scale-[1.035] group-hover:saturate-100"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,7,7,.04)_0%,rgba(8,7,7,.2)_40%,rgba(8,7,7,.94)_100%)]" />
      <div className="absolute bottom-0 left-0 right-0 p-3.5">
        <span className="mb-2 grid h-7 w-7 place-items-center rounded-full border border-white/15 bg-black/30 text-white backdrop-blur-sm">
          <Icon className="h-4 w-4" strokeWidth={1.8} />
        </span>
        <p className="text-[14px] font-semibold leading-tight text-white">{item.title}</p>
        <p className="mt-1 line-clamp-2 text-[10.5px] leading-[1.35] text-white/65">{item.description}</p>
      </div>
    </Link>
  );
}
