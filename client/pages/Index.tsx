import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Download, ListChecks, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Container from "@/components/layout/Container";
import SidebarPanelInner from "@/components/layout/SidebarPanelInner";
import SidebarStats from "@/components/layout/SidebarStats";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ApiResult = string;

type AppSettings = {
  initialTimeoutMs: number;
  retryTimeoutMs: number;
  autoRetry: boolean;
  defaultQuery: string;
};

const SETTINGS_KEY = "app:settings" as const;
const DEFAULT_SETTINGS: AppSettings = {
  initialTimeoutMs: 25000,
  retryTimeoutMs: 55000,
  autoRetry: true,
  defaultQuery: "",
};

const MAX_SIZE = 15 * 1024 * 1024; // 15MB

// API endpoint selection: env override -> Netlify serverless proxy (always)
const API_URL = (() => {
  const env = import.meta.env.VITE_PREDICT_ENDPOINT as string | undefined;
  return env && env.trim() ? env : "/.netlify/functions/proxy";
})();

function ExternalPdfSelector({
  onLoadFile,
  onSetPrompt,
  onGenerate,
  onReset,
  loading,
}: {
  onLoadFile: (f: File | null) => void;
  onSetPrompt: (p: string) => void;
  onGenerate: (prompt?: string) => Promise<void> | void;
  onReset: () => void;
  loading?: boolean;
}) {
  const pdfModules = import.meta.glob("/datafiles/**/*.pdf", {
    as: "url",
    eager: true,
  }) as Record<string, string>;
  const entries = Object.entries(pdfModules).map(([path, url]) => ({
    path,
    url,
    name: path.split("/").pop() || "file.pdf",
  }));
  const byClass = entries.reduce<
    Record<string, { path: string; url: string; name: string }[]>
  >((acc, cur) => {
    // extract class folder name
    const m = cur.path.replace(/^\/?datafiles\//, "");
    const parts = m.split("/");
    const cls = parts[0] || "Other";
    if (!acc[cls]) acc[cls] = [];
    acc[cls].push(cur);
    return acc;
  }, {});

  const classOptions = Object.keys(byClass).sort();
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [subjectOptions, setSubjectOptions] = useState<
    { path: string; url: string; name: string }[]
  >([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>("");
  const [selectedSubjectPath, setSelectedSubjectPath] = useState<string>("");
  const [totalMarks, setTotalMarks] = useState<number | null>(null);
  const [promptText, setPromptText] = useState("");

  const [selectedChapterPaths, setSelectedChapterPaths] = useState<string[]>(
    [],
  );
  const [isMerging, setIsMerging] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const pdfBytesCache = useRef<Map<string, ArrayBuffer>>(new Map());

  const chapterOptionsForSubject = useMemo(
    () =>
      (subjectOptions || [])
        .filter(
          (s) =>
            selectedSubjectName && subjectOf(s.path) === selectedSubjectName,
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [subjectOptions, selectedSubjectName],
  );

  const allChapterPaths = useMemo(
    () => chapterOptionsForSubject.map((s) => s.path),
    [chapterOptionsForSubject],
  );
  const isAllSelected =
    selectedChapterPaths.length > 0 &&
    selectedChapterPaths.length === allChapterPaths.length;
  const selectedCount = selectedChapterPaths.length;

  // Step-wise enabling rules
  const canSelectSubject = !!selectedClass && !isLocked;
  const canSelectChapters = !!selectedSubjectName && !isLocked;
  const canEnterMarks = selectedChapterPaths.length > 0 && !isLocked;
  const canGenerate =
    !!selectedClass &&
    !!selectedSubjectName &&
    selectedChapterPaths.length > 0 &&
    totalMarks != null &&
    !loading &&
    !isMerging &&
    !isLocked;

  const mergeSelected = useCallback(
    async (paths: string[]) => {
      setIsMerging(true);

      try {
        if (!paths.length) {
          onLoadFile(null);
          setSelectedSubjectPath("");
          return;
        }

        // Validate paths
        if (!paths.every((p) => typeof p === "string" && p.trim().length > 0)) {
          throw new Error("Invalid PDF paths provided");
        }

        const { PDFDocument, PDFPage } = await import("pdf-lib");

        // Create a new merged PDF
        const mergedPdf = await PDFDocument.create();

        // Ensure deterministic order by chapter name
        const ordered = chapterOptionsForSubject
          .filter((c) => paths.includes(c.path))
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((c) => c.path);

        // Prefetch bytes in parallel with better error handling
        const fetchResults = await Promise.allSettled(
          ordered.map(async (p) => {
            try {
              if (pdfBytesCache.current.has(p))
                return { path: p, success: true };

              const found = entries.find((e) => e.path === p);
              if (!found) {
                console.warn(`PDF not found for path: ${p}`);
                return { path: p, success: false, error: "PDF not found" };
              }

              const controller = new AbortController();
              const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

              try {
                const res = await fetch(found.url, {
                  signal: controller.signal,
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);

                const bytes = await res.arrayBuffer();
                if (bytes.byteLength === 0) throw new Error("Empty PDF file");

                // Validate it's actually a PDF
                const header = new Uint8Array(bytes, 0, 4);
                const headerStr = Array.from(header)
                  .map((b) => String.fromCharCode(b))
                  .join("");
                if (headerStr !== "%PDF") {
                  throw new Error("Invalid PDF file format");
                }

                pdfBytesCache.current.set(p, bytes);
                return { path: p, success: true };
              } finally {
                clearTimeout(timeout);
              }
            } catch (error) {
              console.error(`Failed to load PDF ${p}:`, error);
              return {
                path: p,
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
              };
            }
          }),
        );

        // Check for failed downloads
        const failed = fetchResults.filter(
          (r): r is PromiseRejectedResult =>
            r.status === "rejected" ||
            (r.status === "fulfilled" && !r.value.success),
        );

        if (failed.length > 0) {
          const errorMessages = failed
            .map((f) =>
              f.status === "rejected"
                ? f.reason?.message || "Unknown error"
                : (f as any).value?.error || "Failed to load PDF",
            )
            .join("; ");

          throw new Error(
            `Failed to load ${failed.length} PDF(s): ${errorMessages}`,
          );
        }

        // Merge PDFs with progress tracking
        let mergedPageCount = 0;
        for (const p of ordered) {
          const bytes = pdfBytesCache.current.get(p);
          if (!bytes) continue;

          try {
            const src = await PDFDocument.load(bytes, {
              ignoreEncryption: true,
              throwOnInvalidObject: true,
            });

            const pageIndices = src.getPageIndices();
            if (pageIndices.length === 0) {
              console.warn(`PDF has no pages: ${p}`);
              continue;
            }

            const copiedPages = await mergedPdf.copyPages(src, pageIndices);
            copiedPages.forEach((page) => mergedPdf.addPage(page));
            mergedPageCount += copiedPages.length;
          } catch (error) {
            console.error(`Error processing PDF ${p}:`, error);
            throw new Error(
              `Failed to process PDF ${p.split("/").pop() || "unknown"}: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            );
          }
        }

        if (mergedPageCount === 0) {
          throw new Error("No valid pages found in the selected PDFs");
        }

        // Generate the merged PDF
        const mergedBytes = await mergedPdf.save();
        const safeSubjectName = (selectedSubjectName || "subject")
          .replace(/[^\w\s-]/g, "") // Remove special chars
          .replace(/\s+/g, "_") // Replace spaces with underscores
          .substring(0, 50); // Limit length

        const fname = `${safeSubjectName}_${mergedPageCount}_pages_${new Date().toISOString().slice(0, 10)}.pdf`;

        const file = new File([mergedBytes], fname, {
          type: "application/pdf",
          lastModified: Date.now(),
        });

        // Enforce 15MB limit to avoid server rejection
        if (file.size > MAX_SIZE) {
          toast({
            title: "PDF too large",
            description: "Merged chapters exceed 15MB. Select fewer chapters.",
            variant: "destructive",
          });
          onLoadFile(null);
          return;
        }

        onLoadFile(file);
      } catch (err) {
        console.error("PDF merge error:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to merge PDFs";
        toast({
          title: "Merge Failed",
          description: errorMessage,
          variant: "destructive",
        });
        onLoadFile(null);
        throw err; // Re-throw to allow callers to handle the error
      } finally {
        setIsMerging(false);
      }
    },
    [chapterOptionsForSubject, entries, onLoadFile, selectedSubjectName],
  );

  const handleToggleAll = useCallback(
    async (checked: boolean) => {
      const next = checked ? allChapterPaths : [];
      setSelectedChapterPaths(next);
      await mergeSelected(next);
    },
    [allChapterPaths, mergeSelected],
  );

  const handleToggleChapter = useCallback(
    async (path: string, checked: boolean) => {
      const set = new Set(selectedChapterPaths);
      if (checked) set.add(path);
      else set.delete(path);
      const next = Array.from(set);
      setSelectedChapterPaths(next);
      await mergeSelected(next);
    },
    [selectedChapterPaths, mergeSelected],
  );

  const buildPaperSchemePrompt = (
    subjectName: string,
    cls: string,
    marks: number,
  ) => {
    // Build a prompt that asks the AI to generate a full exam paper (questions, not just scheme)
    return `Generate a complete exam-style question paper for Class ${cls} in the subject "${subjectName}" of total ${marks} marks.\n\nStructure requirements:\n1) Section A - MCQs: allocate between 10% and 20% of total marks to MCQs. Each MCQ should be 1 mark and include four options labeled a), b), c), d). Number all MCQs sequentially (Q1, Q2, ...).\n2) Section B - Short Questions: allocate between 30% and 40% of total marks. Each short question should be 4 or 5 marks. Number questions sequentially continuing from MCQs.\n3) Section C - Long Questions: allocate between 30% and 40% of total marks. Each long question should be 8 to 10 marks. Number questions sequentially continuing from Section B.\n\nContent and formatting instructions:\n- Provide actual question text for every item (do NOT output only a scheme).\n- For MCQs include clear options (a/b/c/d) and ensure only one correct option logically exists (do NOT reveal answers).\n- Short and long questions should be clear, exam-style (descriptive, conceptual or numerical as appropriate), and require the indicated length of answer.\n- Use headings exactly: "Section A - MCQs", "Section B - Short Questions", "Section C - Long Questions".\n- Use numbering like Q1, Q2, Q3 ... across the paper.\n- Ensure the marks per question and number of questions sum exactly to the total ${marks} marks. If multiple valid distributions exist, choose a balanced distribution that fits the percentage ranges and explain the distribution briefly at the top in one line.\n- Do NOT provide answers or solutions.\n- Keep layout professional and easy to read (use line breaks, headings, and spacing similar to an exam paper).\n\nOutput only the exam paper text (no metadata, no commentary).`;
  };

  function subjectOf(p: string) {
    const m = p.replace(/^\/?datafiles\//, "");
    const parts = m.split("/");
    return parts[1] || "General";
  }

  useEffect(() => {
    const arr = selectedClass ? byClass[selectedClass] || [] : [];
    setSubjectOptions(arr);
    const subs = Array.from(new Set(arr.map((e) => subjectOf(e.path)))).sort();
    setSubjects(subs);
    setSelectedSubjectName("");
    setSelectedSubjectPath("");
    setSelectedChapterPaths([]);
    setTotalMarks(null);
    onLoadFile(null);
  }, [selectedClass]);

  const handleSelectSubject = (name: string) => {
    setSelectedSubjectName(name);
    setSelectedSubjectPath("");
    setSelectedChapterPaths([]);
    onLoadFile(null);
  };

  useEffect(() => {
    (async () => {
      try {
        const toPrefetch = chapterOptionsForSubject.map((c) => c.path);
        await Promise.all(
          toPrefetch.map(async (p) => {
            if (pdfBytesCache.current.has(p)) return;
            const found = entries.find((e) => e.path === p);
            if (!found) return;
            const res = await fetch(found.url);
            const bytes = await res.arrayBuffer();
            pdfBytesCache.current.set(p, bytes);
          }),
        );
      } catch {}
    })();
  }, [chapterOptionsForSubject, entries]);

  const handleSelectChapter = async (path: string) => {
    if (!path) return;
    const found = entries.find((e) => e.path === path);
    if (!found) return;
    try {
      const res = await fetch(found.url);
      const blob = await res.blob();
      const f = new File([blob], found.name, { type: "application/pdf" });
      onLoadFile(f);
      setSelectedSubjectPath(path);
    } catch (err: any) {
      if (err?.name === "AbortError") return; // ignore user/navigation aborts silently
      toast({ title: "Load failed", description: "Could not load PDF." });
    }
  };

  return (
    <div className="rounded-xl card-yellow-shadow border border-muted/20 bg-white p-8 sm:p-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
        {/* Class */}
        <div
          className={`transition-all duration-200 ease-out ${isLocked ? "opacity-50 pointer-events-none" : ""}`}
        >
          <label className="text-sm font-medium text-muted-foreground">
            Class
          </label>
          <Select
            value={selectedClass}
            onValueChange={(v) => setSelectedClass(v)}
          >
            <SelectTrigger className="w-full" disabled={isLocked}>
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
        <div
          className={`transition-all duration-200 ease-out ${!canSelectSubject ? "opacity-50 pointer-events-none" : "opacity-100"}`}
        >
          <label className="text-sm font-medium text-muted-foreground">
            Subject
          </label>
          <Select
            key={`subject-${selectedClass || "none"}`}
            value={selectedSubjectName}
            onValueChange={(name) => handleSelectSubject(name)}
          >
            <SelectTrigger className="w-full" disabled={!canSelectSubject}>
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

        {/* Chapters */}
        <div
          className={`transition-all duration-200 ease-out ${!canSelectChapters ? "opacity-50 pointer-events-none" : "opacity-100"}`}
        >
          <label className="text-sm font-medium text-muted-foreground">
            Chapters
          </label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between rounded-md border border-primary/60 px-3 py-2 text-base hover:border-primary hover:bg-primary/10 hover:text-black focus-visible:ring-primary disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                disabled={!canSelectChapters || isMerging}
              >
                <span className="inline-flex items-center gap-2">
                  <ListChecks className="h-4 w-4 opacity-80" />
                  {isMerging
                    ? "Merging..."
                    : selectedCount === 0
                      ? selectedSubjectName
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
                  {chapterOptionsForSubject.map((s) => (
                    <DropdownMenuCheckboxItem
                      key={s.path}
                      checked={selectedChapterPaths.includes(s.path)}
                      onCheckedChange={(c) =>
                        handleToggleChapter(s.path, Boolean(c))
                      }
                      className="hover:bg-secondary/15 hover:text-black focus:bg-secondary/20 focus:text-black"
                    >
                      {s.name.replace(/\.pdf$/i, "")}
                    </DropdownMenuCheckboxItem>
                  ))}
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Marks */}
        <div
          className={`transition-all duration-200 ease-out ${!canEnterMarks ? "opacity-50 pointer-events-none" : "opacity-100"}`}
        >
          <label className="text-sm font-medium text-muted-foreground">
            Total Marks
          </label>
          <div className="flex gap-2 items-center flex-wrap">
            <input
              type="number"
              min={20}
              max={100}
              value={totalMarks ?? ""}
              onChange={(e) => {
                const v = e.currentTarget.value;
                const n = v === "" ? null : Number(v);
                setTotalMarks(n);
              }}
              disabled={!canEnterMarks || !!loading || isMerging}
              className="w-28 rounded-md border border-input bg-muted/40 px-3 py-2 text-base hover:border-primary focus:border-primary focus:ring-0"
              placeholder="Enter marks"
            />
            <button
              type="button"
              onClick={() => setTotalMarks(30)}
              disabled={!canEnterMarks || !!loading || isMerging}
              aria-pressed={totalMarks === 30}
              className={`rounded-md px-4 py-2 text-base border ${totalMarks === 30 ? "bg-primary text-primary-foreground border-primary" : "bg-white text-foreground/90 border-input hover:bg-muted/50"}`}
            >
              30
            </button>
            <button
              type="button"
              onClick={() => setTotalMarks(50)}
              disabled={!canEnterMarks || !!loading || isMerging}
              aria-pressed={totalMarks === 50}
              className={`rounded-md px-4 py-2 text-base border ${totalMarks === 50 ? "bg-primary text-primary-foreground border-primary" : "bg-white text-foreground/90 border-input hover:bg-muted/50"}`}
            >
              50
            </button>
            <button
              type="button"
              onClick={() => setTotalMarks(100)}
              disabled={!canEnterMarks || !!loading || isMerging}
              aria-pressed={totalMarks === 100}
              className={`rounded-md px-4 py-2 text-base border ${totalMarks === 100 ? "bg-primary text-primary-foreground border-primary" : "bg-white text-foreground/90 border-input hover:bg-muted/50"}`}
            >
              100
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-3">
        <Button
          disabled={!canGenerate}
          onClick={async () => {
            if (!selectedClass) {
              return toast({
                title: "Select class",
                description: "Please select a class first.",
              });
            }
            if (!selectedSubjectName) {
              return toast({
                title: "Select subject",
                description: "Please select a subject.",
              });
            }
            if (selectedChapterPaths.length === 0) {
              return toast({
                title: "Select chapters",
                description: "Please choose one or more chapters.",
              });
            }
            if (totalMarks == null) {
              return toast({
                title: "Enter total marks",
                description: "Please enter a value between 20 and 100.",
              });
            }
            const subjectName = selectedSubjectName || "";
            const marks = Math.min(100, Math.max(20, Number(totalMarks)));
            if (marks !== totalMarks) setTotalMarks(marks);
            const generated = buildPaperSchemePrompt(
              subjectName,
              selectedClass || "",
              marks,
            );
            onSetPrompt(generated);
            setIsLocked(true); // lock all fields
            await onGenerate(generated);
          }}
          className="relative flex items-center gap-3 !shadow-none hover:!shadow-none"
        >
          {loading ? (
            <>
              <span className="opacity-0">Generating...</span>
              <div className="loader">
                <div className="jimu-primary-loading"></div>
              </div>
            </>
          ) : (
            "Generate"
          )}
        </Button>

        <Button
          className="bg-primary/10 border-primary/60 text-blue-600 hover:!bg-primary/10 hover:!border-primary/60 hover:!text-blue-600 hover:!shadow-none disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={!isLocked}
          onClick={() => {
            setSelectedClass("");
            setSelectedSubjectPath("");
            setSelectedChapterPaths([]);
            setTotalMarks(null);
            setPromptText("");
            setIsLocked(false);
            onLoadFile(null);
            onSetPrompt("");
            onReset();
          }}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}

export default function Index() {
  const [file, setFile] = useState<File | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AppSettings>;
        const s = { ...DEFAULT_SETTINGS, ...parsed };
        setSettings(s);
        if (s.defaultQuery) setQuery(s.defaultQuery);
      }
    } catch {}
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }, []);

  const handleFile = (f: File) => {
    if (
      f.type !== "application/pdf" &&
      !f.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Please upload a valid PDF file.");
      setFile(null);
      toast({
        title: "Invalid file",
        description: "Only PDF files are supported.",
      });
      return;
    }
    if (f.size > MAX_SIZE) {
      setError("PDF exceeds 15MB limit.");
      setFile(null);
      toast({
        title: "File too large",
        description: "Please upload a PDF up to 15MB.",
      });
      return;
    }
    setError(null);
    setFile(f);
  };

  const onReset = () => {
    setFile(null);
    setQuery("");
    setError(null);
    setResult(null);
    const el = fileInputRef.current;
    if (el) el.value = "";
  };

  // Utility: promise timeout without aborting the underlying fetch
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

  const runSubmit = async (fArg?: File | null, qArg?: string) => {
    setError(null);
    setResult(null);
    const theFile = fArg ?? file;
    const q = (qArg ?? query).trim();
    if (!theFile) {
      setError("Attach a PDF file first.");
      toast({ title: "Missing PDF", description: "Attach a PDF to continue." });
      return;
    }
    if (!q) {
      setError("Enter a query.");
      toast({ title: "Missing query", description: "Write what to generate." });
      return;
    }

    const sendTo = async (urlStr: string, timeoutMs: number) => {
      const isExternal = /^https?:/i.test(urlStr);

      let finalUrl = urlStr;
      // If external and a query is provided, attach as query param for compatibility
      if (isExternal && q) {
        try {
          const u = new URL(urlStr);
          u.searchParams.set("query", q);
          finalUrl = u.toString();
        } catch {}
      }

      try {
        console.debug("Attempting fetch ->", finalUrl, {
          isExternal,
          hasFile: !!theFile,
        });
        // If no file attached, send a lightweight JSON body with the query only
        if (!theFile) {
          const res = await withTimeout(
            fetch(finalUrl, {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ query: q }),
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
        }

        // Otherwise send multipart form with the PDF
        const form = new FormData();
        form.append("pdf", theFile);
        form.append("query", q);
        // Include both common field names for maximum compatibility via proxy
        form.append("file", theFile);

        const res = await withTimeout(
          fetch(finalUrl, {
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
      } catch (err: any) {
        try {
          if (err?.message === "timeout") {
            console.warn("Request timed out:", finalUrl);
          } else if (
            err?.message === "Failed to fetch" ||
            err?.name === "TypeError"
          ) {
            console.warn(
              "Network or CORS error when fetching:",
              finalUrl,
              err?.message ?? err,
            );
          } else if (err?.name === "AbortError") {
            // Should not happen now, but silently handle
            console.warn("Fetch aborted:", finalUrl);
          } else {
            console.warn("Fetch error:", finalUrl, err?.message ?? err);
          }
        } catch {}
        return null;
      }
    };

    // Check whether a lightweight request to the given URL responds (used to test proxies)
    const checkEndpoint = async (_urlStr: string, _timeoutMs = 3000) => {
      return true;
    };

    try {
      setLoading(true);
      let res: Response | null = null;

      // Try direct API endpoint first
      let initialRes: Response | null = null;
      if (API_URL) {
        initialRes = await sendTo(API_URL, settings.initialTimeoutMs);
        res = initialRes;
      }

      // If direct request failed (network/CORS) or returned non-OK, try internal proxies
      if (!res || !res.ok) {
        const proxies = [
          "/.netlify/functions/proxy", // Netlify serverless proxy (primary)
          "/api/generate-questions", // Netlify redirect path -> functions/proxy
        ];
        for (const proxyPath of proxies) {
          try {
            const attempt = await sendTo(proxyPath, settings.retryTimeoutMs);
            if (attempt && attempt.ok) {
              res = attempt;
              break;
            }
          } catch {
            // continue to next proxy
          }
        }
      }

      if (!res) {
        // If we get here, it likely failed due to CORS or network. Provide a helpful error.
        throw new Error("Network error. Please try again.");
      }

      const contentType = res.headers.get("content-type") || "";
      if (!res.ok) {
        let detail = "";
        try {
          detail = await res.clone().text();
        } catch (e) {
          detail = res.statusText || "";
        }
        throw new Error(detail || `HTTP ${res.status}`);
      }
      if (contentType.includes("application/json")) {
        try {
          const json = await res.clone().json();
          const text =
            typeof json === "string"
              ? json
              : (json?.questions ??
                json?.result ??
                json?.message ??
                JSON.stringify(json, null, 2));
          setResult(String(text));
        } catch (e) {
          // fallback if json parsing fails
          const txt = await res
            .clone()
            .text()
            .catch(() => "");
          setResult(txt);
        }
      } else {
        const text = await res.clone().text();
        setResult(text);
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loading) await runSubmit();
  };

  // Helper: escape HTML to avoid XSS
  const escapeHtml = (unsafe: string) =>
    unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  // Enhanced formatter: renumber per section, convert **bold** to <strong>, style headings, questions and options
  const formatResultHtml = (txt: string) => {
    if (!txt) return "";

    // 1) Renumber questions per section: reset to Q1 at each "Section ..." heading
    const renumbered = (() => {
      const lines = txt.split(/\r?\n/);
      let count = 0;
      let inSection = false;
      const out: string[] = [];
      const headingRe = /^\s*Section\s+[A-Z0-9\-–].*$/i;
      const qRe = /^(\s*)Q\d+\.\s*/i;
      for (const line of lines) {
        if (headingRe.test(line)) {
          inSection = true;
          count = 0;
          out.push(line);
          continue;
        }
        if (inSection && qRe.test(line)) {
          count += 1;
          out.push(line.replace(qRe, `$1Q${count}. `));
        } else {
          out.push(line);
        }
      }
      return out.join("\n");
    })();

    // 2) Escape HTML to avoid XSS
    let out = escapeHtml(renumbered);

    // 3) Convert bold **text**
    out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

    // 4) Headings: lines starting with Section or Section A/B/C -> styled h3 in theme color
    out = out.replace(
      /^\s*(Section\s+[A-Z0-9\-���].*)$/gim,
      '<h3 class="text-xl font-extrabold text-secondary mb-3">$1</h3>',
    );

    // 5) Question lines 'Q1.' -> larger bold line
    out = out.replace(
      /^\s*(Q\d+\.)\s*(.*)$/gim,
      '<p class="text-lg font-semibold mb-3"><strong>$1</strong> $2</p>',
    );

    // 6) MCQ options like 'a) text'
    out = out.replace(
      /^\s*([a-d])\)\s*(.*)$/gim,
      '<div class="ml-6 mb-2 text-base"><strong class="mr-2">$1)</strong>$2</div>',
    );

    // 7) Paragraph spacing
    out = out.replace(/\n{2,}/g, '</p><p class="mb-4">');
    out = out.replace(/\n/g, "<br />");

    if (!out.startsWith("<h3>") && !out.startsWith("<p>")) {
      out = `<p class=\"mb-4\">${out}</p>`;
    }

    return out;
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
                  Exam Generator
                </h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  Fast, accurate question generation tailored to your query.
                </p>
              </div>
            </section>

            <section className="mx-auto mt-10 max-w-5xl space-y-6">
              <div className="flex flex-col gap-4">
                {error && (
                  <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-black">
                    {error}
                  </div>
                )}

                {/* External controls: Class -> Subject -> Prompt */}
                <div className="w-full max-w-4xl mx-auto order-2 sticky top-4 z-20">
                  <ExternalPdfSelector
                    onLoadFile={(f) => setFile(f)}
                    onSetPrompt={(p) => setQuery(p)}
                    onGenerate={async (p?: string) =>
                      await runSubmit(undefined, p)
                    }
                    onReset={onReset}
                    loading={loading}
                  />
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

                              // Layout metrics
                              const margin = 64; // slightly tighter than 1in
                              const pageW = doc.internal.pageSize.getWidth();
                              const pageH = doc.internal.pageSize.getHeight();
                              const contentW = pageW - margin * 2;
                              const BORDER_PAD_X = 18; // horizontal padding from border to text
                              const BORDER_PAD_Y_TOP = 14; // top padding
                              const BORDER_PAD_Y_BOTTOM = 22; // bottom padding
                              let y = margin;

                              // Filename helper
                              function makeFilenameFromPrompt(
                                q: string | undefined,
                              ) {
                                const raw = (q || "").trim();
                                if (!raw) return "exam-paper";
                                const verbs = [
                                  "make",
                                  "generate",
                                  "produce",
                                  "create",
                                  "give",
                                  "write",
                                  "please",
                                  "build",
                                  "compose",
                                  "form",
                                ];
                                let s = raw;
                                let changed = true;
                                while (changed) {
                                  changed = false;
                                  for (const v of verbs) {
                                    const re = new RegExp(
                                      "^" + v + "\\s+",
                                      "i",
                                    );
                                    if (re.test(s)) {
                                      s = s.replace(re, "").trim();
                                      changed = true;
                                    }
                                  }
                                }
                                s = s.replace(/^['"]+|['"]+$/g, "").trim();
                                let out = s.slice(0, 60).toLowerCase();
                                out = out.replace(/[^a-z0-9\s_-]/g, "");
                                out = out.trim().replace(/\s+/g, "_");
                                return out || "exam-paper";
                              }

                              const safeQuery = makeFilenameFromPrompt(query);
                              const filename = `${safeQuery}_${new Date().toISOString().replace(/[:.]/g, "-")}.pdf`;

                              // Cover/header
                              doc.setFont("times", "bold");
                              const headerFontSize = 33; // 50% larger than previous 22
                              doc.setFontSize(headerFontSize);
                              const headingTitle = "Exam Generator";
                              const headerLines = doc.splitTextToSize(
                                headingTitle,
                                pageW - margin * 2,
                              );
                              doc.text(headerLines, pageW / 2, y, {
                                align: "center",
                              });
                              const headerLineHeight = Math.round(
                                headerFontSize * 0.8,
                              );
                              y += Math.max(
                                headerLineHeight + 6,
                                headerLines.length * headerLineHeight + 10,
                              );
                              doc.setDrawColor(190);
                              doc.setLineWidth(1);
                              doc.line(margin, y, pageW - margin, y);
                              y += 16;

                              doc.setFont("times", "normal");
                              doc.setFontSize(12);
                              const dateStr = new Date().toLocaleDateString();
                              const marksMatch = (query || "").match(
                                /total\s+(\d{1,3})\s*marks/i,
                              );
                              const totalMarks = marksMatch
                                ? Number(marksMatch[1])
                                : undefined;
                              if (typeof totalMarks === "number") {
                                doc.text(
                                  `Total Marks: ${totalMarks}`,
                                  margin,
                                  y,
                                );
                              }
                              doc.text(
                                `Generated: ${dateStr}`,
                                pageW - margin,
                                y,
                                {
                                  align: "right",
                                },
                              );
                              y += 18;

                              // Light bordered content box for professional look
                              let boxTop = y;
                              const boxLeft = margin;
                              const boxRight = pageW - margin;
                              const boxBottomMargin = margin;

                              // Text content
                              const rawText = (result || "")
                                .replace(/\r\n/g, "\n")
                                .replace(/\n{3,}/g, "\n\n");
                              const cleaned = rawText
                                .split("\n")
                                .filter(
                                  (l) => !/^\s*\**\s*Distribution:/i.test(l),
                                )
                                .filter(
                                  (l) =>
                                    !/^\s*\**\s*Class\s*\d+.*Exam\s*Paper/i.test(
                                      l,
                                    ),
                                )
                                .join("\n");
                              const renumbered = (() => {
                                const lines = cleaned.split(/\r?\n/);
                                let count = 0;
                                const headingRe =
                                  /^\s*Section\s+[A-Z0-9\-–].*$/i;
                                const qRe = /^\s*(?:Q\.?\s*)?\d+\.\s*/i;
                                const optionRe =
                                  /^\s*(?:[A-Da-d][\).]|\([A-Da-d]\))\s+/;
                                const out: string[] = [];
                                for (const line of lines) {
                                  if (headingRe.test(line)) {
                                    count = 0;
                                    out.push(line);
                                    continue;
                                  }
                                  if (optionRe.test(line)) {
                                    out.push(line);
                                    continue;
                                  }
                                  if (qRe.test(line)) {
                                    count += 1;
                                    const rest = line.replace(qRe, "");
                                    out.push(`${count}. ${rest}`);
                                  } else {
                                    out.push(line);
                                  }
                                }
                                return out.join("\n");
                              })();
                              const paragraphs = renumbered.split(/\n\s*\n/);

                              const lineHeight = 18;
                              const paraGap = 10;

                              function ensurePageSpace(linesNeeded = 1) {
                                if (
                                  y + lineHeight * linesNeeded >
                                  pageH - margin
                                ) {
                                  // Close current page box
                                  doc.setDrawColor(140);
                                  doc.setLineWidth(1.2);
                                  doc.roundedRect(
                                    boxLeft - BORDER_PAD_X,
                                    boxTop - BORDER_PAD_Y_TOP,
                                    boxRight - boxLeft + BORDER_PAD_X * 2,
                                    y -
                                      boxTop +
                                      BORDER_PAD_Y_TOP +
                                      BORDER_PAD_Y_BOTTOM,
                                    6,
                                    6,
                                  );

                                  // New page
                                  doc.addPage();
                                  y = margin;

                                  // Running header
                                  doc.setFont("times", "bold");
                                  doc.setFontSize(12);
                                  doc.text(headingTitle, margin, y);
                                  doc.setDrawColor(220);
                                  doc.setLineWidth(0.5);
                                  doc.line(
                                    margin,
                                    y + 6,
                                    pageW - margin,
                                    y + 6,
                                  );
                                  y += 16;

                                  // Reset box top for new page
                                  boxTop = y;
                                }
                              }

                              for (const para of paragraphs) {
                                const text = para.trim();
                                if (!text) {
                                  y += paraGap;
                                  continue;
                                }

                                const isSection =
                                  /^\s*(Section\s+[A-Z0-9\-–].*)$/i.test(text);
                                const isQuestion = /^\s*(?:\d+)\.\s+/.test(
                                  text,
                                );
                                const isOptionLine =
                                  /^\s*([A-Da-d][\).]|\([A-Da-d]\))\s+/.test(
                                    text,
                                  );

                                if (isSection) {
                                  doc.setFont("times", "bold");
                                  doc.setFontSize(15);
                                  ensurePageSpace(2);
                                  doc.text(
                                    text.replace(/\*\*/g, ""),
                                    margin,
                                    y,
                                  );
                                  y += 8;
                                  doc.setDrawColor(210);
                                  doc.setLineWidth(0.6);
                                  doc.line(margin, y, pageW - margin, y);
                                  y += 10;
                                  continue;
                                }

                                const measure = (t: string, bold: boolean) => {
                                  doc.setFont(
                                    "times",
                                    bold ? "bold" : "normal",
                                  );
                                  return doc.getTextWidth(t);
                                };
                                const drawStyledLine = (
                                  raw: string,
                                  baseBold: boolean,
                                  x: number,
                                  maxW: number,
                                ) => {
                                  // Split into segments by **bold**
                                  const parts = raw
                                    .split(/(\*\*[^*]+\*\*)/g)
                                    .filter(Boolean)
                                    .map((seg) => {
                                      if (/^\*\*[^*]+\*\*$/.test(seg)) {
                                        return {
                                          text: seg.slice(2, -2),
                                          bold: true,
                                        };
                                      }
                                      return { text: seg, bold: baseBold };
                                    });
                                  // Tokenize by spaces preserving them
                                  const tokens: {
                                    text: string;
                                    bold: boolean;
                                  }[] = [];
                                  for (const p of parts) {
                                    const pieces = p.text.split(/(\s+)/);
                                    for (const piece of pieces) {
                                      if (piece === "") continue;
                                      tokens.push({
                                        text: piece,
                                        bold: p.bold,
                                      });
                                    }
                                  }
                                  let line: { text: string; bold: boolean }[] =
                                    [];
                                  let lineW = 0;
                                  let cursorX = x;
                                  const flush = () => {
                                    if (!line.length) return;
                                    ensurePageSpace(1);
                                    cursorX = x;
                                    for (const seg of line) {
                                      doc.setFont(
                                        "times",
                                        seg.bold ? "bold" : "normal",
                                      );
                                      doc.text(seg.text, cursorX, y);
                                      cursorX += measure(seg.text, seg.bold);
                                    }
                                    y += lineHeight;
                                    line = [];
                                    lineW = 0;
                                  };
                                  for (const tk of tokens) {
                                    const w = measure(tk.text, tk.bold);
                                    if (
                                      lineW + w > maxW &&
                                      tk.text.trim() !== ""
                                    ) {
                                      flush();
                                      // Avoid starting line with plain space
                                      if (tk.text.trim() === "") continue;
                                    }
                                    line.push(tk);
                                    lineW += w;
                                  }
                                  flush();
                                };

                                const lines = text.split(/\n/);
                                for (let i = 0; i < lines.length; i++) {
                                  let l = lines[i];
                                  const isOption =
                                    /^\s*(?:[A-Da-d][\).]|\([A-Da-d]\))\s+/.test(
                                      l,
                                    );
                                  const indent = isOption ? 18 : 0;
                                  // Normalize "Q1." -> "Q.1."
                                  l = l.replace(
                                    /^(\s*)(?:Q\.?\s*)?(\d+)\./i,
                                    "$1$2.",
                                  );
                                  const baseBold =
                                    isQuestion || /^\s*Q\.?\s*\d+\./i.test(l);
                                  doc.setFontSize(baseBold ? 13 : 12);
                                  drawStyledLine(
                                    l,
                                    baseBold,
                                    margin + indent,
                                    contentW - indent,
                                  );
                                  if (isOption) y -= 3;
                                }

                                y += paraGap;
                              }

                              // Close last content box
                              doc.setDrawColor(140);
                              doc.setLineWidth(1.2);
                              doc.roundedRect(
                                boxLeft - BORDER_PAD_X,
                                boxTop - BORDER_PAD_Y_TOP,
                                boxRight - boxLeft + BORDER_PAD_X * 2,
                                y -
                                  boxTop +
                                  BORDER_PAD_Y_TOP +
                                  BORDER_PAD_Y_BOTTOM,
                                6,
                                6,
                              );

                              // Footer watermark instead of page numbers
                              const totalPages = doc.getNumberOfPages();
                              for (let i = 1; i <= totalPages; i++) {
                                doc.setPage(i);
                                doc.setFont("times", "bold");
                                doc.setFontSize(12);
                                doc.setTextColor(200);
                                doc.text(headingTitle, pageW / 2, pageH - 28, {
                                  align: "center",
                                });
                                doc.setTextColor(0);
                              }

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
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl bg-card/60 p-8 text-base overflow-hidden">
                      <div className="paper-view">
                        <div
                          className="paper-body prose prose-invert prose-lg leading-relaxed max-w-none break-words"
                          dangerouslySetInnerHTML={{
                            __html: formatResultHtml(result || ""),
                          }}
                        />
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
