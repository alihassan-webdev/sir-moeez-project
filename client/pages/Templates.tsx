import Container from "@/components/layout/Container";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { useTemplateSelection } from "@/hooks/use-template-selection";
import { toast } from "@/hooks/use-toast";
import type { TemplateDefinition, TemplateTier } from "@/lib/templates";

const tierDescriptions: Record<TemplateTier, string> = {
  Standard: "Streamlined defaults that balance readability and clarity.",
  Professional: "Polished visuals ideal for branded assessments.",
  Premium: "Expressive gradients and typography for flagship exams.",
};

export default function Templates() {
  const {
    groupedTemplates,
    tiers,
    selectTemplate,
    isSelected,
    selectedTemplate,
  } = useTemplateSelection();

  const handleSelect = (template: TemplateDefinition) => {
    if (isSelected(template.id)) {
      return;
    }
    selectTemplate(template.id);
    toast({
      title: `${template.name} applied`,
      description: "Your future downloads will use this template.",
    });
  };

  return (
    <div className="min-h-svh bg-background py-8 lg:py-12">
      <Container className="space-y-10">
        <header className="rounded-3xl border border-input bg-white p-6 shadow-xl lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                Template library
              </span>
              <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
                Personalize your PDF exports
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                Browse curated layouts crafted for exams, MCQs, and question
                banks. Choose a style to update all generated PDFs instantly.
              </p>
            </div>
            <div className="flex w-full max-w-sm items-center gap-4 rounded-2xl border border-dashed border-border/60 bg-muted/40 p-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full border border-border/40 text-xs font-semibold uppercase"
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
                <div className="text-xs font-semibold text-muted-foreground">
                  Current template
                </div>
                <div className="text-base font-semibold text-foreground">
                  {selectedTemplate.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {selectedTemplate.tier} •{" "}
                  {selectedTemplate.palette.fontFamily
                    .split(",")[0]
                    ?.replace(/['"]/g, "")}
                </div>
              </div>
            </div>
          </div>
        </header>

        {tiers.map((tier) => (
          <section key={tier} className="space-y-6">
            <div className="space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-2xl font-semibold text-foreground">
                  {tier} templates
                </h2>
                <p className="text-sm text-muted-foreground sm:max-w-md">
                  {tierDescriptions[tier]}
                </p>
              </div>
              <div className="h-1 w-24 rounded-full bg-primary/20" />
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {groupedTemplates[tier]?.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isSelected={isSelected(template.id)}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          </section>
        ))}
      </Container>
    </div>
  );
}
