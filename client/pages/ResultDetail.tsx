import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Container from "@/components/layout/Container";
import SidebarPanelInner from "@/components/layout/SidebarPanelInner";
import { examTypeLabels, fetchAllResultsByType, type ExamType } from "@/lib/results";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft } from "lucide-react";
import { generateExamStylePdf } from "@/lib/pdf";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

function useInstituteHeader() {
  const [inst, setInst] = useState<{ instituteName?: string; instituteLogo?: string } | null>(null);
  useEffect(() => {
    const u = auth.currentUser;
    if (!u?.uid) return;
    const ref = doc(db, "users", u.uid);
    const unsub = onSnapshot(ref, (snap) => {
      const d = snap.data() as any | undefined;
      if (!d) {
        setInst(null);
        return;
      }
      setInst({
        instituteName: String(d.instituteName || d.name || ""),
        instituteLogo: typeof d.instituteLogo === "string" ? d.instituteLogo : undefined,
      });
    });
    return () => unsub();
  }, []);
  return inst ?? {};
}

export default function ResultDetail() {
  const params = useParams();
  const type = (params.type as ExamType) || "mcqs";
  const label = examTypeLabels[type] || "Results";
  const [items, setItems] = useState<Awaited<ReturnType<typeof fetchAllResultsByType>>>([]);
  const header = useInstituteHeader();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetchAllResultsByType(type);
      if (!cancelled) setItems(res);
    })();
    return () => {
      cancelled = true;
    };
  }, [type]);

  const handleDownload = async (content: string) => {
    await generateExamStylePdf({
      title: label,
      body: content,
      filenameBase: label.toLowerCase().replace(/\s+/g, "_"),
      instituteHeader: header,
    });
  };

  return (
    <div className="min-h-svh">
      <Container className="py-6">
        <div className="grid grid-cols-1 md:grid-cols-[260px,1fr] gap-6">
          <aside className="hidden md:block">
            <div className="rounded-xl border border-input bg-white card-yellow-shadow p-4 sticky top-4">
              <SidebarPanelInner />
            </div>
          </aside>

          <div>
            <section className="relative overflow-hidden rounded-2xl px-6 pt-0 pb-12 sm:pt-0 sm:pb-14 mt-4">
              <div className="absolute inset-0 bg-background -z-10" />
              <div className="relative mx-auto max-w-3xl text-center">
                <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl text-primary">
                  {label} — Results
                </h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  Your generated results for {label} with download options.
                </p>
                <div className="mt-4">
                  <Link to="/results" className="inline-flex items-center text-sm text-primary">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back to Result History
                  </Link>
                </div>
              </div>
            </section>

            <section className="mx-auto mt-8 max-w-5xl space-y-3">
              {items.length === 0 && (
                <div className="rounded-xl bg-white border border-input p-6 text-center text-sm text-muted-foreground">
                  No results yet.
                </div>
              )}
              {items.map((it) => {
                const ts = (it.createdAt as any)?.toMillis?.() || it.generatedDateTime || 0;
                const date = ts ? new Date(ts).toLocaleString() : "";
                return (
                  <div key={it.id} className="rounded-xl bg-white border border-input p-4 sm:p-5 card-yellow-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="text-sm text-muted-foreground">Generated</div>
                        <div className="text-base font-semibold">{date}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => handleDownload(it.content)}
                          className="inline-flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" /> Download PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>
          </div>
        </div>
      </Container>
    </div>
  );
}
