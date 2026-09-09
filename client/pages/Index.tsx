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
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SIDE_LINKS = [
  "Movies",
  "Talk Shows",
  "Fashion",
  "Good Food",
  "Amazing Places",
  "Arabic Favourites",
  "And You",
];

const TRENDING = [
  { title: "Emily in Paris", from: "from-rose-500/70", to: "to-fuchsia-900" },
  { title: "The Menu", from: "from-stone-500/70", to: "to-stone-900" },
  { title: "Barbie", from: "from-pink-400/70", to: "to-pink-900" },
  { title: "The Talk Show Collection", from: "from-violet-500/70", to: "to-indigo-950" },
  { title: "Dune", from: "from-amber-600/70", to: "to-orange-950" },
  { title: "The Bear", from: "from-red-600/70", to: "to-neutral-950" },
];

const CATEGORIES = [
  {
    label: "Movies",
    description: "Big stories. Bigger feelings.",
    icon: Clapperboard,
    to: "/movies",
  },
  {
    label: "US TV",
    description: "Your favourite shows & networks.",
    icon: Tv,
    to: "/tv-shows",
  },
  {
    label: "Talk Shows",
    description: "Real conversations. Brighter perspectives.",
    icon: Mic,
    to: "/talk-shows",
  },
  {
    label: "Fashion & Lifestyle",
    description: "Style. Inspiration. A more beautiful everyday.",
    icon: Shirt,
    to: "/lifestyle",
  },
  {
    label: "Cooking",
    description: "Good food. Good mood.",
    icon: UtensilsCrossed,
    to: "/cooking",
  },
  {
    label: "Documentaries",
    description: "Extraordinary people. Incredible real stories.",
    icon: Globe,
    to: "/documentaries",
  },
  {
    label: "Arabic Content",
    description: "Egyptian, Tunisian & more. Always home.",
    icon: Moon,
    to: "/arabic-content",
  },
];

const CHANNELS = ["MBC", "ON", "DMC", "Al Hayat", "El Watania", "Tunisia TV", "Drama"];

const CONTINUE_WATCHING = [
  { title: "The Devil Wears Prada", progress: 65, from: "from-red-800/70", to: "to-neutral-950" },
  { title: "MasterChef US", progress: 40, from: "from-amber-500/70", to: "to-stone-950" },
  { title: "Ahlam Al Fatayat", progress: 80, from: "from-fuchsia-700/70", to: "to-purple-950" },
  { title: "Planet Earth", progress: 25, from: "from-sky-600/70", to: "to-slate-950" },
  { title: "Friends", progress: 55, from: "from-indigo-500/70", to: "to-indigo-950" },
  { title: "Nabli We Chrikha", progress: 15, from: "from-rose-600/70", to: "to-rose-950" },
];

export default function Index() {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
        </div>

        <div className="container grid grid-cols-1 gap-12 py-14 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:py-20">
          <div>
            <p className="font-display text-xl italic text-foreground/90 sm:text-2xl">
              Good evening,
            </p>
            <h1 className="mt-1 font-display text-5xl italic leading-none text-primary sm:text-6xl md:text-7xl">
              Beautiful{" "}
              <Heart className="inline h-9 w-9 -translate-y-2 fill-primary text-primary sm:h-11 sm:w-11" />
            </h1>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
              A world of stories, places, flavours and people — all in one
              place, just for you. Press play on what makes you happy.{" "}
              <Heart className="inline h-3.5 w-3.5 fill-primary/70 text-primary/70" />
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button
                size="lg"
                className="gap-2 rounded-full px-6 shadow-lg shadow-primary/30"
              >
                <Play className="h-4 w-4 fill-current" />
                Play Something for Me
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="gap-2 rounded-full border-white/25 bg-transparent px-6 text-foreground hover:bg-white/10 hover:text-foreground"
              >
                <Link to="/watchlist">
                  <Bookmark className="h-4 w-4" />
                  My Watchlist
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative flex items-center gap-6">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-950 via-slate-900 to-rose-950 shadow-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_100%,rgba(255,255,255,0.12),transparent_55%)]" />
              <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-1.5 pb-4">
                {Array.from({ length: 24 }).map((_, i) => (
                  <span
                    key={i}
                    className="h-6 w-1 rounded-full bg-amber-200/70"
                    style={{
                      height: `${8 + ((i * 7) % 26)}px`,
                      opacity: 0.4 + ((i % 5) * 0.12),
                    }}
                  />
                ))}
              </div>
              <p className="absolute right-6 top-6 text-right font-display text-xl italic leading-snug text-white/90 sm:text-2xl">
                Same girl
                <br />
                Bigger stories <Heart className="inline h-4 w-4 fill-white/80 text-white/80" />
              </p>
            </div>

            <ul className="hidden shrink-0 flex-col gap-3 text-right text-xs font-semibold uppercase tracking-widest text-muted-foreground xl:flex">
              {SIDE_LINKS.map((label) => (
                <li key={label} className="flex items-center justify-end gap-1.5">
                  {label}
                  {label === "And You" && (
                    <Heart className="h-3 w-3 fill-primary text-primary" />
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Trending */}
      <section className="container py-10">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold text-foreground">
            Trending for You
          </h2>
          <button className="text-muted-foreground transition-colors hover:text-foreground">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="scrollbar-none flex gap-4 overflow-x-auto pb-2">
          {TRENDING.map((item) => (
            <div
              key={item.title}
              className={cn(
                "group relative flex h-40 w-64 shrink-0 items-end overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br p-4 shadow-lg transition-transform hover:-translate-y-1",
                item.from,
                item.to,
              )}
            >
              <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/0" />
              <p className="relative font-display text-lg font-semibold text-white drop-shadow-sm">
                {item.title}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Explore Your World */}
      <section className="container py-10">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold text-foreground">
            Explore Your World
          </h2>
          <button className="text-muted-foreground transition-colors hover:text-foreground">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {CATEGORIES.map(({ label, description, icon: Icon, to }) => (
            <Link
              key={label}
              to={to}
              className="group flex flex-col justify-between gap-6 rounded-2xl border border-white/10 bg-card p-4 transition-colors hover:border-primary/40 hover:bg-white/5"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-medium text-foreground">{label}</p>
                <p className="mt-1 text-xs leading-snug text-muted-foreground">
                  {description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular Arabic Channels */}
      <section className="container py-10">
        <h2 className="mb-5 font-display text-2xl font-semibold text-foreground">
          Popular Arabic Channels
        </h2>
        <div className="scrollbar-none flex gap-4 overflow-x-auto pb-2">
          {CHANNELS.map((name) => (
            <div
              key={name}
              className="flex h-16 w-40 shrink-0 items-center justify-center rounded-xl bg-foreground/95 px-4 text-center font-display text-lg font-bold tracking-wide text-background shadow-md"
            >
              {name}
            </div>
          ))}
          <button className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-white/10 text-muted-foreground transition-colors hover:text-foreground">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Continue Watching */}
      <section className="container py-10">
        <h2 className="mb-5 font-display text-2xl font-semibold text-foreground">
          Continue Watching
        </h2>
        <div className="scrollbar-none flex gap-4 overflow-x-auto pb-2">
          {CONTINUE_WATCHING.map((item) => (
            <div key={item.title} className="w-44 shrink-0">
              <div
                className={cn(
                  "relative h-28 w-44 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br shadow-lg",
                  item.from,
                  item.to,
                )}
              >
                <div className="absolute bottom-0 left-0 h-1 w-full bg-white/20">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
              <p className="mt-2 truncate text-sm font-medium text-foreground">
                {item.title}
              </p>
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
}
