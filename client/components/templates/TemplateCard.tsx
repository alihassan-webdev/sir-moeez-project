import { memo } from "react";
import { CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TemplatePreview } from "@/components/templates/TemplatePreview";
import { cn } from "@/lib/utils";
import {
  TemplateDefinition,
  type TemplateTier,
} from "@/lib/templates";

type TemplateCardProps = {
  template: TemplateDefinition;
  isSelected: boolean;
  onSelect: (template: TemplateDefinition) => void;
};

const tierHints: Record<TemplateTier, string> = {
  Standard: "Reliable layouts perfect for everyday exams.",
  Professional: "Elevated styling with refined typography.",
  Premium: "Luxury finishes and expressive gradients.",
};

export const TemplateCard = memo(function TemplateCard({
  template,
  isSelected,
  onSelect,
}: TemplateCardProps) {
  return (
    <div
      className={cn(
        "relative flex h-full flex-col gap-5 overflow-hidden rounded-3xl border bg-white p-6 shadow-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-xl",
        isSelected
          ? "border-primary/80 ring-2 ring-primary/30"
          : "border-border/60",
      )}
    >
      {isSelected ? (
        <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <CheckCircle2 className="h-4 w-4" />
          Selected
        </div>
      ) : null}

      <TemplatePreview template={template} />

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {template.name}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {template.description}
              </p>
            </div>
            <Badge
              variant="outline"
              className="whitespace-nowrap border-primary/30 text-xs font-semibold uppercase text-primary"
              style={{ borderColor: template.palette.accent, color: template.palette.accent }}
            >
              {template.tier}
            </Badge>
          </div>
          <p className="text-xs font-medium text-muted-foreground">
            {tierHints[template.tier]}
          </p>
        </div>

        <ul className="space-y-2 text-sm text-foreground">
          {template.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <span
                className="mt-1 inline-block h-2 w-2 flex-shrink-0 rounded-full"
                style={{ background: template.palette.accent }}
              />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-border/60 bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border/30"
            style={{ background: template.palette.accent }}
          />
          Accent
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-md border border-border/40"
            style={{ background: template.palette.cardBackground }}
          />
          Surface
        </div>
        <div className="hidden items-center gap-2 lg:flex">
          <span className="font-semibold text-foreground">
            {template.palette.fontFamily.split(",")[0]?.replace(/['"]/g, "")}
          </span>
          Font
        </div>
      </div>

      <Button
        className="mt-auto w-full"
        variant={isSelected ? "outline" : "default"}
        onClick={() => onSelect(template)}
        disabled={isSelected}
      >
        {isSelected ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            Current template
          </>
        ) : (
          "Use template"
        )}
      </Button>
    </div>
  );
});
