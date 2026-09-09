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
  { label: "Premium", to: "/browse/premium" },
  { label: "Movies", to: "/browse/movies" },
  { label: "US TV", to: "/browse/us-tv" },
  { label: "Lifestyle", to: "/browse/lifestyle" },
  { label: "Arabic", to: "/browse/arabic" },
];

function isActive(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

export default function Header() {
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-50 h-[62px] border-b border-white/[0.035] bg-[#100b0c]/95 backdrop-blur-md">
      <div className="mx-auto flex h-full w-full max-w-[1223px] items-center px-7">
        <Link
          to="/"
          className="ml-[6px] mr-[52px] flex shrink-0 items-center gap-1.5 font-script text-[34px] leading-none text-[#f5e7df]"
        >
          For You
          <Heart className="h-[20px] w-[20px] -rotate-6 text-[#ef6f7d]" strokeWidth={1.7} />
        </Link>

        <nav className="hidden h-full flex-1 items-center gap-2 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = isActive(pathname, link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "flex h-[31px] items-center rounded-[4px] px-3.5 text-[12px] font-medium text-white/[0.72] transition-colors hover:bg-white/[0.05] hover:text-white",
                  active &&
                    "border-b-2 border-[#f47f8c] bg-white/[0.075] text-white shadow-[0_6px_16px_rgba(0,0,0,.18)]",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex h-full shrink-0 items-center">
          <Link
            to="/browse/all"
            aria-label="Search channels"
            className="flex h-full w-[55px] items-center justify-center border-l border-white/[0.04] text-white/90 transition-colors hover:bg-white/[0.04]"
          >
            <Search className="h-[21px] w-[21px]" strokeWidth={1.7} />
          </Link>

          <Link
            to="/profile"
            className="flex h-full items-center gap-2.5 border-l border-white/[0.04] pl-4 pr-1 transition-colors hover:bg-white/[0.035]"
          >
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=85"
              alt=""
              className="h-9 w-9 rounded-full object-cover ring-1 ring-white/15"
            />
            <span className="hidden text-[12px] font-semibold text-white sm:inline">My Girl</span>
            <ChevronDown className="hidden h-4 w-4 text-white/65 sm:inline" />
          </Link>

          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Open menu"
                className="ml-2 flex h-10 w-10 items-center justify-center text-white/80 lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 border-white/10 bg-[#100b0c]">
              <nav className="mt-10 flex flex-col gap-5">
                {NAV_LINKS.map((link) => {
                  const active = isActive(pathname, link.to);
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={cn(
                        "text-base font-medium text-white/60 transition-colors hover:text-white",
                        active && "text-white",
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })}
                <Link to="/favorites" className="text-base font-medium text-[#ee929e]">
                  My Favorites
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
