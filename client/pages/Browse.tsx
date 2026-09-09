import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useParams } from "react-router-dom";
import ChannelCard from "@/components/tv/ChannelCard";
import { fetchSection } from "@/lib/tv-api";

export default function Browse() {
  const { sectionId = "all" } = useParams();
  const [query, setQuery] = useState("");
  const section = useQuery({
    queryKey: ["tv", "section", sectionId],
    queryFn: ({ signal }) => fetchSection(sectionId, signal),
    staleTime: 60_000,
  });

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return section.data?.channels || [];
    return (section.data?.channels || []).filter((channel) =>
      `${channel.label} ${channel.providerName || ""} ${channel.categoryName || ""}`
        .toLowerCase()
        .includes(needle),
    );
  }, [query, section.data]);

  return (
    <main className="min-h-[72vh] bg-[#090909] pb-16">
      <section className="border-b border-white/[0.04] bg-[radial-gradient(circle_at_75%_0%,rgba(192,82,105,.13),transparent_34%),linear-gradient(180deg,#181011,#0b0909)]">
        <div className="mx-auto w-full max-w-[1223px] px-7 py-10 sm:py-14">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#e8919d]">For You TV</p>
          <h1 className="mt-2 font-display text-4xl text-white sm:text-5xl">
            {section.data?.title || "Your Channels"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
            {section.data?.description || "A curated live TV collection without the IPTV clutter."}
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1223px] px-7 pt-7">
        <label className="flex h-11 max-w-md items-center gap-3 rounded-full border border-white/[0.08] bg-white/[0.035] px-4 text-white/55 focus-within:border-[#e8919d]/35 focus-within:bg-white/[0.05]">
          <Search className="h-4 w-4 shrink-0" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a channel"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/32"
          />
        </label>

        {section.isLoading ? (
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="h-[112px] animate-pulse rounded-[12px] bg-white/[0.04]" />
            ))}
          </div>
        ) : section.isError ? (
          <div className="mt-8 rounded-[14px] border border-[#f39aa6]/15 bg-[#201416] p-5 text-sm text-white/65">
            {section.error instanceof Error ? section.error.message : "This section could not be loaded."}
          </div>
        ) : filtered.length ? (
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filtered.map((channel) => (
              <div key={channel.id} className="min-w-0 [&>a]:w-full">
                <ChannelCard channel={channel} />
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-10 text-sm text-white/45">No matching channels.</p>
        )}
      </section>
    </main>
  );
}
