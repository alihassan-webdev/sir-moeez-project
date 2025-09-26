import * as React from "react";
import Container from "@/components/layout/Container";
import { Link, useLocation } from "react-router-dom";
import {
  FileText,
  ListChecks,
  MessageSquare,
  Layers,
  BookOpen,
  Folder,
  LayoutGrid,
} from "lucide-react";

function NavItem({
  to,
  icon: Icon,
  label,
  active,
}: {
  to: string;
  icon: React.ComponentType<any>;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors ${
        active ? "bg-primary text-primary-foreground" : "hover:bg-primary/10"
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span className="font-medium">{label}</span>
    </Link>
  );
}

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
      {/* Top hero with brand and new title */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="h-28 bg-gradient-to-b from-primary/10 to-transparent" />
        </div>
        <Container className="pt-6 pb-4">
          <div className="flex items-center justify-center sm:justify-between gap-4">
            {/* Brand like landing */}
                      </div>
        </Container>
      </div>

      {/* Main content with sidebar */}
      <Container className="py-6">
        <div className="grid grid-cols-1 md:grid-cols-[260px,1fr] gap-6">
          {/* Sidebar (md+) */}
          <aside className="hidden md:block">
            <div className="rounded-xl border border-input bg-white card-yellow-shadow p-4 sticky top-20">
              <div className="mb-3 px-1 text-xs font-semibold text-muted-foreground">
                Navigation
              </div>
              <nav className="flex flex-col gap-1">
                <NavItem
                  to="/get-started"
                  icon={LayoutGrid}
                  label="Dashboard"
                  active={pathname === "/get-started"}
                />
                <NavItem
                  to="/mcqs"
                  icon={ListChecks}
                  label="Generate MCQs"
                  active={pathname === "/mcqs"}
                />
                <NavItem
                  to="/qna"
                  icon={MessageSquare}
                  label="Generate Q&A"
                  active={pathname === "/qna"}
                />
                <NavItem
                  to="/app"
                  icon={FileText}
                  label="Generate Exam"
                  active={pathname === "/app"}
                />
              </nav>

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

            {/* Quick create */}
            <div className="mt-4">
              <h2 className="text-xl sm:text-2xl font-bold">Quick create</h2>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 auto-rows-fr">
                <Link
                  to="/mcqs"
                  className="group w-full h-full rounded-xl border bg-white p-5 sm:p-6 card-yellow-shadow hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary/60 transition shadow-sm"
                >
                  <div className="flex flex-col items-center text-center h-full">
                    <div className="rounded-full bg-primary/10 p-3.5 sm:p-4 mb-3 text-primary group-hover:bg-primary/15">
                      <ListChecks
                        className="h-9 w-9 sm:h-10 sm:w-10"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="text-lg font-semibold">Generate MCQs</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Create multiple-choice questions from chapters
                    </div>
                  </div>
                </Link>

                <Link
                  to="/qna"
                  className="group w-full h-full rounded-xl border bg-white p-5 sm:p-6 card-yellow-shadow hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary/60 transition shadow-sm"
                >
                  <div className="flex flex-col items-center text-center h-full">
                    <div className="rounded-full bg-primary/10 p-3.5 sm:p-4 mb-3 text-primary group-hover:bg-primary/15">
                      <MessageSquare
                        className="h-9 w-9 sm:h-10 sm:w-10"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="text-lg font-semibold">Generate Q&A</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Generate question–answer cards for quick revision
                    </div>
                  </div>
                </Link>

                <Link
                  to="/app"
                  className="group w-full h-full rounded-xl border bg-white p-5 sm:p-6 card-yellow-shadow hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary/60 transition shadow-sm"
                >
                  <div className="flex flex-col items-center text-center h-full">
                    <div className="rounded-full bg-primary/10 p-3.5 sm:p-4 mb-3 text-primary group-hover:bg-primary/15">
                      <FileText
                        className="h-9 w-9 sm:h-10 sm:w-10"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="text-lg font-semibold">Generate Exam</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Open the Test Paper Generator
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Browse by class */}
            <div className="mt-8">
              <h2 className="text-xl sm:text-2xl font-bold">Browse by class</h2>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
                {classes.map((cls) => {
                  const total = (byClass[cls] || []).length;
                  const subjSet = new Set<string>();
                  for (const e of byClass[cls] || []) {
                    const m = e.path.replace(/^\/?datafiles\//, "");
                    subjSet.add((m.split("/")[1] || "General").trim());
                  }
                  return (
                    <Link
                      to="/app"
                      key={cls}
                      className="rounded-xl bg-white border border-input p-5 card-yellow-shadow hover:shadow-lg hover:-translate-y-0.5 transition"
                    >
                      <div className="text-lg font-semibold">{cls}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {subjSet.size} subjects • {total} chapters
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
