import type { CSSProperties } from "react";
import { TemplateDefinition } from "@/lib/templates";
import { cn } from "@/lib/utils";

type TemplatePreviewProps = {
  template: TemplateDefinition;
  mode?: "compact" | "regular";
};

export function TemplatePreview({
  template,
  mode = "compact",
}: TemplatePreviewProps) {
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
