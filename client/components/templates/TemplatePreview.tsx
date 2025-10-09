import type { CSSProperties } from "react";
import { TemplateDefinition } from "@/lib/templates";
import { cn } from "@/lib/utils";

type TemplatePreviewProps = {
  template: TemplateDefinition;
};

export function TemplatePreview({ template }: TemplatePreviewProps) {
  const { preview, layout, palette } = template;

  const headerStyle: CSSProperties = {
    background: preview.headerBackground,
    color: preview.headerTextColor,
    boxShadow: layout.headerShadow,
    textTransform: layout.uppercaseTitle ? "uppercase" : undefined,
  };

  const bodyStyle: CSSProperties = {
    color: preview.bodyTextColor,
  };

  const accentEnabled =
    layout.accentLine !== "none" && Boolean(preview.accentBar);
  const accentElement = accentEnabled ? (
    <div
      className="h-1.5 w-full rounded-full"
      style={{ background: preview.accentBar }}
    />
  ) : null;

  const headerElement = (
    <div
      className={cn(
        "rounded-xl px-4 py-3 text-sm font-semibold shadow-lg backdrop-blur-sm",
        layout.headerAlign === "center" ? "text-center" : "text-left",
      )}
      style={headerStyle}
    >
      Sample Exam Title
    </div>
  );

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-border/40 shadow-sm"
      style={{ background: preview.background }}
    >
      {palette.watermark ? (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center text-[26px] font-black uppercase tracking-[0.4em]"
          style={{
            color: palette.heading,
            opacity: palette.watermark.opacity,
          }}
        >
          {palette.watermark.text}
        </div>
      ) : null}

      <div className="relative z-10 space-y-3 p-5">
        {layout.accentLine === "top" ? accentElement : null}
        {headerElement}
        {layout.accentLine === "bottom" ? accentElement : null}
        <div
          className="rounded-lg border border-white/50 bg-white/80 px-4 py-3 text-left text-[11px] leading-relaxed shadow-inner backdrop-blur"
          style={bodyStyle}
        >
          <div className="font-semibold">1. Explain the water cycle.</div>
          <div className="mt-1 opacity-80">
            Describe evaporation, condensation, and precipitation.
          </div>
        </div>
        <div
          className="rounded-lg border border-white/40 bg-white/75 px-4 py-3 text-left text-[11px] leading-relaxed shadow-inner backdrop-blur"
          style={bodyStyle}
        >
          <div className="font-semibold">2. Define photosynthesis.</div>
          <div className="mt-1 opacity-80">Include the chemical equation.</div>
        </div>
      </div>
    </div>
  );
}
