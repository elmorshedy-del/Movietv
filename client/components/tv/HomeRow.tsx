import { ChevronRight } from "lucide-react";
import type { TvHomeRow } from "@shared/tv";
import CategoryCard from "./CategoryCard";
import ChannelCard from "./ChannelCard";

export default function HomeRow({ row }: { row: TvHomeRow }) {
  return (
    <section
      data-tv-home-row={row.id}
      className="mx-auto w-full max-w-[1223px] px-5 pt-[18px] first:pt-[10px] sm:px-7"
    >
      <div className="mb-[10px] flex items-end justify-between gap-4">
        <h2 className="text-[22px] font-semibold leading-none tracking-[-0.025em] text-white">
          {row.title}
        </h2>
      </div>

      <div className="scrollbar-none flex gap-[10px] overflow-x-auto pb-1 pr-1">
        {row.kind === "channels"
          ? row.items.map((channel) => <ChannelCard key={channel.id} channel={channel} />)
          : row.items.map((item) => <CategoryCard key={item.id} item={item} />)}
        <span className="flex w-7 shrink-0 items-center justify-center text-white/30" aria-hidden="true">
          <ChevronRight className="h-5 w-5" />
        </span>
      </div>
    </section>
  );
}
