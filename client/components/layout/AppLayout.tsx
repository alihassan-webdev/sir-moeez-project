import { useEffect, useState, PropsWithChildren } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import MobileSheet from "@/components/layout/MobileSheet";
import { useSwipeNavigation } from "@/hooks/use-swipe-navigation";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import SidebarPanelInner from "@/components/layout/SidebarPanelInner";

export function AppLayout({ children }: PropsWithChildren) {
  const location = useLocation();
  const path = location.pathname;
  const [routeLoading, setRouteLoading] = useState(false);
  const navigate = useNavigate();
  const isGetStarted = path === "/get-started";
  const isToolRoute =
    [
      "/get-started",
      "/app",
      "/mcqs",
      "/qna",
      "/syllabus",
      "/templates",
      "/subscription",
      "/profile",
      "/onboarding",
      "/support",
    ].includes(path) || path.startsWith("/results");

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
      <header className="w-full sticky top-0 z-30 bg-white border-b border-input">
        <div className="mx-auto max-w-6xl px-6 py-4 flex w-full items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-black"
          >
            <span className="inline-flex h-8 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
              PG
            </span>
            <span>PaperGen</span>
          </button>
          <div className="ml-auto flex items-center gap-2">
            {isGetStarted ? (
              <Button
                variant="outline"
                className="inline-flex bg-primary/10 border-primary/60"
                onClick={async () => {
                  try {
                    await signOut(auth);
                  } catch {}
                  navigate("/");
                }}
              >
                Logout
              </Button>
            ) : (
              <Button
                variant="outline"
                className="hidden md:inline-flex items-center gap-2 bg-primary/10 border-primary/60"
                onClick={() =>
                  navigate(path === "/login" ? "/" : "/get-started")
                }
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            {isToolRoute && (
              <div className="md:hidden">
                <MobileSheet />
              </div>
            )}
          </div>
        </div>
      </header>

      {isToolRoute && (
        <aside className="hidden md:block fixed left-6 top-28 bottom-0 w-[260px] z-20">
          <div className="h-full overflow-y-auto scrollbar-none border border-input bg-white p-4 rounded-xl shadow-sm">
            <SidebarPanelInner />
          </div>
        </aside>
      )}

      <main className={cn("flex-1", isToolRoute && "md:pl-[320px]")}>
        {children}
      </main>

      {path !== "/login" && (
        <footer className="border-t bg-background/50">
          <div className="container mx-auto px-4 py-6" />
        </footer>
      )}
    </div>
  );
}

export default AppLayout;
