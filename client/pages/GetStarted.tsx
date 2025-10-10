import React from "react";
import Container from "@/components/layout/Container";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  BookOpen,
  ListChecks,
  MessageSquare,
  History,
  CreditCard,
  User,
  LifeBuoy
} from "lucide-react";
import { getSubscription, nextRenewalDate } from "@/lib/subscription";

export default function GetStarted() {
  const navigate = useNavigate();
  // Build real stats from bundled PDFs
  const pdfModules = import.meta.glob("/datafiles/**/*.pdf", {
    query: "?url",
    import: "default",
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
        <div className="grid grid-cols-1 gap-6">
          {/* Sidebar (md+) */}

          {/* Main column */}
          <div>
            {/* Stats removed per request */}

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

            {/* Exams */}
            <div className="mt-4">
              <h2 className="text-xl sm:text-2xl font-bold">Exams</h2>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 auto-rows-fr">
                <button
                  type="button"
                  onClick={() => navigate("/mcqs")}
                  className="group w-full h-full rounded-xl border bg-white p-3.5 sm:p-4 card-yellow-shadow hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary/60 transition shadow-sm text-left"
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
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/qna")}
                  className="group w-full h-full rounded-xl border bg-white p-3.5 sm:p-4 card-yellow-shadow hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary/60 transition shadow-sm text-left"
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
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/app")}
                  className="group w-full h-full rounded-xl border bg-white p-3.5 sm:p-4 card-yellow-shadow hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary/60 transition shadow-sm text-left"
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
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/syllabus")}
                  className="group w-full h-full rounded-xl border bg-white p-3.5 sm:p-4 card-yellow-shadow hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary/60 transition shadow-sm text-left"
                >
                  <div className="flex flex-col items-center text-center h-full">
                    <div className="rounded-full bg-primary/10 p-2.5 sm:p-3 mb-2 text-primary group-hover:bg-primary/15">
                      <BookOpen
                        className="h-7 w-7 sm:h-8 sm:w-8"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="text-base font-semibold">Syllabus</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Browse and download chapters by class & subject
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/results")}
                  className="group w-full h-full rounded-xl border bg-white p-3.5 sm:p-4 card-yellow-shadow hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary/60 transition shadow-sm text-left"
                >
                  <div className="flex flex-col items-center text-center h-full">
                    <div className="rounded-full bg-primary/10 p-2.5 sm:p-3 mb-2 text-primary group-hover:bg-primary/15">
                      <History
                        className="h-7 w-7 sm:h-8 sm:w-8"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="text-base font-semibold">Results</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      View and download your exam results
                    </div>
                  </div>
                </button>

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
  const navigate = useNavigate();
  const sub = React.useMemo(() => getSubscription(), []);
  const renewal = React.useMemo(
    () => nextRenewalDate(sub).toLocaleDateString(),
    [sub],
  );
  return (
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 auto-rows-fr">
      <button
        type="button"
        onClick={() => navigate("/subscription")}
        className="group w-full h-full rounded-xl border bg-white p-3.5 sm:p-4 card-yellow-shadow hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary/60 transition shadow-sm text-left"
      >
        <div className="flex flex-col items-center text-center h-full">
          <div className="rounded-full bg-primary/10 p-2.5 sm:p-3 mb-2 text-primary group-hover:bg-primary/15">
            <CreditCard className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden="true" />
          </div>
          <div className="text-base font-semibold">Manage subscription</div>
          <div className="mt-1">
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
      </button>

      <button
        type="button"
        onClick={() => navigate("/profile")}
        className="group w-full h-full rounded-xl border bg-white p-3.5 sm:p-4 card-yellow-shadow hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary/60 transition shadow-sm text-left"
      >
        <div className="flex flex-col items-center text-center h-full">
          <div className="rounded-full bg-primary/10 p-2.5 sm:p-3 mb-2 text-primary group-hover:bg-primary/15">
            <User className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden="true" />
          </div>
          <div className="text-base font-semibold">My profile</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Update your name and phone.
          </div>
          <div className="mt-auto pt-3 text-xs text-muted-foreground">
            Email linked to your login.
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={() => navigate("/support")}
        className="group w-full h-full rounded-xl border bg-white p-3.5 sm:p-4 card-yellow-shadow hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary/60 transition shadow-sm text-left"
      >
        <div className="flex flex-col items-center text-center h-full">
          <div className="rounded-full bg-primary/10 p-2.5 sm:p-3 mb-2 text-primary group-hover:bg-primary/15">
            <LifeBuoy className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden="true" />
          </div>
          <div className="text-base font-semibold">Support</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Create a ticket for help or billing queries.
          </div>
          <div className="mt-auto pt-3 text-xs text-muted-foreground">
            Response via email.
          </div>
        </div>
      </button>
    </div>
  );
}
