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
      <Container className="space-y-8">
        <header className="rounded-xl bg-white p-6 border border-input card-yellow-shadow">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Personalize your PDF exports
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Browse curated layouts crafted for exams, MCQs, and question
                banks. Choose a style to update all generated PDFs instantly.
              </p>
            </div>
            <div className="flex w-full max-w-sm items-center gap-3 rounded-xl border border-dashed border-border/60 bg-muted/40 p-3">
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
              <div className="space-y-0.5">
                <div className="text-[11px] font-semibold text-muted-foreground">
                  Current template
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {selectedTemplate.name}
                </div>
                <div className="text-[11px] text-muted-foreground">
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
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
