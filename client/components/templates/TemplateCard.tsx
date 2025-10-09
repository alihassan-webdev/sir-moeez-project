import { memo } from "react";
import { CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TemplatePreview } from "@/components/templates/TemplatePreview";
import { cn } from "@/lib/utils";
import { TemplateDefinition, type TemplateTier } from "@/lib/templates";

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
        "relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl border bg-white p-4 shadow-sm transition-colors",
        isSelected ? "border-primary/70" : "border-border/60",
      )}
    >
      {isSelected ? (
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Selected
        </div>
      ) : null}

      <TemplatePreview template={template} mode="compact" />

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {template.name}
          </h3>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {tierHints[template.tier]}
          </p>
        </div>
        <Badge
          variant="outline"
          className="ml-2 whitespace-nowrap border-primary/30 text-[10px] font-semibold uppercase text-primary"
          style={{
            borderColor: template.palette.accent,
            color: template.palette.accent,
          }}
        >
          {template.tier}
        </Badge>
      </div>

      <Button
        className="mt-auto w-full h-8 text-xs"
        variant={isSelected ? "outline" : "default"}
        onClick={() => onSelect(template)}
        disabled={isSelected}
      >
        {isSelected ? (
          <>
            <CheckCircle2 className="h-3.5 w-3.5" />
            Current template
          </>
        ) : (
          "Use template"
        )}
      </Button>
    </div>
  );
});
