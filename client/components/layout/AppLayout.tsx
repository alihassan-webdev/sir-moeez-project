import { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSwipeNavigation } from "@/hooks/use-swipe-navigation";

export function AppLayout({ children }: PropsWithChildren) {
  const location = useLocation();
  const path = location.pathname;
  const [routeLoading, setRouteLoading] = useState(false);
  const navigate = useNavigate();
  const isGetStarted = path === "/get-started";

  useSwipeNavigation(() => {
    if (window.history.length > 1) navigate(-1);
  });

  useEffect(() => {
    setRouteLoading(true);
    const t = setTimeout(() => setRouteLoading(false), 450);
    return () => clearTimeout(t);
  }, [path]);

  return (
    <div className="flex min-h-svh w-full flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background px-4">
        <div className="ml-auto flex items-center gap-2">
          {isGetStarted ? (
            <Button
              variant="outline"
              className="inline-flex bg-primary/10 border-primary/60"
              onClick={() => {
                try {
                  localStorage.clear();
                } catch {}
                navigate("/");
              }}
            >
              Logout
            </Button>
          ) : (
            <Button
              variant="outline"
              className="inline-flex items-center gap-2 bg-primary/10 border-primary/60"
              onClick={() => navigate("/get-started")}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
        </div>
      </header>

      <main className={cn("container mx-auto px-4 py-6 flex-1")}>
        {children}
      </main>

      <footer className="border-t bg-background/50">
        <div className="container mx-auto px-4 py-6" />
      </footer>
    </div>
  );
}

export default AppLayout;
