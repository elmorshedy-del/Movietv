import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <Layout>
      <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 py-24 text-center">
        <h1 className="font-display text-6xl font-bold text-primary">404</h1>
        <p className="text-lg text-muted-foreground">
          Oops! This page doesn't exist.
        </p>
        <Button asChild className="mt-2">
          <Link to="/">Return to Home</Link>
        </Button>
      </div>
    </Layout>
  );
};

export default NotFound;
