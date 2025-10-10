import { useCallback } from "react";

import Container from "@/components/layout/Container";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { TemplatePreview } from "@/components/templates/TemplatePreview";
import { toast } from "@/hooks/use-toast";
import { useTemplateSelection } from "@/hooks/use-template-selection";
import type { TemplateDefinition } from "@/lib/templates";

export default function Templates() {
  const {
    groupedTemplates,
    tiers,
    selectedTemplate,
    selectTemplate,
    isSelected,
  } = useTemplateSelection();

  const handleSelect = useCallback(
    (template: TemplateDefinition) => {
      selectTemplate(template.id);
      toast({
        title: `${template.name} applied`,
        description: "Future exports will follow this layout.",
      });
    },
    [selectTemplate],
  );

  return (
    <div className="min-h-svh bg-background py-8 lg:py-12">
      <Container className="space-y-8">
        <header className="rounded-xl border border-input bg-white p-6 card-yellow-shadow">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                Personalize your PDF exports
              </h2>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Browse curated layouts crafted for exams, MCQs, and question
                banks. Choose a style to update all generated PDFs instantly.
              </p>
            </div>
            <div className="flex w-full max-w-sm items-start gap-3 rounded-xl border border-dashed border-border/60 bg-muted/40 p-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border/40 text-[10px] font-semibold uppercase"
                style={{
                  background: selectedTemplate.palette.accent,
                  color: selectedTemplate.palette.tagText,
                }}
              >
                {selectedTemplate.name
                  .split(" ")
                  .slice(0, 2)
                  .map((word) => word[0])
                  .join("")}
              </div>
              <div className="space-y-1">
                <div className="text-[11px] font-semibold text-muted-foreground">
                  Current template
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {selectedTemplate.name}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {selectedTemplate.tier} • {selectedTemplate.palette.fontFamily
                    .split(",")[0]
                    ?.replace(/["']/g, "")}
                </div>
                <p className="text-[11px] text-muted-foreground/80">
                  {selectedTemplate.description}
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-6">
            <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm lg:p-7">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    Live preview
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    See how the selected layout will print on A4.
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full border border-border/60 px-3 py-1 text-xs font-medium text-muted-foreground">
                  {selectedTemplate.tier}
                </span>
              </div>
              <div className="mt-5">
                <TemplatePreview template={selectedTemplate} mode="regular" />
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm lg:p-7">
              <h4 className="text-sm font-semibold text-foreground">
                Highlights
              </h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Key elements you get with {selectedTemplate.name}.
              </p>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                {selectedTemplate.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span
                      className="mt-1 inline-block h-1.5 w-1.5 rounded-full"
                      style={{ background: selectedTemplate.palette.accent }}
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <aside className="space-y-6">
            {tiers.map((tier) => {
              const tierTemplates = groupedTemplates[tier] ?? [];
              if (!tierTemplates.length) return null;

              return (
                <section key={tier} className="space-y-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        {tier} templates
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {tierTemplates.length} {tierTemplates.length === 1 ? "option" : "options"}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-4">
                    {tierTemplates.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        isSelected={isSelected(template.id)}
                        onSelect={handleSelect}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </aside>
        </div>
      </Container>
    </div>
  );
}
