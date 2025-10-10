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
  const cardPadding = mode === "compact" ? "p-3" : "p-5";

  const lineClass = mode === "compact" ? "h-2 w-3/4" : "h-3 w-2/3";
  const smallLine = mode === "compact" ? "h-2 w-1/3" : "h-3 w-1/4";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border",
        mode === "compact" ? "border-border/40" : "border-border/30 shadow-sm",
      )}
      style={{ background: preview.background }}
    >
      <div
        className={cn(
          "mx-auto w-full",
          mode === "compact" ? "max-w-[320px]" : "max-w-[360px]",
        )}
      >
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
          <header className={cn("flex items-center justify-between border-b-2", mode === "compact" ? "pb-2" : "pb-3")}>
            <div className="flex items-center gap-3">
              <div
                className={cn("flex items-center justify-center rounded-md border bg-white", mode === "compact" ? "h-10 w-10" : "h-12 w-12")}
                style={{ borderColor: "#bbbbbb", color: palette.accent }}
              >
                <div className="text-[10px] font-semibold">LOGO</div>
              </div>
              <div>
                <div className="font-semibold text-sm">{template.name}</div>
                <div className="mt-0.5 opacity-80 text-xs">{template.description}</div>
                <div className="mt-1 flex items-center gap-2">
                  <span className={cn("inline-block rounded-full px-2 py-0.5 text-[11px] font-medium", "bg-[rgba(0,0,0,0.06)] text-[rgba(0,0,0,0.7)]")}>{template.tier}</span>
                </div>
              </div>
            </div>
          </header>

          <div className="p-3">
            <div className="animate-pulse">
              <div className="flex items-center justify-between mb-3">
                <div className={cn("rounded bg-gray-200", lineClass)} />
                <div className={cn("rounded bg-gray-200", smallLine)} />
              </div>

              <div className={cn("rounded border border-dashed bg-[rgba(0,0,0,0.03)] p-3 mb-3")}
                style={{ borderColor: "#e5e7eb" }}>
                <div className="space-y-2">
                  <div className="rounded bg-gray-200 h-2 w-5/6" />
                  <div className="rounded bg-gray-200 h-2 w-3/4" />
                </div>
              </div>

              <div className="mb-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded bg-gray-200 h-8" />
                  <div className="rounded bg-gray-200 h-8" />
                  <div className="rounded bg-gray-200 h-8" />
                </div>
              </div>

              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded border p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="rounded bg-gray-200 h-3 w-1/3" />
                      <div className="rounded bg-gray-200 h-3 w-1/6" />
                    </div>
                    <div className="space-y-2">
                      <div className="rounded bg-gray-200 h-2 w-full" />
                      <div className="rounded bg-gray-200 h-2 w-5/6" />
                      <div className="rounded bg-gray-200 h-2 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 text-center text-xs text-muted-foreground">This is a visual preview. Actual paper content is removed for clarity.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
