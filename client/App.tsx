import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import PlaceholderPage from "@/components/placeholder/PlaceholderPage";
import Browse from "./pages/Browse";
import Favorites from "./pages/Favorites";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Watch from "./pages/Watch";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function Page({ children }: { children: React.ReactNode }) {
  return <Layout>{children}</Layout>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Page><Index /></Page>} />
          <Route path="/browse/:sectionId" element={<Page><Browse /></Page>} />
          <Route path="/watch/:channelId" element={<Page><Watch /></Page>} />
          <Route path="/favorites" element={<Page><Favorites /></Page>} />

          {/* Compatibility redirects from the Builder prototype. */}
          <Route path="/movies" element={<Navigate to="/browse/movies" replace />} />
          <Route path="/tv-shows" element={<Navigate to="/browse/us-tv" replace />} />
          <Route path="/live-tv" element={<Navigate to="/browse/all" replace />} />
          <Route path="/lifestyle" element={<Navigate to="/browse/lifestyle" replace />} />
          <Route path="/cooking" element={<Navigate to="/browse/lifestyle" replace />} />
          <Route path="/documentaries" element={<Navigate to="/browse/discover" replace />} />
          <Route path="/talk-shows" element={<Navigate to="/browse/us-tv" replace />} />
          <Route path="/arabic-content" element={<Navigate to="/browse/arabic" replace />} />
          <Route path="/watchlist" element={<Navigate to="/favorites" replace />} />

          <Route
            path="/profile"
            element={
              <PlaceholderPage
                title="My Girl"
                description="Your profile and preferences will live here."
              />
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
