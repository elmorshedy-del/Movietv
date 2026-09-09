import { Link } from "react-router-dom";
import {
  Heart,
  Play,
  Bookmark,
  ChevronRight,
  Clapperboard,
  Tv,
  Mic,
  Shirt,
  UtensilsCrossed,
  Globe,
  Moon,
} from "lucide-react";

const TRENDING = [
  {
    title: "Emily in Paris",
    image:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=700&q=85",
  },
  {
    title: "The Menu",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=700&q=85",
  },
  {
    title: "Barbie",
    image:
      "https://images.unsplash.com/photo-1529245019870-59b249281fd3?auto=format&fit=crop&w=700&q=85",
  },
  {
    title: "The Talk Show Collection",
    image:
      "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=700&q=85",
  },
  {
    title: "Dune",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=700&q=85",
  },
  {
    title: "The Bear",
    image:
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=700&q=85",
  },
];

const CATEGORIES = [
  {
    label: "Movies",
    description: "Big stories. Bigger feelings.",
    icon: Clapperboard,
    to: "/movies",
    image:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=700&q=85",
  },
  {
    label: "US TV",
    description: "Your favourite shows & networks.",
    icon: Tv,
    to: "/tv-shows",
    image:
      "https://images.unsplash.com/photo-1522083165195-3424ed129620?auto=format&fit=crop&w=700&q=85",
  },
  {
    label: "Talk Shows",
    description: "Real conversations. Brighter perspectives.",
    icon: Mic,
    to: "/talk-shows",
    image:
      "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=700&q=85",
  },
  {
    label: "Fashion & Lifestyle",
    description: "Style. Inspiration. A more beautiful everyday.",
    icon: Shirt,
    to: "/lifestyle",
    image:
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=700&q=85",
  },
  {
    label: "Cooking",
    description: "Good food. Good mood.",
    icon: UtensilsCrossed,
    to: "/cooking",
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=700&q=85",
  },
  {
    label: "Documentaries",
    description: "Extraordinary people. Incredible real stories.",
    icon: Globe,
    to: "/documentaries",
    image:
      "https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=700&q=85",
  },
  {
    label: "Arabic Content",
    description: "Egyptian, Tunisian & more. Always home.",
    icon: Moon,
    to: "/arabic-content",
    image:
      "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&w=700&q=85",
  },
];

const CHANNELS = [
  { name: "mbc", className: "bg-[#d2272f] text-white font-serif lowercase" },
  { name: "ON", className: "bg-gradient-to-br from-[#f56a45] to-[#ef7a93] text-white" },
  { name: "dmc", className: "bg-[#eee9f4] text-[#111] lowercase" },
  { name: "الحياة", className: "bg-[#f4f0ed] text-[#b6252c]" },
  { name: "الوطنية 1", className: "bg-[#f7f4f2] text-[#c11f2f]" },
  { name: "الوطنية التونسية", className: "bg-[#f7f4f2] text-[#c11f2f]" },
  { name: "دراما", className: "bg-[#f4f2f0] text-[#151515]" },
];

const CONTINUE_WATCHING = [
  {
    title: "The Devil Wears Prada",
    progress: 65,
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=700&q=85",
  },
  {
    title: "MasterChef US",
    progress: 40,
    image:
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=700&q=85",
  },
  {
    title: "أحلام الفتيات",
    progress: 80,
    image:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=700&q=85",
  },
  {
    title: "Planet Earth",
    progress: 25,
    image:
      "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=700&q=85",
  },
  {
    title: "Friends",
    progress: 55,
    image:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=700&q=85",
  },
  {
    title: "نبلي وشريهان",
    progress: 15,
    image:
      "https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&w=700&q=85",
  },
];

const SIDE_LINKS = [
  "Movies",
  "Talk Shows",
  "Fashion",
  "Good Food",
  "Amazing Places",
  "Arabic Favourites",
  "And You",
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2.5 text-[22px] font-semibold leading-none tracking-[-0.02em] text-white sm:text-[23px]">
      {children}
    </h2>
  );
}

export default function Index() {
  return (
    <LayoutShell>
      <section className="relative h-[390px] overflow-hidden bg-[#130d0c] lg:h-[397px]">
        <div className="absolute inset-0">
          <div
            className="absolute inset-y-0 right-0 w-[74%] bg-cover bg-center"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1600&q=90)",
              backgroundPosition: "center 38%",
            }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#120d0c_0%,#120d0c_24%,rgba(18,13,12,.93)_31%,rgba(18,13,12,.48)_49%,rgba(18,13,12,.12)_67%,rgba(18,13,12,.42)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#090909] to-transparent" />
          <div className="absolute inset-y-0 right-0 hidden w-[208px] border-l border-white/5 bg-[#160f10]/75 backdrop-blur-[2px] xl:block" />
        </div>

        <div className="relative mx-auto h-full w-full max-w-[1248px] px-7">
          <div className="flex h-full max-w-[430px] flex-col justify-center pb-5 pt-2">
            <p className="font-display text-[28px] leading-none text-[#f8f1ec] sm:text-[31px]">
              Good evening,
            </p>
            <div className="mt-2 flex items-start gap-2">
              <h1 className="font-script text-[70px] leading-[0.9] text-[#f8a8ae] sm:text-[82px]">
                Beautiful
              </h1>
              <Heart className="mt-2 h-8 w-8 -rotate-6 text-[#f18491]" strokeWidth={1.6} />
            </div>
            <p className="mt-5 max-w-[350px] text-[15px] leading-[1.6] text-white/78">
              A world of stories, places, flavours and people — all in one place,
              just for you.
            </p>
            <p className="mt-1 text-[15px] leading-[1.6] text-white/78">
              Press play on what makes you happy. <Heart className="inline h-3.5 w-3.5 text-[#f8a8ae]" />
            </p>

            <div className="mt-6 flex items-center gap-4">
              <button className="flex h-[43px] items-center gap-2 rounded-full bg-[#f79ca7] px-6 text-[14px] font-semibold text-[#1a1110] shadow-[0_7px_30px_rgba(247,156,167,.18)] transition hover:bg-[#f6acb4]">
                <Play className="h-4 w-4 fill-current" />
                Play Something for Me
              </button>
              <Link
                to="/watchlist"
                className="flex h-[43px] items-center gap-2 rounded-full border border-white/45 bg-black/20 px-6 text-[14px] font-medium text-white backdrop-blur-sm transition hover:bg-white/10"
              >
                <Bookmark className="h-4 w-4" />
                My Watchlist
              </Link>
            </div>
          </div>

          <p className="absolute right-[250px] top-[56px] hidden rotate-[-4deg] text-right font-script text-[27px] leading-[1.02] text-[#e8d7eb]/90 lg:block">
            Same girl
            <br />
            Bigger stories <Heart className="inline h-5 w-5 text-[#e78ea4]" />
          </p>

          <div className="absolute right-7 top-7 hidden w-[165px] xl:block">
            <ul className="space-y-3 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/55">
              {SIDE_LINKS.map((label) => (
                <li key={label} className="flex items-center gap-1.5">
                  {label}
                  {label === "And You" && <Heart className="h-3 w-3 text-[#e98998]" />}
                </li>
              ))}
            </ul>
            <div className="mt-6 h-[128px] rounded-sm bg-[radial-gradient(circle_at_50%_100%,rgba(224,180,128,.24),transparent_62%)]" />
          </div>
        </div>
      </section>

      <main className="bg-[#090909] pb-2 pt-2">
        <section className="mx-auto w-full max-w-[1248px] px-7 pt-1">
          <SectionTitle>Trending for You</SectionTitle>
          <div className="scrollbar-none flex gap-[10px] overflow-x-auto pb-1">
            {TRENDING.map((item) => (
              <article
                key={item.title}
                className="group relative h-[132px] w-[188px] shrink-0 overflow-hidden rounded-[4px] bg-[#171212]"
              >
                <img
                  src={item.image}
                  alt=""
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.025]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                <p className="absolute bottom-3 left-3 right-3 text-[16px] font-semibold leading-tight text-white drop-shadow-md">
                  {item.title}
                </p>
              </article>
            ))}
            <button className="flex h-[132px] w-7 shrink-0 items-center justify-center text-white/80">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1248px] px-7 pt-[17px]">
          <SectionTitle>Explore Your World</SectionTitle>
          <div className="scrollbar-none flex gap-[10px] overflow-x-auto pb-1">
            {CATEGORIES.map(({ label, description, icon: Icon, to, image }) => (
              <Link
                key={label}
                to={to}
                className="group relative h-[176px] w-[159px] shrink-0 overflow-hidden rounded-[4px] border border-white/[0.04] bg-[#171212]"
              >
                <img
                  src={image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.025]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/34 to-black/5" />
                <div className="absolute bottom-3 left-3 right-2">
                  <span className="mb-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm">
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="text-[14px] font-semibold leading-tight text-white">{label}</p>
                  <p className="mt-1 text-[10.5px] leading-[1.38] text-white/72">{description}</p>
                </div>
              </Link>
            ))}
            <button className="flex h-[176px] w-7 shrink-0 items-center justify-center text-white/80">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1248px] px-7 pt-[18px]">
          <SectionTitle>Popular Arabic Channels</SectionTitle>
          <div className="scrollbar-none flex gap-[10px] overflow-x-auto pb-1">
            {CHANNELS.map((channel) => (
              <div
                key={channel.name}
                className={`flex h-[69px] w-[161px] shrink-0 items-center justify-center rounded-[4px] px-3 text-center text-[24px] font-bold shadow-sm ${channel.className}`}
              >
                {channel.name}
              </div>
            ))}
            <button className="flex h-[69px] w-7 shrink-0 items-center justify-center text-white/80">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1248px] px-7 pt-[18px]">
          <SectionTitle>Continue Watching</SectionTitle>
          <div className="scrollbar-none flex gap-[10px] overflow-x-auto pb-1">
            {CONTINUE_WATCHING.map((item) => (
              <article key={item.title} className="w-[188px] shrink-0">
                <div className="relative h-[121px] overflow-hidden rounded-[4px] bg-[#171212]">
                  <img src={item.image} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/5 to-transparent" />
                  <p className="absolute bottom-[14px] left-3 right-3 truncate text-[12px] font-medium text-white">
                    {item.title}
                  </p>
                  <div className="absolute bottom-[5px] left-3 right-3 h-[3px] rounded-full bg-white/22">
                    <div
                      className="h-full rounded-full bg-[#f26f83]"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              </article>
            ))}
            <button className="flex h-[121px] w-7 shrink-0 items-center justify-center text-white/80">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </section>
      </main>
    </LayoutShell>
  );
}

function LayoutShell({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
