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
  { title: "Emily in Paris", image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=700&q=85" },
  { title: "The Menu", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=700&q=85" },
  { title: "Barbie", image: "https://images.unsplash.com/photo-1529245019870-59b249281fd3?auto=format&fit=crop&w=700&q=85" },
  { title: "The Talk Show Collection", image: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=700&q=85" },
  { title: "Dune", image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=700&q=85" },
  { title: "The Bear", image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=700&q=85" },
];

const CATEGORIES = [
  { label: "Movies", description: "Big stories. Bigger feelings.", icon: Clapperboard, to: "/movies", image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=700&q=85" },
  { label: "US TV", description: "Your favourite shows & networks.", icon: Tv, to: "/tv-shows", image: "https://images.unsplash.com/photo-1522083165195-3424ed129620?auto=format&fit=crop&w=700&q=85" },
  { label: "Talk Shows", description: "Real conversations. Brighter perspectives.", icon: Mic, to: "/talk-shows", image: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=700&q=85" },
  { label: "Fashion & Lifestyle", description: "Style. Inspiration. A more beautiful everyday.", icon: Shirt, to: "/lifestyle", image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=700&q=85" },
  { label: "Cooking", description: "Good food. Good mood.", icon: UtensilsCrossed, to: "/cooking", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=700&q=85" },
  { label: "Documentaries", description: "Extraordinary people. Incredible real stories.", icon: Globe, to: "/documentaries", image: "https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=700&q=85" },
  { label: "Arabic Content", description: "Egyptian, Tunisian & more. Always home.", icon: Moon, to: "/arabic-content", image: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&w=700&q=85" },
];

const CONTINUE_WATCHING = [
  { title: "The Devil Wears Prada", progress: 65, image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=700&q=85" },
  { title: "MasterChef US", progress: 40, image: "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=700&q=85" },
  { title: "أحلام الفتيات", progress: 80, image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=700&q=85" },
  { title: "Planet Earth", progress: 25, image: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=700&q=85" },
  { title: "Friends", progress: 55, image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=700&q=85" },
  { title: "نبلي وشريهان", progress: 15, image: "https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&w=700&q=85" },
];

const SIDE_LINKS = ["Movies", "Talk Shows", "Fashion", "Good Food", "Amazing Places", "Arabic Favourites", "And You"];

const CHANNELS = [
  { id: "mbc", width: 136 },
  { id: "on", width: 136 },
  { id: "dmc", width: 136 },
  { id: "hayat", width: 160 },
  { id: "watania", width: 163 },
  { id: "tunisia", width: 194 },
  { id: "drama", width: 164 },
] as const;

type ChannelId = (typeof CHANNELS)[number]["id"];

function ChannelMark({ id }: { id: ChannelId }) {
  if (id === "mbc") {
    return <span className="font-serif text-[31px] tracking-[-0.08em] text-white">mbc</span>;
  }
  if (id === "on") {
    return (
      <svg viewBox="0 0 90 38" className="h-9 w-20" aria-hidden="true">
        <defs>
          <linearGradient id="on-g" x1="0" x2="1">
            <stop offset="0" stopColor="#ff765a" />
            <stop offset="1" stopColor="#ef4f83" />
          </linearGradient>
        </defs>
        <path d="M9 3 75 19 9 35Z" fill="url(#on-g)" />
        <text x="20" y="24" fill="white" fontSize="17" fontWeight="700" fontFamily="Arial, sans-serif">ON</text>
      </svg>
    );
  }
  if (id === "dmc") {
    return (
      <div className="relative flex h-12 w-12 items-center justify-center rounded-full border-[4px] border-violet-300 bg-white shadow-[inset_0_0_0_3px_#f4d5ef]">
        <span className="text-[17px] font-bold lowercase tracking-[-0.08em] text-[#171326]">dmc</span>
      </div>
    );
  }
  if (id === "hayat") {
    return (
      <div className="flex items-center gap-2 text-[#b52d34]">
        <span className="grid h-7 w-7 place-items-center rounded-[2px] bg-[#b52d34] text-[15px] font-bold text-white">◆</span>
        <span dir="rtl" className="text-[22px] font-bold">الحياة</span>
      </div>
    );
  }
  if (id === "watania") {
    return (
      <div className="flex flex-col items-center text-[#c82430]">
        <div className="relative h-8 w-8 rotate-45 bg-[#c82430]">
          <span className="absolute inset-0 -rotate-45 grid place-items-center text-[20px] font-black text-white">1</span>
        </div>
        <span dir="rtl" className="mt-1 text-[11px] font-bold">الوطنية</span>
      </div>
    );
  }
  if (id === "tunisia") {
    return (
      <div className="flex items-center gap-2 text-[#be2730]">
        <div dir="rtl" className="text-right leading-[1.05]">
          <div className="text-[11px] font-bold">التلفزة التونسية</div>
          <div className="mt-0.5 text-[7px] tracking-[0.06em]">TELEVISION TUNISIENNE</div>
        </div>
        <div className="relative grid h-9 w-10 place-items-center rounded-full border-[3px] border-[#be2730] text-[23px] font-black">9</div>
      </div>
    );
  }
  return <span dir="rtl" className="text-[31px] font-black tracking-tight text-[#111]">دراما</span>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2.5 text-[22px] font-semibold leading-none tracking-[-0.02em] text-white sm:text-[23px]">{children}</h2>;
}

export default function Index() {
  return (
    <>
      <section className="relative h-[397px] overflow-hidden bg-[#130d0c]">
        <div className="absolute inset-0">
          <div
            className="absolute inset-y-0 right-0 w-[76%] bg-cover bg-center saturate-[.82] sepia-[.16] brightness-[.66]"
            style={{
              backgroundImage: "url(https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1700&q=90)",
              backgroundPosition: "center 36%",
            }}
          />
          <div className="absolute inset-y-0 right-0 w-[55%] bg-[radial-gradient(circle_at_65%_34%,rgba(58,74,148,.38),transparent_36%),radial-gradient(circle_at_76%_68%,rgba(245,170,84,.18),transparent_28%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#120d0c_0%,#120d0c_24%,rgba(18,13,12,.95)_31%,rgba(18,13,12,.50)_49%,rgba(18,13,12,.10)_68%,rgba(18,13,12,.40)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#090909] via-[#090909]/45 to-transparent" />
          <div className="absolute inset-y-0 right-0 hidden w-[205px] border-l border-white/[0.045] bg-[#160f10]/70 backdrop-blur-[2px] xl:block" />
        </div>

        <div className="relative mx-auto h-full w-full max-w-[1223px] px-7">
          <div className="flex h-full max-w-[430px] flex-col justify-center pb-4 pt-1">
            <p className="font-display text-[30px] leading-none text-[#f8f1ec]">Good evening,</p>
            <div className="mt-2 flex items-start gap-2">
              <h1 className="font-script text-[82px] leading-[0.9] text-[#f8a8ae]">Beautiful</h1>
              <Heart className="mt-2 h-8 w-8 -rotate-6 text-[#f18491]" strokeWidth={1.6} />
            </div>
            <p className="mt-5 max-w-[350px] text-[15px] leading-[1.58] text-white/[0.78]">A world of stories, places, flavours and people — all in one place, just for you.</p>
            <p className="mt-1 text-[15px] leading-[1.58] text-white/[0.78]">Press play on what makes you happy. <Heart className="inline h-3.5 w-3.5 text-[#f8a8ae]" /></p>
            <div className="mt-6 flex items-center gap-4">
              <button className="flex h-[43px] items-center gap-2 rounded-full bg-[#f79ca7] px-6 text-[14px] font-semibold text-[#1a1110] shadow-[0_7px_30px_rgba(247,156,167,.18)] transition hover:bg-[#f6acb4]">
                <Play className="h-4 w-4 fill-current" /> Play Something for Me
              </button>
              <Link to="/watchlist" className="flex h-[43px] items-center gap-2 rounded-full border border-white/[0.45] bg-black/20 px-6 text-[14px] font-medium text-white backdrop-blur-sm transition hover:bg-white/10">
                <Bookmark className="h-4 w-4" /> My Watchlist
              </Link>
            </div>
          </div>

          <p className="absolute right-[248px] top-[55px] hidden rotate-[-4deg] text-right font-script text-[28px] leading-[1.02] text-[#e8d7eb]/90 lg:block">Same girl<br />Bigger stories <Heart className="inline h-5 w-5 text-[#e78ea4]" /></p>

          <div className="absolute right-7 top-7 hidden w-[164px] xl:block">
            <ul className="space-y-[11px] text-[9px] font-semibold uppercase tracking-[0.22em] text-white/[0.55]">
              {SIDE_LINKS.map((label) => <li key={label} className="flex items-center gap-1.5">{label}{label === "And You" && <Heart className="h-3 w-3 text-[#e98998]" />}</li>)}
            </ul>
            <div className="mt-4 h-[132px] rounded-sm bg-[radial-gradient(circle_at_50%_100%,rgba(224,180,128,.24),transparent_62%)]" />
          </div>
        </div>
      </section>

      <main className="bg-[#090909] pb-2 pt-2">
        <section className="mx-auto w-full max-w-[1223px] px-7 pt-1">
          <SectionTitle>Trending for You</SectionTitle>
          <div className="scrollbar-none flex gap-[10px] overflow-x-auto pb-1">
            {TRENDING.map((item) => (
              <article key={item.title} className="group relative h-[132px] w-[188px] shrink-0 overflow-hidden rounded-[4px] bg-[#171212]">
                <img src={item.image} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.025]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <p className="absolute bottom-3 left-3 right-3 text-[16px] font-semibold leading-tight text-white drop-shadow-md">{item.title}</p>
              </article>
            ))}
            <button className="flex h-[132px] w-7 shrink-0 items-center justify-center text-white/80"><ChevronRight className="h-5 w-5" /></button>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1223px] px-7 pt-[17px]">
          <SectionTitle>Explore Your World</SectionTitle>
          <div className="scrollbar-none flex gap-[10px] overflow-x-auto pb-1">
            {CATEGORIES.map(({ label, description, icon: Icon, to, image }) => (
              <Link key={label} to={to} className="group relative h-[176px] w-[159px] shrink-0 overflow-hidden rounded-[4px] border border-white/[0.04] bg-[#171212]">
                <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.025]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/[0.34] to-black/5" />
                <div className="absolute bottom-3 left-3 right-2">
                  <span className="mb-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm"><Icon className="h-4 w-4" /></span>
                  <p className="text-[14px] font-semibold leading-tight text-white">{label}</p>
                  <p className="mt-1 text-[10.5px] leading-[1.38] text-white/[0.72]">{description}</p>
                </div>
              </Link>
            ))}
            <button className="flex h-[176px] w-7 shrink-0 items-center justify-center text-white/80"><ChevronRight className="h-5 w-5" /></button>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1223px] px-7 pt-[18px]">
          <SectionTitle>Popular Arabic Channels</SectionTitle>
          <div className="scrollbar-none flex gap-[10px] overflow-x-auto pb-1">
            {CHANNELS.map((channel) => (
              <div
                key={channel.id}
                style={{ width: channel.width }}
                className={`flex h-[69px] shrink-0 items-center justify-center rounded-[4px] px-3 shadow-sm ${channel.id === "mbc" ? "bg-[#ca2c34]" : channel.id === "on" ? "bg-gradient-to-br from-[#ff7b5d] to-[#ef7596]" : "bg-[#f3f0ee]"}`}
              >
                <ChannelMark id={channel.id} />
              </div>
            ))}
            <button className="flex h-[69px] w-7 shrink-0 items-center justify-center text-white/80"><ChevronRight className="h-5 w-5" /></button>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1223px] px-7 pt-[18px]">
          <SectionTitle>Continue Watching</SectionTitle>
          <div className="scrollbar-none flex gap-[10px] overflow-x-auto pb-1">
            {CONTINUE_WATCHING.map((item) => (
              <article key={item.title} className="w-[188px] shrink-0">
                <div className="relative h-[121px] overflow-hidden rounded-[4px] bg-[#171212]">
                  <img src={item.image} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
                  <p className="absolute bottom-[14px] left-3 right-3 truncate text-[12px] font-medium text-white">{item.title}</p>
                  <div className="absolute bottom-[5px] left-3 right-3 h-[3px] rounded-full bg-white/[0.22]"><div className="h-full rounded-full bg-[#f26f83]" style={{ width: `${item.progress}%` }} /></div>
                </div>
              </article>
            ))}
            <button className="flex h-[121px] w-7 shrink-0 items-center justify-center text-white/80"><ChevronRight className="h-5 w-5" /></button>
          </div>
        </section>
      </main>
    </>
  );
}
