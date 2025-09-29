import { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, PropsWithChildren } from "react";
import MobileSheet from "@/components/layout/MobileSheet";
import { useSwipeNavigation } from "@/hooks/use-swipe-navigation";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useProfileLock } from "@/hooks/useProfileLock";

export function AppLayout({ children }: PropsWithChildren) {
  const location = useLocation();
  const path = location.pathname;
  const [routeLoading, setRouteLoading] = useState(false);
  const navigate = useNavigate();
  const isGetStarted = path === "/get-started";
  const isToolRoute = [
    "/get-started",
    "/app",
    "/mcqs",
    "/qna",
    "/syllabus",
    "/subscription",
    "/profile",
    "/onboarding",
    "/support",
  ].includes(path);

  useSwipeNavigation(() => {
    if (window.history.length > 1) navigate(-1);
  });

  useEffect(() => {
    setRouteLoading(true);
    const t = setTimeout(() => setRouteLoading(false), 450);
    return () => clearTimeout(t);
  }, [path]);

  const { locked } = useProfileLock();
  const lockActive = locked && path !== "/profile" && path !== "/my-profile";

  return (
    <div className="flex min-h-svh w-full flex-col">
      {/* Incomplete profile banner */}
      {locked && (
        <>
          <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white shadow-[0_6px_18px_rgba(16,24,40,0.16)] ring-1 ring-white/10">
            <div className="mx-auto max-w-6xl px-6 py-2.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-[13px] sm:text-sm font-semibold tracking-tight">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                  <Lock className="h-3.5 w-3.5" />
                </span>
                <span>⚠️ Please complete your profile setup to unlock all features.</span>
              </div>
              <Button asChild size="sm" className="bg-white text-red-700 hover:bg-white/90 shadow-md">
                <Link to="/my-profile">Go to Profile</Link>
              </Button>
            </div>
          </div>
          <div aria-hidden className="h-11" />
        </>
      )}

      <header className="w-full sticky top-0 z-30 bg-white border-b border-input">
        <div className="mx-auto max-w-6xl px-6 py-4 flex w-full items-center gap-2">
          <Link
            to="/"
            className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-black"
          >
            <span className="inline-flex h-8 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
              PG
            </span>
            <span>PaperGen</span>
          </Link>
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

      <div className={cn("relative flex-1", lockActive ? "pointer-events-none select-none" : undefined)}>
        <main className={cn("flex-1", lockActive ? "filter blur-sm" : undefined)}>{children}</main>
        {lockActive && (
          <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-[1.5px]">
            <div className="relative">
              <span className="absolute inline-flex h-16 w-16 rounded-full bg-primary/30 opacity-75 animate-ping" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/25 shadow-xl">
                <Lock className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>
        )}
      </div>

      {path !== "/login" && (
        <footer className="border-t bg-background/50">
          <div className="container mx-auto px-4 py-6" />
        </footer>
      )}
    </div>
  );
}

export default AppLayout;
