import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import ChannelCard from "@/components/tv/ChannelCard";
import { fetchChannels } from "@/lib/tv-api";
import {
  getFavoriteChannelIds,
  TV_PREFERENCES_EVENT,
} from "@/lib/tv-preferences";

export default function Favorites() {
  const [ids, setIds] = useState(() => getFavoriteChannelIds());

  useEffect(() => {
    const refresh = () => setIds(getFavoriteChannelIds());
    window.addEventListener(TV_PREFERENCES_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(TV_PREFERENCES_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const favorites = useQuery({
    queryKey: ["tv", "favorites", ids.join(",")],
    queryFn: ({ signal }) => fetchChannels(ids, signal),
    enabled: ids.length > 0,
    staleTime: 30_000,
  });

  return (
    <main className="min-h-[72vh] bg-[#090909]">
      <div className="mx-auto w-full max-w-[1223px] px-7 py-12">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#ef8695]/12 text-[#ef8695]">
            <Heart className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#df8793]">Just yours</p>
            <h1 className="mt-1 font-display text-4xl text-white">My Favorites</h1>
          </div>
        </div>

        {!ids.length ? (
          <div className="mt-10 max-w-lg rounded-[14px] border border-white/[0.06] bg-white/[0.025] p-6">
            <p className="font-medium text-white">Nothing saved yet.</p>
            <p className="mt-2 text-sm leading-6 text-white/48">Open any channel and tap the heart. It will stay here on this device.</p>
          </div>
        ) : favorites.isError ? (
          <p className="mt-10 text-sm text-white/55">Could not load favorites right now.</p>
        ) : (
          <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {(favorites.data?.channels || []).map((channel) => (
              <div key={channel.id} className="[&>a]:w-full">
                <ChannelCard channel={channel} />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
