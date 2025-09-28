import React from "react";
import Container from "@/components/layout/Container";
import { Link, useLocation } from "react-router-dom";
import {
  FileText,
  Layers,
  BookOpen,
  Folder,
  ListChecks,
  MessageSquare,
} from "lucide-react";
import SidebarPanelInner from "@/components/layout/SidebarPanelInner";
import { getSubscription, nextRenewalDate } from "@/lib/subscription";

export default function GetStarted() {
  const { pathname } = useLocation();
  // Build real stats from bundled PDFs
  const pdfModules = import.meta.glob("/datafiles/**/*.pdf", {
    as: "url",
    eager: true,
  }) as Record<string, string>;
  const entries = React.useMemo(
    () =>
      Object.entries(pdfModules).map(([path, url]) => ({
        path,
        url,
        name: path.split("/").pop() || "file.pdf",
      })),
    [pdfModules],
  );
  const byClass = React.useMemo(() => {
    return entries.reduce<
      Record<string, { path: string; url: string; name: string }[]>
    >((acc, cur) => {
      const m = cur.path.replace(/^\/?datafiles\//, "");
      const cls = m.split("/")[0] || "Other";
      if (!acc[cls]) acc[cls] = [];
      acc[cls].push(cur);
      return acc;
    }, {});
  }, [entries]);
  const classes = React.useMemo(() => Object.keys(byClass).sort(), [byClass]);
  const subjects = React.useMemo(() => {
    const s = new Set<string>();
    for (const arr of Object.values(byClass)) {
      for (const e of arr) {
        const m = e.path.replace(/^\/?datafiles\//, "");
        const subject = (m.split("/")[1] || "General").trim();
        if (subject) s.add(subject);
      }
    }
    return Array.from(s).sort();
  }, [byClass]);
  const chaptersCount = entries.length;

  return (
    <div className="min-h-svh">
      {/* Main content with sidebar */}
      <Container className="py-6">
        <div className="grid grid-cols-1 md:grid-cols-[260px,1fr] gap-6">
          {/* Sidebar (md+) */}
          <aside className="hidden md:block">
            <div className="rounded-xl border border-input bg-white card-yellow-shadow p-4 sticky top-4">
              <SidebarPanelInner />

              <div className="mt-5 border-t pt-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="rounded-lg border border-input bg-white px-4 py-3">
                    <div className="text-xs font-semibold text-muted-foreground">
                      Classes
                    </div>
                    <div className="text-lg font-extrabold">
                      {classes.length}
                    </div>
                  </div>
                  <div className="rounded-lg border border-input bg-white px-4 py-3">
                    <div className="text-xs font-semibold text-muted-foreground">
                      Subjects
                    </div>
                    <div className="text-lg font-extrabold">
                      {subjects.length}
                    </div>
                  </div>
                  <div className="rounded-lg border border-input bg-white px-4 py-3">
                    <div className="text-xs font-semibold text-muted-foreground">
                      Chapters
                    </div>
                    <div className="text-lg font-extrabold">
                      {chaptersCount}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main column */}
          <div>
            {/* Stats (mobile) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:hidden">
              <div className="rounded-xl bg-white border border-input px-5 py-4 card-yellow-shadow flex items-center gap-3">
                <Layers className="h-5 w-5 text-primary" aria-hidden="true" />
                <div>
                  <div className="text-sm font-semibold">Classes</div>
                  <div className="text-lg font-extrabold">{classes.length}</div>
                </div>
              </div>
              <div className="rounded-xl bg-white border border-input px-5 py-4 card-yellow-shadow flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
                <div>
                  <div className="text-sm font-semibold">Subjects</div>
                  <div className="text-lg font-extrabold">
                    {subjects.length}
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-white border border-input px-5 py-4 card-yellow-shadow flex items-center gap-3">
                <Folder className="h-5 w-5 text-primary" aria-hidden="true" />
                <div>
                  <div className="text-sm font-semibold">Chapters (PDF)</div>
                  <div className="text-lg font-extrabold">{chaptersCount}</div>
                </div>
              </div>
            </div>

            {/* Welcome text */}
            <div className="mt-4 rounded-xl bg-white p-6 border border-input card-yellow-shadow">
              <h2 className="text-2xl font-bold">Welcome to PaperGen</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Generate exam papers and revision cards quickly from your
                uploaded chapters. Choose a class, select a subject and
                chapters, then customise the number of questions or marks —
                PaperGen will create printable PDFs ready to use for tests or
                revision.
              </p>
            </div>

            {/* Quick create */}
            <div className="mt-4">
              <h2 className="text-xl sm:text-2xl font-bold">Quick create</h2>
              <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 auto-rows-fr">
                <Link
                  to="/mcqs"
                  className="group w-full h-full rounded-xl border bg-white p-3.5 sm:p-4 card-yellow-shadow hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary/60 transition shadow-sm"
                >
                  <div className="flex flex-col items-center text-center h-full">
                    <div className="rounded-full bg-primary/10 p-2.5 sm:p-3 mb-2 text-primary group-hover:bg-primary/15">
                      <ListChecks
                        className="h-7 w-7 sm:h-8 sm:w-8"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="text-base font-semibold">Generate MCQs</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Create multiple-choice questions from chapters
                    </div>
                  </div>
                </Link>

                <Link
                  to="/qna"
                  className="group w-full h-full rounded-xl border bg-white p-3.5 sm:p-4 card-yellow-shadow hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary/60 transition shadow-sm"
                >
                  <div className="flex flex-col items-center text-center h-full">
                    <div className="rounded-full bg-primary/10 p-2.5 sm:p-3 mb-2 text-primary group-hover:bg-primary/15">
                      <MessageSquare
                        className="h-7 w-7 sm:h-8 sm:w-8"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="text-base font-semibold">Generate Q&A</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Generate question–answer cards for quick revision
                    </div>
                  </div>
                </Link>

                <Link
                  to="/app"
                  className="group w-full h-full rounded-xl border bg-white p-3.5 sm:p-4 card-yellow-shadow hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary/60 transition shadow-sm"
                >
                  <div className="flex flex-col items-center text-center h-full">
                    <div className="rounded-full bg-primary/10 p-2.5 sm:p-3 mb-2 text-primary group-hover:bg-primary/15">
                      <FileText
                        className="h-7 w-7 sm:h-8 sm:w-8"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="text-base font-semibold">Generate Exam</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Open the Test Paper Generator
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* My account */}
            <div className="mt-6">
              <h2 className="text-xl sm:text-2xl font-bold">My account</h2>
              <MyAccountCards />
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

function MyAccountCards() {
  const sub = React.useMemo(() => getSubscription(), []);
  const renewal = React.useMemo(() => nextRenewalDate(sub).toLocaleDateString(), [sub]);
  return (
    <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
      <Link
        to="/subscription"
        className="group w-full h-full rounded-xl border bg-white p-3.5 sm:p-4 card-yellow-shadow hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary/60 transition shadow-sm"
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between">
            <div className="text-base font-semibold">Manage subscription</div>
            <span className="text-xs rounded-full border border-input px-2 py-0.5 capitalize bg-primary/10 text-primary">
              {sub.frequency}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Current plan: <span className="capitalize font-medium">{sub.planId}</span>
          </div>
          <div className="mt-auto pt-3 text-xs text-muted-foreground">
            Next renewal: {renewal}
          </div>
        </div>
      </Link>
    </div>
  );
}
