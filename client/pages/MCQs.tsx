import * as React from "react";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import Container from "@/components/layout/Container";
import SidebarPanelInner from "@/components/layout/SidebarPanelInner";
import SidebarStats from "@/components/layout/SidebarStats";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

// Reuse the same proxy logic as Index
const API_URL = (() => {
  const env = import.meta.env.VITE_PREDICT_ENDPOINT as string | undefined;
  return env && env.trim() ? env : "/.netlify/functions/proxy";
})();

export default function MCQs() {
  // Build file catalog from /datafiles/**
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
  const [mcqCount, setMcqCount] = useState<number | null>(20);

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

  // Debug: log key variables to help diagnose subject selection issues
  React.useEffect(() => {
    // eslint-disable-next-line no-console
    console.log("MCQs Debug: classOptions=", classOptions);
    // eslint-disable-next-line no-console
    console.log("MCQs Debug: selectedClass=", selectedClass);
    // eslint-disable-next-line no-console
    console.log("MCQs Debug: subjectOptions=", subjectOptions);
    // eslint-disable-next-line no-console
    console.log("MCQs Debug: subjects=", subjects);
  }, [classOptions, selectedClass, subjectOptions, subjects]);

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
    const n = Number(mcqCount ?? 0);
    if (!n || n < 5 || n > 100) {
      toast({ title: "Enter MCQ count", description: "5–100" });
      return;
    }

    const prompt = `Generate exactly ${n} multiple-choice questions (MCQs) based strictly on the attached PDF chapter. Each MCQ must:
- Be labeled sequentially (Q1., Q2., ...)
- Include four options labeled a), b), c), d)
- Be clear and unambiguous
- Do NOT include the answers or explanations
- Do NOT include any extra text before or after the questions`;

    try {
      setLoading(true);

      const sendTo = async (urlStr: string, timeoutMs: number) => {
        const isExternal = /^https?:/i.test(urlStr);
        const form = new FormData();
        form.append("pdf", file);
        form.append("file", file);
        form.append("query", prompt);
        const res = await withTimeout(
          fetch(urlStr, {
            method: "POST",
            body: form,
            headers: { Accept: "application/json" },
            ...(isExternal
              ? {
                  mode: "cors" as const,
                  credentials: "omit" as const,
                  referrerPolicy: "no-referrer" as const,
                }
              : {}),
          }),
          timeoutMs,
        );
        return res;
      };

      let res: Response | null = null;
      if (API_URL) {
        try {
          res = await sendTo(API_URL, 45000);
        } catch {
          res = null;
        }
      }
      if (!res || !res.ok) {
        const proxies = [
          "/.netlify/functions/proxy",
          "/api/generate-questions",
        ];
        for (const proxyPath of proxies) {
          try {
            const attempt = await sendTo(proxyPath, 55000);
            if (attempt && attempt.ok) {
              res = attempt;
              break;
            }
          } catch {}
        }
      }

      if (!res) {
        throw new Error("Network error. Please try again.");
      }
      if (!res.ok) {
        let detail = "";
        try {
          detail = await res.clone().text();
        } catch (e) {
          detail = res.statusText || "";
        }
        throw new Error(detail || `HTTP ${res.status}`);
      }

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        try {
          const json = await res.clone().json();
          const text =
            typeof json === "string"
              ? json
              : (json?.questions ?? json?.result ?? json?.message ?? "");
          setResult(String(text));
        } catch {
          const txt = await res
            .clone()
            .text()
            .catch(() => "");
          setResult(txt);
        }
      } else {
        const txt = await res.clone().text();
        setResult(txt);
      }
    } catch (err: any) {
      const msg =
        err?.message === "timeout"
          ? "Request timed out. Please try again."
          : err?.message || "Request failed";
      setError(msg);
      toast({ title: "Request failed", description: msg });
    } finally {
      setLoading(false);
    }
  };

  const formatMcqHtml = (txt: string) => {
    if (!txt) return "";
    // escape HTML
    const escape = (s: string) =>
      s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");

    let out = escape(txt);
    // MCQ question lines
    out = out.replace(
      /^(\s*Q\d+\.)\s*(.*)$/gim,
      '<p class="text-lg font-semibold mb-2"><strong>$1</strong> $2</p>',
    );
    // options a) b) c) d)
    out = out.replace(
      /^\s*([a-d])\)\s*(.*)$/gim,
      '<div class="ml-6 mb-1"><strong class="mr-2">$1)</strong>$2</div>',
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
      doc.text("MCQs", pageW / 2, y, { align: "center" });
      y += 24;
      doc.setDrawColor(200);
      doc.line(margin, y, pageW - margin, y);
      y += 16;

      // Render result as plain text, simple wrapping
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

      for (const line of lines) {
        write(line);
      }

      doc.save(`mcqs_${new Date().toISOString().replace(/[:.]/g, "-")}.pdf`);
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
    (mcqCount ?? 0) >= 5;

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
                  MCQ Generator
                </h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  Generate multiple-choice questions only, with four options
                  (a–d).
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
                  {/* Class */}
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

                  {/* Subject */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Subject
                    </label>
                    <Select
                      value={selectedSubject}
                      onValueChange={(v) => setSelectedSubject(v)}
                    >
                      <SelectTrigger
                        className="w-full"
                        disabled={!selectedClass}
                      >
                        <SelectValue
                          placeholder={
                            selectedClass
                              ? "Select subject"
                              : "Select class first"
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

                  {/* Chapter */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Chapter (PDF)
                    </label>
                    <Select
                      value={selectedPdfPath}
                      onValueChange={handleSelectPdf}
                    >
                      <SelectTrigger
                        className="w-full"
                        disabled={!selectedSubject}
                      >
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

                  {/* MCQ Count */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Number of MCQs
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={5}
                        max={100}
                        value={mcqCount ?? ""}
                        onChange={(e) =>
                          setMcqCount(
                            e.currentTarget.value === ""
                              ? null
                              : Number(e.currentTarget.value),
                          )
                        }
                        className="w-32 rounded-md border border-input bg-muted/40 px-3 py-2 text-base hover:border-primary focus:border-primary focus:ring-0"
                        placeholder="e.g. 20"
                      />
                      <button
                        type="button"
                        onClick={() => setMcqCount(10)}
                        className={`rounded-md px-3 py-2 text-sm border ${mcqCount === 10 ? "bg-primary text-primary-foreground border-primary" : "bg-white text-foreground/90 border-input hover:bg-muted/50"}`}
                      >
                        10
                      </button>
                      <button
                        type="button"
                        onClick={() => setMcqCount(20)}
                        className={`rounded-md px-3 py-2 text-sm border ${mcqCount === 20 ? "bg-primary text-primary-foreground border-primary" : "bg-white text-foreground/90 border-input hover:bg-muted/50"}`}
                      >
                        20
                      </button>
                      <button
                        type="button"
                        onClick={() => setMcqCount(30)}
                        className={`rounded-md px-3 py-2 text-sm border ${mcqCount === 30 ? "bg-primary text-primary-foreground border-primary" : "bg-white text-foreground/90 border-input hover:bg-muted/50"}`}
                      >
                        30
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <Button disabled={!canGenerate} onClick={runSubmit}>
                    {loading ? "Generating..." : "Generate MCQs"}
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
                    dangerouslySetInnerHTML={{ __html: formatMcqHtml(result) }}
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
