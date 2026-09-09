import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";

export default function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <Layout>
      <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-5 py-24 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Sparkles className="h-6 w-6" />
        </span>
        <h1 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
          {title}
        </h1>
        <p className="max-w-md text-sm text-muted-foreground sm:text-base">
          {description ??
            "This page is on its way. Keep chatting with Fusion to fill in this part of the experience."}
        </p>
        <Button asChild className="mt-2">
          <Link to="/">Back to Home</Link>
        </Button>
      </div>
    </Layout>
  );
}
