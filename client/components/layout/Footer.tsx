import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.025] bg-[#090909] py-4">
      <div className="mx-auto grid w-full max-w-[1223px] grid-cols-1 items-center px-5 sm:px-7 lg:grid-cols-[170px_1fr_170px]">
        <div className="hidden lg:block" />
        <p className="text-center font-script text-[25px] leading-[1.2] text-[#e7a3a8]/90 sm:text-[28px]">
          My favourite place... because it's yours{" "}
          <Heart className="inline h-4 w-4 -rotate-6 text-[#e87988]" strokeWidth={1.6} />
        </p>
        <p className="hidden items-center justify-end gap-1.5 text-[8px] font-semibold uppercase tracking-[0.24em] text-[#c77b80]/80 lg:flex">
          Movies make brighter days
          <Heart className="h-3 w-3 shrink-0 text-[#d96d78]" strokeWidth={1.6} />
        </p>
      </div>
    </footer>
  );
}
