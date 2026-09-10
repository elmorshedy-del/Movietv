import {
  ArrowUpRight,
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

const IMAGES: Record<string, string> = {
  talk: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=700&q=84",
  fashion: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=700&q=84",
  food: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=700&q=84",
  discover: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=700&q=84",
  "movie-night": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=700&q=84",
  arabic: "https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?auto=format&fit=crop&w=700&q=84",
};

const IMAGE_POSITION: Record<string, string> = {
  talk: "50% 45%",
  fashion: "50% 34%",
  food: "50% 42%",
  discover: "50% 48%",
  "movie-night": "50% 48%",
  arabic: "50% 42%",
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
      <Icon className="absolute right-6 top-7 h-12 w-12 text-white/15" strokeWidth={1.1} />
    </div>
  );
}

export default function CategoryCard({ item }: { item: TvCategoryCard }) {
  const Icon = ICONS[item.icon];
  const image = item.image || IMAGES[item.id];

  return (
    <Link
      to={item.to}
      data-tv-category-card
      className="group relative h-[172px] w-[158px] shrink-0 overflow-hidden rounded-[6px] border border-white/[0.08] bg-[#171212] shadow-[0_16px_36px_rgba(0,0,0,.18)] outline-none transition-[transform,box-shadow,border-color] duration-300 ease-out motion-safe:hover:-translate-y-1 motion-safe:hover:scale-[1.018] hover:border-white/[0.22] hover:shadow-[0_24px_50px_rgba(0,0,0,.4)] focus-visible:border-[#f39aa6]/44 focus-visible:ring-2 focus-visible:ring-[#f39aa6]/22 active:scale-[0.985]"
    >
      <Artwork icon={item.icon} />
      {image ? (
        <img
          src={image}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover saturate-[.88] brightness-[.78] transition-[transform,filter] duration-500 ease-out motion-safe:group-hover:scale-[1.065] group-hover:saturate-100 group-hover:brightness-[.92]"
          style={{ objectPosition: IMAGE_POSITION[item.id] || "50% 50%" }}
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : null}

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,7,7,.06)_0%,rgba(8,7,7,.01)_30%,rgba(8,7,7,.17)_47%,rgba(8,7,7,.97)_100%)] transition-colors duration-300 group-hover:bg-[linear-gradient(180deg,rgba(8,7,7,.02)_0%,rgba(8,7,7,0)_29%,rgba(8,7,7,.1)_45%,rgba(8,7,7,.93)_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-0 ring-1 ring-inset ring-white/[0.1] transition-opacity duration-300 group-hover:opacity-100" />

      <span className="absolute right-2.5 top-2.5 grid h-6 w-6 place-items-center rounded-full border border-white/15 bg-black/25 text-white/60 opacity-75 backdrop-blur-sm transition-[transform,opacity,background-color,border-color] duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:border-white/25 group-hover:bg-black/45 group-hover:text-white group-hover:opacity-100">
        <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.7} />
      </span>

      <div className="absolute bottom-0 left-0 right-0 p-3 transition-transform duration-300 ease-out motion-safe:group-hover:-translate-y-0.5">
        <span className="mb-1.5 grid h-6 w-6 place-items-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-sm transition-[transform,background-color,border-color] duration-300 group-hover:scale-110 group-hover:border-white/30 group-hover:bg-black/50">
          <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
        </span>
        <p className="text-[12.5px] font-semibold leading-[1.08] text-white transition-colors duration-300 group-hover:text-[#fff8f8]">{item.title}</p>
        <p className="mt-1 line-clamp-2 text-[9.25px] leading-[1.32] text-white/72 transition-colors duration-300 group-hover:text-white/86">{item.description}</p>
      </div>
    </Link>
  );
}
