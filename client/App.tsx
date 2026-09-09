import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PlaceholderPage from "@/components/placeholder/PlaceholderPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route
            path="/movies"
            element={
              <PlaceholderPage
                title="Movies"
                description="Big stories, bigger feelings — your movie hub is coming soon."
              />
            }
          />
          <Route
            path="/tv-shows"
            element={
              <PlaceholderPage
                title="TV Shows"
                description="Your favourite shows and networks, all in one place soon."
              />
            }
          />
          <Route
            path="/live-tv"
            element={
              <PlaceholderPage
                title="Live TV"
                description="Live channels are almost ready to stream."
              />
            }
          />
          <Route
            path="/lifestyle"
            element={
              <PlaceholderPage
                title="Fashion & Lifestyle"
                description="Style inspiration for a more beautiful everyday, coming soon."
              />
            }
          />
          <Route
            path="/cooking"
            element={
              <PlaceholderPage
                title="Cooking"
                description="Good food, good mood — recipes and shows coming soon."
              />
            }
          />
          <Route
            path="/documentaries"
            element={
              <PlaceholderPage
                title="Documentaries"
                description="Extraordinary people and incredible real stories, coming soon."
              />
            }
          />
          <Route
            path="/talk-shows"
            element={
              <PlaceholderPage
                title="Talk Shows"
                description="Real conversations, brighter perspectives — coming soon."
              />
            }
          />
          <Route
            path="/arabic-content"
            element={
              <PlaceholderPage
                title="Arabic Content"
                description="Egyptian, Tunisian and more — always home. Coming soon."
              />
            }
          />
          <Route
            path="/watchlist"
            element={
              <PlaceholderPage
                title="My Watchlist"
                description="Everything you save to watch later will live here."
              />
            }
          />
          <Route
            path="/profile"
            element={
              <PlaceholderPage
                title="My Girl"
                description="Your profile and preferences are coming soon."
              />
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
