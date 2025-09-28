import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Container from "@/components/layout/Container";
import SidebarPanelInner from "@/components/layout/SidebarPanelInner";
import SidebarStats from "@/components/layout/SidebarStats";
import { ListChecks, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Entry = { path: string; url: string; name: string };

// API endpoint selection: same fallback as Index
const API_URL = (() => {
  const env = (import.meta.env as any).VITE_PREDICT_ENDPOINT as
    | string
    | undefined;
  return env && env.trim() ? env : "/api/generate-questions";
})();

export default function MCQs() {
  const pdfModules = import.meta.glob("/datafiles/**/*.pdf", {
    as: "url",
    eager: true,
  }) as Record<string, string>;

  const entries: Entry[] = Object.entries(pdfModules).map(([path, url]) => ({
    path,
    url,
    name: path.split("/").pop() || "file.pdf",
  }));

  const byClass = entries.reduce<Record<string, Entry[]>>((acc, cur) => {
    const m = cur.path.replace(/^\/?datafiles\//, "");
    const cls = m.split("/")[0] || "Other";
    if (!acc[cls]) acc[cls] = [];
    acc[cls].push(cur);
    return acc;
  }, {});

  const classOptions = Object.keys(byClass).sort();

  const [selectedClass, setSelectedClass] = useState<string>("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [chapterOptions, setChapterOptions] = useState<Entry[]>([]);
  const [selectedChapterPath, setSelectedChapterPath] = useState<string>("");
  const [selectedChapterPaths, setSelectedChapterPaths] = useState<string[]>(
    [],
  );
  const [isMerging, setIsMerging] = useState(false);
  const pdfBytesCache = useRef<Map<string, ArrayBuffer>>(new Map());
  const [file, setFile] = useState<File | null>(null);
  const [mcqCount, setMcqCount] = useState<number | null>(20);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Progressive unlocking flags
  const canSelectSubject = !!selectedClass;
  const canSelectChapter = !!selectedSubject;
  const canEnterCount = selectedChapterPaths.length > 0;

  const allChapterPaths = chapterOptions.map((c) => c.path);
  const isAllSelected =
    selectedChapterPaths.length > 0 &&
    selectedChapterPaths.length === allChapterPaths.length;
  const selectedCount = selectedChapterPaths.length;

  useEffect(() => {
    const arr = selectedClass ? byClass[selectedClass] || [] : [];
    setChapterOptions(arr);
    const subs = Array.from(
      new Set(
        arr.map((e) => {
          const m = e.path.replace(/^\/?datafiles\//, "");
          return m.split("/")[1] || "General";
        }),
      ),
    ).sort();
    setSubjects(subs);
    setSelectedSubject("");
    setSelectedChapterPath("");
    setSelectedChapterPaths([]);
    setFile(null);
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedSubject) {
      setChapterOptions(selectedClass ? byClass[selectedClass] || [] : []);
      setSelectedChapterPaths([]);
      setFile(null);
      return;
    }
    const arr = (byClass[selectedClass] || []).filter((e) => {
      const m = e.path.replace(/^\/?datafiles\//, "");
      return (m.split("/")[1] || "General") === selectedSubject;
    });
    setChapterOptions(arr);
    setSelectedChapterPath("");
    setSelectedChapterPaths([]);
    setFile(null);
  }, [selectedSubject, selectedClass]);

  const handleSelectChapter = async (path: string) => {
    // no-op (multi-select in use)
  };

  const mergeSelected = React.useCallback(
    async (paths: string[]) => {
      setIsMerging(true);
      try {
        if (!paths.length) {
          setFile(null);
          return;
        }
        const { PDFDocument } = await import("pdf-lib");
        const mergedPdf = await PDFDocument.create();
        const ordered = chapterOptions
          .filter((c) => paths.includes(c.path))
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((c) => c.path);

        await Promise.all(
          ordered.map(async (p) => {
            if (pdfBytesCache.current.has(p)) return;
            const found = entries.find((e) => e.path === p);
            if (!found) return;
            const res = await fetch(found.url);
            const bytes = await res.arrayBuffer();
            pdfBytesCache.current.set(p, bytes);
          }),
        );

        let pageCount = 0;
        for (const p of ordered) {
          const bytes = pdfBytesCache.current.get(p);
          if (!bytes) continue;
          const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
          const copied = await mergedPdf.copyPages(src, src.getPageIndices());
          copied.forEach((pg) => mergedPdf.addPage(pg));
          pageCount += copied.length;
        }
        if (pageCount === 0) throw new Error("No pages to merge");

        const mergedBytes = await mergedPdf.save();
        const fname = `${(selectedSubject || "subject").replace(/[^\w\s-]/g, "").replace(/\s+/g, "_")}_${pageCount}_pages_${new Date().toISOString().slice(0, 10)}.pdf`;
        const mergedFile = new File([mergedBytes], fname, {
          type: "application/pdf",
          lastModified: Date.now(),
        });
        if (mergedFile.size > 15 * 1024 * 1024) {
          toast({
            title: "PDF too large",
            description: "Merged chapters exceed 15MB. Select fewer chapters.",
            variant: "destructive",
          });
          setFile(null);
          return;
        }
        setFile(mergedFile);
      } catch (err) {
        toast({ title: "Merge failed", description: "Could not merge PDFs." });
        setFile(null);
      } finally {
        setIsMerging(false);
      }
    },
    [chapterOptions, entries, selectedSubject],
  );

  useEffect(() => {
    (async () => {
      try {
        await Promise.all(
          chapterOptions.map(async (c) => {
            if (pdfBytesCache.current.has(c.path)) return;
            const res = await fetch(c.url);
            const bytes = await res.arrayBuffer();
            pdfBytesCache.current.set(c.path, bytes);
          }),
        );
      } catch {}
    })();
  }, [chapterOptions]);

  const handleToggleAll = async (checked: boolean) => {
    const next = checked ? allChapterPaths : [];
    setSelectedChapterPaths(next);
    await mergeSelected(next);
  };
  const handleToggleChapter = async (path: string, checked: boolean) => {
    const set = new Set(selectedChapterPaths);
    if (checked) set.add(path);
    else set.delete(path);
    const next = Array.from(set);
    setSelectedChapterPaths(next);
    await mergeSelected(next);
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

  const buildMcqPrompt = (n: number) => {
    return `Generate exactly ${n} multiple-choice questions (MCQs) based strictly on the attached PDF chapter. Each MCQ must:
- Be labeled sequentially as Q1., Q2., ...
- Contain a clear stem and four options labeled a), b), c), d).
- Be worth 1 mark each.
- NOT include the answers or explain reasoning.

Format:
Q1. <question text>\n a) <option>\n b) <option>\n c) <option>\n d) <option>\n
Use concise, exam-style wording suitable for classroom tests.`;
  };

  const runSubmit = async () => {
    setResult(null);
    setLoading(true);
    try {
      if (!file) {
        toast({
          title: "Attach a PDF",
          description: "Please select or upload a PDF chapter.",
        });
        setLoading(false);
        return;
      }
      if (!mcqCount || mcqCount < 5 || mcqCount > 100) {
        toast({ title: "Invalid count", description: "Enter 5–100 MCQs." });
        setLoading(false);
        return;
      }

      const q = buildMcqPrompt(mcqCount);

      const form = new FormData();
      form.append("pdf", file);
      form.append("query", q);
      form.append("file", file);

      const res = await withTimeout(
        fetch(API_URL, {
          method: "POST",
          body: form,
          headers: { Accept: "application/json" },
        }),
        25000,
      );

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `HTTP ${res.status}`);
      }

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const json = await res.json();
        const text =
          typeof json === "string"
            ? json
            : (json?.questions ??
              json?.result ??
              json?.message ??
              JSON.stringify(json));
        setResult(String(text));
      } else {
        const text = await res.text();
        setResult(text);
      }
    } catch (err: any) {
      const msg =
        err?.message === "timeout"
          ? "Request timed out."
          : err?.message || "Request failed";
      toast({ title: "Request failed", description: msg });
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

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
                  Create multiple-choice questions from a selected chapter.
                </p>
              </div>
            </section>

            <section className="mx-auto mt-10 max-w-5xl space-y-6">
              <div className="flex flex-col gap-4">
                <div className="w-full max-w-4xl mx-auto rounded-xl card-yellow-shadow border border-muted/20 bg-white p-8 sm:p-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                    <div
                      className={`transition-all duration-200 ease-out ${!canSelectSubject ? "opacity-50 pointer-events-none" : "opacity-100"}`}
                    >
                      <label className="text-sm font-medium text-muted-foreground">
                        Subject
                      </label>
                      <Select
                        value={selectedSubject}
                        onValueChange={(v) => setSelectedSubject(v)}
                      >
                        <SelectTrigger
                          className="w-full"
                          disabled={!canSelectSubject}
                        >
                          <SelectValue
                            placeholder={
                              canSelectSubject
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

                    <div
                      className={`transition-all duration-200 ease-out ${!canSelectChapter ? "opacity-50 pointer-events-none" : "opacity-100"}`}
                    >
                      <label className="text-sm font-medium text-muted-foreground">
                        Chapters
                      </label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="w-full justify-between rounded-md border border-primary/60 px-3 py-2 text-base hover:border-primary hover:bg-primary/10 hover:text-black focus-visible:ring-primary disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                            disabled={!canSelectChapter || isMerging}
                          >
                            <span className="inline-flex items-center gap-2">
                              <ListChecks className="h-4 w-4 opacity-80" />
                              {isMerging
                                ? "Merging..."
                                : selectedCount === 0
                                  ? canSelectChapter
                                    ? "Select chapters"
                                    : "Select subject first"
                                  : isAllSelected
                                    ? `All chapters selected (${selectedCount})`
                                    : `${selectedCount} chapter${selectedCount > 1 ? "s" : ""} selected`}
                            </span>
                            <ChevronDown className="h-4 w-4 opacity-80" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-80 border border-input bg-white text-foreground shadow-xl">
                          <DropdownMenuLabel className="flex items-center justify-between text-sm text-primary">
                            <span>Chapters</span>
                            <span className="text-xs">
                              {selectedCount}/{allChapterPaths.length} selected
                            </span>
                          </DropdownMenuLabel>
                          <DropdownMenuCheckboxItem
                            checked={isAllSelected}
                            onCheckedChange={(c) => handleToggleAll(Boolean(c))}
                            className="font-semibold hover:bg-primary/10 hover:text-black focus:bg-primary/20 focus:text-black"
                          >
                            All chapters
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuSeparator />
                          <div className="max-h-60 overflow-y-auto scrollbar-yellow pr-1">
                            <div className="py-1">
                              {chapterOptions.map((c) => (
                                <DropdownMenuCheckboxItem
                                  key={c.path}
                                  checked={selectedChapterPaths.includes(
                                    c.path,
                                  )}
                                  onCheckedChange={(check) =>
                                    handleToggleChapter(c.path, Boolean(check))
                                  }
                                  className="hover:bg-secondary/15 hover:text-black focus:bg-secondary/20 focus:text-black"
                                >
                                  {c.name.replace(/\.pdf$/i, "")}
                                </DropdownMenuCheckboxItem>
                              ))}
                            </div>
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div
                      className={`transition-all duration-200 ease-out ${!canEnterCount ? "opacity-50 pointer-events-none" : "opacity-100"}`}
                    >
                      <label className="text-sm font-medium text-muted-foreground">
                        Number of MCQs
                      </label>
                      <div className="flex gap-2 items-center flex-wrap">
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
                          disabled={!canEnterCount}
                          className="w-28 rounded-md border border-input bg-muted/40 px-3 py-2 text-base hover:border-primary focus:border-primary focus:ring-0"
                          placeholder="Enter count"
                        />
                        <button
                          type="button"
                          onClick={() => setMcqCount(10)}
                          disabled={!canEnterCount}
                          className={`rounded-md px-3 py-2 text-sm border ${mcqCount === 10 ? "bg-primary text-primary-foreground border-primary" : "bg-white text-foreground/90 border-input hover:bg-muted/50"}`}
                        >
                          10
                        </button>
                        <button
                          type="button"
                          onClick={() => setMcqCount(20)}
                          disabled={!canEnterCount}
                          className={`rounded-md px-3 py-2 text-sm border ${mcqCount === 20 ? "bg-primary text-primary-foreground border-primary" : "bg-white text-foreground/90 border-input hover:bg-muted/50"}`}
                        >
                          20
                        </button>
                        <button
                          type="button"
                          onClick={() => setMcqCount(30)}
                          disabled={!canEnterCount}
                          className={`rounded-md px-3 py-2 text-sm border ${mcqCount === 30 ? "bg-primary text-primary-foreground border-primary" : "bg-white text-foreground/90 border-input hover:bg-muted/50"}`}
                        >
                          30
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <Button
                      disabled={!file || !mcqCount || loading}
                      onClick={runSubmit}
                      className="relative flex items-center gap-3 !shadow-none hover:!shadow-none"
                    >
                      {loading ? "Generating..." : "Generate MCQs"}
                    </Button>

                    <Button
                      className="bg-primary/10 border-primary/60 text-blue-600 hover:!bg-primary/10 hover:!border-primary/60 hover:!text-blue-600 hover:!shadow-none disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={!result}
                      onClick={() => {
                        setSelectedClass("");
                        setSelectedSubject("");
                        setSelectedChapterPath("");
                        setSelectedChapterPaths([]);
                        setFile(null);
                        setMcqCount(20);
                        setResult(null);
                      }}
                    >
                      Reset
                    </Button>
                  </div>
                </div>

                {result && (
                  <div className="order-1 mt-0 w-full max-w-4xl mx-auto">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Result</h3>
                      <div className="flex items-center gap-2">
                        <Button
                          aria-label="Download PDF"
                          variant="secondary"
                          size="icon"
                          className="rounded-full"
                          disabled={!result || !!loading}
                          onClick={async () => {
                            if (!result) return;
                            try {
                              const { jsPDF } = await import("jspdf");
                              const doc = new jsPDF({
                                unit: "pt",
                                format: "a4",
                              });
                              const margin = 64;
                              const pageW = doc.internal.pageSize.getWidth();
                              let y = margin;
                              doc.setFont("times", "bold");
                              doc.setFontSize(22);
                              const heading = "MCQs";
                              doc.text(heading, pageW / 2, y, {
                                align: "center",
                              });
                              y += 30;
                              doc.setFont("times", "normal");
                              doc.setFontSize(12);
                              const paragraphs = (result || "").split(/\n\n+/);
                              for (const para of paragraphs) {
                                const lines = doc.splitTextToSize(
                                  para.replace(/\n/g, " "),
                                  pageW - margin * 2,
                                );
                                doc.text(lines, margin, y);
                                y += lines.length * 16 + 10;
                                if (
                                  y >
                                  doc.internal.pageSize.getHeight() - margin
                                ) {
                                  doc.addPage();
                                  y = margin;
                                }
                              }
                              const filename = `mcqs_${new Date().toISOString().replace(/[:.]/g, "-")}.pdf`;
                              doc.save(filename);
                            } catch (err) {
                              console.error(err);
                              toast({
                                title: "Download failed",
                                description: "Could not generate PDF.",
                              });
                            }
                          }}
                        >
                          Download
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl bg-card/60 p-8 text-base overflow-hidden">
                      <div className="paper-view">
                        <div className="paper-body prose prose-invert prose-lg leading-relaxed max-w-none break-words">
                          <pre className="whitespace-pre-wrap">{result}</pre>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </Container>
    </div>
  );
}
