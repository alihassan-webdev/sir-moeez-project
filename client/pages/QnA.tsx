import * as React from "react";
import { useState, useEffect } from "react";
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

type Entry = { path: string; url: string; name: string };

const API_URL = (() => {
  const env = (import.meta.env as any).VITE_PREDICT_ENDPOINT as
    | string
    | undefined;
  return env && env.trim() ? env : "/.netlify/functions/proxy";
})();

export default function QnA() {
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
  const [file, setFile] = useState<File | null>(null);
  const [qaCount, setQaCount] = useState<number | null>(10);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Progressive unlocking flags
  const canSelectSubject = !!selectedClass;
  const canSelectChapter = !!selectedSubject;
  const canEnterCount = !!selectedChapterPath;

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
    setFile(null);
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedSubject) {
      setChapterOptions(selectedClass ? byClass[selectedClass] || [] : []);
      return;
    }
    const arr = (byClass[selectedClass] || []).filter((e) => {
      const m = e.path.replace(/^\/?datafiles\//, "");
      return (m.split("/")[1] || "General") === selectedSubject;
    });
    setChapterOptions(arr);
    setSelectedChapterPath("");
    setFile(null);
  }, [selectedSubject, selectedClass]);

  const handleSelectChapter = async (path: string) => {
    setSelectedChapterPath(path);
    const found = entries.find((e) => e.path === path);
    if (!found) return;
    try {
      const res = await fetch(found.url);
      const blob = await res.blob();
      const f = new File([blob], found.name, { type: "application/pdf" });
      setFile(f);
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

  const buildQaPrompt = (n: number) => {
    return `Generate exactly ${n} question–answer pairs strictly from the attached PDF chapter. Use the following format and rules:\n\nQ1. <question>\nAnswer: <concise, correct answer>\n\nQ2. <question>\nAnswer: <concise, correct answer>\n\n- Do NOT include options or MCQs\n- Keep answers brief (one or two sentences)\n- Number sequentially starting at Q1.`;
  };

  const runSubmit = async () => {
    setResult(null);
    setLoading(true);
    try {
      if (!file) {
        toast({
          title: "Attach a PDF",
          description: "Please select a chapter.",
        });
        setLoading(false);
        return;
      }
      if (!qaCount || qaCount < 1 || qaCount > 200) {
        toast({
          title: "Invalid count",
          description: "Enter 1–200 Q&A pairs.",
        });
        setLoading(false);
        return;
      }

      const q = buildQaPrompt(qaCount);
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
                  Q&A Generator
                </h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  Generate concise question–answer pairs for quick revision.
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

                    <div className={`transition-all duration-200 ease-out ${!canSelectSubject ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
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

                    <div className={`transition-all duration-200 ease-out ${!canSelectChapter ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
                      <label className="text-sm font-medium text-muted-foreground">
                        Chapter (PDF)
                      </label>
                      <Select
                        value={selectedChapterPath}
                        onValueChange={(v) => {
                          setSelectedChapterPath(v);
                          handleSelectChapter(v);
                        }}
                      >
                        <SelectTrigger
                          className="w-full"
                          disabled={!canSelectChapter}
                        >
                          <SelectValue
                            placeholder={
                              canSelectChapter
                                ? "Select chapter"
                                : "Select subject first"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {chapterOptions.map((c) => (
                            <SelectItem key={c.path} value={c.path}>
                              {c.name.replace(/\.pdf$/i, "")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className={`transition-all duration-200 ease-out ${!canEnterCount ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
                      <label className="text-sm font-medium text-muted-foreground">
                        Number of Q&A pairs
                      </label>
                      <div className="flex gap-2 items-center flex-wrap">
                        <input
                          type="number"
                          min={1}
                          max={200}
                          value={qaCount ?? ""}
                          onChange={(e) =>
                            setQaCount(
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
                          onClick={() => setQaCount(5)}
                          disabled={!canEnterCount}
                          className={`rounded-md px-3 py-2 text-sm border ${qaCount === 5 ? "bg-primary text-primary-foreground border-primary" : "bg-white text-foreground/90 border-input hover:bg-muted/50"}`}
                        >
                          5
                        </button>
                        <button
                          type="button"
                          onClick={() => setQaCount(10)}
                          disabled={!canEnterCount}
                          className={`rounded-md px-3 py-2 text-sm border ${qaCount === 10 ? "bg-primary text-primary-foreground border-primary" : "bg-white text-foreground/90 border-input hover:bg-muted/50"}`}
                        >
                          10
                        </button>
                        <button
                          type="button"
                          onClick={() => setQaCount(20)}
                          disabled={!canEnterCount}
                          className={`rounded-md px-3 py-2 text-sm border ${qaCount === 20 ? "bg-primary text-primary-foreground border-primary" : "bg-white text-foreground/90 border-input hover:bg-muted/50"}`}
                        >
                          20
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <Button
                      disabled={!file || !qaCount || loading}
                      onClick={runSubmit}
                      className="relative flex items-center gap-3 !shadow-none hover:!shadow-none"
                    >
                      {loading ? "Generating..." : "Generate Q&A"}
                    </Button>

                    <Button
                      className="bg-primary/10 border-primary/60 text-blue-600"
                      onClick={() => {
                        setSelectedClass("");
                        setSelectedSubject("");
                        setSelectedChapterPath("");
                        setFile(null);
                        setQaCount(10);
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
