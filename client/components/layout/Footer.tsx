import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-10">
      <div className="container flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
        <p className="font-display text-lg italic text-muted-foreground">
          My favourite place... because it's yours{" "}
          <Heart className="inline h-4 w-4 fill-primary text-primary" />
        </p>
        <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          Movies a brighter day
          <Heart className="h-3.5 w-3.5 fill-primary text-primary" />
        </p>
      </div>
    </footer>
  );
}
