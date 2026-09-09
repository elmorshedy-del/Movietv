import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bookmark, Heart, Play, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { TvChannelRow } from "@shared/tv";
import HomeRow from "@/components/tv/HomeRow";
import { fetchChannels, fetchHome } from "@/lib/tv-api";
import {
  getRecentChannelIds,
  TV_PREFERENCES_EVENT,
} from "@/lib/tv-preferences";

const HERO_FALLBACK = {
  greeting: "Good evening,",
  headline: "Beautiful",
  copy: "Your little world of live TV, movies, food and stories — picked just for you.",
  sideLinks: [
    { label: "Premium", to: "/browse/premium" },
    { label: "Movies", to: "/browse/movies" },
    { label: "US TV", to: "/browse/us-tv" },
    { label: "Talk Shows", to: "/browse/us-tv" },
    { label: "Fashion & Lifestyle", to: "/browse/lifestyle" },
    { label: "Food & Home", to: "/browse/lifestyle" },
    { label: "Egypt + Tunisia", to: "/browse/arabic" },
  ],
};

function LoadingRow() {
  return (
    <section className="mx-auto w-full max-w-[1223px] px-7 pt-5">
      <div className="mb-3 h-6 w-40 animate-pulse rounded bg-white/[0.06]" />
      <div className="flex gap-[10px] overflow-hidden">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-[112px] w-[180px] shrink-0 animate-pulse rounded-[12px] border border-white/[0.04] bg-white/[0.035]"
          />
        ))}
      </div>
    </section>
  );
}

export default function Index() {
  const navigate = useNavigate();
  const home = useQuery({
    queryKey: ["tv", "home"],
    queryFn: ({ signal }) => fetchHome(signal),
    staleTime: 60_000,
  });

  const [recentIds, setRecentIds] = useState(() => getRecentChannelIds());
  useEffect(() => {
    const refresh = () => setRecentIds(getRecentChannelIds());
    window.addEventListener(TV_PREFERENCES_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(TV_PREFERENCES_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const recents = useQuery({
    queryKey: ["tv", "recent", recentIds.join(",")],
    queryFn: ({ signal }) => fetchChannels(recentIds, signal),
    enabled: recentIds.length > 0,
    staleTime: 30_000,
  });

  const hero = home.data?.hero ?? HERO_FALLBACK;
  const playable = useMemo(
    () =>
      (home.data?.rows || [])
        .filter((row): row is TvChannelRow => row.kind === "channels")
        .flatMap((row) => row.items)
        .filter((channel) => channel.available),
    [home.data],
  );

  const playSomething = () => {
    if (!playable.length) return navigate("/browse/all");
    const pick = playable[Math.floor(Math.random() * playable.length)];
    navigate(`/watch/${encodeURIComponent(pick.id)}`);
  };

  return (
    <>
      <section className="relative min-h-[390px] overflow-hidden bg-[#130d0c] lg:h-[397px]">
        <div className="absolute inset-0">
          <div
            className="absolute inset-y-0 right-0 w-[78%] bg-cover saturate-[.72] sepia-[.2] brightness-[.58]"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1570728605336-36ccd881d09f?auto=format&fit=crop&w=1700&q=88)",
              backgroundPosition: "center 48%",
            }}
          />
          <div className="absolute inset-y-0 right-0 w-[60%] bg-[radial-gradient(circle_at_66%_28%,rgba(79,91,154,.28),transparent_38%),radial-gradient(circle_at_77%_72%,rgba(238,164,91,.18),transparent_31%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#120d0c_0%,#120d0c_25%,rgba(18,13,12,.94)_33%,rgba(18,13,12,.48)_51%,rgba(18,13,12,.11)_69%,rgba(18,13,12,.50)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#090909] via-[#090909]/48 to-transparent" />
          <div className="absolute inset-y-0 right-0 hidden w-[205px] border-l border-white/[0.045] bg-[#160f10]/72 backdrop-blur-[2px] lg:block" />
        </div>

        <div className="relative mx-auto h-full min-h-[390px] w-full max-w-[1223px] px-7 lg:min-h-0">
          <div className="flex h-full min-h-[390px] max-w-[455px] flex-col justify-center pb-4 pt-1 lg:min-h-0">
            <p className="font-display text-[30px] leading-none text-[#f8f1ec]">{hero.greeting}</p>
            <div className="mt-2 flex items-start gap-2">
              <h1 className="font-script text-[82px] leading-[0.9] text-[#f8a8ae]">{hero.headline}</h1>
              <Heart className="mt-2 h-8 w-8 -rotate-6 text-[#f18491]" strokeWidth={1.6} />
            </div>
            <p className="mt-5 max-w-[380px] text-[15px] leading-[1.62] text-white/[0.78]">{hero.copy}</p>
            <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-white/[0.55]">
              <Sparkles className="h-3.5 w-3.5 text-[#f4a2ad]" />
              Pick a mood, or let me choose for you.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={playSomething}
                className="flex h-[43px] items-center gap-2 rounded-full bg-[#f79ca7] px-6 text-[14px] font-semibold text-[#1a1110] shadow-[0_7px_30px_rgba(247,156,167,.18)] transition hover:bg-[#f6acb4]"
              >
                <Play className="h-4 w-4 fill-current" />
                Play Something for Me
              </button>
              <Link
                to="/favorites"
                className="flex h-[43px] items-center gap-2 rounded-full border border-white/[0.42] bg-black/20 px-6 text-[14px] font-medium text-white backdrop-blur-sm transition hover:bg-white/10"
              >
                <Bookmark className="h-4 w-4" />
                My Favorites
              </Link>
            </div>
          </div>

          <p className="absolute right-[248px] top-[55px] hidden rotate-[-4deg] text-right font-script text-[28px] leading-[1.02] text-[#e8d7eb]/90 lg:block">
            Your TV
            <br />
            made for you <Heart className="inline h-5 w-5 text-[#e78ea4]" />
          </p>

          <nav className="absolute right-7 top-7 hidden w-[164px] lg:block" aria-label="Featured TV sections">
            <ul className="space-y-[11px] text-[9px] font-semibold uppercase tracking-[0.19em] text-white/[0.55]">
              {hero.sideLinks.map((item) => (
                <li key={`${item.label}-${item.to}`}>
                  <Link to={item.to} className="transition hover:text-[#f4a2ad]">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li className="flex items-center gap-1.5 text-[#e9a3aa]/80">
                And You <Heart className="h-3 w-3" />
              </li>
            </ul>
            <div className="mt-4 h-[132px] rounded-sm bg-[radial-gradient(circle_at_50%_100%,rgba(224,180,128,.22),transparent_62%)]" />
          </nav>
        </div>
      </section>

      <main className="bg-[#090909] pb-7 pt-1">
        {home.isLoading ? (
          <>
            <LoadingRow />
            <LoadingRow />
            <LoadingRow />
          </>
        ) : home.isError ? (
          <section className="mx-auto w-full max-w-[1223px] px-7 py-12">
            <div className="rounded-[14px] border border-[#f39aa6]/15 bg-[#201416] p-6">
              <p className="text-base font-semibold text-white">Live channels are taking a little longer to load.</p>
              <p className="mt-2 text-sm text-white/55">{home.error instanceof Error ? home.error.message : "Please try again."}</p>
              <button
                type="button"
                onClick={() => void home.refetch()}
                className="mt-4 rounded-full bg-[#f39aa6] px-4 py-2 text-sm font-semibold text-[#211214]"
              >
                Try again
              </button>
            </div>
          </section>
        ) : (
          home.data?.rows.map((row) => <HomeRow key={row.id} row={row} />)
        )}

        {recents.data?.channels.length ? (
          <HomeRow
            row={{
              id: "recent",
              title: "Recently Watched",
              subtitle: "Jump straight back into the channels you actually use.",
              kind: "channels",
              items: recents.data.channels,
            }}
          />
        ) : null}
      </main>
    </>
  );
}
