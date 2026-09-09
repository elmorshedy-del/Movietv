import { Link, useLocation } from "react-router-dom";
import { Heart, Search, ChevronDown, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Movies", to: "/movies" },
  { label: "TV Shows", to: "/tv-shows" },
  { label: "Live TV", to: "/live-tv" },
  { label: "Lifestyle", to: "/lifestyle" },
  { label: "Cooking", to: "/cooking" },
  { label: "Documentaries", to: "/documentaries" },
];

export default function Header() {
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-md">
      <div className="container flex h-20 items-center justify-between gap-6">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-1.5 font-display text-2xl font-semibold tracking-tight text-foreground"
        >
          For You
          <Heart className="h-4 w-4 fill-primary text-primary" />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "text-sm font-medium tracking-wide text-muted-foreground transition-colors hover:text-foreground",
                  active && "text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-5">
          <button
            type="button"
            aria-label="Search"
            className="text-foreground/80 transition-colors hover:text-foreground"
          >
            <Search className="h-5 w-5" />
          </button>
          <Link
            to="/profile"
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-white/5"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-semibold text-primary-foreground">
              MG
            </span>
            <span className="hidden text-sm font-medium text-foreground sm:inline">
              My Girl
            </span>
            <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:inline" />
          </Link>

          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Open menu"
                className="text-foreground/80 transition-colors hover:text-foreground lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-64 border-white/10 bg-background"
            >
              <nav className="mt-10 flex flex-col gap-6">
                {NAV_LINKS.map((link) => {
                  const active = pathname === link.to;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={cn(
                        "text-base font-medium text-muted-foreground transition-colors hover:text-foreground",
                        active && "text-foreground",
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
