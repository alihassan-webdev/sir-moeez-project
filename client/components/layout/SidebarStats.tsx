import * as React from "react";

export default function SidebarStats() {
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

  const classesCount = React.useMemo(
    () => Object.keys(byClass).length,
    [byClass],
  );

  const subjectsCount = React.useMemo(() => {
    const s = new Set<string>();
    for (const arr of Object.values(byClass)) {
      for (const e of arr) {
        const m = e.path.replace(/^\/?datafiles\//, "");
        const subject = (m.split("/")[1] || "General").trim();
        if (subject) s.add(subject);
      }
    }
    return s.size;
  }, [byClass]);

  const chaptersCount = entries.length;

  return (
    <div className="mt-5 border-t pt-4">
      <div className="grid grid-cols-1 gap-3">
        <div className="rounded-lg border border-input bg-white px-4 py-3">
          <div className="text-xs font-semibold text-muted-foreground">
            Classes
          </div>
          <div className="text-lg font-extrabold">{classesCount}</div>
        </div>
        <div className="rounded-lg border border-input bg-white px-4 py-3">
          <div className="text-xs font-semibold text-muted-foreground">
            Subjects
          </div>
          <div className="text-lg font-extrabold">{subjectsCount}</div>
        </div>
        <div className="rounded-lg border border-input bg-white px-4 py-3">
          <div className="text-xs font-semibold text-muted-foreground">
            Chapters
          </div>
          <div className="text-lg font-extrabold">{chaptersCount}</div>
        </div>
      </div>
    </div>
  );
}
