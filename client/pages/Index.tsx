import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bookmark, Heart, Play } from "lucide-react";
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
  copy: "Movies, American TV, fashion, food, documentaries, Egypt and Tunisia — all in one place I made for you.",
  sideLinks: [
    { label: "Premium", to: "/browse/premium" },
    { label: "Movies", to: "/browse/movies" },
    { label: "US TV", to: "/browse/us-tv" },
    { label: "Talk & Daytime", to: "/browse/us-tv" },
    { label: "Style & Reality", to: "/browse/style-reality" },
    { label: "Cooking & Home", to: "/browse/food-home" },
    { label: "Documentaries", to: "/browse/discover" },
    { label: "Egypt + Tunisia", to: "/browse/arabic" },
  ],
};

function LoadingRow() {
  return (
    <section className="mx-auto w-full max-w-[1223px] px-5 pt-5 sm:px-7">
      <div className="mb-3 h-6 w-40 animate-pulse rounded bg-white/[0.06]" />
      <div className="flex gap-[10px] overflow-hidden">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-[118px] w-[190px] shrink-0 animate-pulse rounded-[13px] border border-white/[0.04] bg-white/[0.035]"
          />
        ))}
      </div>
    </section>
  );
}

function EditorialBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[linear-gradient(100deg,#130d0d_0%,#130d0d_31%,#281a1e_58%,#171113_100%)]" />
      <div className="absolute inset-y-0 right-0 w-[72%] opacity-70 [background-image:repeating-linear-gradient(90deg,rgba(255,255,255,.035)_0px,rgba(255,255,255,.035)_2px,transparent_2px,transparent_92px)]" />
      <div className="absolute -right-24 top-[-80px] h-[470px] w-[470px] rounded-full bg-[#7c3e50]/16 blur-[2px]" />
      <div className="absolute right-[7%] top-[28px] h-[330px] w-[270px] rotate-[-4deg] rounded-[46%_46%_32%_38%] bg-[linear-gradient(145deg,rgba(247,207,194,.18),rgba(124,65,79,.2)_38%,rgba(26,17,20,.74)_72%)] shadow-[inset_28px_0_70px_rgba(255,210,190,.05)] sm:right-[11%] sm:w-[300px]" />
      <div className="absolute right-[20%] top-[72px] h-[118px] w-[102px] rounded-[48%_48%_44%_44%] bg-[linear-gradient(155deg,#6b3b43,#2a1a1e_68%)] shadow-[0_28px_70px_rgba(0,0,0,.35)] sm:right-[25%]" />
      <div className="absolute right-[16%] top-[54px] h-[170px] w-[135px] rotate-[9deg] rounded-[52%_42%_48%_36%] border-l-[22px] border-[#1b1215]/90 sm:right-[21%]" />
      <div className="absolute right-[12%] top-[188px] h-[190px] w-[182px] rotate-[-9deg] rounded-[50%_50%_12%_34%] border border-white/[0.035] bg-[linear-gradient(160deg,rgba(21,15,17,.92),rgba(71,40,49,.7))] sm:right-[17%]" />
      <div className="absolute right-[22%] top-[202px] h-[86px] w-[46px] rotate-[18deg] rounded-full bg-[linear-gradient(180deg,rgba(228,174,163,.14),rgba(100,55,67,.08))] sm:right-[27%]" />
      <div className="absolute right-[3%] top-[88px] hidden h-[180px] w-[120px] rounded-full border border-[#ebb3bd]/10 lg:block" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#120d0c_0%,#120d0c_24%,rgba(18,13,12,.91)_36%,rgba(18,13,12,.36)_57%,rgba(18,13,12,.18)_72%,rgba(18,13,12,.58)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#090909] via-[#090909]/52 to-transparent" />
    </div>
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
      <section className="relative min-h-[430px] overflow-hidden bg-[#130d0c] sm:min-h-[400px] lg:h-[397px] lg:min-h-0">
        <EditorialBackdrop />

        <div className="relative mx-auto h-full min-h-[430px] w-full max-w-[1223px] px-5 sm:min-h-[400px] sm:px-7 lg:min-h-0">
          <div className="flex h-full min-h-[430px] max-w-[500px] flex-col justify-center pb-7 pt-5 sm:min-h-[400px] lg:min-h-0 lg:pb-4 lg:pt-1">
            <p className="font-display text-[29px] leading-none text-[#f8f1ec] sm:text-[31px]">{hero.greeting}</p>
            <div className="mt-2 flex items-start gap-2">
              <h1 className="font-script text-[68px] leading-[0.9] text-[#f8a8ae] sm:text-[80px] lg:text-[84px]">{hero.headline}</h1>
              <Heart className="mt-1 h-7 w-7 -rotate-6 text-[#f18491] sm:mt-2 sm:h-8 sm:w-8" strokeWidth={1.6} />
            </div>
            <p className="mt-5 max-w-[455px] text-[15px] leading-[1.62] text-white/[0.8]">{hero.copy}</p>

            <div className="mt-6 flex flex-wrap items-center gap-3.5">
              <button
                type="button"
                onClick={playSomething}
                className="group flex h-[43px] items-center gap-2 rounded-full border border-white/[0.12] bg-[linear-gradient(105deg,#f7a0ab_0%,#ee9fbd_48%,#cda3dc_100%)] px-5 text-[14px] font-semibold text-[#1a1110] shadow-[0_8px_30px_rgba(233,151,183,.2)] transition-[transform,filter,box-shadow] duration-300 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_11px_34px_rgba(233,151,183,.3)] active:translate-y-0 sm:px-6"
              >
                <Play className="h-4 w-4 fill-current transition-transform duration-300 group-hover:scale-110" />
                Play Something for Me
              </button>
              <Link
                to="/favorites"
                className="flex h-[43px] items-center gap-2 rounded-full border border-white/[0.42] bg-black/20 px-5 text-[14px] font-medium text-white backdrop-blur-sm transition hover:bg-white/10 sm:px-6"
              >
                <Bookmark className="h-4 w-4" />
                My Favorites
              </Link>
            </div>
          </div>

          <p className="absolute right-[230px] top-[50px] hidden rotate-[-4deg] text-right font-script text-[27px] leading-[1.04] text-[#efdce4]/84 lg:block">
            Your TV
            <br />
            made for you <Heart className="inline h-5 w-5 text-[#e78ea4]" />
          </p>

          <nav className="absolute right-7 top-7 hidden w-[170px] rounded-[15px] border border-white/[0.045] bg-[#160f10]/48 p-4 backdrop-blur-[3px] xl:block" aria-label="Featured TV sections">
            <ul className="space-y-[11px] text-[9px] font-semibold uppercase tracking-[0.19em] text-white/[0.56]">
              {hero.sideLinks.map((item) => (
                <li key={`${item.label}-${item.to}`}>
                  <Link to={item.to} className="transition hover:text-[#f4a2ad]">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li className="flex items-center gap-1.5 pt-1 text-[#e9a3aa]/82">
                And You <Heart className="h-3 w-3" />
              </li>
            </ul>
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
          <section className="mx-auto w-full max-w-[1223px] px-5 py-12 sm:px-7">
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
