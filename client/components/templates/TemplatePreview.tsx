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
  const { palette, preview } = template;
  const borderColor = palette.border ?? "#d6d6d6";
  const accentColor = palette.accent ?? "#222222";
  const cardPadding = mode === "compact" ? "p-3" : "p-5";
  const headerGap = mode === "compact" ? "gap-3 pb-3" : "gap-4 pb-4";
  const infoTextClass = mode === "compact" ? "text-[7.5px]" : "text-[9px]";
  const bodyTextClass = mode === "compact" ? "text-[8.5px]" : "text-[10px]";
  const sectionHeadingClass = mode === "compact" ? "text-[9.5px]" : "text-[11px]";
  const footerTextClass = mode === "compact" ? "text-[8.5px]" : "text-[10px]";
  const instructionsPadding = mode === "compact" ? "p-3" : "p-4";
  const questionSpacing = mode === "compact" ? "space-y-1.5" : "space-y-2";
  const optionSpacing = mode === "compact" ? "space-y-0.5" : "space-y-1";
  const logoSizeClass = mode === "compact" ? "h-10 w-10 text-[8px]" : "h-12 w-12 text-[9px]";

  const instructions = [
    "Attempt ALL questions. The paper is divided into Sections A, B and C.",
    "Read each question carefully and write your answers clearly.",
    "Write your answers in the space provided. Extra sheets must be attached.",
  ];

  const marksRows: Array<[string, string, string]> = [
    ["A", "Multiple Choice Questions (1-10)", "20"],
    ["B", "Short Answer Questions (11-16)", "30"],
    ["C", "Long Answer Questions (17-20)", "50"],
  ];

  const mcqQuestions = [
    {
      prompt: "Choose the correct option: The capital of Pakistan is",
      options: ["a) Lahore", "b) Islamabad", "c) Karachi", "d) Quetta"],
    },
    {
      prompt: "Choose the correct option: The national language of Pakistan is",
      options: ["a) Punjabi", "b) Urdu", "c) Pashto", "d) Sindhi"],
    },
  ];

  const shortAnswers = [
    "Write the year in which the Constitution of Pakistan was adopted.",
    "Define the term 'democracy' in two lines.",
    "Give two major exports of Pakistan.",
  ];

  const longAnswers = [
    "Discuss the major challenges faced by Pakistan's education system and propose practical solutions.",
    "Describe the impact of globalization on Pakistan's economy with relevant examples.",
    "Discuss the role of youth in national development. Suggest three key initiatives.",
  ];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border",
        mode === "compact" ? "border-border/40" : "border-border/30 shadow-sm",
      )}
      style={{ background: preview.background }}
    >
      <div className={cn("mx-auto w-full", mode === "compact" ? "max-w-[320px]" : "max-w-[360px]")}>
        <div
          className={cn(
            "flex flex-col gap-3 rounded-lg border bg-white shadow-sm",
            cardPadding,
          )}
          style={{
            borderColor,
            fontFamily: palette.fontFamily,
            color: preview.bodyTextColor,
          }}
        >
          <header
            className={cn(
              "flex flex-wrap items-center justify-between border-b-2 border-[#222222]",
              headerGap,
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex items-center justify-center rounded-md border uppercase tracking-[0.18em] font-semibold",
                  logoSizeClass,
                )}
                style={{ borderColor: "#bbbbbb", color: accentColor }}
              >
                LOGO
              </div>
              <div className={cn("text-left", mode === "compact" ? "text-[9px]" : "text-[11px]")}>
                <div className="font-semibold leading-snug">
                  Board of Intermediate and Secondary Education, Faisalabad
                </div>
                <div
                  className="mt-0.5 opacity-80"
                  style={{ fontSize: mode === "compact" ? "8px" : "9px" }}
                >
                  www.bisefsd.edu.pk · Address · Phone
                </div>
              </div>
            </div>
            <div
              className={cn(
                "grid w-full max-w-[190px] grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-1 text-left",
                infoTextClass,
              )}
            >
              <span className="font-semibold">Exam:</span>
              <span>Matric Annual Examination 2025</span>
              <span className="font-semibold">Subject:</span>
              <span>English (Compulsory)</span>
              <span className="font-semibold">Class/Group:</span>
              <span>9 / Science</span>
              <span className="font-semibold">Duration:</span>
              <span>2 hours</span>
              <span className="font-semibold">Total Marks:</span>
              <span>100</span>
            </div>
          </header>

          <div className="text-center">
            <div
              className={cn("font-semibold", sectionHeadingClass)}
              style={{ color: accentColor }}
            >
              Matriculation — English (Compulsory) — Paper I
            </div>
            <div className={cn("mt-1 opacity-80", bodyTextClass)}>
              Time Allowed: 2 Hours | Total Marks: 100
            </div>
          </div>

          <div
            className={cn(
              "rounded-md border border-dashed bg-[#fbfbfb] text-left",
              instructionsPadding,
              bodyTextClass,
            )}
            style={{ borderColor: "#888888" }}
          >
            <div className="font-semibold">General Instructions:</div>
            <ol className="mt-1 list-decimal space-y-1 pl-4">
              {instructions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </div>

          <div className="flex flex-col gap-2">
            <div
              className="overflow-hidden rounded-md border"
              style={{ borderColor }}
            >
              <div
                className={cn(
                  "grid grid-cols-3 bg-[#f9fafb] font-semibold",
                  infoTextClass,
                )}
                style={{ borderColor }}
              >
                <div className="border-r px-2 py-1" style={{ borderColor }}>
                  Section
                </div>
                <div className="border-r px-2 py-1" style={{ borderColor }}>
                  Questions
                </div>
                <div className="px-2 py-1">Marks</div>
              </div>
              {marksRows.map(([section, detail, marks]) => (
                <div
                  key={section}
                  className={cn(
                    "grid grid-cols-3 border-t",
                    infoTextClass,
                  )}
                  style={{ borderColor }}
                >
                  <div className="border-r px-2 py-1" style={{ borderColor }}>
                    {section}
                  </div>
                  <div className="border-r px-2 py-1" style={{ borderColor }}>
                    {detail}
                  </div>
                  <div className="px-2 py-1 text-center">{marks}</div>
                </div>
              ))}
              <div
                className={cn("grid grid-cols-3 border-t font-semibold", infoTextClass)}
                style={{ borderColor }}
              >
                <div className="border-r px-2 py-1" style={{ borderColor }}>
                  Total
                </div>
                <div className="border-r px-2 py-1" style={{ borderColor }}>
                  —
                </div>
                <div className="px-2 py-1 text-center">100</div>
              </div>
            </div>
          </div>

          <section className="flex flex-col gap-4">
            <div className="space-y-2">
              <div
                className={cn(
                  "flex flex-wrap items-start justify-between gap-1",
                  sectionHeadingClass,
                )}
              >
                <span className="font-semibold">
                  Section A — Multiple Choice Questions
                </span>
                <span className={cn("font-medium opacity-80", bodyTextClass)}>
                  (Each question carries 2 marks)
                </span>
              </div>
              <ol className={cn("list-decimal pl-4", bodyTextClass, questionSpacing)}>
                {mcqQuestions.map(({ prompt, options }, index) => (
                  <li key={prompt} className="space-y-1">
                    <div>{prompt}</div>
                    <div className={cn("space-y-1", optionSpacing)}>
                      {options.map((option) => (
                        <div
                          key={option}
                          className={cn(
                            "flex items-center gap-1 rounded border border-dashed border-border/50 px-2 py-1",
                            infoTextClass,
                          )}
                        >
                          <span className="h-2 w-2 rounded-full border border-border/60" />
                          {option}
                        </div>
                      ))}
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="space-y-2">
              <div
                className={cn(
                  "flex flex-wrap items-start justify-between gap-1",
                  sectionHeadingClass,
                )}
              >
                <span className="font-semibold">
                  Section B — Short Answer Questions
                </span>
                <span className={cn("font-medium opacity-80", bodyTextClass)}>
                  (Attempt all questions)
                </span>
              </div>
              <ol className={cn("list-decimal pl-4", bodyTextClass, questionSpacing)}>
                {shortAnswers.map((prompt) => (
                  <li key={prompt} className="space-y-1">
                    <div>{prompt}</div>
                    <div
                      className="rounded border border-dashed border-border/60 bg-white/40"
                      style={{ padding: mode === "compact" ? "6px" : "8px" }}
                    >
                      Answer...
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="space-y-2">
              <div
                className={cn(
                  "flex flex-wrap items-start justify-between gap-1",
                  sectionHeadingClass,
                )}
              >
                <span className="font-semibold">
                  Section C — Long Answer Questions
                </span>
                <span className={cn("font-medium opacity-80", bodyTextClass)}>
                  (Answer any two)
                </span>
              </div>
              <ol className={cn("list-decimal pl-4", bodyTextClass, questionSpacing)}>
                {longAnswers.map((prompt) => (
                  <li key={prompt} className="space-y-1">
                    <div>{prompt}</div>
                    <div
                      className="rounded border border-dashed border-border/60 bg-white/40"
                      style={{ padding: mode === "compact" ? "8px" : "10px", minHeight: mode === "compact" ? "28px" : "36px" }}
                    >
                      Write detailed answer here...
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <footer
            className={cn(
              "flex flex-wrap justify-between gap-3 border-t",
              footerTextClass,
            )}
            style={{ borderColor: "#cccccc", paddingTop: mode === "compact" ? "10px" : "14px" }}
          >
            <div className="text-center">
              Examiner: ___________________
              <div className="opacity-70">Signature & Stamp</div>
            </div>
            <div className="text-center">Date: _____________</div>
            <div className="text-center">
              Class Teacher: ___________________
              <div className="opacity-70">Signature</div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
