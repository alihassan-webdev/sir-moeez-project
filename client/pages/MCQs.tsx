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
import { ListChecks, ChevronDown, Download } from "lucide-react";
import { generateExamStylePdf } from "@/lib/pdf";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatResultHtml } from "@/lib/format";
import ToolLock from "@/components/ToolLock";
import { Link } from "react-router-dom";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { saveUserResult } from "@/lib/results";
import { fetchOnce } from "@/lib/endpoints";

type Entry = { path: string; url: string; name: string };

// Using centralized API_URL from endpoints.ts via fetchOnce

export default function MCQs() {
  const pdfModules = import.meta.glob("/datafiles/**/*.pdf", {
    query: "?url",
    import: "default",
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
  const mergeToken = useRef(0);
  const [file, setFile] = useState<File | null>(null);
  const [mcqCount, setMcqCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const lastSavedRef = React.useRef<string | null>(null);

  const [profile, setProfile] = useState<{
    name?: string;
    phone?: string;
    instituteName?: string;
    instituteLogo?: string;
  } | null>(null);

  useEffect(() => {
    const u = auth.currentUser;
    if (!u?.uid) return;
    const ref = doc(db, "users", u.uid);
    const unsub = onSnapshot(ref, (snap) => {
      const d = snap.data() as any | undefined;
      if (!d) {
        setProfile({});
        return;
      }
      setProfile({
        name: String(d.name || ""),
        phone: String(d.phone || ""),
        instituteName: String(d.instituteName || ""),
        instituteLogo:
          typeof d.instituteLogo === "string" ? d.instituteLogo : undefined,
      });
    });
    return () => unsub();
  }, []);

  const isProfileCompleteForPdf = Boolean(
    profile?.name &&
      profile?.phone &&
      profile?.instituteName &&
      profile?.instituteLogo,
  );

  useEffect(() => {
    if (!result) return;
    if (lastSavedRef.current === result) return;
    lastSavedRef.current = result;
    (async () => {
      try {
        const title = `${selectedClass ? selectedClass + " • " : ""}${selectedSubject || "MCQs"} — MCQs`;
        void saveUserResult({
          examType: "mcqs",
          title,
          resultData: result,
          downloadUrl: null,
          score: null,
          instituteName: profile?.instituteName,
          instituteLogo: profile?.instituteLogo,
        });
      } catch {}
    })();
  }, [
    result,
    selectedClass,
    selectedSubject,
    profile?.instituteName,
    profile?.instituteLogo,
  ]);

  // Progressive unlocking flags
  const canSelectSubject = !!selectedClass;
  const canSelectChapter = !!selectedSubject;
  const canEnterCount = !!file && !isMerging;

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
      const token = ++mergeToken.current;
      setIsMerging(true);
      try {
        if (!paths.length) {
          if (mergeToken.current === token) setFile(null);
          return;
        }
        const { PDFDocument } = await import("pdf-lib");
        const mergedPdf = await PDFDocument.create();
        const ordered = chapterOptions
          .filter((c) => paths.includes(c.path))
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((c) => c.path);

        const fetchResults = await Promise.allSettled(
          ordered.map(async (p) => {
            if (pdfBytesCache.current.has(p)) return { path: p } as const;
            const found = entries.find((e) => e.path === p);
            if (!found) return { path: p, error: "not found" } as const;
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 30000);
            try {
              const res = await fetch(found.url, { signal: controller.signal });
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              const bytes = await res.arrayBuffer();
              if (bytes.byteLength === 0) throw new Error("Empty PDF file");
              const header = new Uint8Array(bytes, 0, 4);
              const headerStr = Array.from(header)
                .map((b) => String.fromCharCode(b))
                .join("");
              if (headerStr !== "%PDF") throw new Error("Invalid PDF");
              pdfBytesCache.current.set(p, bytes);
              return { path: p } as const;
            } finally {
              clearTimeout(timeout);
            }
          }),
        );
        const failed = fetchResults.filter((r) => r.status === "rejected");
        if (failed.length) {
          console.warn("Some PDFs failed to prefetch:", failed.length);
        }

        let pageCount = 0;
        for (const p of ordered) {
          const bytes = pdfBytesCache.current.get(p);
          if (!bytes) continue;
          const src = await PDFDocument.load(bytes, {
            ignoreEncryption: true,
            throwOnInvalidObject: true,
          });
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
          if (mergeToken.current === token) setFile(null);
          return;
        }
        if (mergeToken.current === token) setFile(mergedFile);
      } catch (err) {
        toast({ title: "Merge failed", description: "Could not merge PDFs." });
        if (mergeToken.current === token) setFile(null);
      } finally {
        if (mergeToken.current === token) setIsMerging(false);
      }
    },
    [chapterOptions, entries, selectedSubject],
  );

  useEffect(() => {
    (async () => {
      try {
        await Promise.allSettled(
          chapterOptions.map(async (c) => {
            if (pdfBytesCache.current.has(c.path)) return;
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 20000);
            try {
              const res = await fetch(c.url, { signal: controller.signal });
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              const bytes = await res.arrayBuffer();
              if (bytes.byteLength === 0) throw new Error("Empty PDF file");
              pdfBytesCache.current.set(c.path, bytes);
            } finally {
              clearTimeout(timeout);
            }
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
    setLoading(true);
    // Always clear previous result before a fresh generation
    setResult(null);
    try {
      if (!file) {
        toast({
          title: "Attach a PDF",
          description: "Please select or upload a PDF chapter.",
        });
        setLoading(false);
        return;
      }
      if (!mcqCount || mcqCount < 5 || mcqCount > 30) {
        toast({ title: "Invalid count", description: "Enter 5–30 MCQs." });
        setLoading(false);
        return;
      }
      // Batching strategy
      const total = mcqCount;
      const BATCH_SIZE = 30;
      const batches: number[] = [];
      let remaining = total;
      while (remaining > 0) {
        const chunk = Math.min(BATCH_SIZE, remaining);
        batches.push(chunk);
        remaining -= chunk;
      }

      const assembled: string[] = [];

      const extractText = async (r: Response | null) => {
        if (!r) return "";
        const ct = r.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          const j = await r.json().catch(async () => await r.text());
          const got =
            typeof j === "string"
              ? j
              : (j?.questions ?? j?.result ?? j?.message ?? JSON.stringify(j));
          return String(got ?? "").trim();
        }
        return String((await r.text()) ?? "").trim();
      };

      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      const backoffs = [500, 1000, 2000];

      const validateCount = (txt: string, exp: number) => {
        if (!txt) return false;
        let matches = txt.match(/^\s*Q\s*\d+\s*[\.)\:]/gim) || [];
        let count = matches.length;
        if (count === 0) {
          matches = txt.match(/^\s*\d+\s*[\.)\:]/gim) || [];
          count = matches.length;
        }
        return count === exp;
      };

      let hadHardFailure = false;

      for (let i = 0; i < batches.length; i++) {
        const want = batches[i];
        const q = buildMcqPrompt(want);

        // New form per batch (payload kept minimal)
        const form = new FormData();
        form.append("pdf", file);
        form.append("query", q);
        form.append("expected", String(want));
        form.append("requestId", String(Date.now()));

        let text = "";
        let success = false;

        for (let attempt = 0; attempt < 3; attempt++) {
          const res = await withTimeout(fetchOnce(form), 30000).catch(
            () => null as any,
          );

          if (res && res.success !== false) {
            if (typeof res === "string") text = String(res);
            else if (typeof res?.result === "string") text = res.result;
            else {
              const got = res?.questions ?? res?.message ?? "";
              text = String(got);
            }
            success = true;
            break;
          }

          // backoff before next try
          await sleep(backoffs[Math.min(attempt, backoffs.length - 1)]);
        }

        if (!success) {
          hadHardFailure = true;
          break;
        }

        // Append batch result and update UI progressively
        if (text) {
          assembled.push(text);
          setResult(assembled.join("\n\n"));
        }
      }

      const final = (assembled.join("\n\n")).trim();
      if (!final) {
        toast({
          title: "Generation failed",
          description:
            "Too many questions requested. Please reduce count or try again.",
          variant: "destructive",
        });
        setResult(null);
        return;
      }

      // Final validation: total count should match request; otherwise show warning but keep content
      const totalOk = (() => {
        let matches = final.match(/^\s*Q\s*\d+\s*[\.)\:]/gim) || [];
        let count = matches.length;
        if (count === 0) {
          matches = final.match(/^\s*\d+\s*[\.)\:]/gim) || [];
          count = matches.length;
        }
        return count === total;
      })();

      if (!totalOk) {
        toast({
          title: "Assembled with differences",
          description:
            "Generated count differs from requested. Please review the paper.",
        });
      }
      setResult(final);
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
            </div>
          </aside>

          <div>
            <section className="relative overflow-hidden rounded-2xl px-6 pt-0 pb-12 sm:pt-0 sm:pb-14 mt-4">
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
              <ToolLock>
                <div className="flex flex-col gap-4">
                  <div className="order-2 w-full max-w-4xl mx-auto rounded-xl card-yellow-shadow border border-muted/20 bg-white p-8 sm:p-10">
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
                                {selectedCount}/{allChapterPaths.length}{" "}
                                selected
                              </span>
                            </DropdownMenuLabel>
                            <DropdownMenuCheckboxItem
                              checked={isAllSelected}
                              onCheckedChange={(c) =>
                                handleToggleAll(Boolean(c))
                              }
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
                                      handleToggleChapter(
                                        c.path,
                                        Boolean(check),
                                      )
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
                        disabled={!file || !mcqCount || loading || isMerging}
                        onClick={runSubmit}
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
                        disabled={!result}
                        onClick={() => {
                          setSelectedClass("");
                          setSelectedSubject("");
                          setSelectedChapterPath("");
                          setSelectedChapterPaths([]);
                          setFile(null);
                          setMcqCount(null);
                          setResult(null);
                        }}
                      >
                        Reset
                      </Button>
                    </div>
                  </div>

                  {result && (
                    <div className="order-3 mt-0 w-full max-w-4xl mx-auto">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Result</h3>
                        <div className="flex items-center gap-2">
                          <Button
                            aria-label="Download PDF"
                            variant="secondary"
                            size="icon"
                            disabled={!result || !!loading}
                            onClick={async () => {
                              if (!result) return;
                              if (!isProfileCompleteForPdf) {
                                toast({
                                  title: "Profile incomplete",
                                  description:
                                    "Please complete your profile (name, phone, institute name, and logo) before generating exams.",
                                });
                                return;
                              }
                              try {
                                await generateExamStylePdf({
                                  title: "MCQs",
                                  body: result,
                                  filenameBase: "mcqs",
                                  instituteHeader: {
                                    instituteName: profile?.instituteName,
                                    instituteLogo: profile?.instituteLogo,
                                  },
                                });
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
              </ToolLock>
            </section>
          </div>
        </div>
      </Container>
    </div>
  );
}
