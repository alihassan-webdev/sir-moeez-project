import * as React from "react";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import Container from "@/components/layout/Container";
import SidebarPanelInner from "@/components/layout/SidebarPanelInner";
import SidebarStats from "@/components/layout/SidebarStats";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const API_URL = (() => {
  const env = import.meta.env.VITE_PREDICT_ENDPOINT as string | undefined;
  return env && env.trim() ? env : "/.netlify/functions/proxy";
})();

export default function QnA() {
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
      const parts = m.split("/");
      const cls = parts[0] || "Other";
      if (!acc[cls]) acc[cls] = [];
      acc[cls].push(cur);
      return acc;
    }, {});
  }, [entries]);

  const classOptions = React.useMemo(
    () => Object.keys(byClass).sort(),
    [byClass],
  );
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [subjectOptions, setSubjectOptions] = useState<
    { path: string; url: string; name: string }[]
  >([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [chapterOptions, setChapterOptions] = useState<
    { path: string; url: string; name: string }[]
  >([]);
  const [selectedPdfPath, setSelectedPdfPath] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [qaCount, setQaCount] = useState<number | null>(10);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const arr = selectedClass ? byClass[selectedClass] || [] : [];
    setSubjectOptions(arr);
    const subs = Array.from(new Set(arr.map((e) => subjectOf(e.path)))).sort();
    setSubjects(subs);
    setSelectedSubject("");
    setChapterOptions([]);
    setSelectedPdfPath("");
    setFile(null);
    setResult(null);
  }, [selectedClass, byClass]);

  useEffect(() => {
    const arr = (subjectOptions || []).filter(
      (s) => selectedSubject && subjectOf(s.path) === selectedSubject,
    );
    setChapterOptions(arr.slice().sort((a, b) => a.name.localeCompare(b.name)));
    setSelectedPdfPath("");
    setFile(null);
  }, [selectedSubject, subjectOptions]);

  function subjectOf(p: string) {
    const m = p.replace(/^\/?datafiles\//, "");
    const parts = m.split("/");
    return parts[1] || "General";
  }

  const handleSelectPdf = async (path: string) => {
    if (!path) return;
    const found = entries.find((e) => e.path === path);
    if (!found) return;
    try {
      const res = await fetch(found.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const f = new File([blob], found.name, { type: "application/pdf" });
      setFile(f);
      setSelectedPdfPath(path);
    } catch (err) {
      toast({ title: "Load failed", description: "Could not load PDF." });
    }
  };

  const withTimeout = async <T,>(p: Promise<T>, ms: number): Promise<T> => {
    return await new Promise<T>((resolve, reject) => {
      const id = setTimeout(() => reject(new Error("timeout")), ms);
      p.then((v) => {
        clearTimeout(id);
        resolve(v);
      }).catch((e) => {
        clearTimeout(id);
        reject(e);
      });
    });
  };

  const runSubmit = async () => {
    setError(null);
    setResult(null);
    if (!file) {
      toast({ title: "Missing PDF", description: "Attach a PDF to continue." });
      return;
    }
    const n = Number(qaCount ?? 0);
    if (!n || n < 5 || n > 50) {
      toast({ title: "Enter Q&A count", description: "5–50" });
      return;
    }

    const prompt = `Generate exactly ${n} question–answer pairs strictly from the attached PDF chapter. Use the following format and rules:\n\nQ1. <question>\nAnswer: <concise, correct answer>\n\nQ2. <question>\nAnswer: <concise, correct answer>\n\n- Do NOT include options or MCQs\n- Do NOT include explanations beyond the direct answer\n- Do NOT add any extra text before or after the list`;

    try {
      setLoading(true);
      const form = new FormData();
      form.append("pdf", file);
      form.append("file", file);
      form.append("query", prompt);

      const res = await withTimeout(
        fetch(API_URL, {
          method: "POST",
          body: form,
          headers: { Accept: "application/json" },
        }),
        45000,
      );
      if (!res.ok) throw new Error(await res.text());
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const json = await res.json();
        const text =
          typeof json === "string"
            ? json
            : (json?.questions ?? json?.result ?? json?.message ?? "");
        setResult(String(text));
      } else {
        setResult(await res.text());
      }
    } catch (err: any) {
      const msg =
        err?.message === "timeout"
          ? "Request timed out."
          : err?.message || "Request failed";
      setError(msg);
      toast({ title: "Request failed", description: msg });
    } finally {
      setLoading(false);
    }
  };

  const formatQnAHtml = (txt: string) => {
    if (!txt) return "";
    const escape = (s: string) =>
      s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");

    let out = escape(txt.trim());
    // Questions
    out = out.replace(
      /^(\s*Q\d+\.)\s*(.*)$/gim,
      '<p class="text-lg font-semibold mb-1"><strong>$1</strong> $2</p>',
    );
    // Answers
    out = out.replace(
      /^\s*Answer:\s*(.*)$/gim,
      '<div class="ml-4 mb-3 text-base text-muted-foreground"><strong class="mr-1">Answer:</strong>$1</div>',
    );
    // spacing
    out = out.replace(/\n{2,}/g, '</p><p class="mb-3">');
    out = out.replace(/\n/g, "<br />");
    if (!out.startsWith("<p") && !out.startsWith("<div"))
      out = `<p class="mb-3">${out}</p>`;
    return out;
  };

  const downloadPdf = async () => {
    if (!result) return;
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const margin = 64;
      let y = margin;
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();

      doc.setFont("times", "bold");
      doc.setFontSize(18);
      doc.text("Q&A", pageW / 2, y, { align: "center" });
      y += 24;
      doc.setDrawColor(200);
      doc.line(margin, y, pageW - margin, y);
      y += 16;

      doc.setFont("times", "normal");
      doc.setFontSize(12);
      const lines = result.split(/\n/);
      const write = (text: string) => {
        const wrapped = doc.splitTextToSize(text, pageW - margin * 2);
        for (const ln of wrapped) {
          if (y > pageH - margin) {
            doc.addPage();
            y = margin;
          }
          doc.text(ln, margin, y);
          y += 16;
        }
      };
      for (const line of lines) write(line);

      doc.save(`qna_${new Date().toISOString().replace(/[:.]/g, "-")}.pdf`);
    } catch (err) {
      toast({
        title: "Download failed",
        description: "Could not generate PDF.",
      });
    }
  };

  const canGenerate =
    !!selectedClass &&
    !!selectedSubject &&
    !!selectedPdfPath &&
    !!file &&
    !loading &&
    (qaCount ?? 0) >= 5;

  return (
    <div className="min-h-svh">
      <Container className="py-6">
        <div className="grid grid-cols-1 md:grid-cols-[260px,1fr] gap-6">
          <aside className="hidden md:block">
            <div className="rounded-xl border border-input bg-white card-yellow-shadow p-4 sticky top-4">
              <SidebarPanelInner />
              <SidebarStats />
            </div>
          </aside>
          <div>
            <section className="relative overflow-hidden rounded-2xl px-6 pt-0 pb-12 sm:pt-0 sm:pb-14 -mt-5">
              <div className="absolute inset-0 bg-background -z-10" />
              <div className="relative mx-auto max-w-3xl text-center">
                <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl text-primary">
                  Q&A Generator
                </h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  Generate question–answer cards only.
                </p>
              </div>
            </section>

            <section className="mx-auto mt-10 max-w-5xl space-y-6">
              {error && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-black">
                  {error}
                </div>
              )}

              <div className="w-full max-w-4xl mx-auto rounded-xl card-yellow-shadow border border-muted/20 bg-white p-8 sm:p-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Class
                    </label>
                    <Select
                      value={selectedClass}
                      onValueChange={(v) => setSelectedClass(v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classOptions.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Subject
                    </label>
                    <Select
                      value={selectedSubject}
                      onValueChange={(v) => setSelectedSubject(v)}
                    >
                      <SelectTrigger className="w-full" disabled={!selectedClass}>
                        <SelectValue
                          placeholder={
                            selectedClass ? "Select subject" : "Select class first"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Chapter (PDF)
                    </label>
                    <Select value={selectedPdfPath} onValueChange={handleSelectPdf}>
                      <SelectTrigger className="w-full" disabled={!selectedSubject}>
                        <SelectValue
                          placeholder={
                            selectedSubject
                              ? "Select chapter"
                              : "Select subject first"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {chapterOptions.map((opt) => (
                          <SelectItem key={opt.path} value={opt.path}>
                            {opt.name.replace(/\.pdf$/i, "")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Number of Q&A
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={5}
                        max={50}
                        value={qaCount ?? ""}
                        onChange={(e) =>
                          setQaCount(
                            e.currentTarget.value === ""
                              ? null
                              : Number(e.currentTarget.value),
                          )
                        }
                        className="w-32 rounded-md border border-input bg-muted/40 px-3 py-2 text-base hover:border-primary focus:border-primary focus:ring-0"
                        placeholder="e.g. 10"
                      />
                      <button
                        type="button"
                        onClick={() => setQaCount(10)}
                        className={`rounded-md px-3 py-2 text-sm border ${qaCount === 10 ? "bg-primary text-primary-foreground border-primary" : "bg-white text-foreground/90 border-input hover:bg-muted/50"}`}
                      >
                        10
                      </button>
                      <button
                        type="button"
                        onClick={() => setQaCount(20)}
                        className={`rounded-md px-3 py-2 text-sm border ${qaCount === 20 ? "bg-primary text-primary-foreground border-primary" : "bg-white text-foreground/90 border-input hover:bg-muted/50"}`}
                      >
                        20
                      </button>
                      <button
                        type="button"
                        onClick={() => setQaCount(30)}
                        className={`rounded-md px-3 py-2 text-sm border ${qaCount === 30 ? "bg-primary text-primary-foreground border-primary" : "bg-white text-foreground/90 border-input hover:bg-muted/50"}`}
                      >
                        30
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <Button disabled={!canGenerate} onClick={runSubmit}>
                    {loading ? "Generating..." : "Generate Q&A"}
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={!result || loading}
                    onClick={downloadPdf}
                  >
                    Download PDF
                  </Button>
                </div>
              </div>

              {result && (
                <div className="w-full max-w-4xl mx-auto">
                  <h3 className="text-sm font-semibold mb-2">Result</h3>
                  <div
                    className="rounded-md bg-background p-4 text-base leading-7 whitespace-pre-wrap break-words"
                    dangerouslySetInnerHTML={{ __html: formatQnAHtml(result) }}
                  />
                </div>
              )}
            </section>
          </div>
        </div>
      </Container>
    </div>
  );
}
