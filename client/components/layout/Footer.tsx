import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.025] bg-[#090909] py-3">
      <div className="mx-auto flex w-full max-w-[1248px] items-center justify-between px-7">
        <div className="w-[170px]" />
        <p className="font-script text-[28px] leading-none text-[#e7a3a8]/90">
          My favourite place... because it's yours{" "}
          <Heart className="inline h-4 w-4 -rotate-6 text-[#e87988]" strokeWidth={1.6} />
        </p>
        <p className="flex w-[170px] items-center justify-end gap-1.5 text-[8px] font-semibold uppercase tracking-[0.28em] text-[#c77b80]/80">
          Movies a brighter day
          <Heart className="h-3 w-3 text-[#d96d78]" strokeWidth={1.6} />
        </p>
      </div>
    </footer>
  );
}
