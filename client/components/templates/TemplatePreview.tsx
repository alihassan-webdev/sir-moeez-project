import { type CSSProperties } from "react";

import { TemplateDefinition } from "@/lib/templates";
import { cn } from "@/lib/utils";

type TemplatePreviewProps = {
  template: TemplateDefinition;
  mode?: "compact" | "regular";
};

type PreviewRendererProps = {
  template: TemplateDefinition;
  mode: "compact" | "regular";
};

export function TemplatePreview({
  template,
  mode = "compact",
}: TemplatePreviewProps) {
  const variant = template.preview.variant ?? "default";

  if (variant === "board-exam") {
    return <BoardExamPreview template={template} mode={mode} />;
  }

  return <DefaultPreview template={template} mode={mode} />;
}

function DefaultPreview({ template, mode }: PreviewRendererProps) {
  const { preview, layout, palette } = template;

  const headerStyle: CSSProperties = {
    background: preview.headerBackground,
    color: preview.headerTextColor,
    boxShadow: mode === "regular" ? layout.headerShadow : "none",
    textTransform: layout.uppercaseTitle ? "uppercase" : undefined,
  };

  const bodyStyle: CSSProperties = {
    color: preview.bodyTextColor,
  };

  const accentEnabled =
    layout.accentLine !== "none" && Boolean(preview.accentBar);
  const accentElement = accentEnabled ? (
    <div
      className={cn(
        "w-full rounded-full",
        mode === "compact" ? "h-1" : "h-1.5",
      )}
      style={{ background: preview.accentBar }}
    />
  ) : null;

  const headerElement = (
    <div
      className={cn(
        "rounded-md font-semibold",
        mode === "compact" ? "px-3 py-2 text-[11px]" : "px-4 py-3 text-sm",
        layout.headerAlign === "center" ? "text-center" : "text-left",
      )}
      style={headerStyle}
    >
      Sample Exam Paper
    </div>
  );

  const metaRow = (
    <div
      className={cn(
        "grid grid-cols-3 gap-2 text-[10px] opacity-80",
        mode === "compact" ? "mt-1" : "mt-2",
      )}
      style={{ color: preview.bodyTextColor }}
    >
      <div>Time: 3 hrs</div>
      <div
        className={cn(
          layout.headerAlign === "center" ? "text-center" : "text-left",
        )}
      >
        Max Marks: 100
      </div>
      <div className="text-right">Section A</div>
    </div>
  );

  const questionCard = (n: number, title: string, detail?: string) => (
    <div
      className={cn(
        "rounded border text-left leading-relaxed",
        mode === "compact" ? "px-3 py-2 text-[10px]" : "px-4 py-3 text-[11px]",
      )}
      style={{
        background: palette.cardBackground,
        borderColor: palette.border,
        color: preview.bodyTextColor,
      }}
    >
      <div className="font-semibold">
        {n}. {title}
      </div>
      {detail ? (
        <div
          className={cn("opacity-80", mode === "compact" ? "mt-0.5" : "mt-1")}
        >
          {detail}
        </div>
      ) : null}
    </div>
  );

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border",
        mode === "compact" ? "border-border/40" : "border-border/30 shadow-sm",
      )}
      style={{
        background: preview.background,
        minHeight: mode === "compact" ? 140 : 180,
      }}
    >
      {palette.watermark ? (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 flex items-center justify-center font-black uppercase tracking-[0.4em]",
            mode === "compact" ? "text-[20px]" : "text-[26px]",
          )}
          style={{ color: palette.heading, opacity: palette.watermark.opacity }}
        >
          {palette.watermark.text}
        </div>
      ) : null}

      <div
        className={cn(
          "relative z-10",
          mode === "compact" ? "space-y-2 p-3" : "space-y-3 p-5",
        )}
      >
        {layout.accentLine === "top" ? accentElement : null}
        {headerElement}
        {metaRow}
        {layout.accentLine === "bottom" ? accentElement : null}
        {questionCard(
          1,
          "Explain the water cycle.",
          "Describe evaporation, condensation, and precipitation.",
        )}
        {questionCard(
          2,
          "Define photosynthesis.",
          "Include the chemical equation.",
        )}
      </div>
    </div>
  );
}

function BoardExamPreview({ template, mode }: PreviewRendererProps) {
  const html = `
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:"Poppins",Arial,sans-serif;background:#f6f6f8;color:#111}
    .page{width:210mm;min-height:297mm;margin:15mm auto;padding:18mm 16mm;background:#fff;border:1px solid #e5e5e5;box-shadow:0 0 15px rgba(0,0,0,0.05);border-radius:8px}
    header{display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #111;padding-bottom:10px;margin-bottom:16px}
    .logo{font-weight:600;font-size:16px;color:#333}
    .school-info{flex:1;text-align:center}
    .school-info h1{margin:0;font-size:22px;font-weight:600}
    .school-info p{font-size:13px;color:#555;margin-top:3px}
    .meta{width:220px;text-align:left}
    .meta table{width:100%;border-collapse:collapse}
    .meta td{padding:4px;font-size:13px;border-bottom:1px solid #eee}
    .title{text-align:center;margin:20px 0 10px 0}
    .title h2{font-size:18px;font-weight:600}
    .subtitle{font-size:13px;color:#555;margin-top:4px}
    .instructions{border:1px solid #ddd;border-radius:6px;padding:10px;font-size:13px;margin:14px 0;color:#333;background:#fafafa}
    .marks-table{width:100%;border-collapse:collapse;margin:10px 0}
    .marks-table th, .marks-table td{border:1px solid #ddd;padding:8px;text-align:center;font-size:13px}
    .marks-table th{background:#f3f3f3;font-weight:600}
    section.questions{margin-top:15px}
    .question{border:1px dashed #ccc;border-radius:5px;padding:10px;margin-bottom:10px;min-height:40px}
    footer{border-top:1px solid #ddd;margin-top:20px;padding-top:10px;display:flex;justify-content:space-between;font-size:13px;color:#444}
    .sign{width:30%;text-align:center}
    @media print{body{background:#fff}.page{box-shadow:none;border:none;border-radius:0;margin:0;padding:12mm}}
  </style>
  <div class="page" id="paper">
    <header>
      <div class="logo">Logo</div>
      <div class="school-info">
        <h1>Institution / School / College Name</h1>
        <p>Address · Phone · Website</p>
        <p>Course / Department</p>
      </div>
      <div class="meta">
        <table>
          <tr><td>Type:</td><td>Exam Paper</td></tr>
          <tr><td>Subject:</td><td>Subject Name</td></tr>
          <tr><td>Class:</td><td>10th</td></tr>
          <tr><td>Duration:</td><td>2 Hours</td></tr>
          <tr><td>Total Marks:</td><td>100</td></tr>
        </table>
      </div>
    </header>

    <div class="title">
      <h2>Government of Pakistan — Examination Paper</h2>
      <div class="subtitle">Instructions: Read all questions carefully before attempting.</div>
    </div>

    <div class="instructions">Write exam instructions here...</div>

    <table class="marks-table">
      <thead>
        <tr><th>Section</th><th>Questions</th><th>Marks</th></tr>
      </thead>
      <tbody>
        <tr><td>A</td><td></td><td></td></tr>
        <tr><td>B</td><td></td><td></td></tr>
        <tr><td>C</td><td></td><td></td></tr>
      </tbody>
    </table>

    <section class="questions">
      <div class="question">Question area...</div>
      <div class="question">Question area...</div>
      <div class="question">Question area...</div>
    </section>

    <footer>
      <div class="sign">Examiner Signature</div>
      <div class="sign">Date</div>
      <div class="sign">Instructor Signature</div>
    </footer>
  </div>
  `;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border",
        mode === "compact" ? "border-border/40" : "border-border/30 shadow-sm",
      )}
      style={{ background: template.preview.background }}
    >
      <div className={cn("mx-auto w-full", mode === "compact" ? "max-w-[320px]" : "max-w-[360px]")}>
        <div className={cn(mode === "compact" ? "p-2" : "p-4")} dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}
