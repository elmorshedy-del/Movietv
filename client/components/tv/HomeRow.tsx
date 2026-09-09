import { ChevronRight } from "lucide-react";
import type { TvHomeRow } from "@shared/tv";
import CategoryCard from "./CategoryCard";
import ChannelCard from "./ChannelCard";

export default function HomeRow({ row }: { row: TvHomeRow }) {
  return (
    <section className="mx-auto w-full max-w-[1223px] px-7 pt-5 first:pt-3">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-semibold leading-none tracking-[-0.02em] text-white sm:text-[23px]">
            {row.title}
          </h2>
          {row.subtitle ? (
            <p className="mt-1.5 text-[11px] text-white/42">{row.subtitle}</p>
          ) : null}
        </div>
      </div>

      <div className="scrollbar-none flex gap-[10px] overflow-x-auto pb-1">
        {row.kind === "channels"
          ? row.items.map((channel) => <ChannelCard key={channel.id} channel={channel} />)
          : row.items.map((item) => <CategoryCard key={item.id} item={item} />)}
        <span className="flex w-7 shrink-0 items-center justify-center text-white/35" aria-hidden="true">
          <ChevronRight className="h-5 w-5" />
        </span>
      </div>
    </section>
  );
}
