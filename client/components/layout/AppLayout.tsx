import { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Menu } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { useSwipeNavigation } from "@/hooks/use-swipe-navigation";
import SidebarStats from "@/components/layout/SidebarStats";

export function AppLayout({ children }: PropsWithChildren) {
  const location = useLocation();
  const path = location.pathname;
  const [routeLoading, setRouteLoading] = useState(false);
  const navigate = useNavigate();
  const isGetStarted = path === "/get-started";
  const isToolRoute = ["/get-started", "/mcqs", "/qna", "/app"].includes(path);

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
                className="hidden md:inline-flex items-center gap-2 bg-primary/10 border-primary/60"
                onClick={() => navigate("/get-started")}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            {isToolRoute && (
              <div className="md:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <button
                      className="inline-flex items-center gap-2 rounded-md border border-input bg-white px-3 py-2 card-yellow-shadow"
                      aria-label="Open navigation"
                    >
                      <Menu className="h-5 w-5" aria-hidden="true" />
                      <span className="text-sm font-medium">Menu</span>
                    </button>
                  </SheetTrigger>
                  <SheetContent side="right">
                    <SheetHeader>
                      <SheetTitle>Navigate</SheetTitle>
                    </SheetHeader>
                    <div className="mt-2 flex flex-col gap-2 p-2">
                      <SheetClose asChild>
                        <Link
                          to="/get-started"
                          className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm ${path === "/get-started" ? "bg-primary text-primary-foreground hover:text-primary-foreground" : "transition-colors hover:bg-primary/10"}`}
                        >
                          Dashboard
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link
                          to="/mcqs"
                          className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm ${path === "/mcqs" ? "bg-primary text-primary-foreground hover:text-primary-foreground" : "transition-colors hover:bg-primary/10"}`}
                        >
                          Generate MCQs
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link
                          to="/qna"
                          className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm ${path === "/qna" ? "bg-primary text-primary-foreground hover:text-primary-foreground" : "transition-colors hover:bg-primary/10"}`}
                        >
                          Generate Q&A
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link
                          to="/app"
                          className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm ${path === "/app" ? "bg-primary text-primary-foreground hover:text-primary-foreground" : "transition-colors hover:bg-primary/10"}`}
                        >
                          Generate Exam
                        </Link>
                      </SheetClose>
                    </div>

                    <div className="mt-4 p-2">
                      <div className="text-sm font-semibold text-muted-foreground px-1">Stats</div>
                      <div className="mt-2">
                        <SidebarStats />
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            )}
          </div>
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
