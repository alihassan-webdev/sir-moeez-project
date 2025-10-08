import * as React from "react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export default function MobileSheet() {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const handleNavigate = (target: string) => {
    navigate(target);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="inline-flex items-center justify-center rounded-md border border-input bg-white p-2 card-yellow-shadow"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="overflow-y-auto scrollbar-none">
        <SheetHeader>
          <SheetTitle>Navigate</SheetTitle>
        </SheetHeader>
        <div className="mt-2 flex flex-col gap-2 p-2">
          <SheetClose asChild>
            <button
              type="button"
              onClick={() => handleNavigate("/get-started")}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                pathname === "/get-started"
                  ? "bg-primary text-primary-foreground"
                  : "transition-colors hover:bg-primary/10"
              }`}
            >
              Dashboard
            </button>
          </SheetClose>

          <div className="mt-2 mb-1 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80">
            Exams
          </div>
          <SheetClose asChild>
            <button
              type="button"
              onClick={() => handleNavigate("/mcqs")}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                pathname === "/mcqs"
                  ? "bg-primary text-primary-foreground"
                  : "transition-colors hover:bg-primary/10"
              }`}
            >
              Generate MCQs
            </button>
          </SheetClose>

          <SheetClose asChild>
            <button
              type="button"
              onClick={() => handleNavigate("/qna")}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                pathname === "/qna"
                  ? "bg-primary text-primary-foreground"
                  : "transition-colors hover:bg-primary/10"
              }`}
            >
              Generate Q&A
            </button>
          </SheetClose>

          <SheetClose asChild>
            <button
              type="button"
              onClick={() => handleNavigate("/app")}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                pathname === "/app"
                  ? "bg-primary text-primary-foreground"
                  : "transition-colors hover:bg-primary/10"
              }`}
            >
              Generate Exam
            </button>
          </SheetClose>

          <SheetClose asChild>
            <button
              type="button"
              onClick={() => handleNavigate("/syllabus")}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                pathname === "/syllabus"
                  ? "bg-primary text-primary-foreground"
                  : "transition-colors hover:bg-primary/10"
              }`}
            >
              Syllabus
            </button>
          </SheetClose>
          <SheetClose asChild>
            <button
              type="button"
              onClick={() => handleNavigate("/results")}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                pathname.startsWith("/results")
                  ? "bg-primary text-primary-foreground"
                  : "transition-colors hover:bg-primary/10"
              }`}
            >
              Result History
            </button>
          </SheetClose>

          <div className="mt-2 mb-1 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80">
            My account
          </div>
          <SheetClose asChild>
            <button
              type="button"
              onClick={() => handleNavigate("/subscription")}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                pathname === "/subscription"
                  ? "bg-primary text-primary-foreground"
                  : "transition-colors hover:bg-primary/10"
              }`}
            >
              Manage Subscription
            </button>
          </SheetClose>
          <SheetClose asChild>
            <button
              type="button"
              onClick={() => handleNavigate("/profile")}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                pathname === "/profile"
                  ? "bg-primary text-primary-foreground"
                  : "transition-colors hover:bg-primary/10"
              }`}
            >
              My Profile
            </button>
          </SheetClose>
          <SheetClose asChild>
            <button
              type="button"
              onClick={() => handleNavigate("/support")}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                pathname === "/support"
                  ? "bg-primary text-primary-foreground"
                  : "transition-colors hover:bg-primary/10"
              }`}
            >
              Support
            </button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
